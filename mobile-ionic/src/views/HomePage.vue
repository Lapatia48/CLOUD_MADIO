<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\HomePage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>🛣️ MADIO</ion-title>
        <ion-chip slot="end" :color="isOffline ? 'danger' : 'success'" class="status-chip">
          {{ isOffline ? '🔴 Offline' : '🟢 Online' }}
        </ion-chip>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="home-content">
      <!-- Guest Card si non connecté -->
      <div v-if="!isAuthenticated" class="guest-overlay">
        <ion-card class="welcome-card">
          <ion-card-header>
            <ion-card-title>👋 Bienvenue sur MADIO !</ion-card-title>
            <ion-card-subtitle>Gestion des routes d'Antananarivo</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <p>Connectez-vous pour signaler et suivre les problèmes routiers.</p>
            <div v-if="!isOnline" class="offline-warning">
              🔴 Connexion Internet requise pour se connecter
            </div>
            <div class="action-buttons">
              <ion-button expand="block" router-link="/login" :disabled="!isOnline">
                <ion-icon :icon="logInOutline" slot="start"></ion-icon>
                Se connecter
              </ion-button>
            </div>
            <p class="info-hint">💡 Les comptes sont créés par les managers via l'app web</p>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Carte plein écran avec tous les signalements -->
      <div class="map-fullscreen">
        <div id="home-map" class="map-container"></div>
        
        <!-- Légende flottante -->
        <div class="legend-floating">
          <div class="legend-title">📊 Signalements</div>
          <div class="legend-item">
            <span class="dot" style="background: #e74c3c;"></span>
            <span>Nouveaux ({{ statsNouveau }})</span>
          </div>
          <div class="legend-item">
            <span class="dot" style="background: #f39c12;"></span>
            <span>En cours ({{ statsEnCours }})</span>
          </div>
          <div class="legend-item">
            <span class="dot" style="background: #27ae60;"></span>
            <span>Terminés ({{ statsTermine }})</span>
          </div>
          <div class="legend-total">Total: {{ signalements.length }}</div>
        </div>

        <!-- User info card flottante si connecté -->
        <div v-if="isAuthenticated" class="user-floating-card">
          <ion-avatar class="user-avatar-small">
            <div class="avatar-text">{{ userInitial }}</div>
          </ion-avatar>
          <div class="user-info-mini">
            <strong>{{ userName }}</strong>
            <span class="role-badge">{{ userRole }}</span>
          </div>
        </div>
      </div>

      <!-- Actions si connecté (bottom bar) -->
      <div v-if="isAuthenticated" class="bottom-actions">
        <ion-button expand="block" color="primary" router-link="/signalement/new" class="action-btn">
          <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
          Nouveau
        </ion-button>
        <ion-button expand="block" color="secondary" router-link="/map" class="action-btn">
          <ion-icon :icon="listOutline" slot="start"></ion-icon>
          Mes signalements
        </ion-button>
        <ion-button expand="block" color="medium" fill="outline" @click="handleLogout" class="action-btn">
          <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
          Déconnexion
        </ion-button>
      </div>

      <!-- FAB pour rafraîchir -->
      <ion-fab vertical="bottom" horizontal="start" slot="fixed" class="refresh-fab">
        <ion-fab-button color="light" size="small" @click="refreshSignalements">
          <ion-icon :icon="refreshOutline" :class="{ 'spin': isLoading }"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, 
  IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, 
  IonCardSubtitle, IonCardContent, IonChip, IonAvatar, IonFab, IonFabButton 
} from '@ionic/vue'
import { logInOutline, addCircleOutline, listOutline, logOutOutline, refreshOutline } from 'ionicons/icons'
import L from 'leaflet'
import { useAuthStore } from '../stores/auth'
import signalementFirebaseService, { type FirebaseSignalement } from '../services/signalementFirebaseService'

interface DisplaySignalement {
  id?: string
  description?: string
  latitude: number
  longitude: number
  status: string
  dateSignalement?: string
  userEmail?: string
}

const router = useRouter()
const authStore = useAuthStore()

const isOffline = ref(!navigator.onLine)
const isOnline = computed(() => !isOffline.value)
const isLoading = ref(false)
// Utiliser le store auth qui est réactif + vérification localStorage en fallback
const isAuthenticated = computed(() => authStore.isAuthenticated || !!localStorage.getItem('firebase_token') || !!localStorage.getItem('token'))
const signalements = ref<DisplaySignalement[]>([])

const userName = computed(() => {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      const parsed = JSON.parse(user)
      return parsed.prenom || parsed.email || 'Utilisateur'
    } catch { 
      const email = localStorage.getItem('userEmail')
      return email?.split('@')[0] || 'Utilisateur'
    }
  }
  const email = localStorage.getItem('userEmail')
  return email?.split('@')[0] || 'Utilisateur'
})

const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

const userRole = computed(() => {
  const role = localStorage.getItem('userRole')
  return role || 'USER'
})

// Stats
const statsNouveau = computed(() => signalements.value.filter(s => s.status === 'NOUVEAU').length)
const statsEnCours = computed(() => signalements.value.filter(s => s.status === 'EN_COURS').length)
const statsTermine = computed(() => signalements.value.filter(s => s.status === 'TERMINE').length)

let map: L.Map | null = null
let tileLayer: L.TileLayer | null = null
let markersGroup: L.LayerGroup | null = null

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
    ? 'http://localhost:8085/styles/basic/{z}/{x}/{y}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  tileLayer = L.tileLayer(tileUrl, {
    attribution: isOffline.value ? 'TileServer Local' : '&copy; OpenStreetMap'
  }).addTo(map)
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

async function refreshSignalements() {
  isLoading.value = true
  await fetchAllSignalements()
  isLoading.value = false
}

async function fetchAllSignalements() {
  try {
    // Récupérer tous les signalements depuis Firebase
    const firebaseSignalements = await signalementFirebaseService.getAllSignalements()
    
    signalements.value = firebaseSignalements.map((s: FirebaseSignalement & { documentId?: string }) => ({
      id: s.documentId || '',
      description: s.description,
      latitude: s.latitude,
      longitude: s.longitude,
      status: s.status,
      dateSignalement: s.dateSignalement,
      userEmail: s.userEmail
    }))
    
    console.log('Tous les signalements Firebase chargés:', signalements.value.length)
    addMarkersToMap()
  } catch (e) {
    console.error('Erreur chargement signalements Firebase:', e)
  }
}

function addMarkersToMap() {
  if (!map) return
  
  // Supprimer les anciens marqueurs
  if (markersGroup) {
    map.removeLayer(markersGroup)
  }
  markersGroup = L.layerGroup().addTo(map)
  
  signalements.value.forEach((s) => {
    if (s.latitude && s.longitude) {
      const marker = L.circleMarker([s.latitude, s.longitude], {
        radius: 10,
        fillColor: getStatusColor(s.status),
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      })
      
      const tooltipContent = `
        <div style="min-width: 150px;">
          <strong>${s.description?.slice(0, 30) || 'Signalement'}</strong>
          <br><span style="color: ${getStatusColor(s.status)}">${getStatusLabel(s.status)}</span>
          <br><small>📅 ${s.dateSignalement ? new Date(s.dateSignalement).toLocaleDateString('fr-FR') : 'N/A'}</small>
          ${s.userEmail ? `<br><small>👤 ${s.userEmail}</small>` : ''}
        </div>
      `
      
      // Afficher au survol avec bindTooltip au lieu de bindPopup
      marker.bindTooltip(tooltipContent, {
        permanent: false,
        sticky: true,
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95
      })
      
      marker.addTo(markersGroup!)
    }
  })
}

onMounted(async () => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Charger les signalements
  await fetchAllSignalements()

  setTimeout(() => {
    map = L.map('home-map', {
      zoomControl: false
    }).setView([-18.8792, 47.5079], 13)
    
    // Zoom control en bas à droite
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    
    updateTileLayer()
    addMarkersToMap()
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

.home-content {
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

.status-chip {
  margin-right: 8px;
  font-size: 0.75rem;
}

/* Carte plein écran */
.map-fullscreen {
  position: relative;
  width: 100%;
  height: calc(100vh - 56px - 70px); /* header + bottom actions */
}

.map-container {
  width: 100%;
  height: 100%;
}

/* Overlay invité */
.guest-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 70px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
}

.welcome-card {
  max-width: 350px;
  margin: 16px;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  color: white;
  border-radius: 16px;
}

.welcome-card ion-card-title,
.welcome-card ion-card-subtitle {
  color: white;
}

.welcome-card p {
  margin: 16px 0;
  opacity: 0.9;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-buttons ion-button {
  --border-radius: 10px;
}

/* Légende flottante */
.legend-floating {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px;
  z-index: 999;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  min-width: 140px;
}

.legend-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #2c3e50;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  margin: 4px 0;
  color: #34495e;
}

.legend-item .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.legend-total {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
  font-weight: bold;
  font-size: 0.85rem;
  color: #2c3e50;
}

/* User card flottante */
.user-floating-card {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 25px;
  padding: 8px 14px 8px 8px;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.user-avatar-small {
  width: 35px;
  height: 35px;
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.avatar-text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
  color: white;
}

.user-info-mini {
  display: flex;
  flex-direction: column;
}

.user-info-mini strong {
  font-size: 0.85rem;
  color: #2c3e50;
}

.role-badge {
  font-size: 0.65rem;
  color: #3498db;
  font-weight: 600;
}

/* Bottom actions bar */
.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 8px;
  padding: 10px;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  z-index: 1000;
}

.action-btn {
  flex: 1;
  --border-radius: 8px;
  font-size: 0.75rem;
  margin: 0;
}

.action-btn ion-icon {
  font-size: 1rem;
}

/* FAB refresh */
.refresh-fab {
  margin-bottom: 80px;
  margin-left: 10px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive - mode paysage */
@media (orientation: landscape) {
  .map-fullscreen {
    height: calc(100vh - 56px);
  }
  
  .bottom-actions {
    flex-direction: row;
    padding: 8px 16px;
  }
}

/* Téléphone en portrait - plus de hauteur pour la carte */
@media (max-height: 700px) {
  .legend-floating {
    padding: 8px;
    font-size: 0.75rem;
  }
  
  .legend-title {
    font-size: 0.8rem;
    margin-bottom: 4px;
  }
  
  .legend-item {
    font-size: 0.7rem;
    margin: 2px 0;
  }
}

/* Alerte offline et info */
.offline-warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 12px;
  text-align: center;
  font-size: 0.85rem;
}

.info-hint {
  text-align: center;
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 12px;
  font-style: italic;
}
</style>