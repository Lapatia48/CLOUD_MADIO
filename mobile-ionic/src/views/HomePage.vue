<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\HomePage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>🛣️ MADIO</ion-title>
        <div slot="end" class="header-actions">
          <NotificationBell v-if="isAuthenticated" />
          <ion-chip :color="isOffline ? 'danger' : 'success'" class="status-chip">
            {{ isOffline ? '🔴 Offline' : '🟢 Online' }}
          </ion-chip>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Guest Card si non connecté -->
      <ion-card v-if="!isAuthenticated" class="welcome-card">
        <ion-card-header>
          <ion-card-title>👋 Bienvenue !</ion-card-title>
          <ion-card-subtitle>Gestion des routes</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <p>Connectez-vous pour signaler et suivre les problèmes routiers.</p>
          <div class="action-buttons">
            <ion-button expand="block" router-link="/login">
              <ion-icon :icon="logInOutline" slot="start"></ion-icon>
              Se connecter
            </ion-button>
            <ion-button expand="block" fill="outline" router-link="/register">
              <ion-icon :icon="personAddOutline" slot="start"></ion-icon>
              Créer un compte
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- User Card si connecté -->
      <ion-card v-else class="user-card">
        <ion-card-content>
          <div class="user-info-row">
            <ion-avatar class="user-avatar">
              <div class="avatar-text">{{ userInitial }}</div>
            </ion-avatar>
            <div class="user-details">
              <h2>{{ userName }}</h2>
              <ion-badge color="primary">{{ userRole }}</ion-badge>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Carte miniature -->
      <ion-card class="map-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon :icon="mapOutline"></ion-icon> Carte
          </ion-card-title>
        </ion-card-header>
        <ion-card-content class="map-card-content">
          <div id="home-map" class="mini-map"></div>
        </ion-card-content>
      </ion-card>

      <!-- Actions si connecté -->
      <div v-if="isAuthenticated" class="action-buttons">
        <ion-button expand="block" color="primary" router-link="/signalement/new">
          <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
          Nouveau signalement
        </ion-button>
        <ion-button expand="block" color="secondary" router-link="/map">
          <ion-icon :icon="listOutline" slot="start"></ion-icon>
          Mes signalements
        </ion-button>
        <!-- Bouton Admin pour gérer les signalements -->
        <ion-button v-if="isAdmin" expand="block" color="tertiary" router-link="/admin/signalements">
          <ion-icon :icon="settingsOutline" slot="start"></ion-icon>
          Gestion Admin
        </ion-button>
        <ion-button expand="block" color="medium" fill="outline" @click="handleLogout">
          <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
          Déconnexion
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, 
  IonCardSubtitle, IonCardContent, IonChip, IonAvatar, IonBadge 
} from '@ionic/vue'
import { logInOutline, mapOutline, personAddOutline, addCircleOutline, listOutline, logOutOutline, settingsOutline } from 'ionicons/icons'
import L from 'leaflet'
import { useAuthStore } from '../stores/auth'
import NotificationBell from '../components/NotificationBell.vue'

const router = useRouter()
const authStore = useAuthStore()

const isOffline = ref(!navigator.onLine)
const isAuthenticated = computed(() => !!localStorage.getItem('token'))

const userName = computed(() => {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      const parsed = JSON.parse(user)
      return parsed.prenom || parsed.email || 'Utilisateur'
    } catch { return 'Utilisateur' }
  }
  return 'Utilisateur'
})

const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

const userRole = computed(() => {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      const parsed = JSON.parse(user)
      return parsed.role || 'USER'
    } catch { return 'USER' }
  }
  return 'USER'
})

const isAdmin = computed(() => {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      const parsed = JSON.parse(user)
      // ADMIN = id_role 1 (selon init.sql), ou role='ADMIN'
      return parsed.role === 'ADMIN' || parsed.id_role === 1
    } catch { return false }
  }
  return false
})

let map: L.Map | null = null
let tileLayer: L.TileLayer | null = null

function handleOnline() { isOffline.value = false; updateTileLayer() }
function handleOffline() { isOffline.value = true; updateTileLayer() }

function handleLogout() {
  authStore.logout()
  router.replace('/login')
}

function updateTileLayer() {
  if (!map) return
  if (tileLayer) map.removeLayer(tileLayer)
  
  const tileUrl = isOffline.value
    ? 'http://localhost:8081/styles/basic/{z}/{x}/{y}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  tileLayer = L.tileLayer(tileUrl, {
    attribution: isOffline.value ? 'TileServer Local' : '&copy; OpenStreetMap'
  }).addTo(map)
}

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  setTimeout(() => {
    map = L.map('home-map').setView([-18.8792, 47.5079], 13)
    updateTileLayer()
  }, 100)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  if (map) { map.remove(); map = null }
})
</script>

<style scoped>
@import 'leaflet/dist/leaflet.css';

.status-chip {
  margin-right: 8px;
  font-size: 0.75rem;
}

.welcome-card {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  color: white;
}

.welcome-card ion-card-title,
.welcome-card ion-card-subtitle {
  color: white;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 8px;
}

.welcome-card p {
  margin: 16px 0;
  opacity: 0.9;
}

.user-card {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.user-info-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

.avatar-text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.user-details h2 {
  margin: 0 0 4px;
  font-size: 1.2rem;
  color: white;
}

.map-card {
  margin-top: 16px;
}

.map-card-content {
  padding: 0;
}

.mini-map {
  height: 200px;
  width: 100%;
  border-radius: 0 0 8px 8px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.action-buttons ion-button {
  --border-radius: 8px;
}
</style>