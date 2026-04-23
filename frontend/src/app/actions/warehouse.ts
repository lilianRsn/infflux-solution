'use server'

import { cookies } from 'next/headers'
import { getBackendUrl } from '@/lib/backend-url'
import type { WarehouseConfig } from '@/lib/warehouse-store'

const BACKEND_URL = getBackendUrl()

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
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to update slot')
  }

  return res.json()
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

export async function syncWarehouseLayout(warehouseId: string, cfg: WarehouseConfig) {
  const headers = await getAuthHeaders()

  for (const [fi, floor] of cfg.floors.entries()) {
    const floorRes = await fetch(`${BACKEND_URL}/api/client-warehouses/${warehouseId}/floors`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ level: fi, label: floor.label }),
    })
    if (!floorRes.ok) throw new Error('Failed to create floor')
    const { id: floorId } = await floorRes.json()

    for (const [ai, aisle] of floor.aisles.entries()) {
      const aisleRes = await fetch(`${BACKEND_URL}/api/client-warehouses/floors/${floorId}/aisles`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: aisle.code, position_x: ai, position_y: 0 }),
      })
      if (!aisleRes.ok) throw new Error('Failed to create aisle')
      const { id: aisleId } = await aisleRes.json()

      for (let rank = 1; rank <= aisle.ranks; rank++) {
        for (const side of ['L', 'R'] as const) {
          const slotRes = await fetch(`${BACKEND_URL}/api/storage-slots`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              aisle_id: aisleId,
              rank: String(rank),
              side,
              total_volume: cfg.slotVolume,
              status: 'FREE',
            }),
          })
          if (!slotRes.ok) throw new Error('Failed to create slot')
        }
      }
    }
  }
}
