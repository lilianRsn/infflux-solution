import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/server-api'
import ClientsContent from './ClientsContent'

export default async function AdminClientsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/')

  let clients: any[] = []
  let orders: any[] = []

  try {
    ;[clients, orders] = await Promise.all([
      fetchBackend<any[]>('/api/users/clients'),
      fetchBackend<any[]>('/api/orders'),
    ])
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }

  const orderCountByClient = orders.reduce<Record<string, number>>((acc, o) => {
    if (o.customer_id) acc[o.customer_id] = (acc[o.customer_id] ?? 0) + 1
    return acc
  }, {})

  const enrichedClients = clients.map((c) => ({
    ...c,
    order_count: orderCountByClient[c.id] ?? 0,
  }))

  return <ClientsContent initialClients={enrichedClients} adminUser={user} />
}
