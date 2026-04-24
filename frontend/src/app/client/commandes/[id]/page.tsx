import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/api'
import Navbar from '@/components/layout/Navbar'
import OrderDetail from '@/components/orders/OrderDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientOrderDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'client') redirect('/')

  let order: any

  try {
    order = await fetchBackend<any>(`/api/orders/${id}`)
  } catch {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <OrderDetail order={order} user={user} backHref="/client/commandes" />
    </div>
  )
}
