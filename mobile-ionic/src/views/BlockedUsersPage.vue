<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" />
        </ion-buttons>
        <ion-title>🚫 Utilisateurs Bloqués</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="blocked-content">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Chargement des utilisateurs bloqués...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <ion-icon :icon="alertCircleOutline" class="error-icon"></ion-icon>
        <p>{{ error }}</p>
        <ion-button fill="outline" @click="fetchBlockedUsers">Réessayer</ion-button>
      </div>

      <!-- Empty State -->
      <div v-else-if="blockedUsers.length === 0" class="empty-container">
        <ion-icon :icon="checkmarkCircleOutline" class="empty-icon"></ion-icon>
        <h3>Aucun utilisateur bloqué</h3>
        <p>Tous les comptes sont actuellement actifs</p>
      </div>

      <!-- Blocked Users List -->
      <div v-else class="users-container">
        <ion-card class="info-card">
          <ion-card-content>
            <ion-icon :icon="informationCircleOutline" color="primary"></ion-icon>
            <span>{{ blockedUsers.length }} utilisateur(s) bloqué(s)</span>
          </ion-card-content>
        </ion-card>

        <ion-list>
          <ion-item-sliding v-for="user in blockedUsers" :key="user.id">
            <ion-item>
              <ion-avatar slot="start" class="user-avatar">
                <div class="avatar-text">{{ getUserInitial(user) }}</div>
              </ion-avatar>
              <ion-label>
                <h2>{{ user.prenom || '' }} {{ user.nom || user.email }}</h2>
                <p>{{ user.email }}</p>
                <p class="blocked-badge">
                  <ion-icon :icon="banOutline" color="danger"></ion-icon>
                  Compte bloqué
                </p>
              </ion-label>
              <ion-button fill="clear" color="success" @click="handleUnblock(user)">
                <ion-icon :icon="lockOpenOutline" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="success" @click="handleUnblock(user)">
                <ion-icon :icon="lockOpenOutline" slot="icon-only"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
      </div>

      <!-- Unblock Confirmation Alert -->
      <ion-alert
        :is-open="showUnblockAlert"
        header="Débloquer l'utilisateur"
        :message="`Voulez-vous débloquer ${selectedUser?.prenom || ''} ${selectedUser?.nom || selectedUser?.email} ?`"
        :buttons="alertButtons"
        @didDismiss="showUnblockAlert = false"
      ></ion-alert>

      <!-- Toast -->
      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :color="toastColor"
        :duration="3000"
        @didDismiss="showToast = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonBackButton, IonButton, IonIcon, IonList, IonItem, IonLabel,
  IonAvatar, IonSpinner, IonRefresher, IonRefresherContent, IonCard,
  IonCardContent, IonItemSliding, IonItemOptions, IonItemOption,
  IonAlert, IonToast
} from '@ionic/vue'
import {
  alertCircleOutline, checkmarkCircleOutline, informationCircleOutline,
  banOutline, lockOpenOutline
} from 'ionicons/icons'
import { http } from '../api/http'

interface User {
  id: number
  email: string
  nom?: string
  prenom?: string
  isBlocked?: boolean
  is_blocked?: boolean
  blocked?: boolean
}

const blockedUsers = ref<User[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showUnblockAlert = ref(false)
const selectedUser = ref<User | null>(null)
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const alertButtons = [
  {
    text: 'Annuler',
    role: 'cancel'
  },
  {
    text: 'Débloquer',
    handler: () => confirmUnblock()
  }
]

function getUserInitial(user: User) {
  return (user.prenom?.charAt(0) || user.email.charAt(0)).toUpperCase()
}

async function fetchBlockedUsers() {
  loading.value = true
  error.value = null

  try {
    // Try the dedicated endpoint first
    const res = await http.get('/api/users/blocked')
    blockedUsers.value = res.data || []
    console.log('Blocked users loaded:', blockedUsers.value)
  } catch (e: any) {
    // Fallback: get all users and filter blocked ones
    try {
      const res = await http.get('/api/users')
      const allUsers = res.data || []
      blockedUsers.value = allUsers.filter((u: User) =>
        u.isBlocked === true || u.is_blocked === true || u.blocked === true
      )
      console.log('Blocked users (filtered):', blockedUsers.value)
    } catch (err: any) {
      console.error('Error loading users:', err)
      error.value = err.response?.data?.message || 'Erreur lors du chargement'
    }
  } finally {
    loading.value = false
  }
}

async function handleRefresh(event: any) {
  await fetchBlockedUsers()
  event.target.complete()
}

function handleUnblock(user: User) {
  selectedUser.value = user
  showUnblockAlert.value = true
}

async function confirmUnblock() {
  if (!selectedUser.value) return

  try {
    await http.put(`/api/users/${selectedUser.value.id}/unblock`)
    
    // Remove from list
    blockedUsers.value = blockedUsers.value.filter(u => u.id !== selectedUser.value!.id)
    
    toastMessage.value = `${selectedUser.value.prenom || ''} ${selectedUser.value.nom || selectedUser.value.email} a été débloqué`
    toastColor.value = 'success'
    showToast.value = true
  } catch (e: any) {
    console.error('Error unblocking user:', e)
    toastMessage.value = e.response?.data?.message || 'Erreur lors du déblocage'
    toastColor.value = 'danger'
    showToast.value = true
  }

  selectedUser.value = null
}

onMounted(() => {
  fetchBlockedUsers()
})
</script>

<style scoped>
.blocked-content {
  --background: #f5f5f5;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60%;
  padding: 20px;
  text-align: center;
}

.error-icon {
  font-size: 64px;
  color: var(--ion-color-danger);
  margin-bottom: 16px;
}

.empty-icon {
  font-size: 80px;
  color: var(--ion-color-success);
  margin-bottom: 16px;
}

.empty-container h3 {
  margin: 0 0 8px;
  color: var(--ion-color-dark);
}

.empty-container p {
  margin: 0;
  color: var(--ion-color-medium);
}

.users-container {
  padding: 16px;
}

.info-card {
  margin-bottom: 16px;
  --background: #e3f2fd;
}

.info-card ion-card-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.info-card ion-icon {
  font-size: 24px;
}

.user-avatar {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
}

ion-item h2 {
  font-weight: 600;
  color: var(--ion-color-dark);
}

.blocked-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ion-color-danger);
  font-size: 0.85rem;
  margin-top: 4px;
}

.blocked-badge ion-icon {
  font-size: 14px;
}
</style>
