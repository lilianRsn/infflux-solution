'use client'

import { useState, useEffect } from 'react'
import type { ClientWarehouse, ClientWarehouseExterior, SlotStatus } from '@/lib/warehouse-data'
import { MOCK_WAREHOUSE } from '@/lib/warehouse-data'
import { getConfig, configToWarehouse } from '@/lib/warehouse-store'
import WarehouseLayout from './WarehouseLayout'

interface Props {
  readonly id: string
  readonly readonly: boolean
  readonly backendMeta: any
}

function backendToClientWarehouse(meta: any, exterior: ClientWarehouseExterior): ClientWarehouse {
  return {
    id: meta.id,
    clientId: meta.client_id,
    name: meta.name || 'Entrepôt sans nom',
    address: meta.address || 'Aucune adresse',
    floors: (meta.floors ?? []).map((floor: any, fi: number) => ({
      id: floor.id,
      level: Number(floor.level),
      label: floor.label,
      aisles: (floor.aisles ?? []).map((aisle: any, ai: number) => ({
        id: aisle.id,
        code: aisle.code,
        positionX: aisle.position_x ?? ai,
        positionY: aisle.position_y ?? 0,
        slots: (aisle.slots ?? []).map((slot: any) => ({
          id: slot.id,
          rank: Number(slot.rank),
          side: slot.side as 'L' | 'R',
          totalVolume: Number(slot.total_volume),
          usedVolume: Number(slot.used_volume),
          status: slot.status as SlotStatus,
          updatedAt: slot.updated_at ?? new Date().toISOString(),
        })),
      })),
    })),
    exterior,
  }
}

function hasRealSlots(meta: any): boolean {
  return meta?.floors?.some((f: any) =>
    f.aisles?.some((a: any) => a.slots?.length > 0)
  ) ?? false
}

export default function WarehouseViewer({ id, readonly, backendMeta }: Props) {
  const [warehouse, setWarehouse] = useState<ClientWarehouse | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // 1. Demo warehouse
    if (id === MOCK_WAREHOUSE.id) {
      setWarehouse(MOCK_WAREHOUSE)
      return
    }

    // 2. Backend has real slot IDs — use them so PATCH /api/storage-slots/:id works
    if (hasRealSlots(backendMeta)) {
      const localCfg = getConfig(id)
      const exterior = localCfg
        ? configToWarehouse(localCfg).exterior
        : MOCK_WAREHOUSE.exterior
      setWarehouse(backendToClientWarehouse(backendMeta, exterior))
      return
    }

    // 3. No backend slots yet — fall back to local config (generated IDs, read-only PATCH won't work)
    const localCfg = getConfig(id)
    if (localCfg) {
      const localWh = configToWarehouse(localCfg)
      if (backendMeta) {
        localWh.name = backendMeta.name || localWh.name
        localWh.address = backendMeta.address || localWh.address
      }
      setWarehouse(localWh)
      return
    }

    // 4. Backend metadata only, no layout — minimal fallback
    if (backendMeta) {
      setWarehouse({
        id: backendMeta.id,
        clientId: backendMeta.client_id,
        name: backendMeta.name || 'Entrepôt sans nom',
        address: backendMeta.address || 'Aucune adresse',
        floors: [{ id: `${backendMeta.id}-f0`, level: 0, label: 'Rez-de-chaussée', aisles: [] }],
        exterior: MOCK_WAREHOUSE.exterior,
      })
      return
    }

    // 5. Nothing found
    setNotFound(true)
  }, [id, backendMeta])

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-slate-900 font-medium text-sm mb-1">Entrepôt introuvable</p>
        <p className="text-slate-400 text-sm">L&apos;identifiant ne correspond à aucun entrepôt configuré.</p>
      </div>
    )
  }

  if (!warehouse) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <WarehouseLayout warehouse={warehouse} readonly={readonly} />
  )
}
