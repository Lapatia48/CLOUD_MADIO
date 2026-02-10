/**
 * Service de notifications locales
 * Vérifie périodiquement les changements sur les signalements de l'utilisateur
 * et affiche une notification locale quand un statut change
 */

import { LocalNotifications } from '@capacitor/local-notifications'
import signalementFirebaseService, { type FirebaseSignalement } from './signalementFirebaseService'
import firebaseService from './firebaseService'

interface SignalementSnapshot {
  documentId: string
  status: string
  avancement: number
  updatedAt?: string
  entrepriseNom?: string
}

class NotificationService {
  private pollingInterval: ReturnType<typeof setInterval> | null = null
  private previousSnapshots: Map<string, SignalementSnapshot> = new Map()
  private initialized = false
  private notificationId = 1

  /**
   * Initialiser le service : demander les permissions et démarrer le polling
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Demander la permission de notification
      const permResult = await LocalNotifications.requestPermissions()
      console.log('Notification permission:', permResult.display)

      if (permResult.display === 'denied') {
        console.warn('Notifications refusées par l\'utilisateur')
        return
      }

      // Charger le snapshot initial (sans notifier)
      await this.loadInitialSnapshot()

      // Démarrer le polling toutes les 30 secondes
      this.startPolling(30000)

      this.initialized = true
      console.log('NotificationService initialisé')
    } catch (error) {
      console.error('Erreur initialisation NotificationService:', error)
    }
  }

  /**
   * Charger l'état initial des signalements (sans envoyer de notification)
   */
  private async loadInitialSnapshot(): Promise<void> {
    const currentUser = firebaseService.getCurrentUser()
    if (!currentUser) return

    try {
      const signalements = await signalementFirebaseService.getMySignalementsWithIds()
      this.previousSnapshots.clear()
      
      for (const sig of signalements) {
        this.previousSnapshots.set(sig.documentId, {
          documentId: sig.documentId,
          status: sig.status,
          avancement: sig.avancement || 0,
          updatedAt: sig.updatedAt,
          entrepriseNom: sig.entrepriseNom,
        })
      }
      console.log(`Snapshot initial: ${this.previousSnapshots.size} signalements`)
    } catch (error) {
      console.error('Erreur chargement snapshot initial:', error)
    }
  }

  /**
   * Démarrer le polling périodique
   */
  private startPolling(intervalMs: number): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }

    this.pollingInterval = setInterval(async () => {
      await this.checkForChanges()
    }, intervalMs)
  }

  /**
   * Vérifier s'il y a des changements sur les signalements
   */
  private async checkForChanges(): Promise<void> {
    const currentUser = firebaseService.getCurrentUser()
    if (!currentUser) return

    try {
      const signalements = await signalementFirebaseService.getMySignalementsWithIds()

      for (const sig of signalements) {
        const previous = this.previousSnapshots.get(sig.documentId)

        if (previous) {
          // Comparer les changements
          const changes: string[] = []

          if (previous.status !== sig.status) {
            changes.push(`Statut: ${this.getStatusLabel(previous.status)} → ${this.getStatusLabel(sig.status)}`)
          }

          if (previous.avancement !== (sig.avancement || 0)) {
            changes.push(`Avancement: ${previous.avancement}% → ${sig.avancement || 0}%`)
          }

          if (previous.entrepriseNom !== sig.entrepriseNom && sig.entrepriseNom) {
            changes.push(`Entreprise assignée: ${sig.entrepriseNom}`)
          }

          if (changes.length > 0) {
            await this.sendNotification(
              'Signalement mis à jour',
              `${sig.description?.slice(0, 40) || 'Votre signalement'}\n${changes.join(', ')}`,
              sig.documentId
            )
          }
        }

        // Mettre à jour le snapshot
        this.previousSnapshots.set(sig.documentId, {
          documentId: sig.documentId,
          status: sig.status,
          avancement: sig.avancement || 0,
          updatedAt: sig.updatedAt,
          entrepriseNom: sig.entrepriseNom,
        })
      }
    } catch (error) {
      console.error('Erreur polling notifications:', error)
    }
  }

  /**
   * Envoyer une notification locale
   */
  private async sendNotification(title: string, body: string, tag?: string): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: this.notificationId++,
            schedule: { at: new Date(Date.now() + 500) }, // dans 500ms
            sound: undefined,
            smallIcon: 'ic_launcher',
            largeIcon: 'ic_launcher',
            channelId: 'signalement-updates',
          },
        ],
      })
      console.log('Notification envoyée:', title, body)
    } catch (error) {
      console.error('Erreur envoi notification:', error)
    }
  }

  /**
   * Créer le canal de notification Android
   */
  async createNotificationChannel(): Promise<void> {
    try {
      await LocalNotifications.createChannel({
        id: 'signalement-updates',
        name: 'Mises à jour signalements',
        description: 'Notifications quand vos signalements sont mis à jour',
        importance: 4, // HIGH
        visibility: 1, // PUBLIC
        sound: 'default',
        vibration: true,
      })
      console.log('Canal de notification créé')
    } catch (error) {
      // createChannel n'existe pas sur iOS/web, on ignore
      console.log('createChannel non supporté (normal sur web):', error)
    }
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case 'NOUVEAU': return 'Nouveau'
      case 'EN_COURS': return 'En cours'
      case 'TERMINE': return 'Terminé'
      default: return status
    }
  }

  /**
   * Arrêter le polling
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    this.initialized = false
    this.previousSnapshots.clear()
    console.log('NotificationService arrêté')
  }

  /**
   * Redémarrer (après login)
   */
  async restart(): Promise<void> {
    this.stop()
    this.initialized = false
    await this.initialize()
  }
}

export const notificationService = new NotificationService()
export default notificationService
