'use client'

import { useState, useEffect } from 'react'
import type { ClientWarehouse } from '@/lib/warehouse-data'
import { MOCK_WAREHOUSE } from '@/lib/warehouse-data'
import { getConfig, configToWarehouse } from '@/lib/warehouse-store'
import WarehouseLayout from './WarehouseLayout'

interface Props {
  readonly id: string
  readonly readonly: boolean
}

export default function WarehouseViewer({ id, readonly }: Props) {
  const [warehouse, setWarehouse] = useState<ClientWarehouse | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (id === MOCK_WAREHOUSE.id) {
      setWarehouse(MOCK_WAREHOUSE)
      return
    }
    const cfg = getConfig(id)
    if (!cfg) {
      setNotFound(true)
      return
    }
    setWarehouse(configToWarehouse(cfg))
  }, [id])

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

  return <WarehouseLayout warehouse={warehouse} readonly={readonly} />
}
