import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import { MOCK_WAREHOUSE } from '@/lib/warehouse-data'
import Navbar from '@/components/layout/Navbar'
import WarehouseLayout from '@/components/warehouse/WarehouseLayout'

export default async function WarehousePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const readonly = user.role === 'admin'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="max-w-6xl mx-auto p-8">
        <WarehouseLayout warehouse={MOCK_WAREHOUSE} readonly={readonly} />
      </main>
    </div>
  )
}
