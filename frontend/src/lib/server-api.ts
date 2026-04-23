import { cookies } from 'next/headers'
import { getBackendUrl } from '@/lib/backend-url'

const BACKEND_URL = getBackendUrl()

export async function fetchBackend<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('infflux_token')?.value

  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store',
  })

  if (!response.ok) {
    let errorMessage = `Error: ${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch {}
    throw new Error(errorMessage)
  }

  return response.json() as Promise<T>
}
