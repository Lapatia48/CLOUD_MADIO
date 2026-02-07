# Design System - Frontend CLOUD_MADIO

## Vue d'ensemble

Refonte complète du CSS avec un design épuré et élégant, respectant les contraintes suivantes :
- ❌ Aucun emoji dans les pages
- ❌ Aucun texte superflu (MADIO, copyright, etc.)
- ✅ Application épurée et élégante
- ✅ Sidebar à gauche pour les dashboards
- ✅ Thème skyblue (#4A90E2) et fond beige (#F5F1E8)
- ✅ CSS scopé par page (CSS Modules)

## Palette de couleurs

```css
--primary: #4A90E2          /* Skyblue principal */
--primary-light: #6AA8F4    /* Skyblue clair */
--primary-dark: #357ABD     /* Skyblue foncé */
--bg-primary: #F5F1E8       /* Fond beige */
--bg-secondary: #FFFFFF     /* Fond blanc */
--text-primary: #2C3E50     /* Texte principal */
--text-secondary: #7F8C8D   /* Texte secondaire */
--success: #27AE60          /* Vert succès */
--warning: #F39C12          /* Orange attention */
--error: #E74C3C            /* Rouge erreur */
```

## Hiérarchie typographique

- **Titres de page** : 2rem (32px), font-weight 600
- **Titres de section** : 1.25-1.75rem, font-weight 600
- **Corps de texte** : 0.9-1rem, font-weight 400-500
- **Labels** : 0.85-0.9rem, font-weight 500-600
- **Letter-spacing** : -0.02em à -0.03em pour les gros titres

## Espacements et bordures

- **Border-radius** : 16px (principal), 10-12px (éléments)
- **Shadows** :
  - sm: `0 2px 8px rgba(0, 0, 0, 0.03)`
  - md: `0 4px 16px rgba(0, 0, 0, 0.05)`
  - lg: `0 8px 32px rgba(0, 0, 0, 0.08)`
- **Gap** : 1rem (16px) à 1.5rem (24px)
- **Padding** : 1.5-2rem pour les cards

## Architecture des pages

### Pages d'authentification (sans sidebar)
- [LandingPage.module.css](frontend/src/pages/LandingPage.module.css)
- [LoginPage.module.css](frontend/src/pages/LoginPage.module.css)
- [ManagerLoginPage.module.css](frontend/src/pages/ManagerLoginPage.module.css)
- [RegisterPage.module.css](frontend/src/pages/RegisterPage.module.css)

Design : centré, fond dégradé beige, cards flottantes

### Pages avec sidebar (dashboards)
- [AdminDashboard.module.css](frontend/src/pages/AdminDashboard.module.css)
- [UserDashboard.module.css](frontend/src/pages/UserDashboard.module.css)
- [MainDashboard.module.css](frontend/src/pages/MainDashboard.module.css)
- [UserManagementPage.module.css](frontend/src/pages/UserManagementPage.module.css)
- [ManageAccountsPage.module.css](frontend/src/pages/ManageAccountsPage.module.css)
- [BlockedUsersPage.module.css](frontend/src/pages/BlockedUsersPage.module.css)
- [ConfigurationPage.module.css](frontend/src/pages/ConfigurationPage.module.css)
- [AccountManagementPage.module.css](frontend/src/pages/AccountManagementPage.module.css)

Structure :
- Sidebar fixe à gauche (260px)
- Navigation élégante avec icônes
- Footer sidebar avec user info et logout
- Main content avec header + contenu

### Pages de signalement
- [SignalementCreatePage.module.css](frontend/src/pages/SignalementCreatePage.module.css)
- [SignalementDetailPage.module.css](frontend/src/pages/SignalementDetailPage.module.css)

Layout : Grid 2 colonnes (formulaire | carte)

### Pages carte/visiteur
- [VisitorPage.module.css](frontend/src/pages/VisitorPage.module.css)
- [MapPage.module.css](frontend/src/pages/MapPage.module.css)

Design : Header minimal + carte pleine page

### Pages home
- [PublicHome.module.css](frontend/src/pages/PublicHome.module.css)
- [UserHome.module.css](frontend/src/pages/UserHome.module.css)
- [AdminHome.module.css](frontend/src/pages/AdminHome.module.css)

## Composants réutilisables

### Buttons
```css
.btnPrimary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.btnSecondary {
  background: transparent;
  border: 1.5px solid var(--primary);
  color: var(--primary);
}
```

### Cards
```css
.card {
  background: var(--bg-secondary);
  border-radius: var(--radius);
  padding: 1.75-2rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### Status Badges
```css
.badge {
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badgeNew { background: rgba(231, 76, 60, 0.1); color: #E74C3C; }
.badgeInProgress { background: rgba(243, 156, 18, 0.1); color: #F39C12; }
.badgeCompleted { background: rgba(39, 174, 96, 0.1); color: #27AE60; }
```

### Form Controls
```css
input, select, textarea {
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--border);
  border-radius: 10-12px;
  transition: all 0.2s ease;
}

input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}
```

## Animations

### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Slide Down
```css
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Float (background shapes)
```css
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}
```

## Responsive Design

### Breakpoints
- Desktop : > 1024px
- Tablet : 768px - 1024px
- Mobile : < 768px

### Mobile adaptations
- Sidebar cachée (transform: translateX(-100%))
- Grid columns : 1fr
- Padding réduit (1-1.5rem)
- Font-sizes réduits
- Actions en colonne

## Principes de design

1. **Minimalisme** : Pas de décorations inutiles
2. **Hiérarchie claire** : Utilisation de tailles et poids de police variés
3. **Espacement généreux** : Respiration entre les éléments
4. **Consistance** : Même système dans toutes les pages
5. **Accessibilité** : Contrastes suffisants, focus states
6. **Performance** : Transitions fluides (0.2-0.3s)
7. **Responsive** : Mobile-first thinking

## Notes techniques

- Toutes les variables CSS sont définies au niveau de la classe principale de chaque page
- Utilisation de CSS Modules pour éviter les conflits
- Support des préfixes navigateur via postcss
- Transitions avec cubic-bezier pour plus de fluidité
- Box-shadow multicouche pour profondeur subtile

## Prochaines étapes possibles

1. Implémenter les CSS dans les fichiers TSX (ajouter `import styles from './Page.module.css'`)
2. Remplacer les emojis par des icônes SVG dans le JSX
3. Supprimer les textes superflus dans le contenu
4. Ajouter des micro-interactions supplémentaires
5. Optimiser les performances avec lazy loading des styles
