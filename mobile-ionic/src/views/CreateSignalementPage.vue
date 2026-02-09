<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\CreateSignalementPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" />
        </ion-buttons>
        <ion-title>Nouveau Signalement</ion-title>
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
                label="Description du problème *" 
                label-placement="floating" 
                :rows="3"
                placeholder="Décrivez le problème routier..."
                class="custom-input"
              />
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Photo Card -->
      <ion-card class="photo-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon :icon="cameraOutline"></ion-icon> Photo
          </ion-card-title>
          <ion-card-subtitle>Prenez une photo du problème</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <!-- Photo preview -->
          <div v-if="photoBase64" class="photo-preview">
            <img :src="photoBase64" alt="Photo du signalement" />
            <ion-button fill="clear" color="danger" size="small" @click="removePhoto" class="remove-photo-btn">
              <ion-icon :icon="trashOutline"></ion-icon>
            </ion-button>
          </div>
          
          <!-- Photo actions -->
          <div class="photo-actions">
            <ion-button expand="block" fill="outline" @click="takePhoto">
              <ion-icon :icon="cameraOutline" slot="start"></ion-icon>
              {{ photoBase64 ? 'Reprendre la photo' : 'Prendre une photo' }}
            </ion-button>
            <ion-button expand="block" fill="outline" color="secondary" @click="pickFromGallery">
              <ion-icon :icon="imageOutline" slot="start"></ion-icon>
              Galerie
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Map Card -->
      <ion-card class="map-card">
        <ion-card-header>
          <ion-card-title>
            <ion-icon :icon="locationOutline"></ion-icon> Emplacement *
          </ion-card-title>
          <ion-card-subtitle>Cliquez sur la carte pour sélectionner la position</ion-card-subtitle>
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
          {{ loading ? 'Envoi en cours...' : 'Envoyer le signalement' }}
        </ion-button>
        <p class="info-text">Le signalement sera envoyé et traité par les managers</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
  IonBackButton, IonList, IonItem, IonTextarea, IonButton, 
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonIcon, IonSpinner, toastController
} from '@ionic/vue'
import { createOutline, locationOutline, checkmarkCircleOutline, alertCircleOutline, cloudUploadOutline, cameraOutline, imageOutline, trashOutline } from 'ionicons/icons'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import L from 'leaflet'
import signalementFirebaseService from '../services/signalementFirebaseService'

const router = useRouter()

const description = ref('')
const position = ref<{ lat: number; lng: number } | null>(null)
const photoBase64 = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

let marker: L.Marker | null = null

// Prendre une photo avec la caméra
async function takePhoto() {
  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      width: 1024,
      height: 1024,
    })
    
    if (photo.base64String) {
      photoBase64.value = `data:image/${photo.format};base64,${photo.base64String}`
    }
  } catch (e: any) {
    console.warn('Camera error:', e)
    // Fallback si pas de caméra disponible
    if (e.message?.includes('cancelled') || e.message?.includes('User')) {
      return // L'utilisateur a annulé
    }
    const toast = await toastController.create({
      message: 'Caméra non disponible sur cet appareil',
      duration: 2000,
      color: 'warning'
    })
    toast.present()
  }
}

// Choisir depuis la galerie
async function pickFromGallery() {
  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      width: 1024,
      height: 1024,
    })
    
    if (photo.base64String) {
      photoBase64.value = `data:image/${photo.format};base64,${photo.base64String}`
    }
  } catch (e: any) {
    console.warn('Gallery error:', e)
    if (e.message?.includes('cancelled') || e.message?.includes('User')) {
      return
    }
  }
}

function removePhoto() {
  photoBase64.value = null
}

onMounted(async () => {
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
  // Validation
  if (!position.value) {
    error.value = 'Sélectionnez un emplacement sur la carte (obligatoire)'
    return
  }

  if (!description.value.trim()) {
    error.value = 'La description est requise'
    return
  }

  error.value = null
  loading.value = true

  try {
    // Créer le signalement dans Firebase avec photo
    const result = await signalementFirebaseService.createSignalement({
      description: description.value.trim(),
      latitude: position.value.lat,
      longitude: position.value.lng,
      photoBase64: photoBase64.value || undefined
    })

    if (result.success) {
      const toast = await toastController.create({
        message: 'Signalement envoyé avec succès !',
        duration: 3000,
        color: 'success'
      })
      toast.present()
      router.replace('/home')
    } else {
      error.value = result.error || 'Erreur lors de l\'envoi'
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur de connexion'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import 'leaflet/dist/leaflet.css';

/* Page background */
ion-content {
  --background: #F5EFE6;
}

/* Global card style - web theme */
ion-card {
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(27, 58, 92, 0.08);
  border: 1px solid rgba(74, 144, 217, 0.1);
  overflow: hidden;
  margin: 12px 16px;
  background: #FFFFFF;
}

ion-card-header {
  background: linear-gradient(135deg, #1B3A5C, #2E5C8A);
  padding: 14px 16px;
}

ion-card-title {
  color: #FFFFFF !important;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

ion-card-subtitle {
  color: #D6E8F7 !important;
  font-size: 0.8rem;
  margin-top: 4px;
}

.form-card {
  margin-bottom: 4px;
}

.form-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 8px;
}

.custom-input {
  --background: #F5EFE6;
  --padding-start: 14px;
  --padding-end: 14px;
  border-radius: 10px;
  border: 1px solid rgba(74, 144, 217, 0.15);
  margin-top: 4px;
}

.photo-card {
  margin-bottom: 4px;
}

.photo-preview {
  position: relative;
  margin-bottom: 12px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.photo-preview img {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 10px;
}

.remove-photo-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  --background: rgba(255,255,255,0.95);
  --border-radius: 50%;
  --box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.photo-actions {
  display: flex;
  gap: 10px;
}

.photo-actions ion-button {
  flex: 1;
  --border-radius: 10px;
  --border-color: #1B3A5C;
  --color: #1B3A5C;
  font-weight: 500;
  height: 44px;
}

.map-card {
  margin-bottom: 4px;
}

.map-card-content {
  padding: 0;
}

.mini-map {
  height: 220px;
  width: 100%;
  border-radius: 0 0 14px 14px;
}

.position-card {
  background: linear-gradient(135deg, #D6E8F7, #FFFFFF);
  margin-bottom: 4px;
  border: 1px solid rgba(74, 144, 217, 0.2);
}

.position-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.position-info ion-icon {
  font-size: 28px;
  color: #2E5C8A;
}

.position-info strong {
  display: block;
  color: #1B3A5C;
}

.position-info p {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #2E5C8A;
  opacity: 0.8;
}

.error-card {
  background: linear-gradient(135deg, #FDE8E8, #FFFFFF);
  margin-bottom: 4px;
  border: 1px solid rgba(217, 75, 75, 0.2);
}

.error-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #D94B4B;
}

.error-info ion-icon {
  font-size: 24px;
}

.submit-section {
  margin: 20px 16px 32px;
}

.submit-btn {
  --border-radius: 14px;
  --background: linear-gradient(135deg, #1B3A5C, #2E5C8A);
  --background-hover: #2E5C8A;
  height: 54px;
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 14px rgba(27, 58, 92, 0.25);
}

.info-text {
  text-align: center;
  color: #5A7A9A;
  font-size: 0.78rem;
  margin-top: 14px;
  font-style: italic;
}
</style>