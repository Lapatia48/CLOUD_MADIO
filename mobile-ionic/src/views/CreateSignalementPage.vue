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
      <!-- Wrapper container -->
      <div class="form-wrapper">
        <div class="form-wrapper-header">
          <h2>Ajout de Signalement</h2>
          <p>Remplissez les informations ci-dessous pour signaler un probleme routier</p>
        </div>

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
      </div><!-- end form-wrapper -->
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

/* ============================================
   CREATE SIGNALEMENT - MODERN CSS
   Violet-Indigo Theme with Animations
   ============================================ */

/* CSS Variables */
:root {
  --primary-color: #4F46E5;
  --primary-dark: #4338CA;
  --primary-light: #818CF8;
  --primary-pale: #E0E7FF;
  --bg-page: #F8FAFC;
  --bg-card: #FFFFFF;
  --text-dark: #1E293B;
  --text-muted: #64748B;
  --text-light: #94A3B8;
  --success: #10B981;
  --success-dark: #059669;
  --danger: #EF4444;
  --danger-light: #FEE2E2;
  --border-light: rgba(79, 70, 229, 0.08);
  --shadow-card: 0 4px 24px rgba(79, 70, 229, 0.08);
  --shadow-card-hover: 0 8px 32px rgba(79, 70, 229, 0.16);
  --shadow-button: 0 4px 16px rgba(79, 70, 229, 0.3);
  --radius-card: 16px;
  --radius-btn: 12px;
  --transition-fast: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-smooth: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Page background */
ion-content {
  --background: #FFFFFF;
}

/* ---- Form Wrapper ---- */
.form-wrapper {
  background: linear-gradient(160deg, #1B3A5C 0%, #2E5C8A 100%);
  border-radius: 18px;
  border: none;
  box-shadow:
    0 8px 32px rgba(27, 58, 92, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 12px 8px 24px;
  padding: 2px 0 10px;
  animation: fadeInUp 0.5s ease forwards;
  position: relative;
  overflow: hidden;
}

.form-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-light), #FFFFFF, var(--primary-light));
}

.form-wrapper-header {
  text-align: center;
  padding: 14px 16px 4px;
}

.form-wrapper-header h2 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #FFFFFF;
  margin: 0 0 3px;
  letter-spacing: -0.01em;
}

.form-wrapper-header p {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.3;
}

/* ---- Global Card Styles ---- */
ion-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
  overflow: hidden;
  margin: 6px 10px;
  background: var(--bg-card);
  transition: var(--transition-smooth);
  opacity: 0;
  animation: fadeInUp 0.5s ease forwards;
}

ion-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-4px);
  outline-color: var(--primary-dark);
}

/* Stagger card animations */
.form-card { animation-delay: 0.05s; }
.photo-card { animation-delay: 0.12s; }
.map-card { animation-delay: 0.2s; }
.position-card { animation-delay: 0.28s; }
.error-card { animation-delay: 0.1s; }

ion-card-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  padding: 16px 18px;
  position: relative;
  overflow: hidden;
}

/* Subtle shine effect on header */
ion-card-header::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 200%;
  background: linear-gradient(
    135deg,
    transparent 40%,
    rgba(255, 255, 255, 0.06) 50%,
    transparent 60%
  );
  pointer-events: none;
}

ion-card-title {
  color: #FFFFFF !important;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: 0.02em;
}

ion-card-subtitle {
  color: rgba(255, 255, 255, 0.75) !important;
  font-size: 0.8rem;
  margin-top: 4px;
  letter-spacing: 0.01em;
}

/* ---- Form Card ---- */
.form-card {
  margin-bottom: 6px;
}

.form-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 8px;
}

.custom-input {
  --background: #F1F5F9;
  --padding-start: 14px;
  --padding-end: 14px;
  border-radius: var(--radius-btn);
  border: 2px solid transparent;
  margin-top: 4px;
  transition: var(--transition-fast);
}

.custom-input:focus-within {
  border-color: var(--primary-light);
  --background: #FFFFFF;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

/* ---- Photo Card ---- */
.photo-card {
  margin-bottom: 6px;
}

.photo-preview {
  position: relative;
  margin-bottom: 14px;
  border-radius: var(--radius-btn);
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: var(--transition-smooth);
}

.photo-preview:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
}

.photo-preview img {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-radius: var(--radius-btn);
  display: block;
}

.remove-photo-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  --background: rgba(255, 255, 255, 0.95);
  --border-radius: 50%;
  --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  --color: var(--danger);
  transition: var(--transition-fast);
  width: 36px;
  height: 36px;
}

.remove-photo-btn:hover {
  --background: var(--danger);
  --color: #FFFFFF;
  transform: scale(1.1);
}

.photo-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.photo-actions ion-button {
  --border-radius: var(--radius-btn);
  --border-color: var(--primary-color);
  --color: var(--primary-color);
  --border-width: 2px;
  font-weight: 600;
  height: 46px;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  transition: var(--transition-fast);
}

.photo-actions ion-button:hover {
  --background: var(--primary-pale);
  --color: var(--primary-dark);
  transform: translateY(-2px);
}

/* ---- Map Card ---- */
.map-card {
  margin-bottom: 6px;
}

.map-card-content {
  padding: 0;
}

.mini-map {
  height: 240px;
  width: 100%;
  border-radius: 0 0 var(--radius-card) var(--radius-card);
}

/* Enhanced Leaflet Controls */
.mini-map :deep(.leaflet-control-zoom) {
  border: none !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15) !important;
  border-radius: 10px !important;
  overflow: hidden;
}

.mini-map :deep(.leaflet-control-zoom a) {
  background: var(--bg-card) !important;
  color: var(--primary-color) !important;
  width: 34px !important;
  height: 34px !important;
  line-height: 34px !important;
  font-size: 16px !important;
  border-bottom: 1px solid #E2E8F0 !important;
  transition: var(--transition-fast);
}

.mini-map :deep(.leaflet-control-zoom a:hover) {
  background: var(--primary-pale) !important;
  color: var(--primary-dark) !important;
}

.mini-map :deep(.leaflet-control-attribution) {
  background: rgba(255, 255, 255, 0.85) !important;
  font-size: 9px !important;
  border-radius: 6px 0 0 0;
  padding: 2px 6px;
}

/* ---- Position Card ---- */
.position-card {
  background: linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%);
  margin-bottom: 6px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  animation-name: fadeInUp;
}

.position-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.position-info ion-icon {
  font-size: 30px;
  color: var(--success-dark);
  filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3));
}

.position-info strong {
  display: block;
  color: #065F46;
  font-size: 0.95rem;
  font-weight: 700;
}

.position-info p {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: #047857;
  opacity: 0.85;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.02em;
}

/* ---- Error Card ---- */
.error-card {
  background: linear-gradient(135deg, var(--danger-light) 0%, #FFFFFF 100%);
  margin-bottom: 6px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  animation: fadeInUp 0.3s ease forwards, shake 0.4s ease 0.3s;
}

.error-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--danger);
  font-weight: 500;
}

.error-info ion-icon {
  font-size: 26px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3));
}

/* ---- Submit Section ---- */
.submit-section {
  margin: 24px 16px 36px;
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: 0.35s;
  opacity: 0;
}

.submit-btn {
  --border-radius: var(--radius-card);
  --background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  --background-hover: var(--primary-dark);
  --background-activated: #3730A3;
  height: 56px;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: var(--shadow-button);
  transition: var(--transition-smooth);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(79, 70, 229, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
}

.info-text {
  text-align: center;
  color: var(--text-light);
  font-size: 0.78rem;
  margin-top: 16px;
  font-style: italic;
  letter-spacing: 0.01em;
}

/* ============================================
   ANIMATIONS
   ============================================ */

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

/* ============================================
   RESPONSIVE
   ============================================ */

/* Mobile first - petits écrans */
@media (max-width: 400px) {
  .form-wrapper {
    margin: 8px 4px 16px;
    border-radius: 12px;
  }

  .form-wrapper-header h2 {
    font-size: 1rem;
  }

  ion-card {
    margin: 6px 4px;
  }

  .photo-actions {
    grid-template-columns: 1fr;
  }

  .mini-map {
    height: 200px;
  }

  .submit-btn {
    height: 50px;
    font-size: 0.9rem;
  }

  .submit-section {
    margin: 16px 8px 24px;
  }
}

/* Tablettes */
@media (min-width: 768px) {
  .form-wrapper {
    margin: 24px auto;
    max-width: 600px;
  }

  ion-card {
    margin: 16px auto;
    max-width: 600px;
  }

  .submit-section {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .mini-map {
    height: 300px;
  }
}

/* Desktop large */
@media (min-width: 1200px) {
  .form-wrapper {
    max-width: 700px;
  }
}
</style>