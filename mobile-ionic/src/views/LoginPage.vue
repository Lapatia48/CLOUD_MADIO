<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\LoginPage.vue -->
<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-page" :scroll-y="false">
      <div class="login-bg">
        <div class="login-card">
          <div class="card-header">
            <h1>🛣️ MADIO</h1>
            <p class="subtitle">Gestion des routes</p>
          </div>

          <!-- Alerte si hors ligne -->
          <div v-if="!isOnline" class="offline-alert">
            <ion-icon :icon="cloudOfflineOutline"></ion-icon>
            <span>Connexion Internet requise pour se connecter</span>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input v-model="email" type="email" placeholder="votre@email.com" class="form-input" />
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input v-model="password" type="password" placeholder="Mot de passe" class="form-input" />
          </div>

          <button class="login-btn" @click="handleLogin" :disabled="loading || !isOnline">
            <ion-spinner v-if="loading" name="crescent" color="light"></ion-spinner>
            <span v-else>Se connecter</span>
          </button>

          <p class="info-text">
            Utilisez vos identifiants créés depuis l'application web manager.
          </p>
        </div>
      </div>

      <!-- Modal de compte bloqué -->
      <ion-modal :is-open="showBlockedModal" @did-dismiss="showBlockedModal = false">
        <ion-header>
          <ion-toolbar color="danger">
            <ion-title>Compte Bloqué</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="blocked-modal-content">
            <div class="blocked-icon-circle">
              <ion-icon :icon="lockClosedOutline" class="blocked-lock-icon"></ion-icon>
            </div>
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
import { IonPage, IonContent, IonButton, IonSpinner, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, toastController } from '@ionic/vue'
import { cloudOfflineOutline, informationCircleOutline, lockClosedOutline } from 'ionicons/icons'
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
      message: 'Connexion Internet requise', 
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
      message: 'Connexion réussie !', 
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
/* ===== Full-page blue background ===== */
.login-page {
  --background: transparent;
}

.login-bg {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(160deg, #1B3A5C 0%, #2E5C8A 50%, #4A90D9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* ===== White card ===== */
.login-card {
  width: 100%;
  max-width: 400px;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 36px 32px 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

.card-header {
  text-align: center;
  margin-bottom: 28px;
}

.card-header h1 {
  margin: 0 0 6px;
  font-size: 1.8rem;
  font-weight: 800;
  color: #1B3A5C;
  letter-spacing: 1px;
}

.card-header .subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: #5A7A9A;
  font-weight: 400;
}

/* ===== Form ===== */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1B3A5C;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #d4dce6;
  border-radius: 10px;
  font-size: 0.95rem;
  color: #1B3A5C;
  background: #F9FAFB;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #4A90D9;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.15);
  background: #FFFFFF;
}

.form-input::placeholder {
  color: #a0b0c0;
}

/* ===== Login button ===== */
.login-btn {
  width: 100%;
  padding: 14px;
  margin-top: 8px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #1B3A5C, #2E5C8A);
  color: #FFFFFF;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.92;
}

.login-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== Info text ===== */
.info-text {
  text-align: center;
  color: #7A8FA3;
  font-size: 0.8rem;
  margin-top: 18px;
  margin-bottom: 0;
  line-height: 1.5;
}

/* ===== Offline alert ===== */
.offline-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFF8E1;
  border: 1px solid #E6943A;
  color: #8B6914;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 0.85rem;
}

.offline-alert ion-icon {
  font-size: 22px;
  color: #E6943A;
  flex-shrink: 0;
}

/* ===== Blocked modal ===== */
.blocked-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
  background: #F5EFE6;
  min-height: 100%;
}

.blocked-icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #D94B4B, #c0392b);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.blocked-lock-icon {
  font-size: 36px;
  color: #FFFFFF;
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