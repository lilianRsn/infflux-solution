import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/server-auth'
import Navbar from '@/components/layout/Navbar'

export default async function ClientCommande() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="text-center">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mb-2">Client</p>
          <h1 className="text-2xl font-semibold text-slate-900">Passer une commande</h1>
          <p className="mt-2 text-slate-500 text-sm">Interface client à compléter</p>
        </div>
      </div>
    </div>
  )
}
