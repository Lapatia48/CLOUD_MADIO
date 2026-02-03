<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="danger">
        <ion-buttons slot="start">
          <ion-back-button default-href="/map" />
        </ion-buttons>
        <ion-title>🚫 Utilisateurs Bloqués</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="blocked-content">
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent" color="danger" />
        <p>Chargement...</p>
      </div>

      <!-- Error -->
      <ion-card v-else-if="error" class="error-card">
        <ion-card-content>
          <ion-icon :icon="alertCircleOutline" color="danger" class="error-icon" />
          <p>{{ error }}</p>
          <ion-button @click="fetchBlockedUsers" color="danger">
            Réessayer
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Empty State -->
      <ion-card v-else-if="users.length === 0" class="empty-card">
        <ion-card-content class="empty-state">
          <ion-icon :icon="checkmarkCircleOutline" class="empty-icon" color="success" />
          <h2>Aucun utilisateur bloqué</h2>
          <p>Tous les comptes sont actuellement actifs</p>
        </ion-card-content>
      </ion-card>

      <!-- Users List -->
      <ion-list v-else>
        <ion-item-sliding v-for="user in users" :key="user.id">
          <ion-item class="user-item">
            <ion-avatar slot="start" class="user-avatar">
              <div class="avatar-letter">
                {{ (user.prenom?.charAt(0) || user.email.charAt(0)).toUpperCase() }}
              </div>
            </ion-avatar>
            <ion-label>
              <h2>{{ user.prenom || '' }} {{ user.nom || user.email }}</h2>
              <p>{{ user.email }}</p>
              <p class="attempts-text">
                🔴 {{ user.failedAttempts || 0 }} tentatives échouées
              </p>
            </ion-label>
            <ion-button 
              slot="end" 
              color="success" 
              size="small"
              @click="handleUnblock(user)"
              :disabled="unblocking === user.id"
            >
              <ion-icon :icon="lockOpenOutline" slot="start" />
              {{ unblocking === user.id ? '...' : 'Débloquer' }}
            </ion-button>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option color="success" @click="handleUnblock(user)">
              <ion-icon :icon="lockOpenOutline" slot="icon-only" />
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <!-- Refresh Button -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button color="danger" @click="fetchBlockedUsers">
          <ion-icon :icon="refreshOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption, IonLabel,
  IonAvatar, IonButton, IonIcon, IonCard, IonCardContent, IonSpinner, IonFab, IonFabButton
} from '@ionic/vue'
import {
  alertCircleOutline, checkmarkCircleOutline, lockOpenOutline, refreshOutline
} from 'ionicons/icons'
import { http } from '../api/http'

interface User {
  id: number
  email: string
  nom?: string
  prenom?: string
  failedAttempts?: number
  isBlocked?: boolean
}

const loading = ref(true)
const error = ref<string | null>(null)
const users = ref<User[]>([])
const unblocking = ref<number | null>(null)

async function fetchBlockedUsers() {
  loading.value = true
  error.value = null
  
  try {
    const response = await http.get('/api/users/blocked')
    users.value = response.data
    console.log('Blocked users:', users.value)
  } catch (err) {
    console.error('Erreur:', err)
    error.value = 'Erreur lors du chargement des utilisateurs'
  } finally {
    loading.value = false
  }
}

async function handleUnblock(user: User) {
  unblocking.value = user.id
  
  try {
    await http.post(`/api/users/${user.id}/unblock`)
    users.value = users.value.filter(u => u.id !== user.id)
    alert(`✅ ${user.prenom || user.email} a été débloqué !`)
  } catch (err) {
    console.error('Erreur:', err)
    alert('❌ Erreur lors du déblocage')
  } finally {
    unblocking.value = null
  }
}

onMounted(() => {
  fetchBlockedUsers()
})
</script>

<style scoped>
.blocked-content {
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
}

.loading-state p {
  margin-top: 15px;
  font-size: 1.1rem;
}

.error-card,
.empty-card {
  margin: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.error-card ion-card-content {
  text-align: center;
  padding: 30px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 15px;
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
}

.empty-icon {
  font-size: 5rem;
  display: block;
  margin-bottom: 20px;
}

.empty-state h2 {
  margin: 10px 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.empty-state p {
  color: #7f8c8d;
  margin: 0;
}

ion-list {
  background: transparent;
  padding: 10px;
}

.user-item {
  --background: white;
  margin: 10px 5px;
  border-radius: 12px;
  border-left: 4px solid #e74c3c;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.user-avatar {
  --border-radius: 50%;
  width: 50px;
  height: 50px;
}

.avatar-letter {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  font-size: 1.3rem;
  font-weight: bold;
  border-radius: 50%;
}

.user-item ion-label h2 {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.user-item ion-label p {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.attempts-text {
  color: #e74c3c !important;
  font-weight: 600;
  font-size: 0.85rem !important;
  margin-top: 4px;
}

ion-item-option {
  --background: #27ae60;
}
</style>
