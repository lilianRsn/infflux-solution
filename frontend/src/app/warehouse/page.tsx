import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import Navbar from '@/components/layout/Navbar'

export default async function WarehousePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  // Redirect clients to their list of warehouses
  if (user.role === 'client') {
    redirect('/client/warehouses')
  }

  // For admins, try to find global availability or redirect to clients
  if (user.role === 'admin') {
    redirect('/admin/clients')
  }

  // Fallback
  redirect('/')
}
