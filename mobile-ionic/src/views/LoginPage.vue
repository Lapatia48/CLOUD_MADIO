<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\LoginPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Cloud Madio</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="login-container">
        <h1>Connexion</h1>
        <p class="firebase-badge">🔥 Authentification Firebase</p>
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
        <ion-button expand="block" @click="handleLogin" :disabled="loading">
          <ion-spinner v-if="loading" name="crescent"></ion-spinner>
          <span v-else>Se connecter</span>
        </ion-button>
        <ion-button expand="block" fill="outline" router-link="/register">Créer un compte</ion-button>
        <p class="info-text">
          Utilisez vos identifiants synchronisés depuis l'application web.
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonSpinner, toastController } from '@ionic/vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    // Stocker le token pour le router guard
    localStorage.setItem('token', authStore.token || '')
    const toast = await toastController.create({ 
      message: '🔥 Connexion Firebase réussie!', 
      duration: 2000, 
      color: 'success' 
    })
    toast.present()
    router.push('/home')
  } catch (error: any) {
    const toast = await toastController.create({ 
      message: error.message || 'Erreur de connexion', 
      duration: 3000, 
      color: 'danger' 
    })
    toast.present()
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
</style>