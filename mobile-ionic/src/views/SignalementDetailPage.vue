<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/map" />
        </ion-buttons>
        <ion-title>Detail Signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="detail-content">
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent" color="primary" />
        <p>Chargement...</p>
      </div>

      <div v-else-if="!signalement" class="not-found-state">
        <ion-icon :icon="alertCircleOutline" class="not-found-icon" />
        <h2>Signalement non trouve</h2>
        <ion-button @click="router.push('/map')">Retour</ion-button>
      </div>

      <template v-else>
        <div v-if="signalement.photoBase64 || signalement.photoUrl" class="photo-section">
          <img :src="getPhotoSrc()" alt="Photo du signalement" class="signalement-photo" />
        </div>

        <div class="detail-map" id="detail-map"></div>

        <ion-card class="progress-card" v-if="signalement.avancement !== undefined">
          <ion-card-content>
            <div class="progress-header">
              <span class="progress-label">Avancement</span>
              <span class="progress-value" :style="{ color: getStatusColor(signalement.status) }">
                {{ signalement.avancement }}%
              </span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: signalement.avancement + '%', backgroundColor: getStatusColor(signalement.status) }"></div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card class="info-card">
          <ion-card-header>
            <ion-badge :color="getStatusBadgeColor(signalement.status)">
              {{ getStatusLabel(signalement.status) }}
            </ion-badge>
            <ion-card-title>{{ signalement.description || 'Sans description' }}</ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-icon :icon="calendarOutline" slot="start" color="primary" />
                <ion-label>
                  <p>Date</p>
                  <h3>{{ formatDate(signalement.dateSignalement) }}</h3>
                </ion-label>
              </ion-item>

              <ion-item>
                <ion-icon :icon="resizeOutline" slot="start" color="success" />
                <ion-label>
                  <p>Surface</p>
                  <h3>{{ signalement.surfaceM2 ? signalement.surfaceM2 + ' m2' : 'Non renseignee' }}</h3>
                </ion-label>
              </ion-item>

              <ion-item>
                <ion-icon :icon="cashOutline" slot="start" color="warning" />
                <ion-label>
                  <p>Budget</p>
                  <h3>{{ signalement.budget ? signalement.budget.toLocaleString() + ' Ar' : 'Non renseigne' }}</h3>
                </ion-label>
              </ion-item>

              <ion-item>
                <ion-icon :icon="businessOutline" slot="start" color="tertiary" />
                <ion-label>
                  <p>Entreprise</p>
                  <h3>{{ signalement.entrepriseNom || 'Aucune' }}</h3>
                </ion-label>
              </ion-item>

              <ion-item>
                <ion-icon :icon="locationOutline" slot="start" color="danger" />
                <ion-label>
                  <p>Coordonnees GPS</p>
                  <h3>{{ signalement.latitude.toFixed(6) }}, {{ signalement.longitude.toFixed(6) }}</h3>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <ion-card class="info-message-card">
          <ion-card-content>
            <div class="info-message">
              <ion-icon :icon="informationCircleOutline" color="primary" />
              <p>Les mises a jour (budget, entreprise, avancement) sont effectuees par les managers via l'application web</p>
            </div>
          </ion-card-content>
        </ion-card>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel,
  IonIcon, IonBadge, IonSpinner, IonButton
} from '@ionic/vue'
import {
  alertCircleOutline, calendarOutline, resizeOutline, cashOutline,
  businessOutline, locationOutline, informationCircleOutline
} from 'ionicons/icons'
import L from 'leaflet'
import signalementFirebaseService from '../services/signalementFirebaseService'

interface Signalement {
  id: number
  description?: string
  latitude: number
  longitude: number
  status: string
  avancement?: number
  surfaceM2?: number | null
  budget?: number | null
  photoBase64?: string
  photoUrl?: string
  dateSignalement?: string
  entrepriseNom?: string
}

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const signalement = ref<Signalement | null>(null)
let map: L.Map | null = null

function getStatusLabel(status: string) {
  switch (status) {
    case 'NOUVEAU': return 'Nouveau'
    case 'EN_COURS': return 'En cours'
    case 'TERMINE': return 'Termine'
    default: return status
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'NOUVEAU': return '#e74c3c'
    case 'EN_COURS': return '#f39c12'
    case 'TERMINE': return '#27ae60'
    default: return '#3498db'
  }
}

function getPhotoSrc(): string {
  if (signalement.value?.photoBase64) {
    if (signalement.value.photoBase64.startsWith('data:')) return signalement.value.photoBase64
    return 'data:image/jpeg;base64,' + signalement.value.photoBase64
  }
  return signalement.value?.photoUrl || ''
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'NOUVEAU': return 'danger'
    case 'EN_COURS': return 'warning'
    case 'TERMINE': return 'success'
    default: return 'primary'
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function fetchSignalement() {
  const documentId = route.params.id as string
  try {
    const allSignalements = await signalementFirebaseService.getAllSignalements()
    const found = allSignalements.find(s => s.documentId === documentId)
    if (found) {
      signalement.value = {
        id: found.postgresId || 0,
        description: found.description,
        latitude: found.latitude,
        longitude: found.longitude,
        status: found.status,
        avancement: found.avancement,
        surfaceM2: found.surfaceM2,
        budget: found.budget,
        photoBase64: found.photoBase64,
        photoUrl: found.photoUrl,
        dateSignalement: found.dateSignalement,
        entrepriseNom: found.entrepriseNom,
      }
    } else {
      signalement.value = null
    }
  } catch (error) {
    console.error('Erreur:', error)
    signalement.value = null
  } finally {
    loading.value = false
  }
}

function initMap() {
  if (!signalement.value) return
  setTimeout(() => {
    const mapContainer = document.getElementById('detail-map')
    if (!mapContainer) return
    map = L.map('detail-map').setView([signalement.value!.latitude, signalement.value!.longitude], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map)
    L.circleMarker([signalement.value!.latitude, signalement.value!.longitude], {
      radius: 12, fillColor: getStatusColor(signalement.value!.status), color: '#fff', weight: 3, fillOpacity: 0.9
    }).addTo(map)
  }, 100)
}

onMounted(async () => { await fetchSignalement(); initMap() })
onUnmounted(() => { if (map) { map.remove(); map = null } })
</script>

<style scoped>
@import 'leaflet/dist/leaflet.css';
.detail-content { --padding-start: 0; --padding-end: 0; --padding-top: 0; --background: #f5f6fa; }
.loading-state, .not-found-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #7f8c8d; }
.not-found-icon { font-size: 5rem; color: #e74c3c; margin-bottom: 20px; }
.photo-section { width: 100%; max-height: 250px; overflow: hidden; }
.signalement-photo { width: 100%; height: 250px; object-fit: cover; }
.detail-map { height: 200px; width: 100%; }
.progress-card { margin: 15px; margin-bottom: 0; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.progress-label { font-size: 0.9rem; color: #7f8c8d; }
.progress-value { font-size: 1.2rem; font-weight: 700; }
.progress-bar { height: 12px; background: #ecf0f1; border-radius: 6px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 6px; transition: width 0.5s ease; }
.info-card { margin: 15px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.info-card ion-card-header { padding-bottom: 10px; }
.info-card ion-badge { margin-bottom: 10px; }
.info-card ion-card-title { font-size: 1.2rem; color: #2c3e50; }
.info-card ion-item { --background: #f8f9fa; --border-radius: 10px; margin-bottom: 8px; }
.info-card ion-item p { color: #7f8c8d; font-size: 0.8rem; }
.info-card ion-item h3 { color: #2c3e50; font-size: 1rem; font-weight: 600; margin: 4px 0 0; }
.info-message-card { margin: 15px; border-radius: 16px; background: rgba(52,152,219,0.1); }
.info-message { display: flex; align-items: flex-start; gap: 10px; }
.info-message ion-icon { font-size: 1.5rem; flex-shrink: 0; }
.info-message p { margin: 0; font-size: 0.85rem; color: #2c3e50; }
</style>
