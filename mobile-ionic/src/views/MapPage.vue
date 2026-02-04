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

    <ion-content :fullscreen="true" class="mes-signalements-content">
      <!-- Carte prenant toute la hauteur disponible -->
      <div class="map-section">
        <div id="map" class="map-fullscreen"></div>
        
        <!-- User Info flottant -->
        <div class="user-floating">
          <ion-avatar class="user-avatar-small">
            <div class="avatar-text">{{ userInitial }}</div>
          </ion-avatar>
          <div class="user-info-mini">
            <strong>{{ userName }}</strong>
            <span class="badge">{{ signalements.length }} signalement(s)</span>
          </div>
          <ion-button fill="clear" color="danger" size="small" @click="handleLogout">
            <ion-icon :icon="logOutOutline" />
          </ion-button>
        </div>

        <!-- Stats flottantes -->
        <div class="stats-floating">
          <div class="stat-item nouveau">
            <span class="num">{{ statsNouveau }}</span>
            <span class="label">🔴</span>
          </div>
          <div class="stat-item en-cours">
            <span class="num">{{ statsEnCours }}</span>
            <span class="label">🟠</span>
          </div>
          <div class="stat-item termine">
            <span class="num">{{ statsTermine }}</span>
            <span class="label">🟢</span>
          </div>
        </div>
      </div>

      <!-- Liste des signalements (scrollable) -->
      <div class="list-section">
        <div class="list-header">
          <h3>📋 Mes signalements ({{ signalements.length }})</h3>
          <ion-button fill="clear" size="small" @click="refreshSignalements" :disabled="isLoading">
            <ion-icon :icon="refreshOutline" :class="{ 'spin': isLoading }"></ion-icon>
          </ion-button>
        </div>
        
        <ion-list v-if="signalements.length > 0" class="signalements-list">
          <ion-item v-for="sig in signalements" :key="sig.documentId" button @click="goToDetail(sig.documentId)" detail>
            <div class="status-dot" :style="{ backgroundColor: getStatusColor(sig.status) }" slot="start"></div>
            <ion-label>
              <h3>{{ sig.description?.slice(0, 35) || 'Signalement' }}...</h3>
              <p>
                {{ getStatusLabel(sig.status) }} 
                <span v-if="sig.avancement !== undefined"> • {{ sig.avancement }}%</span>
                • {{ formatDate(sig.dateSignalement) }}
              </p>
              <p v-if="sig.entrepriseNom" class="entreprise-info">
                🏢 {{ sig.entrepriseNom }}
              </p>
            </ion-label>
            <!-- Barre d'avancement mini -->
            <div slot="end" class="mini-progress" v-if="sig.avancement !== undefined">
              <div class="progress-bar-mini">
                <div class="progress-fill-mini" :style="{ width: sig.avancement + '%', backgroundColor: getStatusColor(sig.status) }"></div>
              </div>
            </div>
          </ion-item>
        </ion-list>
        
        <div v-else class="empty-state">
          <ion-icon :icon="alertCircleOutline" class="empty-icon"></ion-icon>
          <p>Vous n'avez pas encore de signalement</p>
          <ion-button router-link="/signalement/new" color="primary">
            <ion-icon :icon="addOutline" slot="start"></ion-icon>
            Créer mon premier signalement
          </ion-button>
        </div>
      </div>

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
  IonIcon, IonFab, IonFabButton, IonChip, IonAvatar, IonBackButton, IonList, IonItem, IonLabel 
} from '@ionic/vue'
import { addOutline, logOutOutline, refreshOutline, alertCircleOutline } from 'ionicons/icons'
import L from 'leaflet'
import { useAuthStore } from '../stores/auth'
import signalementFirebaseService, { type FirebaseSignalement } from '../services/signalementFirebaseService'

interface MySignalement extends FirebaseSignalement {
  documentId: string
}

const router = useRouter()
const authStore = useAuthStore()
const isOffline = ref(!navigator.onLine)
const isLoading = ref(false)
const signalements = ref<MySignalement[]>([])

// User info
const userName = computed(() => {
  const email = localStorage.getItem('userEmail')
  return email?.split('@')[0] || 'Utilisateur'
})

const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

// Stats
const statsNouveau = computed(() => signalements.value.filter(s => s.status === 'NOUVEAU').length)
const statsEnCours = computed(() => signalements.value.filter(s => s.status === 'EN_COURS').length)
const statsTermine = computed(() => signalements.value.filter(s => s.status === 'TERMINE').length)

let map: L.Map | null = null
let tileLayer: L.TileLayer | null = null
let markersGroup: L.LayerGroup | null = null

function handleLogout() {
  authStore.logout()
  router.replace('/login')
}

function goToDetail(documentId: string) {
  router.push(`/signalement/${documentId}`)
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

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

function handleOnline() { isOffline.value = false; updateTileLayer() }
function handleOffline() { isOffline.value = true; updateTileLayer() }

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

async function refreshSignalements() {
  isLoading.value = true
  await fetchMySignalements()
  isLoading.value = false
}

async function fetchMySignalements() {
  try {
    // Récupérer uniquement MES signalements depuis Firebase
    const mySignalements = await signalementFirebaseService.getMySignalements()
    
    // Ajouter documentId (on doit récupérer avec IDs)
    const firebaseUid = localStorage.getItem('firebaseUid')
    if (!firebaseUid) {
      console.warn('Pas de firebaseUid trouvé')
      signalements.value = []
      return
    }
    
    // Utiliser getAllSignalements et filtrer par firebaseUid de l'utilisateur
    const allSigs = await signalementFirebaseService.getAllSignalements()
    signalements.value = allSigs.filter(s => s.firebaseUid === firebaseUid) as MySignalement[]
    
    console.log('Mes signalements Firebase:', signalements.value.length)
    addMarkersToMap()
  } catch (e) {
    console.error('Erreur chargement mes signalements:', e)
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
        radius: 12,
        fillColor: getStatusColor(s.status),
        color: '#fff',
        weight: 3,
        fillOpacity: 0.9
      })
      
      // Construire le tooltip avec avancement et entreprise
      const avancementBar = s.avancement !== undefined 
        ? `<div style="margin-top:5px;background:#eee;border-radius:4px;overflow:hidden;height:8px;">
             <div style="width:${s.avancement}%;height:100%;background:${getStatusColor(s.status)};"></div>
           </div>
           <small>Avancement: ${s.avancement}%</small>`
        : ''
      
      const entrepriseInfo = s.entrepriseNom 
        ? `<br><small>🏢 ${s.entrepriseNom}</small>` 
        : ''
      
      const tooltipContent = `
        <div style="min-width: 150px;">
          <strong>${s.description?.slice(0, 25) || 'Signalement'}</strong>
          <br><span style="color: ${getStatusColor(s.status)}">${getStatusLabel(s.status)}</span>
          ${avancementBar}
          ${entrepriseInfo}
          <br><small>📅 ${formatDate(s.dateSignalement)}</small>
        </div>
      `
      
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
  
  // Centrer la carte sur les marqueurs s'il y en a
  if (signalements.value.length > 0 && map) {
    const bounds = L.latLngBounds(signalements.value.map(s => [s.latitude, s.longitude]))
    map.fitBounds(bounds, { padding: [30, 30] })
  }
}

onMounted(async () => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Charger mes signalements
  await fetchMySignalements()

  setTimeout(() => {
    map = L.map('map', { zoomControl: false }).setView([-18.8792, 47.5079], 13)
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

.mes-signalements-content {
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

.status-chip {
  margin-right: 8px;
  font-size: 0.7rem;
}

/* Section carte */
.map-section {
  position: relative;
  width: 100%;
  height: 45vh;
  min-height: 280px;
}

.map-fullscreen {
  width: 100%;
  height: 100%;
}

/* User info flottant */
.user-floating {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 8px 12px;
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
  flex-shrink: 0;
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
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-info-mini strong {
  font-size: 0.9rem;
  color: #2c3e50;
}

.user-info-mini .badge {
  font-size: 0.7rem;
  color: #7f8c8d;
}

/* Stats flottants */
.stats-floating {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  gap: 8px;
  z-index: 999;
}

.stat-item {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.stat-item .num {
  font-weight: bold;
  font-size: 1rem;
}

.stat-item .label {
  font-size: 0.8rem;
}

.stat-item.nouveau .num { color: #e74c3c; }
.stat-item.en-cours .num { color: #f39c12; }
.stat-item.termine .num { color: #27ae60; }

/* Section liste */
.list-section {
  background: #f5f6fa;
  min-height: calc(55vh - 56px);
  padding: 12px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.list-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #2c3e50;
}

.signalements-list {
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
}

.signalements-list ion-item {
  --background: white;
  --border-radius: 8px;
  margin-bottom: 8px;
  --padding-start: 12px;
}

.status-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-right: 8px;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
  color: #bdc3c7;
}

.empty-state p {
  margin-bottom: 16px;
}

/* Info entreprise */
.entreprise-info {
  font-size: 0.8rem !important;
  color: #3498db !important;
  margin-top: 4px !important;
}

/* Mini barre de progression */
.mini-progress {
  width: 50px;
}

.progress-bar-mini {
  width: 100%;
  height: 6px;
  background: #ecf0f1;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill-mini {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Animation spin */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive landscape */
@media (orientation: landscape) {
  .map-section {
    height: 60vh;
  }
  
  .list-section {
    min-height: 40vh;
  }
}

/* Petit écran */
@media (max-height: 600px) {
  .map-section {
    height: 40vh;
    min-height: 200px;
  }
}
</style>