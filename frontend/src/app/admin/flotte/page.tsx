import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/api'
import type { DeliveryPlan, Truck, AdminPlanningOrder } from '@/types/fleet'
import DeliveryPlanningContent from '@/components/fleet/DeliveryPlanningContent'

export default async function AdminFlottePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/')

  let initialTrucks: Truck[] = []
  let initialPlans: DeliveryPlan[] = []
  let initialOrders: AdminPlanningOrder[] = []

  try {
    ;[initialTrucks, initialPlans, initialOrders] = await Promise.all([
      fetchBackend<Truck[]>('/api/trucks'),
      fetchBackend<DeliveryPlan[]>('/api/delivery-plans'),
      fetchBackend<AdminPlanningOrder[]>('/api/orders'),
    ])
  } catch (error) {
    console.error('Failed to load delivery planning data:', error)
  }

  return (
    <DeliveryPlanningContent
      adminUser={user}
      initialTrucks={initialTrucks}
      initialPlans={initialPlans}
      initialOrders={initialOrders}
    />
  )
}
