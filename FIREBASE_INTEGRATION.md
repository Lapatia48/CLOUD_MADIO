# Intégration Firebase - Cloud Madio

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Web React     │ ───▶ │  Backend Spring  │ ───▶ │   PostgreSQL    │
│   (Frontend)    │      │     Boot         │      │   (Docker)      │
└─────────────────┘      └────────┬─────────┘      └─────────────────┘
                                  │
                                  │ Sync
                                  ▼
                         ┌──────────────────┐
                         │    Firebase      │
                         │  ┌────────────┐  │
                         │  │ Auth       │  │
                         │  └────────────┘  │
                         │  ┌────────────┐  │
                         │  │ Firestore  │  │
                         │  └────────────┘  │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Mobile Ionic    │
                         │     (Vue)        │
                         └──────────────────┘
```

## Flux de synchronisation

1. **Création utilisateur (Web)**
   - L'admin crée un utilisateur via l'interface web
   - L'utilisateur est stocké dans PostgreSQL

2. **Synchronisation Firebase (Web)**
   - L'admin clique sur "Sync Firebase" sur la page `/admin/users`
   - Entre le mot de passe de l'utilisateur
   - Le backend crée:
     - Un compte dans Firebase Authentication
     - Un document dans Firestore collection `users`
   - Le `firebase_uid` est stocké dans PostgreSQL

3. **Connexion Mobile**
   - L'utilisateur se connecte via l'app Ionic
   - Authentification directe via Firebase Auth REST API
   - Les données utilisateur sont récupérées depuis Firestore

## Configuration Firebase

### Projet Firebase
- **Project ID**: `cloud-s5-91071`
- **API Key**: `AIzaSyAZDq6XBscA4ys06AJptbvjOSKLrqAa1Yc`

### Endpoints utilisés

#### Firebase Authentication (REST API)
```
POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}
```

#### Firestore (REST API)
```
Base URL: https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents
```

## Structure Firestore

### Collection: `users`
```json
{
  "email": "string",
  "password": "string",
  "nom": "string",
  "prenom": "string",
  "role": "string (USER|MANAGER|ADMIN)",
  "firebaseUid": "string",
  "postgresId": "integer",
  "isBlocked": "boolean"
}
```

## API Backend - Endpoints Firebase

### POST `/api/firebase/sync/user`
Synchronise un utilisateur vers Firebase.

**Request Body:**
```json
{
  "userId": 1,
  "plainPassword": "motdepasse123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Synchronisation réussie avec Firebase",
  "firebaseUid": "abc123xyz",
  "firestoreDocId": "docId123",
  "userId": 1,
  "email": "user@example.com"
}
```

### POST `/api/firebase/sync/all`
Synchronise tous les utilisateurs non synchronisés.

**Query Params:**
- `defaultPassword` (optional, default: "password123")

**Response:**
```json
{
  "totalProcessed": 5,
  "success": 4,
  "failed": 1
}
```

## Tests avec curl

### Synchroniser un utilisateur
```bash
curl -X POST http://localhost:8080/api/firebase/sync/user \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "plainPassword": "test1234"}'
```

### Se connecter via Firebase (test)
```bash
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyAZDq6XBscA4ys06AJptbvjOSKLrqAa1Yc" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "test1234", "returnSecureToken": true}'
```

## Fichiers modifiés/créés

### Backend (Spring Boot)
- `config/FirebaseConfig.java` - Configuration Firebase
- `service/FirebaseService.java` - Service de synchronisation
- `controller/FirebaseController.java` - Endpoints REST
- `dto/FirebaseSyncRequest.java` - DTO requête
- `dto/FirebaseSyncResponse.java` - DTO réponse
- `dto/UserResponse.java` - Ajout firebaseUid

### Frontend (React)
- `pages/UserManagementPage.tsx` - Page gestion utilisateurs
- `assets/css/UserManagement.css` - Styles
- `App.tsx` - Route ajoutée

### Mobile (Ionic/Vue)
- `services/firebaseService.ts` - Service Firebase REST
- `stores/auth.ts` - Store avec authentification Firebase
- `views/LoginPage.vue` - UI mise à jour
- `config.ts` - Configuration

## Rebuild Docker

Après modifications, reconstruire les conteneurs:

```bash
docker-compose down
docker-compose build backend frontend mobile-ionic
docker-compose up -d
```
