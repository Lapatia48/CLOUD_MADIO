import { createRouter, createWebHistory } from '@ionic/vue-router';

const routes = [
  { 
    path: '/', 
    redirect: '/map' 
  },
  { 
    path: '/home', 
    redirect: '/map' 
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
    path: '/admin/blocked-users',
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
    redirect: '/map'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token
  
  // Get user role from localStorage
  let userRole = 'USER'
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      userRole = user.role || localStorage.getItem('userRole') || 'USER'
    } catch (e) {
      userRole = localStorage.getItem('userRole') || 'USER'
    }
  } else {
    userRole = localStorage.getItem('userRole') || 'USER'
  }
  
  console.log('Router guard:', { path: to.path, isAuthenticated, requiresAuth: to.meta.requiresAuth, requiresAdmin: to.meta.requiresAdmin, userRole })
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('Not authenticated, redirecting to /login')
    next('/login')
  } else if (to.meta.requiresAdmin && userRole !== 'ADMIN' && userRole !== 'MANAGER') {
    console.log('Not admin, redirecting to /map')
    next('/map')
  } else {
    console.log('Proceeding to', to.path)
    next()
  }
})

export default router
