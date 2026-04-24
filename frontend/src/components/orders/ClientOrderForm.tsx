'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ClientCreateOrderPayload, DeliveryNeed, OrderLine } from '../../types/order'
import { createOrder } from '@/app/actions/orders'


const initialForm: ClientCreateOrderPayload = {
  delivery_destination: {
    delivery_address: '',
    site_name: '',
    delivery_contact_name: '',
    delivery_contact_phone: '',
  },
  order_lines: [
    {
      product_id: '',
      quantity_pallets: 1,
    },
  ],
  delivery_need: {
    requested_delivery_date: '',
    delivery_time_window: 'morning',
    urgency_level: 'standard',
    can_receive_early: false,
    earliest_acceptable_delivery_date: '',
    can_store_early_delivery: false,
    grouped_delivery_allowed: false,
    latest_acceptable_grouped_delivery_date: '',
    split_delivery_allowed: false,
    partner_delivery_allowed: false,
  },
}

interface Props {
  warehouses?: any[]
}

export default function ClientOrderForm({ warehouses = [] }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ClientCreateOrderPayload>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')

  const today = getTodayDate()

  const totalPallets = useMemo(
    () =>
      form.order_lines.reduce((sum, line) => sum + (Number(line.quantity_pallets) || 0), 0),
    [form.order_lines]
  )

  function formatDateForInput(date: Date) {
    return date.toISOString().split('T')[0]
  }

  function getTodayDate() {
    return formatDateForInput(new Date())
  }


  function handleWarehouseSelect(warehouseId: string) {
    setSelectedWarehouseId(warehouseId)
    const wh = warehouses.find((w) => w.id === warehouseId)
    if (wh) {
      setForm((current) => ({
        ...current,
        client_warehouse_id: wh.id,
        destination_warehouse_id: wh.id,
        delivery_destination: {
          ...current.delivery_destination,
          delivery_address: wh.address,
          site_name: wh.name,
        },
      }))
    }
  }

  function updateDestination(
    key: keyof ClientCreateOrderPayload['delivery_destination'],
    value: string
  ) {
    setForm((current) => ({
      ...current,
      delivery_destination: {
        ...current.delivery_destination,
        [key]: value,
      },
    }))
  }

  function updateDeliveryNeed<K extends keyof DeliveryNeed>(key: K, value: DeliveryNeed[K]) {
    setForm((current) => ({
      ...current,
      delivery_need: {
        ...current.delivery_need,
        [key]: value,
      },
    }))
  }

  function updateOrderLine(index: number, key: keyof OrderLine, value: string | number) {
    setForm((current) => ({
      ...current,
      order_lines: current.order_lines.map((line, i) =>
        i === index
          ? {
            ...line,
            [key]: key === 'quantity_pallets' ? Number(value) : value,
          }
          : line
      ),
    }))
  }

  function addLine() {
    setForm((current) => ({
      ...current,
      order_lines: [...current.order_lines, { product_id: '', quantity_pallets: 1 }],
    }))
  }

  function removeLine(index: number) {
    setForm((current) => ({
      ...current,
      order_lines:
        current.order_lines.length === 1
          ? current.order_lines
          : current.order_lines.filter((_, i) => i !== index),
    }))
  }

  function validateForm() {
    if (form.delivery_need.requested_delivery_date && form.delivery_need.requested_delivery_date < today) {
      return 'La date souhaitée ne peut pas être dans le passé.'
    }

    if (
      form.delivery_need.earliest_acceptable_delivery_date &&
      form.delivery_need.earliest_acceptable_delivery_date < today
    ) {
      return 'La date minimum acceptable ne peut pas être dans le passé.'
    }

    if (
      form.delivery_need.latest_acceptable_grouped_delivery_date &&
      form.delivery_need.latest_acceptable_grouped_delivery_date < today
    ) {
      return 'La date maximale de groupage ne peut pas être dans le passé.'
    }
    if (warehouses.length > 0 && !selectedWarehouseId) {
      return "Veuillez sélectionner un entrepôt de destination."
    }
    if (warehouses.length === 0 && !form.delivery_destination.delivery_address.trim()) {
      return "L’adresse de livraison est requise."
    }

    if (!form.delivery_need.requested_delivery_date) {
      return 'La date souhaitée est requise.'
    }

    for (const line of form.order_lines) {
      if (!line.product_id.trim()) {
        return 'Chaque ligne doit contenir un identifiant produit.'
      }

      if (!line.quantity_pallets || line.quantity_pallets <= 0) {
        return 'Chaque ligne doit contenir une quantité de palettes supérieure à 0.'
      }
    }

    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      await createOrder(form)
      router.push('/client/commandes')
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Destination de livraison</h2>
            <p className="mt-1 text-sm text-slate-500">
              {warehouses.length > 0 ? 'Sélectionnez un de vos entrepôts comme destination.' : 'Adresse de livraison et contact sur site.'}
            </p>
          </div>

          {warehouses.length > 0 ? (
            <div className="space-y-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Entrepôt de destination</span>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => handleWarehouseSelect(e.target.value)}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
                >
                  <option value="">— Choisir un entrepôt —</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} — {wh.address}
                    </option>
                  ))}
                </select>
              </label>

              {selectedWarehouseId && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Contact livraison"
                    value={form.delivery_destination.delivery_contact_name}
                    onChange={(value) => updateDestination('delivery_contact_name', value)}
                    placeholder="Sophie Martin"
                  />
                  <TextField
                    label="Téléphone du contact"
                    value={form.delivery_destination.delivery_contact_phone}
                    onChange={(value) => updateDestination('delivery_contact_phone', value)}
                    placeholder="0611111111"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Nom du site"
                value={form.delivery_destination.site_name}
                onChange={(value) => updateDestination('site_name', value)}
                placeholder="Magasin Lyon"
              />
              <TextField
                label="Contact livraison"
                value={form.delivery_destination.delivery_contact_name}
                onChange={(value) => updateDestination('delivery_contact_name', value)}
                placeholder="Sophie Martin"
              />
              <div className="sm:col-span-2">
                <TextField
                  label="Adresse de livraison"
                  value={form.delivery_destination.delivery_address}
                  onChange={(value) => updateDestination('delivery_address', value)}
                  placeholder="25 avenue Livraison, Lyon"
                />
              </div>
              <TextField
                label="Téléphone du contact"
                value={form.delivery_destination.delivery_contact_phone}
                onChange={(value) => updateDestination('delivery_contact_phone', value)}
                placeholder="0611111111"
              />
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lignes de commande</h2>
              <p className="mt-1 text-sm text-slate-500">
                Produits demandés et quantité en palettes.
              </p>
            </div>

            <button
              type="button"
              onClick={addLine}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Ajouter une ligne
            </button>
          </div>

          <div className="space-y-3">
            {form.order_lines.map((line, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_180px_auto]"
              >
                <TextField
                  label={`Produit ${index + 1}`}
                  value={line.product_id}
                  onChange={(value) => updateOrderLine(index, 'product_id', value)}
                  placeholder="PROD_001"
                />

                <TextField
                  label="Palettes"
                  type="number"
                  min={1}
                  value={String(line.quantity_pallets)}
                  onChange={(value) => updateOrderLine(index, 'quantity_pallets', Number(value))}
                />

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">Préférences de livraison</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ces paramètres serviront ensuite à l’optimisation logistique.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Date souhaitée"
              type="date"
              min={today}
              value={form.delivery_need.requested_delivery_date}
              onChange={(value) => updateDeliveryNeed('requested_delivery_date', value)}
            />

            <SelectField
              label="Créneau"
              value={form.delivery_need.delivery_time_window}
              onChange={(value) =>
                updateDeliveryNeed(
                  'delivery_time_window',
                  value as DeliveryNeed['delivery_time_window']
                )
              }
              options={[
                { label: 'Matin', value: 'morning' },
                { label: 'Après-midi', value: 'afternoon' },
                { label: 'Journée complète', value: 'full_day' },
              ]}
            />

            <SelectField
              label="Urgence"
              value={form.delivery_need.urgency_level}
              onChange={(value) =>
                updateDeliveryNeed('urgency_level', value as DeliveryNeed['urgency_level'])
              }
              options={[
                { label: 'Urgent', value: 'urgent' },
                { label: 'Standard', value: 'standard' },
                { label: 'Flexible', value: 'flexible' },
              ]}
            />

            <TextField
              label="Date minimum acceptable"
              type="date"
              min={today}
              value={form.delivery_need.earliest_acceptable_delivery_date}
              onChange={(value) => updateDeliveryNeed('earliest_acceptable_delivery_date', value)}
            />


            <TextField
              label="Date max groupée"
              type="date"
              min={today}
              value={form.delivery_need.latest_acceptable_grouped_delivery_date}
              onChange={(value) =>
                updateDeliveryNeed('latest_acceptable_grouped_delivery_date', value)
              }
            />

            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
              <ToggleCard
                label="Livraison anticipée possible"
                checked={form.delivery_need.can_receive_early}
                onChange={(checked) => updateDeliveryNeed('can_receive_early', checked)}
              />
              <ToggleCard
                label="Capacité de stockage anticipée"
                checked={form.delivery_need.can_store_early_delivery}
                onChange={(checked) => updateDeliveryNeed('can_store_early_delivery', checked)}
              />
              <ToggleCard
                label="Livraison groupée autorisée"
                checked={form.delivery_need.grouped_delivery_allowed}
                onChange={(checked) => updateDeliveryNeed('grouped_delivery_allowed', checked)}
              />
              <ToggleCard
                label="Livraison fractionnée autorisée"
                checked={form.delivery_need.split_delivery_allowed}
                onChange={(checked) => updateDeliveryNeed('split_delivery_allowed', checked)}
              />
              <ToggleCard
                label="Transport partenaire autorisé"
                checked={form.delivery_need.partner_delivery_allowed}
                onChange={(checked) => updateDeliveryNeed('partner_delivery_allowed', checked)}
              />
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? 'Création en cours...' : 'Créer la commande'}
          </button>
        </div>
      </form>

      <aside className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Résumé</h2>

          <div className="mt-5 space-y-3">
            <MetricRow label="Lignes" value={String(form.order_lines.length)} />
            <MetricRow label="Palettes totales" value={String(totalPallets)} />
            <MetricRow label="Urgence" value={form.delivery_need.urgency_level} />
            <MetricRow
              label="Date souhaitée"
              value={form.delivery_need.requested_delivery_date || 'Non renseignée'}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Informations</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Vos informations client seront récupérées automatiquement à la validation.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Vous pouvez indiquer ici vos préférences pour aider à optimiser la livraison.
          </p>
        </section>
      </aside>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  max,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  min?: number | string
  max?: number | string
}) {

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
      />

    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ToggleCard({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-slate-900"
      />
    </label>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}
