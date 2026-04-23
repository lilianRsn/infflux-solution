import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/server-api'
import ClientDetailContent from './ClientDetailContent'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/')

  let client = null
  let warehouses: any[] = []
  let orders: any[] = []

  try {
    const [clients, allOrders] = await Promise.all([
      fetchBackend<any[]>('/api/users/clients'),
      fetchBackend<any[]>('/api/orders'),
    ])
    client = clients.find((c) => String(c.id) === id)
    orders = allOrders.filter((o) => String(o.customer_id) === id)

    if (client) {
      warehouses = await fetchBackend<any[]>(`/api/client-warehouses/${id}`)
    }
  } catch (error) {
    console.error('Failed to fetch client details:', error)
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">Client introuvable</h1>
          <p className="mt-2 text-slate-500 text-sm">L'identifiant {id} ne correspond à aucun client.</p>
        </div>
      </div>
    )
  }

  return <ClientDetailContent client={client} warehouses={warehouses} orders={orders} adminUser={user} />
}
