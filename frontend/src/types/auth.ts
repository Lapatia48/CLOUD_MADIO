export type Role = 'USER' | 'MANAGER' | string

export type User = {
  id: number
  email: string
  nom?: string | null
  prenom?: string | null
  role: Role
  isBlocked: boolean
  createdAt?: string
}

export type AuthResponse = {
  token: string
  type?: string
  user: User
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  email: string
  password: string
  nom?: string
  prenom?: string
}
