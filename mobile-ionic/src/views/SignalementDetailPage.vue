<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/map" color="light" />
        </ion-buttons>
        <ion-title>Détail Signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="detail-content">
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent" color="light" />
        <p>Chargement...</p>
      </div>

      <!-- Not Found -->
      <div v-else-if="!signalement" class="not-found-state">
        <ion-icon :icon="alertCircleOutline" class="not-found-icon" />
        <h2>Signalement non trouvé</h2>
        <button class="btn-back-home" @click="router.push('/map')">Retour à la carte</button>
      </div>

      <!-- Detail Content -->
      <template v-else>
        <!-- Mini Map -->
        <div class="detail-map" id="detail-map"></div>

        <!-- Detail Panel - Style Web -->
        <div class="detail-panel">
          <!-- Header avec statut -->
          <div class="detail-header">
            <span class="status-badge" :style="{ background: getStatusColor(signalement.status) }">
              {{ getStatusLabel(signalement.status) }}
            </span>
            <h1>{{ signalement.description || 'Sans description' }}</h1>
            
            <!-- Barre de progression -->
            <div class="progress-container">
              <div class="progress-header">
                <span class="progress-label">Avancement</span>
                <span class="progress-percent">{{ getProgressPercent(signalement.status) }}%</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ 
                    width: `${getProgressPercent(signalement.status)}%`,
                    background: getStatusColor(signalement.status)
                  }"
                />
              </div>
            </div>
          </div>

          <!-- Info Cards -->
          <div class="detail-info">
            <div class="info-card">
              <span class="info-icon">📅</span>
              <div>
                <label>Date de signalement</label>
                <strong>{{ formatDate(signalement.dateSignalement || signalement.date_signalement) }}</strong>
              </div>
            </div>

            <div v-if="signalement.dateModification || signalement.date_modification" class="info-card">
              <span class="info-icon">🔄</span>
              <div>
                <label>Dernière modification</label>
                <strong>{{ formatDate(signalement.dateModification || signalement.date_modification) }}</strong>
              </div>
            </div>

            <div class="info-card">
              <span class="info-icon">📐</span>
              <div>
                <label>Surface</label>
                <strong>{{ signalement.surfaceM2 ? `${signalement.surfaceM2} m²` : 'Non renseignée' }}</strong>
              </div>
            </div>

            <div class="info-card">
              <span class="info-icon">💰</span>
              <div>
                <label>Budget estimé</label>
                <strong>{{ signalement.budget ? `${signalement.budget.toLocaleString()} Ar` : 'Non renseigné' }}</strong>
              </div>
            </div>

            <div class="info-card">
              <span class="info-icon">🏢</span>
              <div>
                <label>Entreprise assignée</label>
                <strong>{{ signalement.entreprise?.nom || signalement.entrepriseNom || 'Aucune' }}</strong>
              </div>
            </div>

            <div class="info-card">
              <span class="info-icon">📍</span>
              <div>
                <label>Coordonnées GPS</label>
                <strong>{{ signalement.latitude.toFixed(6) }}, {{ signalement.longitude.toFixed(6) }}</strong>
              </div>
            </div>

            <div v-if="signalement.user" class="info-card">
              <span class="info-icon">👤</span>
              <div>
                <label>Signalé par</label>
                <strong>{{ signalement.user.prenom }} {{ signalement.user.nom }}</strong>
              </div>
            </div>
          </div>

          <!-- Section Admin - Modification -->
          <div v-if="isAdmin" class="admin-section">
            <h3>🔧 Administration</h3>
            
            <template v-if="!isEditing">
              <button class="btn-edit" @click="startEditing">
                ✏️ Modifier le signalement
              </button>
            </template>

            <template v-else>
              <div class="edit-form">
                <div class="form-group">
                  <label>Description</label>
                  <textarea 
                    v-model="editForm.description" 
                    rows="3"
                    placeholder="Description du problème..."
                  />
                </div>
                
                <div class="form-group">
                  <label>Status</label>
                  <select v-model="editForm.status">
                    <option value="NOUVEAU">🔴 Nouveau (0%)</option>
                    <option value="EN_COURS">🟠 En cours (50%)</option>
                    <option value="TERMINE">🟢 Terminé (100%)</option>
                  </select>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Surface (m²)</label>
                    <input 
                      type="number" 
                      v-model="editForm.surfaceM2" 
                      placeholder="Ex: 150"
                    />
                  </div>
                  <div class="form-group">
                    <label>Budget (Ar)</label>
                    <input 
                      type="number" 
                      v-model="editForm.budget" 
                      placeholder="Ex: 500000"
                    />
                  </div>
                </div>
                
                <div class="edit-actions">
                  <button class="btn-save" @click="saveEdit" :disabled="saving">
                    {{ saving ? '⏳ Enregistrement...' : '💾 Enregistrer' }}
                  </button>
                  <button class="btn-cancel" @click="cancelEditing">
                    ❌ Annuler
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonIcon, IonSpinner
} from '@ionic/vue'
import { alertCircleOutline } from 'ionicons/icons'
import L from 'leaflet'
import { http } from '../api/http'

interface Signalement {
  id: number
  description?: string
  latitude: number
  longitude: number
  status: string
  surfaceM2?: number | null
  budget?: number | null
  dateSignalement?: string
  date_signalement?: string
  dateModification?: string
  date_modification?: string
  entreprise?: { id: number; nom: string } | null
  entrepriseNom?: string
  user?: { id: number; email: string; nom?: string; prenom?: string } | null
}

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const signalement = ref<Signalement | null>(null)
const isEditing = ref(false)
const saving = ref(false)
const editForm = ref({
  description: '',
  status: '',
  surfaceM2: '',
  budget: '',
})

let map: L.Map | null = null

const currentUser = computed(() => {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      return JSON.parse(user)
    } catch { return null }
  }
  return null
})

const isAdmin = computed(() => {
  const user = currentUser.value
  // ADMIN = id_role 1 (selon init.sql), ou role='ADMIN'
  return user?.role === 'ADMIN' || user?.id_role === 1
})

function getStatusLabel(status: string) {
  switch (status) {
    case 'NOUVEAU': return '🔴 Nouveau'
    case 'EN_COURS': return '🟠 En cours'
    case 'TERMINE': return '🟢 Terminé'
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

function getProgressPercent(status: string) {
  switch (status) {
    case 'NOUVEAU': return 0
    case 'EN_COURS': return 50
    case 'TERMINE': return 100
    default: return 0
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function startEditing() {
  if (!signalement.value) return
  editForm.value = {
    description: signalement.value.description || '',
    status: signalement.value.status || 'NOUVEAU',
    surfaceM2: signalement.value.surfaceM2?.toString() || '',
    budget: signalement.value.budget?.toString() || '',
  }
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
}

async function saveEdit() {
  if (!signalement.value) return
  saving.value = true

  try {
    const response = await http.put(`/api/signalements/${signalement.value.id}`, {
      description: editForm.value.description,
      status: editForm.value.status,
      latitude: signalement.value.latitude,
      longitude: signalement.value.longitude,
      surfaceM2: editForm.value.surfaceM2 ? parseFloat(editForm.value.surfaceM2) : null,
      budget: editForm.value.budget ? parseFloat(editForm.value.budget) : null,
    })

    signalement.value = response.data
    isEditing.value = false
    alert('✅ Signalement modifié avec succès !')
  } catch (error) {
    console.error('Erreur modification:', error)
    alert('❌ Erreur lors de la modification')
  } finally {
    saving.value = false
  }
}

async function fetchSignalement() {
  const id = route.params.id
  try {
    const response = await http.get(`/api/signalements/${id}`)
    signalement.value = response.data
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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    // Cercle coloré
    L.circle([signalement.value!.latitude, signalement.value!.longitude], {
      radius: 50,
      color: getStatusColor(signalement.value!.status),
      fillColor: getStatusColor(signalement.value!.status),
      fillOpacity: 0.3,
      weight: 3,
    }).addTo(map)

    L.marker([signalement.value!.latitude, signalement.value!.longitude]).addTo(map)
  }, 100)
}

onMounted(async () => {
  await fetchSignalement()
  if (signalement.value) {
    initMap()
  }
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

.custom-toolbar {
  --background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  --color: white;
}

.detail-content {
  --background: #2c3e50;
}

.loading-state,
.not-found-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  color: white;
}

.not-found-icon {
  font-size: 5rem;
  color: #e74c3c;
  margin-bottom: 20px;
}

.btn-back-home {
  padding: 14px 35px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
}

.detail-map {
  height: 200px;
  width: 100%;
}

/* Panel Style - Identique au Web */
.detail-panel {
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 25px 20px;
  min-height: calc(100% - 200px);
}

.detail-header {
  margin-bottom: 25px;
}

.status-badge {
  display: inline-block;
  padding: 8px 18px;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 15px;
}

.detail-header h1 {
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.4;
  font-weight: 600;
}

/* Barre de progression */
.progress-container {
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px 18px;
  border-radius: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.progress-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.progress-percent {
  font-size: 1.1rem;
  font-weight: bold;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease, background 0.3s ease;
}

/* Info Cards */
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 12px;
  transition: background 0.2s;
}

.info-card:active {
  background: rgba(255, 255, 255, 0.15);
}

.info-card .info-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.info-card div {
  display: flex;
  flex-direction: column;
}

.info-card label {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 3px;
}

.info-card strong {
  font-size: 1rem;
}

/* Section Admin */
.admin-section {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid rgba(255, 255, 255, 0.2);
}

.admin-section h3 {
  margin: 0 0 15px;
  font-size: 1.1rem;
  color: #f39c12;
}

.btn-edit {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-edit:active {
  transform: scale(0.98);
  box-shadow: 0 4px 15px rgba(155, 89, 182, 0.4);
}

/* Formulaire d'édition */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.edit-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-form .form-group label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.edit-form .form-group input,
.edit-form .form-group textarea,
.edit-form .form-group select {
  padding: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transition: border-color 0.2s;
}

.edit-form .form-group input:focus,
.edit-form .form-group textarea:focus,
.edit-form .form-group select:focus {
  outline: none;
  border-color: #3498db;
  background: rgba(255, 255, 255, 0.15);
}

.edit-form .form-group select option {
  background: #2c3e50;
  color: white;
}

.edit-form .form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.edit-form .form-row {
  display: flex;
  gap: 12px;
}

.edit-form .form-row .form-group {
  flex: 1;
}

.edit-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.btn-save {
  flex: 1;
  padding: 14px;
  background: linear-gradient(135deg, #27ae60, #219a52);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-save:active:not(:disabled) {
  transform: scale(0.98);
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-cancel:active {
  background: rgba(231, 76, 60, 0.8);
}
</style>
