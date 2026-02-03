<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" />
        </ion-buttons>
        <ion-title>📊 Gestion Signalements</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="admin-content">
      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card total">
          <span class="num">{{ signalements.length }}</span>
          <span class="label">Total</span>
        </div>
        <div class="stat-card nouveau">
          <span class="num">{{ countByStatus('NOUVEAU') }}</span>
          <span class="label">Nouveaux</span>
        </div>
        <div class="stat-card en-cours">
          <span class="num">{{ countByStatus('EN_COURS') }}</span>
          <span class="label">En cours</span>
        </div>
        <div class="stat-card termine">
          <span class="num">{{ countByStatus('TERMINE') }}</span>
          <span class="label">Terminés</span>
        </div>
      </div>

      <!-- Filtre par statut -->
      <ion-segment v-model="filterStatus" class="status-filter">
        <ion-segment-button value="">
          <ion-label>Tous</ion-label>
        </ion-segment-button>
        <ion-segment-button value="NOUVEAU">
          <ion-label>🔴 Nouveaux</ion-label>
        </ion-segment-button>
        <ion-segment-button value="EN_COURS">
          <ion-label>🟠 En cours</ion-label>
        </ion-segment-button>
        <ion-segment-button value="TERMINE">
          <ion-label>🟢 Terminés</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- Liste des signalements -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent" color="primary" />
        <p>Chargement...</p>
      </div>

      <ion-list v-else>
        <ion-item-sliding v-for="sig in filteredSignalements" :key="sig.id">
          <ion-item @click="openDetailModal(sig)" detail>
            <ion-badge slot="start" :color="getStatusBadgeColor(sig.status)">
              {{ sig.id }}
            </ion-badge>
            <ion-label>
              <h2>{{ sig.description?.slice(0, 40) || 'Sans description' }}...</h2>
              <p>
                <ion-icon :icon="calendarOutline" /> {{ formatDate(sig) }}
                <span v-if="sig.user"> • {{ sig.user.prenom }} {{ sig.user.nom }}</span>
              </p>
              <!-- Mini barre de progression -->
              <div class="mini-progress">
                <div class="mini-progress-bar">
                  <div 
                    class="mini-progress-fill" 
                    :style="{ width: `${getProgressPercent(sig.status)}%`, background: getStatusColor(sig.status) }"
                  />
                </div>
                <span class="mini-progress-text">{{ getProgressPercent(sig.status) }}%</span>
              </div>
            </ion-label>
          </ion-item>

          <ion-item-options side="end">
            <ion-item-option color="secondary" @click="openEditModal(sig)">
              <ion-icon :icon="createOutline" slot="icon-only" />
            </ion-item-option>
            <ion-item-option color="primary" @click="router.push(`/signalement/${sig.id}`)">
              <ion-icon :icon="eyeOutline" slot="icon-only" />
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <div v-if="!loading && filteredSignalements.length === 0" class="empty-state">
        <ion-icon :icon="alertCircleOutline" class="empty-icon" />
        <p>Aucun signalement trouvé</p>
      </div>

      <!-- Modal de modification -->
      <ion-modal :is-open="showEditModal" @didDismiss="closeEditModal">
        <ion-header>
          <ion-toolbar color="secondary">
            <ion-title>✏️ Modifier #{{ editingSignalement?.id }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeEditModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Description</ion-label>
              <ion-textarea v-model="editForm.description" :rows="3" placeholder="Description du problème..." />
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Statut</ion-label>
              <ion-select v-model="editForm.status" interface="popover">
                <ion-select-option value="NOUVEAU">🔴 Nouveau</ion-select-option>
                <ion-select-option value="EN_COURS">🟠 En cours</ion-select-option>
                <ion-select-option value="TERMINE">🟢 Terminé</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Surface (m²)</ion-label>
              <ion-input v-model="editForm.surfaceM2" type="number" placeholder="Ex: 150" />
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Budget (Ar)</ion-label>
              <ion-input v-model="editForm.budget" type="number" placeholder="Ex: 500000" />
            </ion-item>
          </ion-list>

          <div class="edit-actions">
            <ion-button expand="block" color="success" @click="saveEdit" :disabled="saving">
              <ion-icon :icon="saveOutline" slot="start" />
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </ion-button>
            <ion-button expand="block" color="medium" fill="outline" @click="closeEditModal">
              <ion-icon :icon="closeOutline" slot="start" />
              Annuler
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>

      <!-- Modal de détail rapide -->
      <ion-modal :is-open="showDetailModal" @didDismiss="closeDetailModal">
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Signalement #{{ detailSignalement?.id }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeDetailModal">
                <ion-icon :icon="closeOutline" />
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding" v-if="detailSignalement">
          <ion-card>
            <ion-card-header>
              <ion-badge :color="getStatusBadgeColor(detailSignalement.status)">
                {{ getStatusLabel(detailSignalement.status) }}
              </ion-badge>
              <ion-card-title>{{ detailSignalement.description || 'Sans description' }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-list lines="none">
                <ion-item>
                  <ion-icon :icon="calendarOutline" slot="start" color="primary" />
                  <ion-label>
                    <p>Date</p>
                    <h3>{{ formatDate(detailSignalement) }}</h3>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-icon :icon="resizeOutline" slot="start" color="success" />
                  <ion-label>
                    <p>Surface</p>
                    <h3>{{ detailSignalement.surfaceM2 ? `${detailSignalement.surfaceM2} m²` : 'N/A' }}</h3>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-icon :icon="cashOutline" slot="start" color="warning" />
                  <ion-label>
                    <p>Budget</p>
                    <h3>{{ detailSignalement.budget ? `${detailSignalement.budget.toLocaleString()} Ar` : 'N/A' }}</h3>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-icon :icon="locationOutline" slot="start" color="danger" />
                  <ion-label>
                    <p>Coordonnées</p>
                    <h3>{{ detailSignalement.latitude.toFixed(4) }}, {{ detailSignalement.longitude.toFixed(4) }}</h3>
                  </ion-label>
                </ion-item>
              </ion-list>
            </ion-card-content>
          </ion-card>

          <div class="detail-actions">
            <ion-button expand="block" color="secondary" @click="openEditFromDetail">
              <ion-icon :icon="createOutline" slot="start" />
              Modifier
            </ion-button>
            <ion-button expand="block" color="primary" @click="goToFullDetail">
              <ion-icon :icon="eyeOutline" slot="start" />
              Voir sur la carte
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonBadge, IonIcon, IonSpinner, IonButton, IonSegment,
  IonSegmentButton, IonModal, IonTextarea, IonInput, IonSelect, IonSelectOption,
  IonItemSliding, IonItemOptions, IonItemOption, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonRefresher, IonRefresherContent
} from '@ionic/vue'
import {
  calendarOutline, createOutline, eyeOutline, closeOutline, saveOutline,
  alertCircleOutline, resizeOutline, cashOutline, locationOutline
} from 'ionicons/icons'
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
  user?: { id: number; email: string; nom?: string; prenom?: string } | null
}

const router = useRouter()

const signalements = ref<Signalement[]>([])
const loading = ref(true)
const filterStatus = ref('')

// Modal d'édition
const showEditModal = ref(false)
const editingSignalement = ref<Signalement | null>(null)
const editForm = ref({ description: '', status: '', surfaceM2: '', budget: '' })
const saving = ref(false)

// Modal de détail
const showDetailModal = ref(false)
const detailSignalement = ref<Signalement | null>(null)

const filteredSignalements = computed(() => {
  if (!filterStatus.value) return signalements.value
  return signalements.value.filter(s => s.status === filterStatus.value)
})

function countByStatus(status: string) {
  return signalements.value.filter(s => s.status === status).length
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'NOUVEAU': return '🔴 Nouveau'
    case 'EN_COURS': return '🟠 En cours'
    case 'TERMINE': return '🟢 Terminé'
    default: return status
  }
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'NOUVEAU': return 'danger'
    case 'EN_COURS': return 'warning'
    case 'TERMINE': return 'success'
    default: return 'primary'
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

function formatDate(sig: Signalement) {
  const dateStr = sig.dateSignalement || sig.date_signalement
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

async function fetchSignalements() {
  loading.value = true
  try {
    const response = await http.get('/api/signalements')
    signalements.value = response.data
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    loading.value = false
  }
}

async function handleRefresh(event: CustomEvent) {
  await fetchSignalements()
  ;(event.target as HTMLIonRefresherElement).complete()
}

// Modal d'édition
function openEditModal(sig: Signalement) {
  editingSignalement.value = sig
  editForm.value = {
    description: sig.description || '',
    status: sig.status || 'NOUVEAU',
    surfaceM2: sig.surfaceM2?.toString() || '',
    budget: sig.budget?.toString() || '',
  }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingSignalement.value = null
}

async function saveEdit() {
  if (!editingSignalement.value) return
  saving.value = true

  try {
    const response = await http.put(`/api/signalements/${editingSignalement.value.id}`, {
      description: editForm.value.description,
      status: editForm.value.status,
      latitude: editingSignalement.value.latitude,
      longitude: editingSignalement.value.longitude,
      surfaceM2: editForm.value.surfaceM2 ? parseFloat(editForm.value.surfaceM2) : null,
      budget: editForm.value.budget ? parseFloat(editForm.value.budget) : null,
    })

    // Mettre à jour la liste
    const index = signalements.value.findIndex(s => s.id === editingSignalement.value!.id)
    if (index !== -1) {
      signalements.value[index] = { ...signalements.value[index], ...response.data }
    }

    closeEditModal()
    alert('✅ Signalement modifié avec succès !')
  } catch (error) {
    console.error('Erreur:', error)
    alert('❌ Erreur lors de la modification')
  } finally {
    saving.value = false
  }
}

// Modal de détail
function openDetailModal(sig: Signalement) {
  detailSignalement.value = sig
  showDetailModal.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  detailSignalement.value = null
}

function openEditFromDetail() {
  if (detailSignalement.value) {
    closeDetailModal()
    setTimeout(() => openEditModal(detailSignalement.value!), 300)
  }
}

function goToFullDetail() {
  if (detailSignalement.value) {
    closeDetailModal()
    router.push(`/signalement/${detailSignalement.value.id}`)
  }
}

onMounted(fetchSignalements)
</script>

<style scoped>
.admin-content {
  --background: #f0f2f5;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.stat-card .num {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-card .label {
  font-size: 0.7rem;
  color: #7f8c8d;
}

.stat-card.total { border-top: 3px solid #3498db; }
.stat-card.total .num { color: #3498db; }
.stat-card.nouveau { border-top: 3px solid #e74c3c; }
.stat-card.nouveau .num { color: #e74c3c; }
.stat-card.en-cours { border-top: 3px solid #f39c12; }
.stat-card.en-cours .num { color: #f39c12; }
.stat-card.termine { border-top: 3px solid #27ae60; }
.stat-card.termine .num { color: #27ae60; }

.status-filter {
  margin: 12px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.edit-actions,
.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

ion-item h2 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c3e50;
}

ion-item p {
  font-size: 0.8rem;
  color: #7f8c8d;
}

ion-item p ion-icon {
  vertical-align: middle;
  margin-right: 4px;
}

/* Mini barre de progression dans la liste */
.mini-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.mini-progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.mini-progress-text {
  font-size: 0.75rem;
  font-weight: bold;
  color: #2c3e50;
  min-width: 35px;
}
</style>
