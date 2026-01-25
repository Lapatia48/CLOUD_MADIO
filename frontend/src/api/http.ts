import axios, { type InternalAxiosRequestConfig } from 'axios'

const defaultBaseUrl = 'http://localhost:8080'

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? defaultBaseUrl

export const http = axios.create({
  baseURL: API_BASE_URL,
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    ;(config.headers ??= {} as any).Authorization = `Bearer ${token}`
  }
  return config
})

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data: any = err.response?.data
    if (!data) return err.message

    if (typeof data === 'string') return data
    if (typeof data.message === 'string' && data.message.trim()) return data.message
    if (typeof data.error === 'string' && data.error.trim()) return data.error

    return err.message
  }

  if (err instanceof Error) return err.message

  return 'Unexpected error'
}
