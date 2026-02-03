import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { http } from '../api/http'
import firebaseService, { type FirebaseUser, type FirestoreUserData } from '../services/firebaseService'

interface User { 
  id: number
  email: string
  nom: string
  prenom: string
  role: string
  firebaseUid?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('firebase_token'))
  const isAuthenticated = computed(() => !!token.value)
  const authMode = ref<'firebase' | 'backend'>('firebase') // Mode par défaut: Firebase

  // Restaurer l'utilisateur depuis le localStorage
  if (token.value) {
    const storedEmail = localStorage.getItem('userEmail')
    const storedRole = localStorage.getItem('userRole')
    const storedFirebaseUid = localStorage.getItem('firebaseUid')
    if (storedEmail) {
      user.value = { 
        id: 0, 
        email: storedEmail, 
        nom: '', 
        prenom: '', 
        role: storedRole || 'USER',
        firebaseUid: storedFirebaseUid || undefined
      }
    }
  }

  /**
   * Connexion via Firebase Authentication (pour mobile)
   */
  async function loginWithFirebase(email: string, password: string): Promise<User> {
    // 1. Authentification Firebase
    const firebaseUser: FirebaseUser = await firebaseService.signIn(email, password)
    
    // 2. Récupérer les données utilisateur depuis Firestore
    let userData: FirestoreUserData | null = null
    try {
      userData = await firebaseService.getUserDataFromFirestore(email)
    } catch (e) {
      console.warn('Could not fetch Firestore data:', e)
    }

    token.value = firebaseUser.idToken
    user.value = {
      id: userData?.postgresId || 0,
      email: firebaseUser.email,
      nom: userData?.nom || '',
      prenom: userData?.prenom || '',
      role: userData?.role || 'USER',
      firebaseUid: firebaseUser.uid
    }

    // Stocker les infos
    localStorage.setItem('firebase_token', firebaseUser.idToken)
    localStorage.setItem('userEmail', firebaseUser.email)
    localStorage.setItem('userRole', user.value.role)
    localStorage.setItem('firebaseUid', firebaseUser.uid)

    // Configurer le header pour les appels API backend si nécessaire
    http.defaults.headers.common['Authorization'] = `Bearer ${firebaseUser.idToken}`

    return user.value
  }

  /**
   * Connexion via Backend Spring Boot (mode alternatif)
   */
  async function loginWithBackend(email: string, password: string): Promise<User> {
    const res = await http.post('/api/auth/login', { email, password })
    console.log('Login response:', res.data)
    token.value = res.data.token
    user.value = { id: 0, email: res.data.email, nom: '', prenom: '', role: res.data.role }
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userEmail', res.data.email)
    localStorage.setItem('userRole', res.data.role)
    http.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    return user.value
  }

  /**
   * Fonction de login principale - utilise Firebase par défaut
   */
  async function login(email: string, password: string): Promise<User> {
    if (authMode.value === 'firebase') {
      return loginWithFirebase(email, password)
    }
    return loginWithBackend(email, password)
  }

  /**
   * Inscription (toujours via backend pour créer dans PostgreSQL)
   */
  async function register(email: string, password: string, nom: string, prenom: string): Promise<User> {
    const res = await http.post('/api/auth/register', { email, password, nom, prenom })
    console.log('Register response:', res.data)
    token.value = res.data.token
    user.value = { id: 0, email: res.data.email, nom, prenom, role: res.data.role }
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userEmail', res.data.email)
    localStorage.setItem('userRole', res.data.role)
    http.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    return user.value
  }

  /**
   * Déconnexion
   */
  function logout() {
    // Déconnexion Firebase
    firebaseService.signOut()
    
    // Nettoyer l'état local
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('firebase_token')
    localStorage.removeItem('firebase_user')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userRole')
    localStorage.removeItem('firebaseUid')
    delete http.defaults.headers.common['Authorization']
  }

  /**
   * Changer le mode d'authentification
   */
  function setAuthMode(mode: 'firebase' | 'backend') {
    authMode.value = mode
  }

  return { 
    user, 
    token, 
    isAuthenticated, 
    authMode,
    login, 
    loginWithFirebase,
    loginWithBackend,
    register, 
    logout,
    setAuthMode
  }
})
