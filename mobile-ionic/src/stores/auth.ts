import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import firebaseService, { type FirebaseUser, type FirestoreUserData } from '../services/firebaseService'

interface User { 
  email: string
  nom: string
  prenom: string
  role: string
  firebaseUid: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('firebase_token'))
  const isAuthenticated = computed(() => !!token.value)
  const isOnline = ref(navigator.onLine)

  // Écouter les changements de connexion
  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })

  // Restaurer l'utilisateur depuis le localStorage
  if (token.value) {
    const storedEmail = localStorage.getItem('userEmail')
    const storedRole = localStorage.getItem('userRole')
    const storedFirebaseUid = localStorage.getItem('firebaseUid')
    if (storedEmail && storedFirebaseUid) {
      user.value = { 
        email: storedEmail, 
        nom: '', 
        prenom: '', 
        role: storedRole || 'USER',
        firebaseUid: storedFirebaseUid
      }
    }
  }

  /**
   * Connexion via Firebase Authentication uniquement
   * Requiert une connexion Internet
   */
  async function login(email: string, password: string): Promise<User> {
    // Vérifier la connexion Internet
    if (!navigator.onLine) {
      throw new Error('Pas de connexion Internet. Veuillez vous connecter pour utiliser Firebase.')
    }

    // Authentification Firebase
    const firebaseUser: FirebaseUser = await firebaseService.signIn(email, password)
    
    // Récupérer les données utilisateur depuis Firestore
    let userData: FirestoreUserData | null = null
    try {
      userData = await firebaseService.getUserDataFromFirestore(email)
    } catch (e) {
      console.warn('Could not fetch Firestore data:', e)
    }

    token.value = firebaseUser.idToken
    user.value = {
      email: firebaseUser.email,
      nom: userData?.nom || '',
      prenom: userData?.prenom || '',
      role: userData?.role || 'USER',
      firebaseUid: firebaseUser.uid
    }

    // Stocker les infos
    localStorage.setItem('firebase_token', firebaseUser.idToken)
    localStorage.setItem('token', firebaseUser.idToken) // Pour le router guard
    localStorage.setItem('userEmail', firebaseUser.email)
    localStorage.setItem('userRole', user.value.role)
    localStorage.setItem('firebaseUid', firebaseUser.uid)

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
  }

  return { 
    user, 
    token, 
    isAuthenticated,
    isOnline,
    login, 
    logout
  }
})
