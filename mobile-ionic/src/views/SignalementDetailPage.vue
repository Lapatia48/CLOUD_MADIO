<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/map" />
        </ion-buttons>
        <ion-title>Détail Signalement</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="detail-content">
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent" color="primary" />
        <p>Chargement...</p>
      </div>

      <!-- Not Found -->
      <div v-else-if="!signalement" class="not-found-state">
        <ion-icon :icon="alertCircleOutline" class="not-found-icon" />
        <h2>Signalement non trouvé</h2>
        <ion-button @click="router.push('/map')">Retour</ion-button>
      </div>

      <!-- Detail Content -->
      <template v-else>
        <!-- Mini Map -->
        <div class="detail-map" id="detail-map"></div>

        <!-- Info Card -->
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
                  <h3>{{ formatDate(signalement.dateSignalement || signalement.date_signalement) }}</h3>
                </ion-label>
              </ion-item>

              <ion-item>
                <ion-icon :icon="resizeOutline" slot="start" color="success" />
                <ion-label>
                  <p>Surface</p>
                  <h3>{{ signalement.surfaceM2 ? `${signalement.surfaceM2} m²` : 'Non renseignée' }}</h3>
                </ion-label>
              </ion-item>

              <ion-item>
                <ion-icon :icon="cashOutline" slot="start" color="warning" />
                <ion-label>
                  <p>Budget</p>
                  <h3>{{ signalement.budget ? `${signalement.budget.toLocaleString()} Ar` : 'Non renseigné' }}</h3>
                </ion-label>
              </ion-item>

              <ion-item>
                <ion-icon :icon="businessOutline" slot="start" color="tertiary" />
                <ion-label>
                  <p>Entreprise</p>
                  <h3>{{ signalement.entreprise?.nom || signalement.entrepriseNom || 'Aucune' }}</h3>
                </ion-label>
              </ion-item>

              <ion-item>
                <ion-icon :icon="locationOutline" slot="start" color="danger" />
                <ion-label>
                  <p>Coordonnées GPS</p>
                  <h3>{{ signalement.latitude.toFixed(6) }}, {{ signalement.longitude.toFixed(6) }}</h3>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Admin Section -->
        <ion-card v-if="isAdmin" class="admin-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="settingsOutline" /> Administration
            </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <template v-if="!isEditing">
              <ion-button expand="block" color="secondary" @click="startEditing">
                <ion-icon :icon="createOutline" slot="start" />
                Modifier le signalement
              </ion-button>
            </template>

            <template v-else>
              <div class="edit-form">
                <ion-item>
                  <ion-label position="stacked">Description</ion-label>
                  <ion-textarea v-model="editForm.description" :rows="3" />
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Status</ion-label>
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

                <div class="edit-actions">
                  <ion-button expand="block" color="success" @click="saveEdit" :disabled="saving">
                    <ion-icon :icon="saveOutline" slot="start" />
                    {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
                  </ion-button>
                  <ion-button expand="block" color="medium" @click="cancelEditing">
                    <ion-icon :icon="closeOutline" slot="start" />
                    Annuler
                  </ion-button>
                </div>
              </div>
            </template>
          </ion-card-content>
        </ion-card>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel,
  IonIcon, IonBadge, IonSpinner, IonButton, IonTextarea, IonInput, IonSelect, IonSelectOption
} from '@ionic/vue'
import {
  alertCircleOutline, calendarOutline, resizeOutline, cashOutline,
  businessOutline, locationOutline, settingsOutline, createOutline,
  saveOutline, closeOutline
} from 'ionicons/icons'
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
  return user?.role === 'ADMIN' || user?.id_role === 3
})

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

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
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

.detail-content {
  --background: #f0f2f5;
}

.loading-state,
.not-found-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #7f8c8d;
}

.not-found-icon {
  font-size: 5rem;
  color: #e74c3c;
  margin-bottom: 20px;
}

.detail-map {
  height: 200px;
  width: 100%;
}

.info-card {
  margin: 15px;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.info-card ion-card-header {
  padding-bottom: 10px;
}

.info-card ion-badge {
  margin-bottom: 10px;
}

.info-card ion-card-title {
  font-size: 1.2rem;
  color: #2c3e50;
}

.info-card ion-item {
  --background: #f8f9fa;
  --border-radius: 10px;
  margin-bottom: 8px;
}

.info-card ion-item p {
  color: #7f8c8d;
  font-size: 0.8rem;
}

.info-card ion-item h3 {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
  margin: 4px 0 0;
}

/* Admin Card */
.admin-card {
  margin: 15px;
  border-radius: 16px;
  border-top: 4px solid #9b59b6;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.admin-card ion-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9b59b6;
  font-size: 1.1rem;
}

.edit-form ion-item {
  --background: white;
  margin-bottom: 12px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}

.edit-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.edit-actions ion-button {
  --border-radius: 10px;
  font-weight: 600;
}
</style>
