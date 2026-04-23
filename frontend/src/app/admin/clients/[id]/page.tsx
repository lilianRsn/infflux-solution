import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/api'
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
  let warehouses = []

  try {
    // We don't have a direct get client by ID, so we fetch all and find
    const clients = await fetchBackend<any[]>('/api/users/clients')
    client = clients.find(c => String(c.id) === id)
    
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
          <h1 className="text-xl font-bold">Client introuvable</h1>
          <p className="mt-2 text-slate-500">L'identifiant {id} ne correspond à aucun client.</p>
        </div>
      </div>
    )
  }

  return <ClientDetailContent client={client} warehouses={warehouses} adminUser={user} />
}
