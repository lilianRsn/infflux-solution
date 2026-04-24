'use client'

import { useMemo, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import type { User } from '@/types/auth'
import type {
  AdminPlanningOrder,
  DeliveryPlan,
  DeliveryPlanDetail,
  GeneratePlansResult,
  PlanStatus,
  PlanningStatus,
  ReprogramOrderPayload,
  TimeWindow,
  Truck,
} from '@/types/fleet'

interface Props {
  adminUser: User
  initialTrucks: Truck[]
  initialPlans: DeliveryPlan[]
  initialOrders: AdminPlanningOrder[]
}

const PLAN_STATUS_STYLE: Record<PlanStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  BLOCKED: 'bg-red-50 text-red-700',
}

const PLANNING_STATUS_STYLE: Record<PlanningStatus, string> = {
  UNPLANNED: 'bg-slate-100 text-slate-600',
  PARTIALLY_PLANNED: 'bg-amber-50 text-amber-700',
  PLANNED: 'bg-blue-50 text-blue-700',
  BLOCKED: 'bg-red-50 text-red-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
}

const TIME_WINDOW_LABEL: Record<TimeWindow, string> = {
  morning: 'Matin',
  afternoon: 'Après-midi',
  full_day: 'Journée',
}

const URGENCY_LABEL: Record<'urgent' | 'standard' | 'flexible', string> = {
  urgent: 'Urgent',
  standard: 'Standard',
  flexible: 'Flexible',
}

async function apiFetch<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message ?? `Erreur ${response.status}`)
  }

  return data as T
}

export default function DeliveryPlanningContent({
  adminUser,
  initialTrucks,
  initialPlans,
  initialOrders,
}: Props) {
  const [trucks, setTrucks] = useState(initialTrucks)
  const [plans, setPlans] = useState(initialPlans)
  const [orders, setOrders] = useState(initialOrders)
  const [selectedPlan, setSelectedPlan] = useState<DeliveryPlanDetail | null>(null)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generationResult, setGenerationResult] = useState<GeneratePlansResult | null>(null)

  const [reprogramForms, setReprogramForms] = useState<Record<string, ReprogramOrderPayload>>({})

  const blockedOrPartialOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.planning_status === 'BLOCKED' ||
          order.planning_status === 'PARTIALLY_PLANNED'
      ),
    [orders]
  )

  const draftPlansCount = plans.filter((plan) => plan.status === 'DRAFT').length
  const activePlansCount = plans.filter(
    (plan) => plan.status === 'CONFIRMED' || plan.status === 'IN_PROGRESS'
  ).length
  const blockedPlansCount = plans.filter((plan) => plan.status === 'BLOCKED').length

  async function refreshAll() {
    setError(null)
    const [nextTrucks, nextPlans, nextOrders] = await Promise.all([
      apiFetch<Truck[]>('/api/trucks'),
      apiFetch<DeliveryPlan[]>('/api/delivery-plans'),
      apiFetch<AdminPlanningOrder[]>('/api/orders'),
    ])

    setTrucks(nextTrucks)
    setPlans(nextPlans)
    setOrders(nextOrders)

    if (selectedPlan) {
      const updatedDetail = await apiFetch<DeliveryPlanDetail>(
        `/api/delivery-plans/${selectedPlan.id}`
      )
      setSelectedPlan(updatedDetail)
    }
  }

  async function handleGeneratePlanning() {
    setBusyAction('generate')
    setError(null)
    setFlash(null)

    try {
      const result = await apiFetch<GeneratePlansResult>('/api/delivery-plans/generate', {
        method: 'POST',
        body: '{}',
      })
      setGenerationResult(result)
      await refreshAll()
      setFlash('Planification générée avec succès.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la génération.')
    } finally {
      setBusyAction(null)
    }
  }

  async function handleValidatePlan(planId: string) {
    setBusyAction(`validate-${planId}`)
    setError(null)
    setFlash(null)

    try {
      await apiFetch(`/api/delivery-plans/${planId}/validate`, {
        method: 'POST',
        body: '{}',
      })
      await refreshAll()
      setFlash('Plan validé.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de valider le plan.')
    } finally {
      setBusyAction(null)
    }
  }

  async function handleChangePlanStatus(planId: string, status: PlanStatus) {
    setBusyAction(`status-${planId}-${status}`)
    setError(null)
    setFlash(null)

    try {
      await apiFetch(`/api/delivery-plans/${planId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await refreshAll()
      setFlash(`Statut du plan mis à jour vers ${status}.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de changer le statut.')
    } finally {
      setBusyAction(null)
    }
  }

  async function handleOpenPlan(planId: string) {
    if (selectedPlan?.id === planId) {
      setSelectedPlan(null)
      return
    }

    setLoadingPlanId(planId)
    setError(null)

    try {
      const detail = await apiFetch<DeliveryPlanDetail>(`/api/delivery-plans/${planId}`)
      setSelectedPlan(detail)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de charger le détail.')
    } finally {
      setLoadingPlanId(null)
    }
  }

  function updateReprogramForm(orderId: string, patch: ReprogramOrderPayload) {
    setReprogramForms((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        ...patch,
      },
    }))
  }

  function getReprogramForm(order: AdminPlanningOrder): ReprogramOrderPayload {
    return (
      reprogramForms[order.id] ?? {
        requested_delivery_date: order.requested_delivery_date.slice(0, 10),
        delivery_time_window: order.delivery_time_window,
        urgency_level: order.urgency_level,
        auto_replan: true,
      }
    )
  }

  async function handleReprogramOrder(order: AdminPlanningOrder) {
    const form = getReprogramForm(order)
    setBusyAction(`reprogram-${order.id}`)
    setError(null)
    setFlash(null)

    try {
      await apiFetch(`/api/delivery-plans/orders/${order.id}/reprogram`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      })
      await refreshAll()
      setFlash(`Commande ${order.order_number} reprogrammée.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de reprogrammer la commande.')
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={adminUser} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Livraisons planifiées</h1>
            <p className="text-sm text-slate-500 mt-1">
              Génération des plans, validation, suivi d’état et reprogrammation des commandes.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => refreshAll().catch((e) => setError(e.message))}
              className="px-4 h-10 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-white transition-colors"
            >
              Actualiser
            </button>
            <button
              onClick={handleGeneratePlanning}
              disabled={busyAction === 'generate'}
              className="px-4 h-10 rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 transition-colors"
            >
              {busyAction === 'generate' ? 'Génération…' : 'Générer la planification'}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {flash ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {flash}
          </div>
        ) : null}

        {generationResult ? (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-slate-900">Résultat de la génération</h2>
              <button
                onClick={() => setGenerationResult(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Fermer
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <MetricCard label="Plans créés" value={generationResult.generated_count} />
              <MetricCard
                label="Partiellement planifiés"
                value={generationResult.partially_planned_count}
              />
              <MetricCard label="Bloqués" value={generationResult.blocked_count} />
            </div>
          </div>
        ) : null}

        <div className="grid md:grid-cols-4 gap-3 mb-8">
          <MetricCard label="Camions disponibles" value={trucks.filter((t) => t.status === 'AVAILABLE').length} />
          <MetricCard label="Plans en brouillon" value={draftPlansCount} />
          <MetricCard label="Plans actifs" value={activePlansCount} />
          <MetricCard label="Plans bloqués" value={blockedPlansCount} />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Plans de livraison</h2>
          </div>

          {plans.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">
              Aucun plan pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {plans.map((plan) => (
                <div key={plan.id} className="px-5 py-4">
                  <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {plan.client_warehouse_name}
                        </span>
                        <Badge className={PLAN_STATUS_STYLE[plan.status]}>
                          {plan.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDate(plan.planned_delivery_date)} ·{' '}
                        {TIME_WINDOW_LABEL[plan.planned_time_window]} ·{' '}
                        {plan.total_pallets} palettes ·{' '}
                        {plan.trucks_count} camion{plan.trucks_count > 1 ? 's' : ''} ·{' '}
                        {plan.docks_count} quai{plan.docks_count > 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleOpenPlan(plan.id)}
                        className="px-3 h-9 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {loadingPlanId === plan.id
                          ? 'Chargement…'
                          : selectedPlan?.id === plan.id
                          ? 'Masquer'
                          : 'Voir le détail'}
                      </button>

                      {plan.status === 'DRAFT' ? (
                        <button
                          onClick={() => handleValidatePlan(plan.id)}
                          disabled={busyAction === `validate-${plan.id}`}
                          className="px-3 h-9 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          Valider
                        </button>
                      ) : null}

                      {plan.status === 'CONFIRMED' ? (
                        <button
                          onClick={() => handleChangePlanStatus(plan.id, 'IN_PROGRESS')}
                          disabled={busyAction === `status-${plan.id}-IN_PROGRESS`}
                          className="px-3 h-9 rounded-lg bg-amber-600 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                        >
                          Démarrer
                        </button>
                      ) : null}

                      {plan.status === 'IN_PROGRESS' ? (
                        <button
                          onClick={() => handleChangePlanStatus(plan.id, 'COMPLETED')}
                          disabled={busyAction === `status-${plan.id}-COMPLETED`}
                          className="px-3 h-9 rounded-lg bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Terminer
                        </button>
                      ) : null}

                      {(plan.status === 'DRAFT' || plan.status === 'CONFIRMED') ? (
                        <button
                          onClick={() => handleChangePlanStatus(plan.id, 'BLOCKED')}
                          disabled={busyAction === `status-${plan.id}-BLOCKED`}
                          className="px-3 h-9 rounded-lg border border-red-300 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          Bloquer
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {selectedPlan?.id === plan.id ? (
                    <div className="mt-4 grid lg:grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4">
                      <div className="lg:col-span-1">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Camions
                        </h3>
                        <div className="space-y-2">
                          {selectedPlan.trucks.map((truck) => (
                            <div key={truck.id} className="rounded-lg bg-white border border-slate-200 p-3">
                              <div className="text-sm font-medium text-slate-900">{truck.name}</div>
                              <div className="text-xs text-slate-500">
                                {truck.license_plate} · {truck.assigned_pallets}/{truck.max_palettes} palettes
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:col-span-1">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Quais attribués
                        </h3>
                        <div className="space-y-2">
                          {selectedPlan.dock_assignments.map((dock) => (
                            <div key={`${dock.id}-${dock.truck_id}`} className="rounded-lg bg-white border border-slate-200 p-3">
                              <div className="text-sm font-medium text-slate-900">Quai {dock.code}</div>
                              <div className="text-xs text-slate-500">
                                Côté {dock.side} · camion {dock.truck_code}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:col-span-1">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Commandes
                        </h3>
                        <div className="space-y-2">
                          {selectedPlan.orders.map((order) => (
                            <div key={order.id} className="rounded-lg bg-white border border-slate-200 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-sm font-medium text-slate-900">
                                    {order.order_number}
                                  </div>
                                  <div className="text-xs text-slate-500">{order.company_name}</div>
                                </div>
                                <Badge className={PLANNING_STATUS_STYLE[order.planning_status]}>
                                  {order.planning_status}
                                </Badge>
                              </div>
                              <div className="mt-2 text-xs text-slate-500">
                                {order.allocated_pallets}/{order.total_pallets} palettes ·{' '}
                                {URGENCY_LABEL[order.urgency_level]}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              Commandes à reprendre
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Reprogrammez les commandes bloquées ou partiellement planifiées puis relancez le replanning.
            </p>
          </div>

          {blockedOrPartialOrders.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">
              Aucune commande bloquée ou partiellement planifiée.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {blockedOrPartialOrders.map((order) => {
                const form = getReprogramForm(order)

                return (
                  <div key={order.id} className="px-5 py-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-900">
                            {order.order_number}
                          </span>
                          <Badge className={PLANNING_STATUS_STYLE[order.planning_status]}>
                            {order.planning_status}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-700">{order.company_name}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {order.total_pallets} palettes · {formatDate(order.requested_delivery_date)} ·{' '}
                          {TIME_WINDOW_LABEL[order.delivery_time_window]} ·{' '}
                          {URGENCY_LABEL[order.urgency_level]}
                        </div>
                        {order.blocked_reason ? (
                          <div className="mt-2 text-xs text-red-600">
                            Motif: {order.blocked_reason}
                          </div>
                        ) : null}
                      </div>

                      <div className="grid sm:grid-cols-4 gap-2 w-full lg:w-auto lg:min-w-[720px]">
                        <label className="flex flex-col gap-1">
                          <span className="text-[11px] text-slate-500">Nouvelle date</span>
                          <input
                            type="date"
                            value={form.requested_delivery_date ?? ''}
                            onChange={(e) =>
                              updateReprogramForm(order.id, {
                                requested_delivery_date: e.target.value,
                              })
                            }
                            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
                          />
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-[11px] text-slate-500">Créneau</span>
                          <select
                            value={form.delivery_time_window ?? order.delivery_time_window}
                            onChange={(e) =>
                              updateReprogramForm(order.id, {
                                delivery_time_window: e.target.value as TimeWindow,
                              })
                            }
                            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
                          >
                            <option value="morning">Matin</option>
                            <option value="afternoon">Après-midi</option>
                            <option value="full_day">Journée</option>
                          </select>
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-[11px] text-slate-500">Urgence</span>
                          <select
                            value={form.urgency_level ?? order.urgency_level}
                            onChange={(e) =>
                              updateReprogramForm(order.id, {
                                urgency_level: e.target.value as 'urgent' | 'standard' | 'flexible',
                              })
                            }
                            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
                          >
                            <option value="urgent">Urgent</option>
                            <option value="standard">Standard</option>
                            <option value="flexible">Flexible</option>
                          </select>
                        </label>

                        <div className="flex flex-col justify-end">
                          <button
                            onClick={() => handleReprogramOrder(order)}
                            disabled={busyAction === `reprogram-${order.id}`}
                            className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                          >
                            {busyAction === `reprogram-${order.id}` ? 'Reprogrammation…' : 'Reprogrammer'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <label className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
                      <input
                        type="checkbox"
                        checked={form.auto_replan ?? true}
                        onChange={(e) =>
                          updateReprogramForm(order.id, { auto_replan: e.target.checked })
                        }
                        className="h-4 w-4 accent-slate-900"
                      />
                      Relancer automatiquement le planning après modification
                    </label>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function Badge({
  className,
  children,
}: {
  className: string
  children: React.ReactNode
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${className}`}>
      {children}
    </span>
  )
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
