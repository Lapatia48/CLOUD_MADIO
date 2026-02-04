/**
 * HTTP Client - Non utilisé (l'app fonctionne uniquement avec Firebase)
 * Ce fichier est conservé pour compatibilité mais n'est plus utilisé.
 */

import axios from 'axios'

// Instance vide - l'app mobile n'utilise plus le backend
export const http = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' }
})

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.message
  }
  return 'Erreur inconnue'
}
