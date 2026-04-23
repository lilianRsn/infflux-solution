import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getSessionUser } from '@/lib/server-auth'
import Navbar from '@/components/layout/Navbar'
import WarehouseBuilder from '@/components/warehouse/builder/WarehouseBuilder'

export default async function NewWarehousePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'client') redirect('/')

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href="/client/warehouses"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
          >
            <ChevronLeft size={15} />
            Mes entrepôts
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">Configurer un entrepôt</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Définissez la structure de votre espace de stockage pour permettre le suivi de capacité.
          </p>
        </div>
        <WarehouseBuilder />
      </main>
    </div>
  )
}
