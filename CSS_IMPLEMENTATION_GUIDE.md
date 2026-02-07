# Guide d'implémentation CSS - Changements à apporter

## Vue d'ensemble

Tous les fichiers CSS modules ont été créés. Voici les modifications à apporter dans les fichiers TSX pour utiliser le nouveau design.

## Modifications globales à faire

### 1. Importer le fichier global.css dans main.tsx

```tsx
// Dans frontend/src/main.tsx
import './styles/global.css'
import 'leaflet/dist/leaflet.css'
```

### 2. Modifications par page

#### ✅ LandingPage.tsx
- CSS Module déjà importé et utilisé
- Supprimer les textes superflus (déjà fait)
- Classes CSS déjà appliquées

#### LoginPage.tsx & RegisterPage.tsx
**Ajouter** :
```tsx
import styles from './LoginPage.module.css'; // ou RegisterPage.module.css
```

**Remplacer les classes** :
- `.auth-page` → `styles.loginPage` / `styles.registerPage`
- `.auth-container` → `styles.loginContainer` / `styles.registerContainer`
- `.auth-header` → `styles.loginHeader` / `styles.registerHeader`
- `.auth-form` → `styles.loginForm` / `styles.registerForm`
- `.form-group` → `styles.formGroup`
- `.btn-submit` → `styles.btnSubmit`
- `.error-message` → `styles.errorMessage`
- `.success-message` → `styles.successMessage`

**Supprimer tous les emojis** dans le JSX (🛣️, 🔐, ⏳, 📝, etc.)

#### ✅ ManagerLoginPage.tsx
- CSS Module déjà importé
- Emojis déjà supprimés
- Classes CSS déjà appliquées

#### AdminDashboard.tsx, UserDashboard.tsx, MainDashboard.tsx
**Ajouter** :
```tsx
import styles from './AdminDashboard.module.css'; // ou UserDashboard, MainDashboard
```

**Restructurer le JSX** pour utiliser :
```tsx
<div className={styles.dashboard}>
  <aside className={styles.sidebar}>
    <div className={styles.sidebarHeader}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg>...</svg>
        </div>
        <span className={styles.logoText}>Routes</span>
      </div>
    </div>
    
    <nav className={styles.sidebarNav}>
      <a href="#" className={styles.navLink}>
        <svg>...</svg>
        <span>Dashboard</span>
      </a>
    </nav>
    
    <div className={styles.sidebarFooter}>
      <div className={styles.userInfo}>
        <div className={styles.userAvatar}>JD</div>
        <div className={styles.userDetails}>
          <p className={styles.userName}>John Doe</p>
          <p className={styles.userRole}>Manager</p>
        </div>
      </div>
      <button className={styles.btnLogout}>Déconnexion</button>
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
        <p className={styles.cardValue}>42</p>
      </div>
    </div>
    
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        ...
      </table>
    </div>
  </main>
</div>
```

**Supprimer tous les emojis** : 📊, 🔄, 🔥, 👥, 🔍, 🔴, 🟠, 🟢, etc.

#### VisitorPage.tsx, MapPage.tsx
**Ajouter** :
```tsx
import styles from './VisitorPage.module.css'; // ou MapPage.module.css
```

**Remplacer** :
```tsx
<div className={styles.visitorPage}>
  <header className={styles.header}>
    <div className={styles.logo}>
      <div className={styles.logoIcon}>
        <svg>...</svg>
      </div>
      <span className={styles.logoText}>Routes</span>
    </div>
    
    <div className={styles.headerActions}>
      <div className={styles.statusIndicator}>
        <span className={styles.statusDot}></span>
        <span>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
      </div>
      <button className={styles.btnBack}>Retour</button>
    </div>
  </header>
  
  <div className={styles.mapContainer}>
    <div className={styles.mapWrapper}>
      <MapContainer>...</MapContainer>
    </div>
  </div>
</div>
```

**Supprimer les emojis** : 🌐, 📡, etc.

#### SignalementCreatePage.tsx
**Ajouter** :
```tsx
import styles from './SignalementCreatePage.module.css';
```

**Structure** :
```tsx
<div className={styles.signalementCreatePage}>
  <div className={styles.container}>
    <div className={styles.header}>
      <button className={styles.btnBack}>← Retour</button>
      <h1 className={styles.pageTitle}>Nouveau signalement</h1>
    </div>
    
    <div className={styles.content}>
      <div className={styles.formPanel}>
        <h2 className={styles.formTitle}>Informations</h2>
        <form className={styles.form}>
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea></textarea>
          </div>
          <div className={styles.formActions}>
            <button className={styles.btnPrimary}>Créer</button>
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

#### SignalementDetailPage.tsx
**Ajouter** :
```tsx
import styles from './SignalementDetailPage.module.css';
```

**Structure similaire** avec `.signalementDetailPage`, `.container`, `.header`, etc.

#### UserManagementPage.tsx et autres pages de gestion
**Ajouter** :
```tsx
import styles from './UserManagementPage.module.css';
```

**Utiliser le même pattern** que AdminDashboard avec sidebar + mainContent.

#### AccountManagementPage.tsx
**Ajouter** :
```tsx
import styles from './AccountManagementPage.module.css';
```

**Structure** :
```tsx
<div className={styles.page}>
  <div className={styles.mainContent}>
    <header className={styles.contentHeader}>
      <h1 className={styles.pageTitle}>Gestion des comptes</h1>
    </header>
    
    <div className={styles.cardsGrid}>
      <a href="/accounts/create" className={styles.card}>
        <div className={styles.cardIcon}>
          <svg>...</svg>
        </div>
        <h3 className={styles.cardTitle}>Créer un compte</h3>
        <p className={styles.cardDescription}>...</p>
      </a>
    </div>
  </div>
</div>
```

## Icônes SVG à utiliser (remplacement des emojis)

### Routes/Grid
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M3 12h18M3 6h18M3 18h18" />
  <path d="M9 3v18M15 3v18" />
</svg>
```

### User
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</svg>
```

### Map/Location
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
  <circle cx="12" cy="10" r="3"/>
</svg>
```

### Eye (Voir/Visiteur)
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>
```

### Settings/Gear
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <circle cx="12" cy="12" r="3"/>
  <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1"/>
</svg>
```

### Log Out
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
  <polyline points="16 17 21 12 16 7"/>
  <line x1="21" y1="12" x2="9" y2="12"/>
</svg>
```

### Chart/Dashboard
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <line x1="18" y1="20" x2="18" y2="10"/>
  <line x1="12" y1="20" x2="12" y2="4"/>
  <line x1="6" y1="20" x2="6" y2="14"/>
</svg>
```

### Plus/Add
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <line x1="12" y1="5" x2="12" y2="19"/>
  <line x1="5" y1="12" x2="19" y2="12"/>
</svg>
```

## Checklist de vérification

- [ ] Importer global.css dans main.tsx
- [ ] Remplacer toutes les classes CSS par des modules
- [ ] Supprimer tous les emojis
- [ ] Remplacer par des icônes SVG
- [ ] Supprimer les textes superflus (MADIO, copyright, taglines)
- [ ] Tester sur desktop, tablet, mobile
- [ ] Vérifier l'accessibilité (focus states, contraste)
- [ ] Valider les animations et transitions
- [ ] Tester le mode online/offline

## Notes importantes

1. Les CSS Modules évitent les conflits de noms
2. Toujours importer : `import styles from './Page.module.css'`
3. Utiliser : `className={styles.nomDeClasse}`
4. Pour plusieurs classes : `className={`${styles.classe1} ${styles.classe2}`}`
5. Classes conditionnelles : `className={isActive ? styles.active : styles.inactive}`

## Support

Pour toute question sur l'implémentation, se référer à :
- [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) - Documentation complète du design system
- Les fichiers CSS modules existants pour des exemples
