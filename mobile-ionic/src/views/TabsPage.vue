<!-- filepath: c:\Users\miari\Documents\MrRojoS5\cloudS5\cloudClean\CLOUD_MADIO\mobile-ionic\src\views\TabsPage.vue -->
<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="files" href="/tabs/files">
          <ion-icon :icon="folderOutline"></ion-icon><ion-label>Fichiers</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="upload" href="/tabs/upload">
          <ion-icon :icon="cloudUploadOutline"></ion-icon><ion-label>Upload</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="personOutline"></ion-icon><ion-label>Profil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/vue'
import { folderOutline, cloudUploadOutline, personOutline } from 'ionicons/icons'
</script>