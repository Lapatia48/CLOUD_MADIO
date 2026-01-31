<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\FilesPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mes Fichiers</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refresh"><ion-icon :icon="refreshOutline"></ion-icon></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh"><ion-refresher-content></ion-refresher-content></ion-refresher>
      <ion-list v-if="files.length > 0">
        <ion-item-sliding v-for="file in files" :key="file.id">
          <ion-item @click="openFile(file)">
            <ion-icon :icon="file.isFolder ? folderOutline : documentOutline" slot="start" :color="file.isFolder ? 'warning' : 'primary'"></ion-icon>
            <ion-label><h2>{{ file.name }}</h2><p>{{ formatSize(file.size) }}</p></ion-label>
          </ion-item>
          <ion-item-options side="end">
            <ion-item-option color="danger" @click="deleteFile(file)"><ion-icon :icon="trashOutline" slot="icon-only"></ion-icon></ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>
      <div v-else class="empty"><ion-icon :icon="cloudOutline"></ion-icon><p>Aucun fichier</p></div>
      <ion-loading :is-open="loading" message="Chargement..."></ion-loading>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButtons, IonButton, IonItemSliding, IonItemOptions, IonItemOption, IonRefresher, IonRefresherContent, IonLoading, alertController, toastController } from '@ionic/vue'
import { folderOutline, documentOutline, refreshOutline, trashOutline, cloudOutline } from 'ionicons/icons'
import { useFilesStore } from '@/stores/files'

const store = useFilesStore()
const { files, loading } = storeToRefs(store)

onMounted(() => store.fetchFiles())

const formatSize = (b: number) => b ? `${Math.round(b/1024)} KB` : '-'
const openFile = (f: any) => f.isFolder && store.fetchFiles(f.id)
const handleRefresh = async (e: any) => { await store.fetchFiles(); e.target.complete() }
const refresh = () => store.fetchFiles()

async function deleteFile(file: any) {
  const alert = await alertController.create({
    header: 'Supprimer', message: `Supprimer "${file.name}" ?`,
    buttons: [{ text: 'Non', role: 'cancel' }, { text: 'Oui', handler: async () => {
      await store.deleteFile(file.id)
      toastController.create({ message: 'Supprimé', duration: 2000, color: 'success' }).then(t => t.present())
    }}]
  })
  alert.present()
}
</script>

<style scoped>
.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50%; color: #999; }
.empty ion-icon { font-size: 64px; }
</style>