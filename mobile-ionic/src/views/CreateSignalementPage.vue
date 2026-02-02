<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/map" />
        </ion-buttons>
        <ion-title>📍 Nouveau Signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="create-content">
      <!-- Map Section -->
      <ion-card class="map-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon :icon="mapOutline"></ion-icon> Sélectionner l'emplacement
          </ion-card-title>
          <ion-card-subtitle>👆 Cliquez sur la carte pour marquer le problème</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content class="map-card-content">
          <div id="create-map" class="create-map"></div>
        </ion-card-content>
      </ion-card>

      <!-- Position Info -->
      <ion-card v-if="position" class="position-card">
        <ion-card-content>
          <div class="position-info">
            <ion-icon :icon="checkmarkCircleOutline" color="success"></ion-icon>
            <div>
              <strong>Coordonnées sélectionnées</strong>
              <p>📍 {{ position.lat.toFixed(6) }}, {{ position.lng.toFixed(6) }}</p>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-card v-else class="position-empty-card">
        <ion-card-content>
          <div class="position-empty">
            <ion-icon :icon="locationOutline" color="medium"></ion-icon>
            <span>Aucun emplacement sélectionné</span>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Form Section -->
      <ion-card class="form-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon :icon="createOutline"></ion-icon> Informations
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <!-- Description -->
          <div class="form-group">
            <label class="form-label">Description du problème *</label>
            <ion-textarea 
              v-model="description" 
              :rows="3"
              placeholder="Décrivez le problème de la route..."
              class="form-textarea"
            />
          </div>

          <!-- Surface & Budget Row -->
          <div class="form-row">
            <div class="form-group half">
              <label class="form-label">Surface (m²)</label>
              <ion-input 
                v-model="surfaceM2" 
                type="number" 
                placeholder="Ex: 10"
                class="form-input"
              />
            </div>
            <div class="form-group half">
              <label class="form-label">Budget estimé (Ar)</label>
              <ion-input 
                v-model="budget" 
                type="number" 
                placeholder="Ex: 500000"
                class="form-input"
              />
            </div>
          </div>

          <!-- Entreprise -->
          <div class="form-group">
            <label class="form-label">Entreprise assignée</label>
            <ion-select 
              v-model="entrepriseId" 
              placeholder="-- Aucune entreprise --"
              interface="action-sheet"
              class="form-select"
            >
              <ion-select-option :value="null">-- Aucune entreprise --</ion-select-option>
              <ion-select-option v-for="ent in entreprises" :key="ent.id" :value="ent.id">
                {{ ent.nom }} {{ ent.adresse ? `(${ent.adresse})` : '' }}
              </ion-select-option>
            </ion-select>
          </div>

          <!-- Status -->
          <div class="form-group">
            <label class="form-label">Statut</label>
            <ion-input 
              value="NOUVEAU" 
              disabled
              class="form-input disabled"
            />
          </div>

          <!-- Date -->
          <div class="form-group">
            <label class="form-label">Date de signalement</label>
            <ion-datetime-button datetime="datetime"></ion-datetime-button>
            <ion-modal :keep-contents-mounted="true">
              <ion-datetime 
                id="datetime" 
                v-model="dateSignalement"
                presentation="date-time"
                :prefer-wheel="false"
              ></ion-datetime>
            </ion-modal>
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
          <ion-icon :icon="checkmarkOutline" slot="start" v-if="!loading"></ion-icon>
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
          {{ loading ? 'Création en cours...' : '✓ Créer le signalement' }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
  IonBackButton, IonInput, IonTextarea, IonButton, IonSelect, IonSelectOption,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonIcon, IonSpinner, IonDatetime, IonDatetimeButton, IonModal
} from '@ionic/vue'
import { 
  createOutline, locationOutline, checkmarkCircleOutline, alertCircleOutline, 
  checkmarkOutline, mapOutline 
} from 'ionicons/icons'
import L from 'leaflet'
import { http, getApiErrorMessage } from '../api/http'

interface Entreprise {
  id: number
  nom: string
  adresse?: string
}

const router = useRouter()

const description = ref('')
const surfaceM2 = ref('')
const budget = ref('')
const entrepriseId = ref<number | null>(null)
const entreprises = ref<Entreprise[]>([])
const dateSignalement = ref(new Date().toISOString())
const position = ref<{ lat: number; lng: number } | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

let map: L.Map | null = null
let marker: L.Marker | null = null

async function fetchEntreprises() {
  try {
    const res = await http.get('/api/entreprises')
    entreprises.value = res.data || []
  } catch (e) {
    console.error('Erreur chargement entreprises:', e)
  }
}

onMounted(() => {
  fetchEntreprises()
  
  setTimeout(() => {
    map = L.map('create-map').setView([-18.8792, 47.5079], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    map.on('click', (e: L.LeafletMouseEvent) => {
      position.value = { lat: e.latlng.lat, lng: e.latlng.lng }
      error.value = null
      if (marker) {
        marker.setLatLng(e.latlng)
      } else {
        marker = L.marker(e.latlng).addTo(map!)
      }
    })
  }, 100)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

async function handleSubmit() {
  if (!position.value) {
    error.value = 'Veuillez cliquer sur la carte pour sélectionner un emplacement'
    return
  }

  if (!description.value.trim()) {
    error.value = 'La description est requise'
    return
  }

  error.value = null
  loading.value = true

  try {
    // Get user info
    const userStr = localStorage.getItem('user')
    let userId = null
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        userId = user.id || user.userId
      } catch (e) {
        console.error('Error parsing user:', e)
      }
    }

    const payload = {
      description: description.value,
      latitude: position.value.lat,
      longitude: position.value.lng,
      surfaceM2: surfaceM2.value ? parseFloat(surfaceM2.value) : null,
      budget: budget.value ? parseFloat(budget.value) : null,
      status: 'NOUVEAU',
      dateSignalement: new Date(dateSignalement.value).toISOString(),
      entreprise: entrepriseId.value ? { id: entrepriseId.value } : null,
      user: userId ? { id: userId } : null
    }

    console.log('Envoi signalement:', payload)

    await http.post('/api/signalements', payload)
    
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

.create-content {
  --background: #f5f5f5;
}

.map-card {
  margin: 16px;
  margin-bottom: 12px;
}

.map-card-content {
  padding: 0;
}

.create-map {
  height: 220px;
  width: 100%;
  border-radius: 0 0 8px 8px;
}

.position-card {
  margin: 0 16px 12px;
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
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
  font-size: 0.9rem;
  color: #155724;
}

.position-empty-card {
  margin: 0 16px 12px;
  background: #f8f9fa;
}

.position-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--ion-color-medium);
}

.form-card {
  margin: 0 16px 12px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group.half {
  flex: 1;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
  margin-bottom: 8px;
}

.form-input,
.form-textarea,
.form-select {
  --background: #ffffff;
  --padding-start: 14px;
  --padding-end: 14px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
}

.form-input.disabled {
  --background: #f5f5f5;
  --color: #7f8c8d;
}

.form-textarea {
  min-height: 80px;
}

.form-select {
  width: 100%;
}

.error-card {
  margin: 0 16px 12px;
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
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
  margin: 16px;
  margin-bottom: 32px;
}

.submit-btn {
  --border-radius: 12px;
  height: 50px;
  font-weight: 600;
  --background: linear-gradient(135deg, #3498db, #2980b9);
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

ion-datetime-button {
  width: 100%;
}

ion-datetime-button::part(native) {
  background: #ffffff;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 12px 14px;
  width: 100%;
  justify-content: flex-start;
}
</style>