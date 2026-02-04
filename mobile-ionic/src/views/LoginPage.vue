<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\LoginPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>🛣️ MADIO</ion-title>

      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="login-container">
        <h1>Connexion</h1>
        <p class="firebase-badge">🔥 Firebase</p>
        
        <!-- Alerte si hors ligne -->
        <div v-if="!isOnline" class="offline-alert">
          <ion-icon :icon="cloudOfflineOutline"></ion-icon>
          <span>Connexion Internet requise pour se connecter</span>
        </div>
        
        <ion-list>
          <ion-item>
            <ion-label position="floating">Email</ion-label>
            <ion-input v-model="email" type="email"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="floating">Mot de passe</ion-label>
            <ion-input v-model="password" type="password"></ion-input>
          </ion-item>
        </ion-list>
        <ion-button expand="block" @click="handleLogin" :disabled="loading || !isOnline">
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
          <span v-else>Se connecter</span>
        </ion-button>
        <p class="info-text">
          💡 Utilisez vos identifiants créés depuis l'application web manager.
        </p>
      </div>

      <!-- Modal de compte bloqué -->
      <ion-modal :is-open="showBlockedModal" @did-dismiss="showBlockedModal = false">
        <ion-header>
          <ion-toolbar color="danger">
            <ion-title>🔒 Compte Bloqué</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="blocked-modal-content">
            <div class="blocked-icon">🚫</div>
            <h2>Accès Refusé</h2>
            <p>{{ blockedMessage }}</p>
            <div class="blocked-info">
              <ion-icon :icon="informationCircleOutline"></ion-icon>
              <span>Pour débloquer votre compte, veuillez contacter l'administrateur via l'application web.</span>
            </div>
            <ion-button expand="block" color="medium" @click="showBlockedModal = false">
              Compris
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonIcon, IonModal, toastController } from '@ionic/vue'
import { cloudOfflineOutline, informationCircleOutline } from 'ionicons/icons'
import { useAuthStore, AccountBlockedError } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const isOnline = ref(navigator.onLine)
const showBlockedModal = ref(false)
const blockedMessage = ref('')

function handleOnline() { isOnline.value = true }
function handleOffline() { isOnline.value = false }

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})

async function handleLogin() {
  if (!isOnline.value) {
    const toast = await toastController.create({ 
      message: '🔴 Connexion Internet requise', 
      duration: 3000, 
      color: 'danger' 
    })
    toast.present()
    return
  }
  
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    const toast = await toastController.create({ 
      message: '🔥 Connexion Firebase réussie!', 
      duration: 2000, 
      color: 'success' 
    })
    toast.present()
    // Utiliser replace pour éviter le retour arrière vers login
    // Petit délai pour que le store soit mis à jour
    setTimeout(() => {
      router.replace('/home')
    }, 100)
  } catch (error: any) {
    // Vérifier si c'est une erreur de compte bloqué
    if (error instanceof AccountBlockedError || error.name === 'AccountBlockedError') {
      blockedMessage.value = error.message
      showBlockedModal.value = true
    } else {
      const toast = await toastController.create({ 
        message: error.message || 'Erreur de connexion', 
        duration: 4000, 
        color: 'danger' 
      })
      toast.present()
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container { max-width: 400px; margin: 0 auto; padding-top: 40px; }
h1 { text-align: center; margin-bottom: 10px; }
ion-button { margin-top: 16px; }
.firebase-badge {
  text-align: center;
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 20px;
}
.info-text {
  text-align: center;
  color: #666;
  font-size: 0.85rem;
  margin-top: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
}
.status-chip {
  margin-right: 8px;
  font-size: 0.7rem;
}
.offline-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.offline-alert ion-icon {
  font-size: 24px;
}

/* Styles pour le modal de compte bloqué */
.blocked-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
}
.blocked-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}
.blocked-modal-content h2 {
  color: #e74c3c;
  margin-bottom: 1rem;
}
.blocked-modal-content p {
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}
.blocked-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f0f0f0;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: left;
}
.blocked-info ion-icon {
  font-size: 24px;
  color: #3498db;
  flex-shrink: 0;
}
.blocked-info span {
  font-size: 0.9rem;
  color: #555;
}
</style>