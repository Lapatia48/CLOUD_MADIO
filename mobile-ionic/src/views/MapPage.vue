<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\MapPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" />
        </ion-buttons>
        <ion-title>📋 Mes Signalements</ion-title>
        <ion-chip slot="end" :color="isOffline ? 'danger' : 'success'" class="status-chip">
          {{ isOffline ? '🔴' : '🟢' }}
        </ion-chip>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- User Info Card -->
      <ion-card class="user-card">
        <ion-card-content>
          <div class="user-info-row">
            <ion-avatar class="user-avatar">
              <div class="avatar-text">{{ userInitial }}</div>
            </ion-avatar>
            <div class="user-details">
              <h2>{{ userName }}</h2>
              <ion-badge color="primary">{{ userRole }}</ion-badge>
            </div>
            <ion-button fill="clear" color="danger" @click="handleLogout" class="logout-btn">
              <ion-icon :icon="logOutOutline" />
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Stats Cards -->
      <div class="stats-row">
        <ion-card class="stat-card nouveau">
          <ion-card-content>
            <span class="stat-number">{{ statsNouveau }}</span>
            <span class="stat-label">Nouveaux</span>
          </ion-card-content>
        </ion-card>
        <ion-card class="stat-card en-cours">
          <ion-card-content>
            <span class="stat-number">{{ statsEnCours }}</span>
            <span class="stat-label">En cours</span>
          </ion-card-content>
        </ion-card>
        <ion-card class="stat-card termine">
          <ion-card-content>
            <span class="stat-number">{{ statsTermine }}</span>
            <span class="stat-label">Terminés</span>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Mini Map Card -->
      <ion-card class="map-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon :icon="mapOutline"></ion-icon> Localisation
          </ion-card-title>
        </ion-card-header>
        <ion-card-content class="map-card-content">
          <div id="map" class="mini-map"></div>
        </ion-card-content>
      </ion-card>

      <!-- Signalements List -->
      <ion-card class="list-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon :icon="listOutline"></ion-icon> Liste ({{ signalements.length }})
          </ion-card-title>
        </ion-card-header>
        <ion-card-content class="list-content">
          <ion-list v-if="signalements.length > 0">
            <ion-item v-for="sig in signalements" :key="sig.id" button @click="goToDetail(sig.id)">
              <div class="status-dot" :style="{ backgroundColor: getStatusColor(sig.status) }" slot="start"></div>
              <ion-label>
                <h3>{{ sig.description?.slice(0, 30) || 'Signalement' }}...</h3>
                <p>{{ getStatusLabel(sig.status) }} • {{ formatDate(sig) }}</p>
              </ion-label>
              <ion-icon :icon="chevronForwardOutline" slot="end" color="medium"></ion-icon>
            </ion-item>
          </ion-list>
          <div v-else class="empty-state">
            <ion-icon :icon="alertCircleOutline" class="empty-icon"></ion-icon>
            <p>Aucun signalement</p>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- FAB Button -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button color="primary" router-link="/signalement/new">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, 
  IonIcon, IonFab, IonFabButton, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonChip, IonAvatar, IonBadge, IonBackButton, IonList, IonItem, IonLabel 
} from '@ionic/vue'
import { addOutline, logOutOutline, mapOutline, listOutline, chevronForwardOutline, alertCircleOutline } from 'ionicons/icons'
import L from 'leaflet'
import { useAuthStore } from '../stores/auth'
import { http } from '../api/http'

interface Signalement {
  id: number
  description?: string
  latitude: number
  longitude: number
  status: string
  dateSignalement?: string
  date_signalement?: string
}

const router = useRouter()
const authStore = useAuthStore()
const isOffline = ref(!navigator.onLine)
const signalements = ref<Signalement[]>([])

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

const statsNouveau = computed(() => signalements.value.filter(s => s.status === 'NOUVEAU').length)
const statsEnCours = computed(() => signalements.value.filter(s => s.status === 'EN_COURS').length)
const statsTermine = computed(() => signalements.value.filter(s => s.status === 'TERMINE').length)

let map: L.Map | null = null
let tileLayer: L.TileLayer | null = null

function handleLogout() {
  authStore.logout()
  router.replace('/login')
}

function goToDetail(id: number) {
  router.push(`/signalement/${id}`)
}

function getStatusColor(status: string) {
  switch (status) {
    case 'NOUVEAU': return '#e74c3c'
    case 'EN_COURS': return '#f39c12'
    case 'TERMINE': return '#27ae60'
    default: return '#3498db'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'NOUVEAU': return '🔴 Nouveau'
    case 'EN_COURS': return '🟠 En cours'
    case 'TERMINE': return '🟢 Terminé'
    default: return status
  }
}

function formatDate(sig: Signalement) {
  const dateStr = sig.dateSignalement || sig.date_signalement
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

function handleOnline() { isOffline.value = false; updateTileLayer() }
function handleOffline() { isOffline.value = true; updateTileLayer() }

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

onMounted(async () => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  setTimeout(() => {
    map = L.map('map').setView([-18.8792, 47.5079], 13)
    updateTileLayer()

    // Add markers after loading signalements
    signalements.value.forEach((s) => {
      L.marker([s.latitude, s.longitude])
        .addTo(map!)
        .bindPopup(`<b>${s.description?.slice(0, 20) || 'Signalement'}</b><br>${getStatusLabel(s.status)}`)
    })
  }, 100)

  try {
    const res = await http.get('/api/signalements/me')
    signalements.value = res.data

    // Update markers on map
    if (map) {
      signalements.value.forEach((s) => {
        L.marker([s.latitude, s.longitude])
          .addTo(map!)
          .bindPopup(`<b>${s.description?.slice(0, 20) || 'Signalement'}</b><br>${getStatusLabel(s.status)}`)
      })
    }
  } catch (e) {
    console.error('Erreur chargement signalements:', e)
  }
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
  font-size: 0.7rem;
}

.user-card {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  margin-bottom: 8px;
}

.user-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

.avatar-text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: bold;
  color: white;
}

.user-details {
  flex: 1;
}

.user-details h2 {
  margin: 0 0 4px;
  font-size: 1.1rem;
  color: white;
}

.logout-btn {
  --padding-start: 8px;
  --padding-end: 8px;
}

.stats-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.stat-card {
  flex: 1;
  margin: 0;
  text-align: center;
}

.stat-card ion-card-content {
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.7rem;
  opacity: 0.8;
}

.stat-card.nouveau {
  border-top: 3px solid #e74c3c;
}
.stat-card.nouveau .stat-number {
  color: #e74c3c;
}

.stat-card.en-cours {
  border-top: 3px solid #f39c12;
}
.stat-card.en-cours .stat-number {
  color: #f39c12;
}

.stat-card.termine {
  border-top: 3px solid #27ae60;
}
.stat-card.termine .stat-number {
  color: #27ae60;
}

.map-card {
  margin-bottom: 8px;
}

.map-card-content {
  padding: 0;
}

.mini-map {
  height: 180px;
  width: 100%;
  border-radius: 0 0 8px 8px;
}

.list-card {
  margin-bottom: 80px;
}

.list-content {
  padding: 0;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 8px;
}
</style>