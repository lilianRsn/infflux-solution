import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getSessionUser } from '@/lib/server-auth'
import Navbar from '@/components/layout/Navbar'
import WarehouseLayout from '@/components/warehouse/WarehouseLayout'
import { fetchBackend } from '@/lib/api'

interface Props {
  params: Promise<{ id: string }>
}

export default async function WarehouseViewPage({ params }: Props) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { id } = await params
  const readonly = user.role === 'admin'

  let warehouse = null
  let exteriorData = null
  try {
    [warehouse, exteriorData] = await Promise.all([
      fetchBackend<any>(`/api/client-warehouses/${id}/layout`),
      fetchBackend<any>(`/api/client-warehouses/${id}/exterior`)
    ])
  } catch (error) {
    console.error('Failed to fetch warehouse:', error)
    return notFound()
  }

  // Map backend fields to frontend camelCase
  const mappedWarehouse = {
    ...warehouse,
    floors: warehouse.floors.map((f: any) => ({
      ...f,
      aisles: (f.aisles || []).map((a: any) => ({
        ...a,
        slots: (a.slots || []).map((s: any) => ({
          ...s,
          totalVolume: Number(s.total_volume),
          usedVolume: Number(s.used_volume),
          updatedAt: s.updated_at
        }))
      }))
    })),
    exterior: exteriorData.exterior ? {
      ...exteriorData.exterior,
      siteWidth: exteriorData.exterior.site_width,
      siteHeight: exteriorData.exterior.site_height,
      buildingX: exteriorData.exterior.building_x,
      buildingY: exteriorData.exterior.building_y,
      buildingWidth: exteriorData.exterior.building_width,
      buildingHeight: exteriorData.exterior.building_height,
      accessDirection: exteriorData.exterior.access_direction,
      docks: (exteriorData.docks || []).map((d: any) => ({
        ...d,
        maxTonnage: d.max_tonnage,
        maxWidthMeters: d.max_width_meters,
        currentOrderId: d.current_order_id,
        positionX: d.position_x,
        positionY: d.position_y
      })),
      parkingZones: (exteriorData.parking_zones || []).map((p: any) => ({
        ...p,
        positionX: p.position_x,
        positionY: p.position_y
      }))
    } : null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href={user.role === 'client' ? '/client/warehouses' : `/admin/clients/${warehouse.client_id}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
          >
            <ChevronLeft size={15} />
            {user.role === 'client' ? 'Mes entrepôts' : 'Détails client'}
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">{warehouse.name}</h1>
          </div>
        </div>
        <WarehouseLayout warehouse={mappedWarehouse} readonly={readonly} />
      </main>
    </div>
  )
}
