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
    router.push('/tabs/files')
  } catch (error: any) {
    const toast = await toastController.create({ message: error.response?.data?.message || 'Erreur de connexion', duration: 3000, color: 'danger' })
    toast.present()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container { max-width: 400px; margin: 0 auto; padding-top: 40px; }
h1 { text-align: center; margin-bottom: 30px; }
ion-button { margin-top: 16px; }
</style>