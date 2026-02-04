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

// URL pour le backend PostgreSQL
const BACKEND_URL = 'http://localhost:8080'

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
  password: string
  postgresId: number
  isBlocked: boolean
  failedAttempts: number
}

export interface FirestoreConfigData {
  maxAttempts: number
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
   * Connexion via Firestore (vérification directe email/password dans Firestore)
   * Car les users sont créés dans Firestore, pas dans Firebase Auth
   */
  async signIn(email: string, password: string): Promise<FirebaseUser> {
    // Chercher l'utilisateur par email dans Firestore
    const userData = await this.getUserDataByEmail(email)
    
    if (!userData) {
      throw new Error('Aucun compte trouvé avec cet email')
    }
    
    // Vérifier le mot de passe
    if (userData.password !== password) {
      throw new Error('Mot de passe incorrect')
    }
    
    // Login réussi - créer un pseudo FirebaseUser
    const user: FirebaseUser = {
      uid: String(userData.postgresId),
      email: userData.email,
      idToken: `firestore_${userData.postgresId}_${Date.now()}`,
      refreshToken: '',
    }
    
    this.currentUser = user
    localStorage.setItem('firebase_user', JSON.stringify(user))
    localStorage.setItem('firebase_token', user.idToken)
    
    return user
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
    if (!this.currentUser) {
      throw new Error('No user logged in')
    }
    // Pour Firestore-based auth, on régénère juste un nouveau token
    const newToken = `firestore_${this.currentUser.uid}_${Date.now()}`
    this.currentUser.idToken = newToken
    localStorage.setItem('firebase_user', JSON.stringify(this.currentUser))
    localStorage.setItem('firebase_token', newToken)
    return newToken
  }

  /**
   * Récupérer les données utilisateur depuis Firestore (après authentification)
   */
  async getUserDataFromFirestore(email: string): Promise<FirestoreUserData | null> {
    return this.getUserDataByEmail(email)
  }

  /**
   * Récupérer la configuration (max_attempts) depuis Firestore
   */
  async getConfigurationFromFirestore(): Promise<FirestoreConfigData> {
    try {
      const response = await axios.get(
        `${FIRESTORE_URL}/configuration/max_attempts`
      )
      
      if (response.data && response.data.fields) {
        const fields = response.data.fields
        return {
          maxAttempts: parseInt(fields.valeur?.stringValue || '3'),
        }
      }
      
      return { maxAttempts: 3 } // Valeur par défaut
    } catch (error) {
      console.error('Error fetching configuration from Firestore:', error)
      return { maxAttempts: 3 }
    }
  }

  /**
   * Mettre à jour les failedAttempts d'un utilisateur dans Firestore
   * Utilise postgresId comme ID de document
   */
  async updateFailedAttempts(postgresId: number, failedAttempts: number): Promise<void> {
    try {
      const docId = String(postgresId)
      
      await axios.patch(
        `${FIRESTORE_URL}/users/${docId}?updateMask.fieldPaths=failedAttempts`,
        {
          fields: {
            failedAttempts: { integerValue: String(failedAttempts) }
          }
        }
      )
      console.log(`Updated failedAttempts to ${failedAttempts} for postgresId=${postgresId}`)
    } catch (error) {
      console.error('Error updating failedAttempts in Firestore:', error)
    }
  }

  /**
   * Marquer un utilisateur comme bloqué dans Firestore
   * Utilise postgresId comme ID de document
   */
  async blockUserInFirestore(postgresId: number): Promise<void> {
    try {
      const docId = String(postgresId)
      
      await axios.patch(
        `${FIRESTORE_URL}/users/${docId}?updateMask.fieldPaths=isBlocked`,
        {
          fields: {
            isBlocked: { booleanValue: true }
          }
        }
      )
      console.log(`User postgresId=${postgresId} blocked in Firestore`)
    } catch (error) {
      console.error('Error blocking user in Firestore:', error)
    }
  }

  /**
   * Récupérer les données utilisateur par email (sans authentification)
   * Utilisé avant le login pour vérifier si le compte est bloqué
   * Fait une query sur la collection users pour trouver par email
   */
  async getUserDataByEmail(email: string): Promise<FirestoreUserData | null> {
    try {
      // Query pour trouver l'utilisateur par email
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
        }
      )
      
      if (response.data && response.data.length > 0 && response.data[0].document) {
        const fields = response.data[0].document.fields
        return {
          email: fields.email?.stringValue || '',
          nom: fields.nom?.stringValue || '',
          prenom: fields.prenom?.stringValue || '',
          role: fields.role?.stringValue || 'USER',
          password: fields.password?.stringValue || '',
          postgresId: parseInt(fields.postgresId?.integerValue || '0'),
          isBlocked: fields.isBlocked?.booleanValue || false,
          failedAttempts: parseInt(fields.failedAttempts?.integerValue || '0'),
        }
      }
      
      return null
    } catch (error) {
      console.error('Error fetching user data by email:', error)
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
