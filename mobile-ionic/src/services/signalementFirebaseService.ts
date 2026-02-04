/**
 * Service Firebase pour les signalements (Firestore)
 * Gère la création et récupération des signalements depuis Firebase
 */

import axios from 'axios'
import firebaseService from './firebaseService'

// Configuration Firebase
const FIREBASE_CONFIG = {
  projectId: 'cloud-s5-91071',
}

const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`

/**
 * Interface Signalement pour Firebase (NoSQL)
 * Contraintes mappées depuis PostgreSQL:
 * 
 * CREATE TABLE signalements (
 *     id SERIAL PRIMARY KEY,
 *     description TEXT,
 *     latitude DOUBLE PRECISION NOT NULL,
 *     longitude DOUBLE PRECISION NOT NULL,
 *     status VARCHAR(20) DEFAULT 'NOUVEAU',
 *     surface_m2 DECIMAL(10,2),
 *     budget DECIMAL(15,2),
 *     id_entreprise INT REFERENCES entreprises(id),
 *     date_signalement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *     user_id INT REFERENCES users(id)
 * );
 */
export interface FirebaseSignalement {
  // Champs obligatoires (NOT NULL dans PostgreSQL)
  latitude: number        // DOUBLE PRECISION NOT NULL
  longitude: number       // DOUBLE PRECISION NOT NULL
  
  // Champs optionnels
  description?: string    // TEXT (nullable)
  status: 'NOUVEAU' | 'EN_COURS' | 'TERMINE'  // VARCHAR(20) DEFAULT 'NOUVEAU'
  avancement?: number     // Pourcentage: 0=nouveau, 50=en cours, 100=terminé
  surfaceM2?: number      // DECIMAL(10,2) (nullable)
  budget?: number         // DECIMAL(15,2) (nullable)
  photoBase64?: string    // Photo en base64 (ajoutée depuis mobile)
  photoUrl?: string       // URL cloud après traitement par le web
  
  // Références (pour sync avec PostgreSQL)
  userId?: number         // INT REFERENCES users(id) - ID PostgreSQL
  userEmail: string       // Pour identifier l'utilisateur
  firebaseUid: string     // UID Firebase de l'utilisateur
  idEntreprise?: number   // INT REFERENCES entreprises(id) (nullable)
  entrepriseNom?: string  // Nom de l'entreprise (dénormalisé pour affichage)
  
  // Métadonnées
  dateSignalement: string // TIMESTAMP DEFAULT CURRENT_TIMESTAMP - ISO format
  syncedToPostgres: boolean // Flag de synchronisation
  postgresId?: number     // ID après sync vers PostgreSQL
  updatedAt?: string      // Date de dernière modification
}

/**
 * Interface pour création depuis mobile (champs simples)
 */
export interface CreateSignalementRequest {
  // Champs obligatoires (NOT NULL)
  latitude: number        // DOUBLE PRECISION NOT NULL
  longitude: number       // DOUBLE PRECISION NOT NULL
  
  // Champs optionnels depuis mobile
  description?: string    // TEXT
  photoBase64?: string    // Photo en base64
}

/**
 * Interface réponse Firestore
 */
interface FirestoreDocument {
  name: string
  fields: Record<string, any>
  createTime: string
  updateTime: string
}

class SignalementFirebaseService {
  
  /**
   * Créer un signalement dans Firestore
   */
  async createSignalement(data: CreateSignalementRequest): Promise<{ success: boolean; documentId?: string; error?: string }> {
    const token = firebaseService.getIdToken()
    if (!token) {
      return { success: false, error: 'Non authentifié' }
    }

    const currentUser = firebaseService.getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }

    // Validation des contraintes NOT NULL
    if (typeof data.latitude !== 'number' || isNaN(data.latitude)) {
      return { success: false, error: 'Latitude invalide (obligatoire)' }
    }
    if (typeof data.longitude !== 'number' || isNaN(data.longitude)) {
      return { success: false, error: 'Longitude invalide (obligatoire)' }
    }

    // Construire le document Firestore (simplifié pour mobile)
    const now = new Date().toISOString()

    // Convertir en format Firestore
    const firestoreDoc: { fields: Record<string, any> } = {
      fields: {
        latitude: { doubleValue: data.latitude },
        longitude: { doubleValue: data.longitude },
        description: { stringValue: data.description || '' },
        status: { stringValue: 'NOUVEAU' },
        avancement: { integerValue: '0' },
        userEmail: { stringValue: currentUser.email },
        firebaseUid: { stringValue: currentUser.uid },
        dateSignalement: { timestampValue: now },
        syncedToPostgres: { booleanValue: false },
      }
    }

    // Ajouter la photo si présente
    if (data.photoBase64) {
      firestoreDoc.fields.photoBase64 = { stringValue: data.photoBase64 }
    }

    try {
      const response = await axios.post(
        `${FIRESTORE_URL}/signalements`,
        firestoreDoc,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // Extraire l'ID du document
      const fullName = response.data.name
      const documentId = fullName.substring(fullName.lastIndexOf('/') + 1)

      console.log('Signalement créé dans Firebase:', documentId)
      return { success: true, documentId }
    } catch (error: any) {
      console.error('Erreur création signalement Firebase:', error)
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      }
    }
  }

  /**
   * Récupérer TOUS les signalements (pour la carte globale)
   * Utilise l'API publique Firestore (sans auth)
   */
  async getAllSignalements(): Promise<Array<FirebaseSignalement & { documentId: string }>> {
    try {
      // Utiliser l'API REST publique Firestore
      const response = await axios.get(
        `${FIRESTORE_URL}/signalements`
      )

      if (response.data && response.data.documents) {
        return response.data.documents.map((doc: any) => {
          const sig = this.parseFirestoreDocument(doc)
          const fullName = doc.name
          const documentId = fullName.substring(fullName.lastIndexOf('/') + 1)
          return { ...sig, documentId }
        })
      }
      
      return []
    } catch (error) {
      console.error('Erreur récupération tous les signalements:', error)
      return []
    }
  }

  /**
   * Récupérer tous les signalements de l'utilisateur courant
   */
  async getMySignalements(): Promise<FirebaseSignalement[]> {
    const token = firebaseService.getIdToken()
    const currentUser = firebaseService.getCurrentUser()
    
    if (!token || !currentUser) {
      console.warn('Non authentifié')
      return []
    }

    try {
      // Query Firestore pour les signalements de l'utilisateur
      const response = await axios.post(
        `${FIRESTORE_URL}:runQuery`,
        {
          structuredQuery: {
            from: [{ collectionId: 'signalements' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'firebaseUid' },
                op: 'EQUAL',
                value: { stringValue: currentUser.uid },
              },
            },
            orderBy: [
              { field: { fieldPath: 'dateSignalement' }, direction: 'DESCENDING' }
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return this.parseSignalementsList(response.data)
    } catch (error) {
      console.error('Erreur récupération signalements:', error)
      return []
    }
  }

  /**
   * Récupérer tous les signalements non synchronisés (pour le backend)
   */
  async getUnsyncedSignalements(): Promise<Array<FirebaseSignalement & { documentId: string }>> {
    const token = firebaseService.getIdToken()
    if (!token) {
      return []
    }

    try {
      const response = await axios.post(
        `${FIRESTORE_URL}:runQuery`,
        {
          structuredQuery: {
            from: [{ collectionId: 'signalements' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'syncedToPostgres' },
                op: 'EQUAL',
                value: { booleanValue: false },
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return this.parseSignalementsListWithIds(response.data)
    } catch (error) {
      console.error('Erreur récupération signalements non sync:', error)
      return []
    }
  }

  /**
   * Marquer un signalement comme synchronisé
   */
  async markAsSynced(documentId: string, postgresId: number): Promise<boolean> {
    const token = firebaseService.getIdToken()
    if (!token) return false

    try {
      await axios.patch(
        `${FIRESTORE_URL}/signalements/${documentId}?updateMask.fieldPaths=syncedToPostgres&updateMask.fieldPaths=postgresId`,
        {
          fields: {
            syncedToPostgres: { booleanValue: true },
            postgresId: { integerValue: postgresId.toString() },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      return true
    } catch (error) {
      console.error('Erreur marquage sync:', error)
      return false
    }
  }

  /**
   * Parser la liste des signalements depuis Firestore
   */
  private parseSignalementsList(data: any[]): FirebaseSignalement[] {
    if (!data || !Array.isArray(data)) return []

    return data
      .filter(item => item.document)
      .map(item => this.parseFirestoreDocument(item.document))
  }

  private parseSignalementsListWithIds(data: any[]): Array<FirebaseSignalement & { documentId: string }> {
    if (!data || !Array.isArray(data)) return []

    return data
      .filter(item => item.document)
      .map(item => {
        const sig = this.parseFirestoreDocument(item.document)
        const fullName = item.document.name
        const documentId = fullName.substring(fullName.lastIndexOf('/') + 1)
        return { ...sig, documentId }
      })
  }

  private parseFirestoreDocument(doc: FirestoreDocument): FirebaseSignalement {
    const f = doc.fields
    return {
      latitude: f.latitude?.doubleValue || 0,
      longitude: f.longitude?.doubleValue || 0,
      description: f.description?.stringValue || '',
      status: (f.status?.stringValue as 'NOUVEAU' | 'EN_COURS' | 'TERMINE') || 'NOUVEAU',
      avancement: f.avancement?.integerValue ? parseInt(f.avancement.integerValue) : 0,
      surfaceM2: f.surfaceM2?.doubleValue || 0,
      budget: f.budget?.doubleValue || 0,
      photoBase64: f.photoBase64?.stringValue || undefined,
      photoUrl: f.photoUrl?.stringValue || undefined,
      userEmail: f.userEmail?.stringValue || '',
      firebaseUid: f.firebaseUid?.stringValue || '',
      idEntreprise: f.idEntreprise?.integerValue ? parseInt(f.idEntreprise.integerValue) : undefined,
      entrepriseNom: f.entrepriseNom?.stringValue || undefined,
      dateSignalement: f.dateSignalement?.timestampValue || new Date().toISOString(),
      syncedToPostgres: f.syncedToPostgres?.booleanValue || false,
      postgresId: f.postgresId?.integerValue ? parseInt(f.postgresId.integerValue) : undefined,
      userId: f.userId?.integerValue ? parseInt(f.userId.integerValue) : undefined,
      updatedAt: f.updatedAt?.timestampValue || undefined,
    }
  }
}

export const signalementFirebaseService = new SignalementFirebaseService()
export default signalementFirebaseService
