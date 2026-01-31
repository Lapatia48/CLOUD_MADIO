<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\RegisterPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/login"></ion-back-button></ion-buttons>
        <ion-title>Inscription</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item><ion-input v-model="nom" label="Nom" label-placement="floating"></ion-input></ion-item>
        <ion-item><ion-input v-model="prenom" label="Prénom" label-placement="floating"></ion-input></ion-item>
        <ion-item><ion-input v-model="email" type="email" label="Email" label-placement="floating"></ion-input></ion-item>
        <ion-item><ion-input v-model="password" type="password" label="Mot de passe" label-placement="floating"></ion-input></ion-item>
      </ion-list>
      <ion-button expand="block" @click="handleRegister" :disabled="loading" class="ion-margin-top">
        {{ loading ? 'Inscription...' : "S'inscrire" }}
      </ion-button>
      <ion-text color="danger" v-if="error"><p class="ion-text-center">{{ error }}</p></ion-text>
      <ion-button expand="block" fill="clear" router-link="/login">Déjà un compte ?</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput, IonButton, IonText, IonButtons, IonBackButton } from '@ionic/vue'
import { useAuthStore } from '../stores/auth'
import { getApiErrorMessage } from '../api/http'

const router = useRouter()
const authStore = useAuthStore()
const nom = ref('')
const prenom = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function handleRegister() {
  error.value = null
  loading.value = true
  try {
    await authStore.register(email.value, password.value, nom.value, prenom.value)
    router.replace('/map')
  } catch (err) {
    error.value = getApiErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
ion-button { margin-top: 16px; }
</style>