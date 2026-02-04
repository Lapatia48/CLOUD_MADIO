import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import firebaseService, { type FirebaseUser, type FirestoreUserData } from '../services/firebaseService'

interface User { 
  email: string
  nom: string
  prenom: string
  role: string
  firebaseUid: string
  postgresId: number
  isBlocked: boolean
  failedAttempts: number
}

// Erreurs personnalisées pour le blocage
export class AccountBlockedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AccountBlockedError'
  }
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
    const storedPostgresId = localStorage.getItem('postgresId')
    if (storedEmail) {
      user.value = { 
        email: storedEmail, 
        nom: '', 
        prenom: '', 
        role: storedRole || 'USER',
        firebaseUid: storedFirebaseUid || '',
        postgresId: storedPostgresId ? parseInt(storedPostgresId) : 0,
        isBlocked: false,
        failedAttempts: 0
      }
    }
  }

  /**
   * Connexion via Firestore (vérifie email/password directement dans Firestore)
   */
  async function login(email: string, password: string): Promise<User> {
    // Vérifier la connexion Internet
    if (!navigator.onLine) {
      throw new Error('Pas de connexion Internet. Veuillez vous connecter.')
    }

    // 1. Récupérer l'utilisateur depuis Firestore pour vérifier blocage
    const userData = await firebaseService.getUserDataByEmail(email)
    
    if (!userData) {
      throw new Error('Aucun compte trouvé avec cet email')
    }

    // 2. Vérifier si le compte est bloqué
    if (userData.isBlocked) {
      throw new AccountBlockedError('🔒 Ce compte est bloqué. Veuillez contacter l\'administrateur.')
    }

    // 3. Récupérer la configuration max_attempts
    const config = await firebaseService.getConfigurationFromFirestore()
    const maxAttempts = config.maxAttempts

    // 4. Tenter le login (vérifie le password dans Firestore)
    try {
      const firebaseUser: FirebaseUser = await firebaseService.signIn(email, password)
      
      // 5. Login réussi: remettre failedAttempts à 0
      if (userData.failedAttempts > 0) {
        await firebaseService.updateFailedAttempts(userData.postgresId, 0)
      }

      token.value = firebaseUser.idToken
      user.value = {
        email: firebaseUser.email,
        nom: userData.nom || '',
        prenom: userData.prenom || '',
        role: userData.role || 'USER',
        firebaseUid: firebaseUser.uid,
        postgresId: userData.postgresId,
        isBlocked: false,
        failedAttempts: 0
      }

      // Stocker les infos
      localStorage.setItem('firebase_token', firebaseUser.idToken)
      localStorage.setItem('token', firebaseUser.idToken)
      localStorage.setItem('userEmail', firebaseUser.email)
      localStorage.setItem('userRole', user.value.role)
      localStorage.setItem('firebaseUid', firebaseUser.uid)
      localStorage.setItem('postgresId', String(user.value.postgresId))

      return user.value

    } catch (error: any) {
      // 6. Login échoué: incrémenter failedAttempts
      if (error.name !== 'AccountBlockedError' && userData.postgresId) {
        const newFailedAttempts = (userData.failedAttempts || 0) + 1
        await firebaseService.updateFailedAttempts(userData.postgresId, newFailedAttempts)
        
        if (newFailedAttempts >= maxAttempts) {
          await firebaseService.blockUserInFirestore(userData.postgresId)
          throw new AccountBlockedError(
            `🔒 Compte bloqué après ${maxAttempts} tentatives échouées. Contactez l'administrateur.`
          )
        } else {
          const remaining = maxAttempts - newFailedAttempts
          throw new Error(
            `Mot de passe incorrect.\n⚠️ ${remaining} tentative(s) restante(s) avant blocage.`
          )
        }
      }
      throw error
    }
  }

  /**
   * Déconnexion
   */
  function logout() {
    firebaseService.signOut()
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('firebase_token')
    localStorage.removeItem('firebase_user')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userRole')
    localStorage.removeItem('firebaseUid')
    localStorage.removeItem('postgresId')
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
