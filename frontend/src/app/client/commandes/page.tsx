import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/api'
import Navbar from '@/components/layout/Navbar'
import { ShoppingCart, Package, MapPin, Plus, ChevronRight } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'En attente',  cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  assigned:   { label: 'Assignée',    cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  in_transit: { label: 'En transit',  cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  delivered:  { label: 'Livrée',      cls: 'bg-green-50 text-green-800 border-green-200' },
  cancelled:  { label: 'Annulée',     cls: 'bg-red-50 text-red-800 border-red-200' },
}

const URGENCY_CONFIG: Record<string, { label: string; cls: string }> = {
  urgent:   { label: 'Urgent',   cls: 'bg-red-50 text-red-800 border-red-200' },
  standard: { label: 'Standard', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  flexible: { label: 'Flexible', cls: 'bg-green-50 text-green-800 border-green-200' },
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cls}`}>
      {label}
    </span>
  )
}

export default async function ClientCommandesPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'client') redirect('/')

  let orders: any[] = []

  try {
    orders = await fetchBackend<any[]>('/api/orders/me')
  } catch {
    orders = []
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1">Client</p>
            <h1 className="text-2xl font-semibold text-slate-900">Mes commandes</h1>
            <p className="mt-1 text-sm text-slate-500">
              {orders.length} commande{orders.length > 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/client/commande"
            className="h-9 px-4 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            Nouvelle commande
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {orders.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">N° commande</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Statut</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Palettes</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Livraison prévue</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Destination</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Urgence</th>
                  <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Options</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, cls: 'bg-slate-100 text-slate-700 border-slate-200' }
                  const urgencyCfg = URGENCY_CONFIG[order.urgency_level] ?? { label: order.urgency_level ?? '—', cls: 'bg-slate-100 text-slate-700 border-slate-200' }
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-700">{order.order_number ?? order.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge label={statusCfg.label} cls={statusCfg.cls} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Package size={12} className="text-slate-400" />
                          <span className="text-sm text-slate-900 font-medium">{order.total_pallets ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {order.promised_delivery_date
                          ? new Date(order.promised_delivery_date).toLocaleDateString('fr-FR')
                          : order.requested_delivery_date
                            ? new Date(order.requested_delivery_date).toLocaleDateString('fr-FR')
                            : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {order.site_name ? (
                          <div>
                            <p className="text-xs font-medium text-slate-700">{order.site_name}</p>
                            {order.delivery_address && (
                              <p className="text-[11px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                                <MapPin size={10} />
                                {order.delivery_address}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {order.urgency_level ? <Badge label={urgencyCfg.label} cls={urgencyCfg.cls} /> : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {order.eligible_for_early_delivery && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">Anticipée</span>
                          )}
                          {order.eligible_for_grouped_delivery && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Groupée</span>
                          )}
                          {order.eligible_for_partner_carrier && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-800 border border-green-200">Partenaire</span>
                          )}
                          {!order.eligible_for_early_delivery && !order.eligible_for_grouped_delivery && !order.eligible_for_partner_carrier && (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/client/commandes/${order.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                          Voir
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center">
              <ShoppingCart size={28} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">Aucune commande pour le moment</p>
              <p className="text-xs text-slate-400 mt-1">Créez votre première commande pour commencer.</p>
              <Link
                href="/client/commande"
                className="mt-5 inline-flex items-center gap-2 h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={15} />
                Passer une commande
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
