'use server'

import { cookies } from 'next/headers'
import type { ClientCreateOrderPayload } from '@/types/order'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

async function getAuthHeaders() {
  const cookieStore = await cookies()
  const token = cookieStore.get('infflux_token')?.value
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export async function createOrder(data: ClientCreateOrderPayload) {
  const headers = await getAuthHeaders()

  const res = await fetch(`${BACKEND_URL}/api/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Erreur lors de la création de la commande')
  }

  return res.json()
}
