import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getSessionUser } from '@/lib/server-auth'
import Navbar from '@/components/layout/Navbar'
import WarehouseViewer from '@/components/warehouse/WarehouseViewer'
import WarehouseOrders from '@/components/warehouse/WarehouseOrders'
import { fetchBackend } from '@/lib/api'

interface Props {
  params: Promise<{ id: string }>
}

export default async function WarehouseViewPage({ params }: Props) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { id } = await params
  const readonly = user.role === 'admin'

  let warehouseMeta = null
  try {
    warehouseMeta = await fetchBackend<any>(`/api/client-warehouses/${id}/layout`)
  } catch (error) {
    console.error('Failed to fetch warehouse metadata:', error)
    if (!id.startsWith('wh-')) {
      return notFound()
    }
  }

  const backHref =
    user.role === 'client'
      ? '/client/warehouses'
      : `/admin/clients/${warehouseMeta?.client_id || ''}`

  const backLabel = user.role === 'client' ? 'Mes entrepôts' : 'Détails client'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
          >
            <ChevronLeft size={15} />
            {backLabel}
          </Link>
          <WarehouseViewer id={id} readonly={readonly} backendMeta={warehouseMeta} />
        </div>

        {/* Commandes entrantes pour cet entrepôt */}
        <div>
          <WarehouseOrders
            warehouseId={id}
            userRole={user.role as 'admin' | 'client' | 'partner'}
          />
        </div>
      </main>
    </div>
  )
}
