import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/api'
import ClientsContent from './ClientsContent'

export default async function AdminClientsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/')

  let clients = []
  try {
    clients = await fetchBackend<any[]>('/api/users/clients')
  } catch (error) {
    console.error('Failed to fetch clients:', error)
    // Fallback or show error
  }

  return <ClientsContent initialClients={clients} adminUser={user} />
}
