import { getToken, saveToken } from '@/lib/auth'
import type { Order } from '@/types/order'
import type { LoginCredentials, AuthSession } from '@/types/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function fetchWithAuth<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    // Essayer de lire le corps de la réponse pour obtenir plus de détails sur l'erreur
    const errorBody = await res.json().catch(() => ({}))
    const errorMessage = errorBody.message || `API Error ${res.status}`
    throw new Error(errorMessage)
  }

  // Gérer le cas où la réponse est vide (ex: 204 No Content)
  if (res.status === 204) {
    return null as T
  }

  return await res.json() as T
}

export function getOrders(): Promise<Order[]> {
  return fetchWithAuth<Order[]>('/api/orders')
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await fetchWithAuth<AuthSession>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  if (response.token) {
    saveToken(response.token)
  }
  return response
}
