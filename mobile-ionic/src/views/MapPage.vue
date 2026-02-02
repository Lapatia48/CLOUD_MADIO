<template>
  <ion-page>
    <ion-content :fullscreen="true" class="main-dashboard">
      <!-- Map Section (Full Screen) -->
      <div class="map-section">
        <div :class="['connection-badge', isOffline ? 'offline' : 'online']">
          {{ isOffline ? '🔴 Hors ligne' : '🟢 En ligne' }}
        </div>
        <div id="map" class="map-container"></div>
      </div>

      <!-- Sidebar -->
      <div class="sidebar" :class="{ expanded: sidebarExpanded }">
        <!-- Toggle Button -->
        <button class="sidebar-toggle" @click="toggleSidebar">
          {{ sidebarExpanded ? '✕' : '☰' }}
        </button>

        <div class="sidebar-content" v-show="sidebarExpanded">
          <!-- Header -->
          <div class="sidebar-header">
            <h1>🛣️ MADIO</h1>
            <p>Gestion des routes</p>
          </div>

          <!-- User Card -->
          <div class="user-card">
            <div class="user-avatar">{{ userInitial }}</div>
            <div class="user-info">
              <strong>{{ userName }}</strong>
              <span :class="['role-badge', userRole.toLowerCase()]">{{ userRole }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="actions">
            <ion-button expand="block" class="btn-primary" @click="goToNewSignalement">
              ➕ Nouveau signalement
            </ion-button>

            <ion-button expand="block" fill="outline" class="btn-secondary" @click="refreshSignalements">
              🔄 Rafraîchir
            </ion-button>

            <ion-button expand="block" fill="outline" class="btn-sync" @click="handleSync" :disabled="syncing">
              {{ syncing ? '⏳ Sync...' : '🔁 Synchroniser' }}
            </ion-button>

            <!-- Admin Only -->
            <ion-button v-if="isAdmin" expand="block" class="btn-admin" @click="goToBlockedUsers">
              🚫 Users bloqués
            </ion-button>

            <ion-button expand="block" fill="outline" class="btn-danger" @click="handleLogout">
              🚪 Déconnexion
            </ion-button>
          </div>

          <!-- Signalements List -->
          <div class="signalements-list">
            <h3>📋 Mes signalements ({{ signalements.length }})</h3>
            
            <div v-if="signalements.length === 0" class="empty">
              Aucun signalement
            </div>
            
            <div v-else class="list-items">
              <div 
                v-for="sig in signalements.slice(0, 10)" 
                :key="sig.id" 
                class="list-item"
                @click="goToDetail(sig.id)"
              >
                <span class="status-dot" :style="{ backgroundColor: getStatusColor(sig.status) }"></span>
                <div class="item-content">
                  <strong>{{ sig.description?.slice(0, 25) || 'Signalement' }}...</strong>
                  <small>{{ formatDate(sig) }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonButton, toastController } from '@ionic/vue'
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
const syncing = ref(false)
const sidebarExpanded = ref(true)

const userName = computed(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const parsed = JSON.parse(userStr)
      // Priorité: prenom + nom, puis juste prenom, puis email
      if (parsed.prenom && parsed.nom) {
        return `${parsed.prenom} ${parsed.nom}`
      } else if (parsed.prenom) {
        return parsed.prenom
      } else if (parsed.nom) {
        return parsed.nom
      } else if (parsed.email) {
        return parsed.email.split('@')[0]
      }
    } catch { /* ignore */ }
  }
  // Fallback sur userEmail
  const email = localStorage.getItem('userEmail')
  if (email) return email.split('@')[0]
  return 'Utilisateur'
})

const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

const userRole = computed(() => {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      const parsed = JSON.parse(user)
      return parsed.role || localStorage.getItem('userRole') || 'USER'
    } catch { return localStorage.getItem('userRole') || 'USER' }
  }
  return localStorage.getItem('userRole') || 'USER'
})

const isAdmin = computed(() => {
  const role = userRole.value
  return role === 'ADMIN' || role === 'MANAGER'
})

let map: L.Map | null = null
let tileLayer: L.TileLayer | null = null
let markers: L.Marker[] = []

function toggleSidebar() {
  sidebarExpanded.value = !sidebarExpanded.value
}

function handleOnline() { isOffline.value = false; updateTileLayer() }
function handleOffline() { isOffline.value = true; updateTileLayer() }

function handleLogout() {
  authStore.logout()
  router.replace('/login')
}

function goToNewSignalement() {
  router.push('/signalement/new')
}

function goToBlockedUsers() {
  router.push('/admin/blocked-users')
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

function formatDate(sig: Signalement) {
  const dateStr = sig.dateSignalement || sig.date_signalement
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('fr-FR')
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

function updateMarkers() {
  if (!map) return
  
  // Clear existing markers
  markers.forEach(m => map!.removeLayer(m))
  markers = []

  // Add new markers
  signalements.value.forEach((s) => {
    if (s.latitude && s.longitude) {
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${getStatusColor(s.status)};width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const marker = L.marker([s.latitude, s.longitude], { icon: customIcon })
        .addTo(map!)
        .bindPopup(`
          <div style="min-width:150px;">
            <strong>${s.description?.slice(0, 30) || 'Signalement'}</strong><br>
            <span style="color:${getStatusColor(s.status)}">● ${s.status}</span><br>
            <small>📅 ${formatDate(s)}</small>
          </div>
        `)
        .on('click', () => goToDetail(s.id))
      
      markers.push(marker)
    }
  })
}

async function refreshSignalements() {
  try {
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

    let res
    if (userId) {
      res = await http.get(`/api/signalements/user/${userId}`)
    } else {
      res = await http.get('/api/signalements')
    }
    
    signalements.value = res.data || []
    updateMarkers()
    
    const toast = await toastController.create({
      message: 'Liste mise à jour',
      duration: 1500,
      color: 'success'
    })
    toast.present()
  } catch (e) {
    console.error('Erreur chargement signalements:', e)
  }
}

async function handleSync() {
  syncing.value = true
  try {
    await http.post('/api/sync')
    await refreshSignalements()
    const toast = await toastController.create({
      message: 'Synchronisation réussie !',
      duration: 2000,
      color: 'success'
    })
    toast.present()
  } catch (e) {
    const toast = await toastController.create({
      message: 'Erreur de synchronisation',
      duration: 2000,
      color: 'danger'
    })
    toast.present()
  } finally {
    syncing.value = false
  }
}

onMounted(async () => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Load signalements first
  try {
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

    let res
    if (userId) {
      res = await http.get(`/api/signalements/user/${userId}`)
    } else {
      res = await http.get('/api/signalements')
    }
    
    signalements.value = res.data || []
  } catch (e) {
    console.error('Erreur chargement signalements:', e)
    signalements.value = []
  }

  // Initialize map
  setTimeout(() => {
    map = L.map('map').setView([-18.8792, 47.5079], 13)
    updateTileLayer()
    updateMarkers()
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

.main-dashboard {
  --background: #1a1a2e;
  position: relative;
}

.map-section {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.map-container {
  width: 100%;
  height: 100%;
}

.connection-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.connection-badge.online { background: #d4edda; color: #155724; }
.connection-badge.offline { background: #f8d7da; color: #721c24; }

/* Sidebar */
.sidebar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 60px;
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  z-index: 1001;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}

.sidebar.expanded {
  width: 280px;
}

.sidebar-toggle {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-content {
  padding: 60px 15px 15px;
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-header {
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(255,255,255,0.1);
  color: white;
}

.sidebar-header h1 { margin: 0; font-size: 1.4rem; }
.sidebar-header p { margin: 4px 0 0; opacity: 0.7; font-size: 0.8rem; }

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.1);
  padding: 12px;
  border-radius: 10px;
}

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #9b59b6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: bold;
  color: white;
  text-transform: uppercase;
  flex-shrink: 0;
}

.user-info { 
  display: flex; 
  flex-direction: column; 
  gap: 2px; 
  color: white;
  overflow: hidden;
}
.user-info strong { 
  font-size: 0.95rem; 
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.65rem;
  width: fit-content;
  font-weight: 600;
}

.role-badge.user { background: #3498db; color: white; }
.role-badge.admin { background: #e74c3c; color: white; }
.role-badge.manager { background: #9b59b6; color: white; }

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actions ion-button {
  --border-radius: 10px;
  font-weight: 600;
  font-size: 0.8rem;
  height: 40px;
  margin: 0;
}

.btn-primary { --background: linear-gradient(135deg, #3498db, #2980b9); }
.btn-secondary { --color: white; --border-color: rgba(255,255,255,0.3); }
.btn-sync { --color: #1abc9c; --border-color: #1abc9c; }
.btn-admin { --background: linear-gradient(135deg, #f39c12, #d68910); }
.btn-danger { --color: #e74c3c; --border-color: #e74c3c; }

.signalements-list {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 10px;
  overflow-y: auto;
  min-height: 120px;
}

.signalements-list h3 { 
  margin: 0 0 10px; 
  font-size: 0.85rem; 
  color: white;
}

.signalements-list .empty { 
  text-align: center; 
  color: rgba(255,255,255,0.5); 
  padding: 16px 8px;
  font-size: 0.85rem;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  color: white;
}

.list-item:hover,
.list-item:active { 
  background: rgba(255,255,255,0.1); 
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.item-content { 
  display: flex; 
  flex-direction: column; 
  overflow: hidden;
}

.item-content strong { 
  font-size: 0.8rem; 
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-content small { 
  font-size: 0.7rem; 
  opacity: 0.6; 
}

.custom-marker { 
  background: transparent; 
  border: none; 
}
</style>
