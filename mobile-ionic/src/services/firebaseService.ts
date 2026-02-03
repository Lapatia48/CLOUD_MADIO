/**
 * Service Firebase pour l'authentification mobile via API REST
 * Utilise Firebase Authentication sans SDK pour rester léger
 */

import axios from 'axios'

// Configuration Firebase
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAZDq6XBscA4ys06AJptbvjOSKLrqAa1Yc',
  projectId: 'cloud-s5-91071',
}

const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts`
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`

export interface FirebaseAuthResponse {
  kind: string
  localId: string
  email: string
  displayName: string
  idToken: string
  registered: boolean
  refreshToken: string
  expiresIn: string
}

export interface FirebaseUser {
  uid: string
  email: string
  idToken: string
  refreshToken: string
}

export interface FirestoreUserData {
  email: string
  nom: string
  prenom: string
  role: string
  firebaseUid: string
  postgresId: number
  isBlocked: boolean
}

class FirebaseService {
  private currentUser: FirebaseUser | null = null

  constructor() {
    // Restaurer l'utilisateur depuis le localStorage
    const storedUser = localStorage.getItem('firebase_user')
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser)
    }
  }

  /**
   * Connexion avec email/password via Firebase Auth REST API
   */
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    try {
      const response = await axios.post<FirebaseAuthResponse>(
        `${AUTH_URL}:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      )

      const user: FirebaseUser = {
        uid: response.data.localId,
        email: response.data.email,
        idToken: response.data.idToken,
        refreshToken: response.data.refreshToken,
      }

      this.currentUser = user
      localStorage.setItem('firebase_user', JSON.stringify(user))
      localStorage.setItem('firebase_token', user.idToken)

      return user
    } catch (error: any) {
      const errorMessage = this.parseFirebaseError(error)
      throw new Error(errorMessage)
    }
  }

  /**
   * Inscription avec email/password via Firebase Auth REST API
   */
  async signUp(email: string, password: string): Promise<FirebaseUser> {
    try {
      const response = await axios.post<FirebaseAuthResponse>(
        `${AUTH_URL}:signUp?key=${FIREBASE_CONFIG.apiKey}`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      )

      const user: FirebaseUser = {
        uid: response.data.localId,
        email: response.data.email,
        idToken: response.data.idToken,
        refreshToken: response.data.refreshToken,
      }

      this.currentUser = user
      localStorage.setItem('firebase_user', JSON.stringify(user))
      localStorage.setItem('firebase_token', user.idToken)

      return user
    } catch (error: any) {
      const errorMessage = this.parseFirebaseError(error)
      throw new Error(errorMessage)
    }
  }

  /**
   * Rafraîchir le token d'authentification
   */
  async refreshToken(): Promise<string> {
    if (!this.currentUser?.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await axios.post(
        `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_CONFIG.apiKey}`,
        {
          grant_type: 'refresh_token',
          refresh_token: this.currentUser.refreshToken,
        }
      )

      const newToken = response.data.id_token
      this.currentUser.idToken = newToken
      localStorage.setItem('firebase_user', JSON.stringify(this.currentUser))
      localStorage.setItem('firebase_token', newToken)

      return newToken
    } catch (error) {
      this.signOut()
      throw new Error('Session expired. Please login again.')
    }
  }

  /**
   * Récupérer les données utilisateur depuis Firestore
   */
  async getUserDataFromFirestore(email: string): Promise<FirestoreUserData | null> {
    if (!this.currentUser?.idToken) {
      throw new Error('Not authenticated')
    }

    try {
      // Rechercher l'utilisateur par email dans la collection "users"
      const response = await axios.post(
        `${FIRESTORE_URL}:runQuery`,
        {
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'email' },
                op: 'EQUAL',
                value: { stringValue: email },
              },
            },
            limit: 1,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.currentUser.idToken}`,
          },
        }
      )

      if (response.data && response.data.length > 0 && response.data[0].document) {
        const fields = response.data[0].document.fields
        return {
          email: fields.email?.stringValue || '',
          nom: fields.nom?.stringValue || '',
          prenom: fields.prenom?.stringValue || '',
          role: fields.role?.stringValue || 'USER',
          firebaseUid: fields.firebaseUid?.stringValue || '',
          postgresId: parseInt(fields.postgresId?.integerValue || '0'),
          isBlocked: fields.isBlocked?.booleanValue || false,
        }
      }

      return null
    } catch (error) {
      console.error('Error fetching user data from Firestore:', error)
      return null
    }
  }

  /**
   * Déconnexion
   */
  signOut(): void {
    this.currentUser = null
    localStorage.removeItem('firebase_user')
    localStorage.removeItem('firebase_token')
  }

  /**
   * Obtenir l'utilisateur courant
   */
  getCurrentUser(): FirebaseUser | null {
    return this.currentUser
  }

  /**
   * Obtenir le token d'authentification
   */
  getIdToken(): string | null {
    return this.currentUser?.idToken || localStorage.getItem('firebase_token')
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!this.currentUser?.idToken
  }

  /**
   * Parser les erreurs Firebase
   */
  private parseFirebaseError(error: any): string {
    const errorCode = error.response?.data?.error?.message

    const errorMessages: Record<string, string> = {
      EMAIL_NOT_FOUND: 'Aucun compte trouvé avec cet email',
      INVALID_PASSWORD: 'Mot de passe incorrect',
      INVALID_LOGIN_CREDENTIALS: 'Email ou mot de passe incorrect',
      USER_DISABLED: 'Ce compte a été désactivé',
      EMAIL_EXISTS: 'Un compte existe déjà avec cet email',
      OPERATION_NOT_ALLOWED: 'Opération non autorisée',
      TOO_MANY_ATTEMPTS_TRY_LATER: 'Trop de tentatives. Réessayez plus tard',
      WEAK_PASSWORD: 'Le mot de passe doit contenir au moins 6 caractères',
    }

    return errorMessages[errorCode] || error.message || 'Erreur de connexion'
  }
}

export const firebaseService = new FirebaseService()
export default firebaseService
