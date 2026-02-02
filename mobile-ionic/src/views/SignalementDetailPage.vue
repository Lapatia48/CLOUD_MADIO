<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/map" />
        </ion-buttons>
        <ion-title>Détail du signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Chargement...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <ion-icon :icon="alertCircleOutline" class="error-icon"></ion-icon>
        <p>{{ error }}</p>
        <ion-button fill="outline" @click="loadSignalement">Réessayer</ion-button>
      </div>

      <div v-else-if="signalement" class="detail-content">
        <!-- Status Card -->
        <ion-card class="status-card" :class="getStatusClass(signalement.status)">
          <ion-card-content>
            <div class="status-row">
              <div class="status-badge">
                <span class="status-dot" :style="{ backgroundColor: getStatusColor(signalement.status) }"></span>
                {{ getStatusLabel(signalement.status) }}
              </div>
              <span class="date-badge">{{ formatDate(signalement) }}</span>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Description Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="documentTextOutline"></ion-icon> Description
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p class="description-text">{{ signalement.description || 'Aucune description' }}</p>
          </ion-card-content>
        </ion-card>

        <!-- Location Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="locationOutline"></ion-icon> Localisation
            </ion-card-title>
          </ion-card-header>
          <ion-card-content class="map-card-content">
            <div id="detail-map" class="detail-map"></div>
            <p class="coordinates">
              📍 {{ signalement.latitude?.toFixed(6) }}, {{ signalement.longitude?.toFixed(6) }}
            </p>
          </ion-card-content>
        </ion-card>

        <!-- Photo Card (if exists) -->
        <ion-card v-if="signalement.photoPath">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="imageOutline"></ion-icon> Photo
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <img :src="getPhotoUrl(signalement.photoPath)" class="signalement-photo" alt="Photo du signalement">
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
  IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonIcon, IonSpinner, IonButton
} from '@ionic/vue'
import { alertCircleOutline, documentTextOutline, locationOutline, imageOutline } from 'ionicons/icons'
import L from 'leaflet'
import { http } from '../api/http'

interface Signalement {
  id: number
  description?: string
  latitude: number
  longitude: number
  status: string
  dateSignalement?: string
  date_signalement?: string
  photoPath?: string
}

const route = useRoute()
const signalement = ref<Signalement | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

let map: L.Map | null = null

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

function getStatusClass(status: string) {
  switch (status) {
    case 'NOUVEAU': return 'status-nouveau'
    case 'EN_COURS': return 'status-en-cours'
    case 'TERMINE': return 'status-termine'
    default: return ''
  }
}

function formatDate(sig: Signalement) {
  const dateStr = sig.dateSignalement || sig.date_signalement
  if (!dateStr) return 'Date inconnue'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function getPhotoUrl(photoPath: string) {
  if (photoPath.startsWith('http')) return photoPath
  return `http://localhost:8080${photoPath}`
}

async function loadSignalement() {
  const id = route.params.id
  if (!id) {
    error.value = 'ID du signalement manquant'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const res = await http.get(`/api/signalements/${id}`)
    signalement.value = res.data
    console.log('Signalement loaded:', res.data)
    
    // Initialize map after data is loaded
    setTimeout(() => {
      if (signalement.value && signalement.value.latitude && signalement.value.longitude) {
        map = L.map('detail-map').setView([signalement.value.latitude, signalement.value.longitude], 15)
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map)

        L.marker([signalement.value.latitude, signalement.value.longitude])
          .addTo(map)
          .bindPopup(`<b>${signalement.value.description?.slice(0, 30) || 'Signalement'}</b>`)
          .openPopup()
      }
    }, 200)
  } catch (e: any) {
    console.error('Erreur chargement signalement:', e)
    error.value = e.response?.data?.message || 'Erreur lors du chargement du signalement'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSignalement()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
@import 'leaflet/dist/leaflet.css';

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50%;
  color: var(--ion-color-medium);
}

.error-icon {
  font-size: 64px;
  color: var(--ion-color-danger);
  margin-bottom: 16px;
}

.detail-content {
  padding-bottom: 20px;
}

.status-card {
  margin-bottom: 16px;
}

.status-card.status-nouveau {
  border-left: 4px solid #e74c3c;
}

.status-card.status-en-cours {
  border-left: 4px solid #f39c12;
}

.status-card.status-termine {
  border-left: 4px solid #27ae60;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 1.1rem;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.date-badge {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.description-text {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--ion-text-color);
}

.map-card-content {
  padding: 0;
}

.detail-map {
  height: 200px;
  width: 100%;
  border-radius: 0;
}

.coordinates {
  padding: 12px 16px;
  margin: 0;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  background: var(--ion-color-light);
}

.signalement-photo {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

ion-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
}

ion-card-title ion-icon {
  color: var(--ion-color-primary);
}
</style>
