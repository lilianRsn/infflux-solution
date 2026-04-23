'use client'

import Link from 'next/link'
import {
  Building2,
  ArrowLeft,
  MapPin,
  Mail,
  Calendar,
  Layers,
  ChevronRight,
  ShoppingCart,
  Package,
  Truck,
  Users,
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import type { User } from '@/types/auth'

interface ClientUser {
  id: string
  company_name: string
  main_contact_name: string
  main_contact_email: string
  created_at: string
}

interface Props {
  client: ClientUser
  warehouses: any[]
  orders: any[]
  adminUser: User
}

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

function Badge({ cfg }: { cfg: { label: string; cls: string } }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export default function ClientDetailContent({ client, warehouses, orders, adminUser }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={adminUser} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Retour aux clients
        </Link>

        {/* Header card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                {(client.company_name || '??').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{client.company_name || 'N/A'}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Mail size={11} className="text-slate-400" />
                    {client.main_contact_name} · {client.main_contact_email}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={11} />
                    Inscrit le {client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 shrink-0">
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center min-w-[80px]">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Entrepôts</p>
                <p className="text-xl font-semibold text-slate-900">{warehouses.length}</p>
              </div>
              <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center min-w-[80px]">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Commandes</p>
                <p className="text-xl font-semibold text-slate-900">{orders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Warehouses */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">Entrepôts</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {warehouses.map((wh) => (
              <div key={wh.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-200 transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{wh.name}</h3>
                    {wh.address && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} />
                        {wh.address}
                      </p>
                    )}
                  </div>
                  {wh.floors_count != null && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                      <Layers size={11} />
                      {wh.floors_count} étage{wh.floors_count > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <Link
                  href={`/client/warehouses/${wh.id}`}
                  className="w-full h-8 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md border border-slate-200 hover:border-blue-200 transition-all"
                >
                  Vue 2D
                  <ChevronRight size={13} />
                </Link>
              </div>
            ))}

            {warehouses.length === 0 && (
              <div className="col-span-full py-10 bg-white border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center">
                <Building2 size={24} className="text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">Aucun entrepôt configuré.</p>
              </div>
            )}
          </div>
        </div>

        {/* Orders */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={16} className="text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">Commandes</h2>
            <span className="ml-auto text-xs text-slate-400">{orders.length} commande{orders.length > 1 ? 's' : ''}</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, cls: 'bg-slate-100 text-slate-700 border-slate-200' }
                  const urgencyCfg = URGENCY_CONFIG[order.urgency_level] ?? { label: order.urgency_level, cls: 'bg-slate-100 text-slate-700 border-slate-200' }
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-700">{order.order_number ?? order.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge cfg={statusCfg} />
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
                        <Badge cfg={urgencyCfg} />
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
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {orders.length === 0 && (
              <div className="py-14 text-center">
                <ShoppingCart size={24} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Aucune commande pour ce client.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
