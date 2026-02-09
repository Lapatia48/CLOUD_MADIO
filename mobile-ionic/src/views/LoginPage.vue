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
.login-container {
  max-width: 420px;
  margin: 0 auto;
  padding-top: 40px;
}

h1 {
  text-align: center;
  margin-bottom: 10px;
  color: #1B3A5C;
  font-weight: 700;
  font-size: 1.6rem;
}

ion-content {
  --background: #F5EFE6;
}

ion-item {
  --background: #FFFFFF;
  --border-radius: 10px;
  --border-color: rgba(74, 144, 217, 0.12);
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(27, 58, 92, 0.06);
}

ion-button {
  margin-top: 16px;
  --border-radius: 10px;
  --background: #1B3A5C;
  --background-hover: #2E5C8A;
  font-weight: 600;
  height: 48px;
  letter-spacing: 0.3px;
}

.firebase-badge {
  text-align: center;
  background: linear-gradient(135deg, #4A90D9, #2E5C8A);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 20px;
}

.info-text {
  text-align: center;
  color: #5A7A9A;
  font-size: 0.85rem;
  margin-top: 20px;
  padding: 12px 14px;
  background: #FFFFFF;
  border-radius: 10px;
  border: 1px solid rgba(74, 144, 217, 0.1);
  box-shadow: 0 2px 8px rgba(27, 58, 92, 0.05);
}

.status-chip {
  margin-right: 8px;
  font-size: 0.7rem;
}

.offline-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFF8E1;
  border: 1px solid #E6943A;
  color: #8B6914;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 16px;
}

.offline-alert ion-icon {
  font-size: 24px;
  color: #E6943A;
}

/* Styles pour le modal de compte bloqué */
.blocked-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
  background: #F5EFE6;
  min-height: 100%;
}

.blocked-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.blocked-modal-content h2 {
  color: #D94B4B;
  margin-bottom: 1rem;
  font-weight: 700;
}

.blocked-modal-content p {
  color: #5A7A9A;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.blocked-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #FFFFFF;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  text-align: left;
  border: 1px solid rgba(74, 144, 217, 0.12);
  box-shadow: 0 2px 8px rgba(27, 58, 92, 0.06);
}

.blocked-info ion-icon {
  font-size: 24px;
  color: #4A90D9;
  flex-shrink: 0;
}

.blocked-info span {
  font-size: 0.9rem;
  color: #5A7A9A;
}
</style>