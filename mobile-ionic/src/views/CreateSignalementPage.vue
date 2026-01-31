<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\CreateSignalementPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/map" />
        </ion-buttons>
        <ion-title>➕ Nouveau Signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Form Card -->
      <ion-card class="form-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon :icon="createOutline"></ion-icon> Informations
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item class="form-item">
              <ion-textarea 
                v-model="description" 
                label="Description" 
                label-placement="floating" 
                :rows="3"
                placeholder="Décrivez le problème..."
                class="custom-input"
              />
            </ion-item>
            <ion-item class="form-item">
              <ion-input 
                v-model="surfaceM2" 
                type="number" 
                label="Surface (m²)" 
                label-placement="floating"
                placeholder="Ex: 50"
                class="custom-input"
              />
            </ion-item>
            <ion-item class="form-item">
              <ion-input 
                v-model="budget" 
                type="number" 
                label="Budget estimé (Ar)" 
                label-placement="floating"
                placeholder="Ex: 500000"
                class="custom-input"
              />
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Map Card -->
      <ion-card class="map-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon :icon="locationOutline"></ion-icon> Emplacement
          </ion-card-title>
          <ion-card-subtitle>Cliquez sur la carte pour sélectionner</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content class="map-card-content">
          <div id="create-map" class="mini-map"></div>
        </ion-card-content>
      </ion-card>

      <!-- Position Info -->
      <ion-card v-if="position" class="position-card">
        <ion-card-content>
          <div class="position-info">
            <ion-icon :icon="checkmarkCircleOutline" color="success"></ion-icon>
            <div>
              <strong>Position sélectionnée</strong>
              <p>Lat: {{ position.lat.toFixed(6) }}, Lng: {{ position.lng.toFixed(6) }}</p>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Error Message -->
      <ion-card v-if="error" class="error-card">
        <ion-card-content>
          <div class="error-info">
            <ion-icon :icon="alertCircleOutline" color="danger"></ion-icon>
            <span>{{ error }}</span>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Submit Button -->
      <div class="submit-section">
        <ion-button expand="block" color="primary" @click="handleSubmit" :disabled="loading" class="submit-btn">
          <ion-icon :icon="cloudUploadOutline" slot="start" v-if="!loading"></ion-icon>
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
          {{ loading ? 'Création en cours...' : 'Créer le signalement' }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
  IonBackButton, IonList, IonItem, IonInput, IonTextarea, IonButton, 
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonIcon, IonSpinner
} from '@ionic/vue'
import { createOutline, locationOutline, checkmarkCircleOutline, alertCircleOutline, cloudUploadOutline } from 'ionicons/icons'
import L from 'leaflet'
import { http, getApiErrorMessage } from '../api/http'

const router = useRouter()

const description = ref('')
const surfaceM2 = ref('')
const budget = ref('')
const position = ref<{ lat: number; lng: number } | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

let marker: L.Marker | null = null

onMounted(() => {
  setTimeout(() => {
    const map = L.map('create-map').setView([-18.8792, 47.5079], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    map.on('click', (e: L.LeafletMouseEvent) => {
      position.value = { lat: e.latlng.lat, lng: e.latlng.lng }
      error.value = null
      if (marker) {
        marker.setLatLng(e.latlng)
      } else {
        marker = L.marker(e.latlng).addTo(map)
      }
    })
  }, 100)
})

async function handleSubmit() {
  if (!position.value) {
    error.value = 'Sélectionnez un emplacement sur la carte'
    return
  }

  if (!description.value.trim()) {
    error.value = 'La description est requise'
    return
  }

  error.value = null
  loading.value = true

  try {
    await http.post('/api/signalements', {
      description: description.value,
      latitude: position.value.lat,
      longitude: position.value.lng,
      surfaceM2: parseFloat(surfaceM2.value) || 0,
      budget: parseFloat(budget.value) || 0
    })
    router.replace('/map')
  } catch (err) {
    error.value = getApiErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import 'leaflet/dist/leaflet.css';

.form-card {
  margin-bottom: 12px;
}

.form-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 8px;
}

.custom-input {
  --background: var(--ion-color-light);
  --padding-start: 12px;
  --padding-end: 12px;
  border-radius: 8px;
}

.map-card {
  margin-bottom: 12px;
}

.map-card-content {
  padding: 0;
}

.mini-map {
  height: 200px;
  width: 100%;
  border-radius: 0 0 8px 8px;
}

.position-card {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  margin-bottom: 12px;
}

.position-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.position-info ion-icon {
  font-size: 28px;
}

.position-info strong {
  display: block;
  color: #155724;
}

.position-info p {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #155724;
  opacity: 0.8;
}

.error-card {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  margin-bottom: 12px;
}

.error-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #721c24;
}

.error-info ion-icon {
  font-size: 24px;
}

.submit-section {
  margin-top: 16px;
  margin-bottom: 24px;
}

.submit-btn {
  --border-radius: 12px;
  height: 50px;
  font-weight: 600;
}
</style>