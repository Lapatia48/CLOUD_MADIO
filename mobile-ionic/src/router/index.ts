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
    path: '/register', 
    component: () => import('../views/RegisterPage.vue') 
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
  { 
    path: '/blocked-users', 
    component: () => import('../views/BlockedUsersPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  // Rediriger les anciennes routes vers /map
  {
    path: '/tabs/:pathMatch(.*)*',
    redirect: '/map'
  },
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
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token
  
  console.log('Router guard:', { path: to.path, isAuthenticated, requiresAuth: to.meta.requiresAuth })
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('Not authenticated, redirecting to /login')
    next('/login')
  } else {
    console.log('Proceeding to', to.path)
    next()
  }
})

export default router
