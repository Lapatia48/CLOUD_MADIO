# ✅ Checklist d'implémentation - Refonte CSS

## 📋 État actuel

### ✅ Complété
- [x] Design system complet créé
- [x] Tous les CSS modules créés (19 fichiers)
- [x] Palette de couleurs définie
- [x] Composants UI réutilisables
- [x] Documentation complète (3 fichiers MD)
- [x] Styles globaux créés
- [x] LandingPage.tsx refactorisé (emojis supprimés, textes épurés)
- [x] ManagerLoginPage.tsx refactorisé (CSS module intégré)

### 🔄 En cours / À faire
- [ ] Intégrer les CSS modules dans les autres fichiers TSX
- [ ] Supprimer tous les emojis des fichiers TSX
- [ ] Remplacer par des icônes SVG
- [ ] Supprimer les textes superflus
- [ ] Tests responsive
- [ ] Tests accessibilité

## 🎯 Actions immédiates à réaliser

### 1️⃣ Importer global.css dans main.tsx

```tsx
// frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import App from './App.tsx'

// AJOUTER CES IMPORTS
import './styles/global.css'
import 'leaflet/dist/leaflet.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
```

### 2️⃣ Refactoriser les pages d'authentification

#### LoginPage.tsx
```tsx
// AVANT
<div className="auth-page">
  <div className="auth-container">
    <h1>🛣️ MADIO</h1>
    
// APRÈS
import styles from './LoginPage.module.css';

<div className={styles.loginPage}>
  <div className={styles.loginContainer}>
    <div className={styles.loginIcon}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h18M3 6h18M3 18h18" />
        <path d="M9 3v18M15 3v18" />
      </svg>
    </div>
```

#### RegisterPage.tsx
```tsx
// AVANT
<div className="auth-page">
  <h1>🛣️ MADIO</h1>
  
// APRÈS
import styles from './RegisterPage.module.css';

<div className={styles.registerPage}>
  <div className={styles.registerContainer}>
    <button className={styles.btnBack} onClick={() => navigate(-1)}>
      ← Retour
    </button>
```

### 3️⃣ Refactoriser les dashboards

#### AdminDashboard.tsx
```tsx
// AVANT
<div className="admin-dashboard">
  <button className="btn-back">← Retour</button>
  <h1>📊 Dashboard Admin</h1>
  
// APRÈS
import styles from './AdminDashboard.module.css';

<div className={styles.dashboard}>
  <aside className={styles.sidebar}>
    <div className={styles.sidebarHeader}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
            <path d="M9 3v18M15 3v18" />
          </svg>
        </div>
        <span className={styles.logoText}>Routes</span>
      </div>
    </div>
    
    <nav className={styles.sidebarNav}>
      <button className={styles.navLink} onClick={() => navigate('/admin')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span>Dashboard</span>
      </button>
    </nav>
    
    <div className={styles.sidebarFooter}>
      <div className={styles.userInfo}>
        <div className={styles.userAvatar}>A</div>
        <div className={styles.userDetails}>
          <p className={styles.userName}>Admin</p>
          <p className={styles.userRole}>Administrateur</p>
        </div>
      </div>
      <button className={styles.btnLogout} onClick={handleLogout}>
        Déconnexion
      </button>
    </div>
  </aside>
  
  <main className={styles.mainContent}>
    <header className={styles.contentHeader}>
      <h1 className={styles.pageTitle}>Dashboard</h1>
    </header>
    
    <div className={styles.cardsGrid}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Total</span>
        </div>
        <p className={styles.cardValue}>{signalements.length}</p>
      </div>
    </div>
  </main>
</div>
```

#### MainDashboard.tsx & UserDashboard.tsx
Même structure que AdminDashboard.tsx

### 4️⃣ Refactoriser les pages de signalement

#### SignalementCreatePage.tsx
```tsx
// AVANT
<div className="create-page">
  <button>← Retour</button>
  <h1>Nouveau signalement</h1>
  
// APRÈS
import styles from './SignalementCreatePage.module.css';

<div className={styles.signalementCreatePage}>
  <div className={styles.container}>
    <div className={styles.header}>
      <button className={styles.btnBack} onClick={() => navigate(-1)}>
        ← Retour
      </button>
      <h1 className={styles.pageTitle}>Nouveau signalement</h1>
    </div>
    
    <div className={styles.content}>
      <div className={styles.formPanel}>
        <h2 className={styles.formTitle}>Informations</h2>
        <form className={styles.form}>
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea placeholder="Décrivez le signalement..."></textarea>
          </div>
          {/* ... autres champs ... */}
          <div className={styles.formActions}>
            <button className={styles.btnPrimary} type="submit">
              Créer le signalement
            </button>
            <button className={styles.btnSecondary} type="button" onClick={() => navigate(-1)}>
              Annuler
            </button>
          </div>
        </form>
      </div>
      
      <div className={styles.mapPanel}>
        <h2 className={styles.mapTitle}>Localisation</h2>
        <div className={styles.mapContainer}>
          <MapContainer>...</MapContainer>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 5️⃣ Refactoriser les pages visiteur/map

#### VisitorPage.tsx
```tsx
// AVANT
<div className="visitor-page">
  <button>← Retour</button>
  
// APRÈS
import styles from './VisitorPage.module.css';

<div className={styles.visitorPage}>
  <header className={styles.header}>
    <div className={styles.logo}>
      <div className={styles.logoIcon}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
          <path d="M9 3v18M15 3v18" />
        </svg>
      </div>
      <span className={styles.logoText}>Routes</span>
    </div>
    
    <div className={styles.headerActions}>
      <div className={`${styles.statusIndicator} ${isOnline ? styles.statusOnline : styles.statusOffline}`}>
        <span className={styles.statusDot}></span>
        <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
      </div>
      <button className={styles.btnBack} onClick={() => navigate('/')}>
        Retour
      </button>
    </div>
  </header>
  
  <div className={styles.mapContainer}>
    <div className={styles.mapWrapper}>
      <MapContainer>...</MapContainer>
    </div>
  </div>
</div>
```

## 🎨 Icônes SVG à utiliser

### Routes/Grid
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M3 12h18M3 6h18M3 18h18" />
  <path d="M9 3v18M15 3v18" />
</svg>
```

### User/Profile
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</svg>
```

### Dashboard/Chart
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <line x1="18" y1="20" x2="18" y2="10"/>
  <line x1="12" y1="20" x2="12" y2="4"/>
  <line x1="6" y1="20" x2="6" y2="14"/>
</svg>
```

### Map/Location
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
  <circle cx="12" cy="10" r="3"/>
</svg>
```

### Eye/Voir
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>
```

### Settings
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
</svg>
```

### LogOut
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
  <polyline points="16 17 21 12 16 7"/>
  <line x1="21" y1="12" x2="9" y2="12"/>
</svg>
```

### Plus/Add
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <line x1="12" y1="5" x2="12" y2="19"/>
  <line x1="5" y1="12" x2="19" y2="12"/>
</svg>
```

## 🧪 Tests à effectuer

### Visual Testing
- [ ] Tester sur Chrome, Firefox, Safari, Edge
- [ ] Tester responsive (320px, 768px, 1024px, 1920px)
- [ ] Vérifier les hover states
- [ ] Vérifier les focus states
- [ ] Vérifier les animations

### Accessibility
- [ ] Contraste des couleurs (WCAG AA)
- [ ] Navigation au clavier
- [ ] Screen reader compatible
- [ ] Alt text sur toutes les images/icônes
- [ ] ARIA labels appropriés

### Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1

## 📚 Documentation à consulter

1. **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** - Spécifications design complètes
2. **[CSS_IMPLEMENTATION_GUIDE.md](CSS_IMPLEMENTATION_GUIDE.md)** - Guide d'implémentation détaillé
3. **[REFONTE_COMPLETE.md](REFONTE_COMPLETE.md)** - Vue d'ensemble du projet

## 🚀 Commandes utiles

```bash
# Lancer le frontend
cd frontend
npm run dev

# Build pour production
npm run build

# Linter CSS
npm run lint:css

# Format code
npm run format
```

## ✨ Résultat attendu

Un frontend moderne, épuré et professionnel avec :
- ✅ Design cohérent et élégant
- ✅ Aucun emoji visible
- ✅ Textes essentiels uniquement
- ✅ Sidebar élégante pour les dashboards
- ✅ Thème skyblue/beige
- ✅ Responsive et accessible
- ✅ Animations fluides
- ✅ Performance optimale

---

**Dernière mise à jour** : Février 2026  
**Status** : CSS Modules créés ✅ | Intégration TSX en cours 🔄
