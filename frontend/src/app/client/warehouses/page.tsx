import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import Navbar from '@/components/layout/Navbar'
import WarehouseList from '@/components/warehouse/WarehouseList'
import { fetchBackend } from '@/lib/api'

export default async function WarehouseListPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'client') redirect('/')

  let warehouses: any[] = []
  let metricsById: Record<string, any> = {}

  try {
    warehouses = await fetchBackend<any[]>(`/api/client-warehouses/${user.id}`)

    const results = await Promise.allSettled(
      warehouses.map((wh) =>
        fetchBackend<any>(`/api/client-warehouses/${wh.id}/occupancy-metrics`)
      )
    )

    warehouses.forEach((wh, i) => {
      const r = results[i]
      if (r.status === 'fulfilled') metricsById[wh.id] = r.value
    })
  } catch (error) {
    console.error('Failed to fetch warehouses:', error)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <WarehouseList initialWarehouses={warehouses} metricsById={metricsById} />
      </main>
    </div>
  )
}
