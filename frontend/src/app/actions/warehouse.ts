'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

async function getAuthHeaders() {
  const cookieStore = await cookies()
  const token = cookieStore.get('infflux_token')?.value
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export async function updateStorageSlot(slotId: string, data: { used_volume: number, status: string }) {
  const headers = await getAuthHeaders()
  
  const res = await fetch(`${BACKEND_URL}/api/storage-slots/${slotId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    throw new Error('Failed to update slot')
  }

  const updatedSlot = await res.json()
  
  // We can revalidate paths if we want to refresh server data
  // revalidatePath('/client/warehouses')
  
  return updatedSlot
}

export async function createWarehouse(data: any) {
  const headers = await getAuthHeaders()
  
  const res = await fetch(`${BACKEND_URL}/api/client-warehouses`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to create warehouse')
  }

  return res.json()
}
