import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/api'
import Navbar from '@/components/layout/Navbar'
import ClientOrderForm from '@/components/orders/ClientOrderForm'

export default async function ClientCommande() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  let warehouses: any[] = []
  try {
    warehouses = await fetchBackend<any[]>(`/api/client-warehouses/${user.id}`)
  } catch {
    // non-blocking
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-500">
            Client
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Passer une commande
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Renseignez la destination, les palettes et les préférences de livraison.
          </p>
        </div>

        <ClientOrderForm warehouses={warehouses} />
      </div>
    </div>
  )
}
