/**
 * Service API - Non utilisé (l'app fonctionne uniquement avec Firebase)
 * Ce fichier est conservé pour compatibilité mais n'est plus utilisé.
 */

// L'application mobile fonctionne uniquement avec Firebase
// Aucune dépendance au backend PostgreSQL/Spring Boot

export const authService = {
  logout: () => {
    localStorage.removeItem('firebase_token')
    localStorage.removeItem('token')
    localStorage.removeItem('firebase_user')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userRole')
    localStorage.removeItem('firebaseUid')
  },
}

export default {}
