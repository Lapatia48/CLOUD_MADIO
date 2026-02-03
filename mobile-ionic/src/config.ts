/**
 * Configuration de l'application mobile
 */

export const config = {
  // Backend API (Spring Boot)
  backendUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  
  // Firebase Configuration
  firebase: {
    apiKey: 'AIzaSyAZDq6XBscA4ys06AJptbvjOSKLrqAa1Yc',
    projectId: 'cloud-s5-91071',
    authDomain: 'cloud-s5-91071.firebaseapp.com',
  },
  
  // Mode d'authentification par défaut
  // 'firebase' pour utiliser Firebase Auth (recommandé pour mobile)
  // 'backend' pour utiliser le backend Spring Boot directement
  defaultAuthMode: 'firebase' as 'firebase' | 'backend',
}

export default config
