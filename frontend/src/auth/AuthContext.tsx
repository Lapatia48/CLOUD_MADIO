import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { http } from '../api/http'
import type { AuthResponse, RegisterRequest, User } from '../types/auth'

type AuthContextValue = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  register: (request: RegisterRequest) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function loadFromStorage(): { token: string | null; user: User | null } {
  const token = localStorage.getItem('auth_token')
  const rawUser = localStorage.getItem('auth_user')

  if (!token || !rawUser) return { token: null, user: null }

  try {
    const user = JSON.parse(rawUser) as User
    return { token, user }
  } catch {
    return { token: null, user: null }
  }
}

function persistAuth(token: string, user: User) {
  localStorage.setItem('auth_token', token)
  localStorage.setItem('auth_user', JSON.stringify(user))
}

function clearAuth() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ token, user }, setAuth] = useState(() => loadFromStorage())

  useEffect(() => {
    const current = loadFromStorage()
    setAuth(current)
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      token,
      isAuthenticated: Boolean(token && user),
      async login(email: string, password: string) {
        const res = await http.post<AuthResponse>('/api/auth/login', { email, password })
        persistAuth(res.data.token, res.data.user)
        setAuth({ token: res.data.token, user: res.data.user })
        return res.data.user
      },
      async register(request: RegisterRequest) {
        const res = await http.post<AuthResponse>('/api/auth/register', request)
        persistAuth(res.data.token, res.data.user)
        setAuth({ token: res.data.token, user: res.data.user })
        return res.data.user
      },
      async logout() {
        try {
          await http.post('/api/auth/logout')
        } finally {
          clearAuth()
          setAuth({ token: null, user: null })
        }
      },
    }
  }, [token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
