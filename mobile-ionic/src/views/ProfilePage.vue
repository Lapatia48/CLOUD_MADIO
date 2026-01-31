<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\ProfilePage.vue -->
<template>
  <ion-page>
    <ion-header><ion-toolbar color="primary"><ion-title>Profil</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <div class="profile">
        <ion-avatar><img :src="`https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=3880ff&color=fff`" /></ion-avatar>
        <h2>{{ user?.name || 'Utilisateur' }}</h2>
        <p>{{ user?.email }}</p>
      </div>
      <ion-button expand="block" color="danger" @click="logout">
        <ion-icon :icon="logOutOutline" slot="start"></ion-icon>Déconnexion
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonAvatar, IonButton, IonIcon } from '@ionic/vue'
import { logOutOutline } from 'ionicons/icons'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
onMounted(() => authStore.loadUser())
const user = computed(() => authStore.user)
const logout = () => { authStore.logout(); router.push('/login') }
</script>

<style scoped>
.profile { text-align: center; padding: 30px 0; }
.profile ion-avatar { width: 100px; height: 100px; margin: 0 auto 16px; }
ion-button { margin-top: 30px; }
</style>