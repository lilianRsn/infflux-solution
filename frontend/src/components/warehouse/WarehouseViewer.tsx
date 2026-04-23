'use client'

import { useState, useEffect } from 'react'
import type { ClientWarehouse } from '@/lib/warehouse-data'
import { MOCK_WAREHOUSE } from '@/lib/warehouse-data'
import { getConfig, configToWarehouse } from '@/lib/warehouse-store'
import WarehouseLayout from './WarehouseLayout'

interface Props {
  readonly id: string
  readonly readonly: boolean
  readonly backendMeta: any
}

export default function WarehouseViewer({ id, readonly, backendMeta }: Props) {
  const [warehouse, setWarehouse] = useState<ClientWarehouse | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    // 1. If it's the demo warehouse
    if (id === MOCK_WAREHOUSE.id) {
      setWarehouse(MOCK_WAREHOUSE)
      return
    }

    // 2. Try loading detailed config from local storage (hybrid hackathon mode)
    const localCfg = getConfig(id)

    if (localCfg) {
      // Merge with backend meta if available
      const localWh = configToWarehouse(localCfg)
      if (backendMeta) {
        localWh.name = backendMeta.name || localWh.name
        localWh.address = backendMeta.address || localWh.address
      }
      setWarehouse(localWh)
      return
    }

    // 3. No local config found. If backend returned metadata, build a fallback minimal warehouse to avoid crash.
    if (backendMeta) {
      setWarehouse({
        id: backendMeta.id,
        clientId: backendMeta.client_id,
        name: backendMeta.name || 'Entrepôt sans nom',
        address: backendMeta.address || 'Aucune adresse',
        floors: [{
          id: `${backendMeta.id}-f0`,
          level: 0,
          label: 'Rez-de-chaussée',
          aisles: []
        }],
        exterior: MOCK_WAREHOUSE.exterior
      })
      return
    }

    // 4. Nothing found
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
