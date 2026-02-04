import { createRouter, createWebHistory } from '@ionic/vue-router';

const routes = [
  { 
    path: '/', 
    redirect: '/home' 
  },
  { 
    path: '/home', 
    component: () => import('../views/HomePage.vue') 
  },
  { 
    path: '/login', 
    component: () => import('../views/LoginPage.vue') 
  },
  { 
    path: '/map', 
    component: () => import('../views/MapPage.vue'),
    meta: { requiresAuth: true }
  },
  { 
    path: '/signalement/new', 
    component: () => import('../views/CreateSignalementPage.vue'),
    meta: { requiresAuth: true }
  },
  { 
    path: '/signalement/:id', 
    component: () => import('../views/SignalementDetailPage.vue'),
    meta: { requiresAuth: true }
  },
  // Rediriger toutes les autres routes vers /home
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('firebase_token') || localStorage.getItem('token')
  const isAuthenticated = !!token
  const isOnline = navigator.onLine
  
  console.log('Router guard:', { path: to.path, isAuthenticated, isOnline, requiresAuth: to.meta.requiresAuth })
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('Not authenticated, redirecting to /login')
    next('/login')
  } else if (to.path === '/login' && !isOnline) {
    // Si pas en ligne et essaie d'aller au login, montrer un message
    console.log('Offline, cannot login')
    next()
  } else {
    console.log('Proceeding to', to.path)
    next()
  }
})

export default router
