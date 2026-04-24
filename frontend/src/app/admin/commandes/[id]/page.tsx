import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/api'
import Navbar from '@/components/layout/Navbar'
import OrderDetail from '@/components/orders/OrderDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/')

  let order: any
  let hubData: any = null

  try {
    order = await fetchBackend<any>(`/api/orders/${id}`)
  } catch {
    notFound()
  }

  // Fetch hub alternatives using destination_warehouse_id if available
  const targetWarehouseId = order.destination_warehouse_id
  if (targetWarehouseId) {
    try {
      hubData = await fetchBackend<any>(`/api/client-warehouses/${targetWarehouseId}/hub-alternatives`)
    } catch {
      // hub alternatives not critical — silently skip
    }
  } else if (order.customer_id) {
    // Fallback: find any warehouse with a hub for this customer
    try {
      const warehouses = await fetchBackend<any[]>(`/api/client-warehouses/${order.customer_id}`)
      const hubWarehouse = warehouses.find((w) => w.logistics_hub_id) ?? null
      if (hubWarehouse) {
        try {
          hubData = await fetchBackend<any>(`/api/client-warehouses/${hubWarehouse.id}/hub-alternatives`)
        } catch {
          // silently skip
        }
      }
    } catch {
      // non-blocking
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <OrderDetail order={order} user={user} backHref="/admin/clients" hubData={hubData} />
    </div>
  )
}
