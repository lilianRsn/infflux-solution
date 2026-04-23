import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getSessionUser } from '@/lib/server-auth'
import Navbar from '@/components/layout/Navbar'
import WarehouseViewer from '@/components/warehouse/WarehouseViewer'
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
    // We only fetch basic metadata, since the detailed layout is local for hackathon
    warehouseMeta = await fetchBackend<any>(`/api/client-warehouses/${id}/layout`)
  } catch (error) {
    console.error('Failed to fetch warehouse metadata:', error)
    // If it's a demo warehouse like 'wh-001' not in backend, we ignore backend error
    if (!id.startsWith('wh-')) {
      return notFound()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href={user.role === 'client' ? '/client/warehouses' : `/admin/clients/${warehouseMeta?.client_id || ''}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
          >
            <ChevronLeft size={15} />
            {user.role === 'client' ? 'Mes entrepôts' : 'Détails client'}
          </Link>
        </div>
        <WarehouseViewer id={id} readonly={readonly} backendMeta={warehouseMeta} />
      </main>
    </div>
  )
}
