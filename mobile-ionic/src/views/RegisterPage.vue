<template>
  <ion-page>
    <ion-content class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <h1>🛣️ MADIO</h1>
          <p>Créer un compte</p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-row">
            <div class="form-group">
              <label>Nom</label>
              <ion-input 
                v-model="nom" 
                placeholder="Votre nom"
                class="form-input"
                required
              ></ion-input>
            </div>
            <div class="form-group">
              <label>Prénom</label>
              <ion-input 
                v-model="prenom" 
                placeholder="Votre prénom"
                class="form-input"
                required
              ></ion-input>
            </div>
          </div>

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
          <div v-if="success" class="success-message">{{ success }}</div>

          <ion-button expand="block" type="submit" :disabled="loading" class="btn-submit">
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>📝 Créer mon compte</span>
          </ion-button>

          <div class="auth-footer">
            <a @click="goToHome" class="auth-link">← Retour à l'accueil</a>
            <a @click="goToLogin" class="auth-link">Déjà un compte ?</a>
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
import { http } from '../api/http'

const router = useRouter()
const nom = ref('')
const prenom = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

function goToHome() {
  router.push('/home')
}

function goToLogin() {
  router.push('/login')
}

async function handleRegister() {
  error.value = null
  success.value = null
  loading.value = true
  
  try {
    // Just register without auto-login
    const res = await http.post('/api/auth/register', { 
      email: email.value, 
      password: password.value, 
      nom: nom.value, 
      prenom: prenom.value 
    })
    
    console.log('Register response:', res.data)
    
    // Show success message
    success.value = 'Compte créé avec succès ! Redirection vers la connexion...'
    
    const toast = await toastController.create({ 
      message: 'Compte créé avec succès ! Veuillez vous connecter.', 
      duration: 3000, 
      color: 'success' 
    })
    toast.present()
    
    // Redirect to login page after a short delay
    setTimeout(() => {
      router.replace('/login')
    }, 1500)
    
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors de l\'inscription'
    const toast = await toastController.create({ 
      message: error.value || 'Erreur lors de l\'inscription', 
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
  max-width: 450px;
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

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
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

.success-message {
  background: #e8f8f5;
  border: 1px solid #27ae60;
  color: #1e8449;
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