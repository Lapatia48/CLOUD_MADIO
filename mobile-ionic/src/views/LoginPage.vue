<template>
  <ion-page>
    <ion-content class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <h1>🛣️ MADIO</h1>
          <p>Connexion</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label>Email</label>
            <ion-input 
              v-model="email" 
              type="email" 
              placeholder="votre@email.com"
              class="form-input"
              required
            ></ion-input>
          </div>

          <div class="form-group">
            <label>Mot de passe</label>
            <ion-input 
              v-model="password" 
              type="password" 
              placeholder="••••••••"
              class="form-input"
              required
            ></ion-input>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <ion-button expand="block" type="submit" :disabled="loading" class="btn-submit">
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>🔐 Se connecter</span>
          </ion-button>

          <div class="auth-footer">
            <a @click="goToRegister" class="auth-link">Créer un compte</a>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent, IonInput, IonButton, IonSpinner, toastController } from '@ionic/vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

function goToRegister() {
  router.push('/register')
}

async function handleLogin() {
  error.value = null
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    router.push('/map')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Email ou mot de passe incorrect'
    const toast = await toastController.create({ message: error.value || 'Erreur de connexion', duration: 3000, color: 'danger' })
    toast.present()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  --background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.auth-container {
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin: 20px;
}

.auth-header {
  text-align: center;
  margin-bottom: 35px;
}

.auth-header h1 {
  font-size: 2.2rem;
  margin: 0;
  color: #2c3e50;
}

.auth-header p {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 8px 0 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.form-input {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --background: #ffffff;
  --color: #2c3e50;
  --placeholder-color: #bdc3c7;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus-within {
  border-color: #3498db;
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.15);
}

.error-message {
  background: #fdedee;
  border: 1px solid #e74c3c;
  color: #c0392b;
  padding: 14px;
  border-radius: 10px;
  text-align: center;
  font-size: 0.95rem;
}

.btn-submit {
  --background: linear-gradient(135deg, #3498db, #2980b9);
  --border-radius: 12px;
  font-weight: 600;
  height: 50px;
  margin-top: 10px;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
}

.auth-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 15px;
  border-top: 1px solid #ecf0f1;
  margin-top: 10px;
}

.auth-link {
  color: #3498db;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.auth-link:hover {
  color: #2980b9;
  text-decoration: underline;
}
</style>