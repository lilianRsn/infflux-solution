import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import Navbar from '@/components/layout/Navbar'
import WarehouseList from '@/components/warehouse/WarehouseList'
import { fetchBackend } from '@/lib/api'

export default async function WarehouseListPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'client') redirect('/')

  let warehouses = []
  try {
    warehouses = await fetchBackend<any[]>(`/api/client-warehouses/${user.id}`)
  } catch (error) {
    console.error('Failed to fetch warehouses:', error)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <WarehouseList initialWarehouses={warehouses} />
      </main>
    </div>
  )
}
