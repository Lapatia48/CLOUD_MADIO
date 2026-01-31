import { createRouter, createWebHistory } from '@ionic/vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../views/LoginPage.vue') },
  { path: '/register', component: () => import('../views/RegisterPage.vue') },
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
];

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/map')
  } else {
    next()
  }
})

export default router
