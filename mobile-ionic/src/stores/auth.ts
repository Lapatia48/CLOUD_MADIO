import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { http } from '../api/http'

interface User {
  id: number
  email: string
  nom: string
  prenom: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)

  // Initialiser le header si token existe
  if (token.value) {
    http.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  async function login(email: string, password: string) {
    const res = await http.post('/api/auth/login', { email, password })
    token.value = res.data.token
    user.value = { id: 0, email: res.data.email, nom: '', prenom: '', role: res.data.role }
    localStorage.setItem('token', res.data.token)
    http.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    return user.value
  }

  async function register(email: string, password: string, nom: string, prenom: string) {
    const res = await http.post('/api/auth/register', { email, password, nom, prenom })
    token.value = res.data.token
    user.value = { id: 0, email: res.data.email, nom, prenom, role: res.data.role }
    localStorage.setItem('token', res.data.token)
    http.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    return user.value
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    delete http.defaults.headers.common['Authorization']
  }

  return { user, token, isAuthenticated, login, register, logout }
})
