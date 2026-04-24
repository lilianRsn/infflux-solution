'use client'

import Link from 'next/link'
import { ArrowLeft, Package, MapPin, Clock, Truck, AlertCircle, CheckCircle2, Users, GitBranch } from 'lucide-react'
import type { User } from '@/types/auth'

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

const WINDOW_LABELS: Record<string, string> = {
  morning: 'Matin',
  afternoon: 'Après-midi',
  full_day: 'Journée complète',
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {label}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className="text-xs text-slate-900 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function OptionChip({ active, label, color }: { active: boolean; label: string; color: string }) {
  if (!active) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${color}`}>
      <CheckCircle2 size={11} />
      {label}
    </span>
  )
}

interface HubWarehouse {
  warehouse_id: string
  name: string
  address: string
  logistics_hub_id: string
  available_volume: number
  max_capacity_volume: number
  occupancy_rate: number
  free_slots: number
  total_slots: number
  free_docks: number
  total_docks: number
  is_main: boolean
}

interface HubData {
  hub_id: string
  main: HubWarehouse | null
  alternatives: HubWarehouse[]
}

interface Props {
  order: any
  user: User
  backHref: string
  hubData?: HubData | null
}

function occupancyColor(rate: number) {
  if (rate < 60) return { bar: 'bg-green-400', badge: 'bg-green-50 text-green-800 border-green-200' }
  if (rate < 85) return { bar: 'bg-amber-400', badge: 'bg-amber-50 text-amber-800 border-amber-200' }
  return { bar: 'bg-red-400', badge: 'bg-red-50 text-red-800 border-red-200' }
}

export default function OrderDetail({ order, user, backHref, hubData }: Props) {
  const isAdmin = user.role === 'admin'
  const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, cls: 'bg-slate-100 text-slate-700 border-slate-200' }
  const urgencyCfg = URGENCY_CONFIG[order.urgency_level] ?? { label: order.urgency_level, cls: 'bg-slate-100 text-slate-700 border-slate-200' }

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={15} />
        Retour
      </Link>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Commande</p>
            <h1 className="text-2xl font-semibold text-slate-900 font-mono">{order.order_number}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Créée le {fmtDate(order.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge label={statusCfg.label} cls={statusCfg.cls} />
            <Badge label={urgencyCfg.label} cls={urgencyCfg.cls} />
          </div>
        </div>

        {/* KPI strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Palettes</p>
            <div className="flex items-center justify-center gap-1.5">
              <Package size={16} className="text-slate-500" />
              <p className="text-2xl font-semibold text-slate-900">{order.total_pallets ?? '—'}</p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Date souhaitée</p>
            <p className="text-sm font-semibold text-slate-900">{fmtDate(order.requested_delivery_date)}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Créneau</p>
            <p className="text-sm font-semibold text-slate-900">{WINDOW_LABELS[order.delivery_time_window] ?? '—'}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Score flexibilité</p>
            <p className="text-2xl font-semibold text-slate-900">{order.delivery_flexibility_score ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Destination */}
        <Section title="Destination de livraison">
          <div className="space-y-0.5">
            <Row label="Site" value={order.site_name || '—'} />
            <Row
              label="Adresse"
              value={
                <span className="flex items-center gap-1 justify-end">
                  <MapPin size={11} className="text-slate-400 shrink-0" />
                  {order.delivery_address}
                </span>
              }
            />
            <Row label="Contact" value={order.delivery_contact_name || '—'} />
            <Row label="Téléphone" value={order.delivery_contact_phone || '—'} />
          </div>
        </Section>

        {/* Préférences */}
        <Section title="Préférences de livraison">
          <div className="space-y-0.5">
            <Row label="Date souhaitée" value={fmtDate(order.requested_delivery_date)} />
            <Row label="Date min acceptable" value={fmtDate(order.earliest_acceptable_delivery_date)} />
            <Row label="Date max groupage" value={fmtDate(order.latest_acceptable_grouped_delivery_date)} />
            <Row label="Livraison promise" value={fmtDate(order.promised_delivery_date)} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100">
            <OptionChip active={order.eligible_for_early_delivery} label="Anticipée" color="bg-blue-50 text-blue-800 border-blue-200" />
            <OptionChip active={order.eligible_for_grouped_delivery} label="Groupée" color="bg-slate-100 text-slate-700 border-slate-200" />
            <OptionChip active={order.eligible_for_partner_carrier} label="Partenaire" color="bg-green-50 text-green-800 border-green-200" />
            <OptionChip active={order.split_delivery_allowed} label="Fractionnée" color="bg-amber-50 text-amber-800 border-amber-200" />
            {!order.eligible_for_early_delivery && !order.eligible_for_grouped_delivery && !order.eligible_for_partner_carrier && !order.split_delivery_allowed && (
              <span className="text-xs text-slate-400">Aucune option activée</span>
            )}
          </div>
        </Section>
      </div>

      {/* Lignes de commande */}
      <Section title="Lignes de commande">
        {order.order_lines?.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Référence produit</th>
                <th className="pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest text-right">Palettes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.order_lines.map((line: any, i: number) => (
                <tr key={line.id ?? i}>
                  <td className="py-2.5 text-sm text-slate-900 font-mono">{line.product_id}</td>
                  <td className="py-2.5 text-right">
                    <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <Package size={13} className="text-slate-400" />
                      {line.quantity_pallets}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td className="pt-2.5 text-xs font-semibold text-slate-500">Total</td>
                <td className="pt-2.5 text-right text-sm font-bold text-slate-900">{order.total_pallets} pal.</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="text-sm text-slate-400">Aucune ligne de commande.</p>
        )}
      </Section>

      {/* Section admin : attribution transporteur */}
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Truck size={20} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-amber-900 mb-1">Attribution d'un transporteur</h2>
              <p className="text-xs text-amber-800 leading-relaxed">
                La fonctionnalité d'attribution de transporteur sera disponible une fois le module flotte implémenté.
                Cette section affichera les camions disponibles ayant une capacité ≥ <strong>{order.total_pallets} palettes</strong> et une tournée compatible avec la destination.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock size={11} />
                  En attente du module flotte
                </span>
                {order.eligible_for_partner_carrier && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-green-50 text-green-800 border border-green-200">
                    <Users size={11} />
                    Transporteur partenaire éligible
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section client : statut et demande */}
      {!isAdmin && (
        <Section title="Suivi de votre commande">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <AlertCircle size={18} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Commande en cours de traitement</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Votre commande a bien été enregistrée. L'équipe Infflux va l'analyser et vous attribuer un transporteur dans les plus brefs délais.
                  Vous serez notifié dès qu'un transporteur est assigné.
                </p>
              </div>
            </div>

            {isAdmin === false && order.status === 'pending' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  Votre commande de <strong>{order.total_pallets} palettes</strong> est en attente d'attribution.
                  {order.eligible_for_early_delivery && ' Elle est éligible à une livraison anticipée.'}
                  {order.eligible_for_grouped_delivery && ' Elle peut être groupée avec d\'autres commandes pour optimiser les coûts.'}
                </p>
              </div>
            )}

            {order.status === 'assigned' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800 leading-relaxed font-medium">
                  Un transporteur a été assigné à votre commande. Livraison prévue le {fmtDate(order.promised_delivery_date)}.
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Hub logistique (admin seulement) */}
      {isAdmin && hubData && hubData.hub_id && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Hub logistique</h2>
            <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
              {hubData.hub_id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...(hubData.main ? [hubData.main] : []), ...hubData.alternatives].map((wh) => {
              const colors = occupancyColor(wh.occupancy_rate)
              return (
                <div
                  key={wh.warehouse_id}
                  className={`rounded-lg border p-4 ${wh.is_main ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-semibold text-slate-900 truncate">{wh.name}</p>
                        {wh.is_main && (
                          <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
                        <MapPin size={9} className="shrink-0" />
                        {wh.address}
                      </p>
                    </div>
                    <span className={`shrink-0 ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded border ${colors.badge}`}>
                      {Math.round(wh.occupancy_rate)}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-full rounded-full ${colors.bar}`}
                      style={{ width: `${Math.min(wh.occupancy_rate, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{wh.free_slots} / {wh.total_slots} empl. libres</span>
                    <span className="font-medium text-slate-700">{wh.available_volume} pal. dispo</span>
                  </div>

                  {wh.total_docks > 0 && (
                    <div className="mt-1.5 text-[10px] text-slate-500">
                      {wh.free_docks > 0 ? (
                        <span className="text-green-700 font-medium">{wh.free_docks} quai{wh.free_docks > 1 ? 's' : ''} libre{wh.free_docks > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-red-600 font-medium">Aucun quai disponible</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {hubData.alternatives.length > 0 && (
            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
              En cas de saturation ou de quais indisponibles sur l'entrepôt principal, les entrepôts ci-dessus partagent le même hub logistique et peuvent absorber ce flux.
            </p>
          )}
        </div>
      )}

      {/* Info client (admin seulement) */}
      {isAdmin && (
        <Section title="Informations client">
          <div className="space-y-0.5">
            <Row label="Entreprise" value={order.company_name || '—'} />
            <Row label="Contact" value={order.main_contact_name || '—'} />
            <Row label="Email" value={order.main_contact_email || '—'} />
            <Row label="Téléphone" value={order.main_contact_phone || '—'} />
          </div>
        </Section>
      )}
    </main>
  )
}
