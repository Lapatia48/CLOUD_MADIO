import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { http } from '../api/http'

interface User { id: number; email: string; nom: string; prenom: string; role: string }

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isAuthenticated = computed(() => !!token.value)

  if (token.value) {
    http.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    const storedEmail = localStorage.getItem('userEmail')
    const storedRole = localStorage.getItem('userRole')
    if (storedEmail) {
      user.value = { id: 0, email: storedEmail, nom: '', prenom: '', role: storedRole || 'USER' }
    }
  }

  async function login(email: string, password: string): Promise<User> {
    const res = await http.post('/api/auth/login', { email, password })
    console.log('Login response:', res.data)
    token.value = res.data.token
    const userData = {
      id: res.data.userId || res.data.id || 0,
      email: res.data.email,
      nom: res.data.nom || '',
      prenom: res.data.prenom || '',
      role: res.data.role
    }
    user.value = userData
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userEmail', res.data.email)
    localStorage.setItem('userRole', res.data.role)
    localStorage.setItem('user', JSON.stringify(userData))
    http.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    return user.value
  }

  async function register(email: string, password: string, nom: string, prenom: string): Promise<User> {
    const res = await http.post('/api/auth/register', { email, password, nom, prenom })
    console.log('Register response:', res.data)
    token.value = res.data.token
    user.value = { id: 0, email: res.data.email, nom, prenom, role: res.data.role }
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userEmail', res.data.email)
    localStorage.setItem('userRole', res.data.role)
    http.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    return user.value
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userRole')
    localStorage.removeItem('user')
    delete http.defaults.headers.common['Authorization']
  }

  return { user, token, isAuthenticated, login, register, logout }
})
