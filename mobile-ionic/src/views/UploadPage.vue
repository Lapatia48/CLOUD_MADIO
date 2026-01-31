<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\UploadPage.vue -->
<template>
  <ion-page>
    <ion-header><ion-toolbar color="primary"><ion-title>Upload</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <div class="upload-zone" @click="($refs.fileInput as HTMLInputElement).click()">
        <ion-icon :icon="cloudUploadOutline"></ion-icon><p>Sélectionner des fichiers</p>
      </div>
      <input type="file" ref="fileInput" @change="onSelect" hidden multiple />
      <ion-list v-if="selectedFiles.length">
        <ion-item v-for="(f, i) in selectedFiles" :key="i">
          <ion-icon :icon="documentOutline" slot="start"></ion-icon>
          <ion-label>{{ f.name }}</ion-label>
          <ion-button fill="clear" slot="end" @click="selectedFiles.splice(i, 1)"><ion-icon :icon="closeOutline"></ion-icon></ion-button>
        </ion-item>
      </ion-list>
      <ion-button expand="block" @click="upload" :disabled="!selectedFiles.length || uploading">
        <ion-spinner v-if="uploading" name="crescent"></ion-spinner>
        <span v-else>Envoyer ({{ selectedFiles.length }})</span>
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButton, IonSpinner, toastController } from '@ionic/vue'
import { cloudUploadOutline, documentOutline, closeOutline } from 'ionicons/icons'
import { useFilesStore } from '@/stores/files'

const router = useRouter()
const store = useFilesStore()
const selectedFiles = ref<File[]>([])
const uploading = ref(false)

const onSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files) selectedFiles.value.push(...Array.from(files))
}

async function upload() {
  uploading.value = true
  try {
    for (const f of selectedFiles.value) await store.uploadFile(f)
    toastController.create({ message: 'Envoyé!', duration: 2000, color: 'success' }).then(t => t.present())
    selectedFiles.value = []
    router.push('/tabs/files')
  } catch { toastController.create({ message: 'Erreur', duration: 3000, color: 'danger' }).then(t => t.present()) }
  finally { uploading.value = false }
}
</script>

<style scoped>
.upload-zone { border: 2px dashed var(--ion-color-primary); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; }
.upload-zone ion-icon { font-size: 48px; color: var(--ion-color-primary); }
ion-button { margin-top: 20px; }
</style>