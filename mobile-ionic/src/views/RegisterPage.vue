<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\RegisterPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button default-href="/login"></ion-back-button></ion-buttons>
        <ion-title>Inscription</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item><ion-label position="floating">Nom</ion-label><ion-input v-model="name" type="text"></ion-input></ion-item>
        <ion-item><ion-label position="floating">Email</ion-label><ion-input v-model="email" type="email"></ion-input></ion-item>
        <ion-item><ion-label position="floating">Mot de passe</ion-label><ion-input v-model="password" type="password"></ion-input></ion-item>
        <ion-item><ion-label position="floating">Confirmer</ion-label><ion-input v-model="confirmPassword" type="password"></ion-input></ion-item>
      </ion-list>
      <ion-button expand="block" @click="handleRegister" :disabled="loading">
        <ion-spinner v-if="loading" name="crescent"></ion-spinner>
        <span v-else>S'inscrire</span>
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonButtons, IonBackButton, toastController } from '@ionic/vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const name = ref(''), email = ref(''), password = ref(''), confirmPassword = ref(''), loading = ref(false)

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    const toast = await toastController.create({ message: 'Mots de passe différents', duration: 3000, color: 'danger' })
    return toast.present()
  }
  loading.value = true
  try {
    await authStore.register(email.value, password.value, name.value)
    router.push('/tabs/files')
  } catch (error: any) {
    const toast = await toastController.create({ message: error.response?.data?.message || 'Erreur', duration: 3000, color: 'danger' })
    toast.present()
  } finally { loading.value = false }
}
</script>

<style scoped>
ion-button { margin-top: 16px; }
</style>