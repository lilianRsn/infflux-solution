'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Minus, ChevronDown, ChevronRight, Truck, ParkingCircle as Parking } from 'lucide-react'
import type { WarehouseConfig, FloorConfig, AisleConfig, ExteriorConfig } from '@/lib/warehouse-store'
import { newWarehouseId, newFloor, newAisle, saveConfig } from '@/lib/warehouse-store'
import { createWarehouse as createWarehouseAction, syncWarehouseLayout } from '@/app/actions/warehouse'
import BuilderPreview from './BuilderPreview'

const INITIAL_CONFIG = {
  name: '',
  address: '',
  slotVolume: 20,
  floors: [
    {
      id: 'floor-init',
      label: 'Rez-de-chaussée',
      aisles: [
        { id: 'ai-1', code: 'A1', ranks: 6 },
        { id: 'ai-2', code: 'A2', ranks: 6 },
        { id: 'ai-3', code: 'A3', ranks: 6 },
      ],
    },
  ],
  exterior: {
    dockCount: 3,
    parkingCount: 5,
    maxTonnage: 26,
    dockSpacing: 40,
  }
}

type DraftConfig = Omit<WarehouseConfig, 'id' | 'createdAt'>

export default function WarehouseBuilder() {
  const router = useRouter()
  const [config, setConfig] = useState<DraftConfig>(INITIAL_CONFIG)
  const [activeFloorIdx, setActiveFloorIdx] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeFloor = config.floors[activeFloorIdx] ?? config.floors[0]

  function patchFloor(idx: number, patch: Partial<FloorConfig>) {
    setConfig((prev) => ({
      ...prev,
      floors: prev.floors.map((f, i) => (i === idx ? { ...f, ...patch } : f)),
    }))
  }

  function patchAisle(fi: number, ai: number, patch: Partial<AisleConfig>) {
    setConfig((prev) => ({
      ...prev,
      floors: prev.floors.map((f, fIdx) =>
        fIdx !== fi ? f : { ...f, aisles: f.aisles.map((a, aIdx) => (aIdx === ai ? { ...a, ...patch } : a)) }
      ),
    }))
  }

  function handleAddAisle(fi: number) {
    const existing = config.floors[fi].aisles.map((a) => a.code)
    patchFloor(fi, { aisles: [...config.floors[fi].aisles, newAisle(existing)] })
  }

  function handleRemoveAisle(fi: number, ai: number) {
    if (config.floors[fi].aisles.length <= 1) return
    patchFloor(fi, { aisles: config.floors[fi].aisles.filter((_, i) => i !== ai) })
  }

  function handleAddFloor() {
    const floor = newFloor(config.floors.length)
    setConfig((prev) => ({ ...prev, floors: [...prev.floors, floor] }))
    setActiveFloorIdx(config.floors.length)
  }

  function handleRemoveFloor(idx: number) {
    if (config.floors.length <= 1) return
    setConfig((prev) => ({ ...prev, floors: prev.floors.filter((_, i) => i !== idx) }))
    setActiveFloorIdx((prev) => Math.min(prev, config.floors.length - 2))
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!config.name.trim()) errs.name = 'Le nom est requis'
    if (!config.address.trim()) errs.address = "L'adresse est requise"
    config.floors.forEach((floor, fi) =>
      floor.aisles.forEach((aisle, ai) => {
        if (!aisle.code.trim()) errs[`f${fi}a${ai}`] = 'Code requis'
      })
    )
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setIsSubmitting(true)
    try {
      // 1. Create warehouse metadata in backend
      const backendWh = await createWarehouseAction({
        name: config.name,
        address: config.address,
        floors_count: config.floors.length,
      })

      const cfg: WarehouseConfig = {
        ...config,
        id: backendWh.id,
        createdAt: new Date().toISOString(),
      }

      // 2. Save locally first so the viewer always has a fallback
      saveConfig(cfg)

      // 3. Sync full layout to backend so slot IDs become real DB UUIDs (PATCH will work)
      await syncWarehouseLayout(backendWh.id, cfg)

      router.push('/client/warehouses')
    } catch (error) {
      console.error('Failed to create warehouse:', error)
      alert("Erreur lors de la création de l'entrepôt sur le serveur")
    } finally {
      setIsSubmitting(false)
    }
  }

  const slotCount = activeFloor.aisles.reduce((sum, a) => sum + a.ranks * 2, 0)
  const volumeTotal = slotCount * config.slotVolume

  return (
    <div className="flex gap-6 items-start">
      {/* ── Config panel ─────────────────────────────────────────── */}
      <div className="w-[400px] shrink-0 space-y-4">

        {/* General info */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Informations générales</p>

          <Field label="Nom de l'entrepôt" error={errors.name}>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ex. Entrepôt Lyon-Nord"
              className={inputCls(!!errors.name)}
            />
          </Field>

          <Field label="Adresse" error={errors.address}>
            <input
              type="text"
              value={config.address}
              onChange={(e) => setConfig((p) => ({ ...p, address: e.target.value }))}
              placeholder="Ex. 12 Rue des Logisticiens, 69100 Villeurbanne"
              className={inputCls(!!errors.address)}
            />
          </Field>

          <Field label="Volume par emplacement">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={500}
                value={config.slotVolume}
                onChange={(e) => setConfig((p) => ({ ...p, slotVolume: Math.max(1, Number(e.target.value)) }))}
                className={`w-24 ${inputCls(false)}`}
              />
              <span className="text-sm text-slate-500">m³ / emplacement</span>
            </div>
          </Field>
        </div>

        {/* Exterior info */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Aménagement extérieur</p>
          
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre de portes (docks)">
              <div className="relative">
                <Truck className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={config.exterior.dockCount}
                  onChange={(e) => setConfig((p) => ({ 
                    ...p, 
                    exterior: { ...p.exterior, dockCount: Math.max(1, Number(e.target.value)) }
                  }))}
                  className={`${inputCls(false)} pl-9`}
                />
              </div>
            </Field>

            <Field label="Places de parking">
              <div className="relative">
                <Parking className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={config.exterior.parkingCount}
                  onChange={(e) => setConfig((p) => ({ 
                    ...p, 
                    exterior: { ...p.exterior, parkingCount: Math.max(0, Number(e.target.value)) }
                  }))}
                  className={`${inputCls(false)} pl-9`}
                />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Gabarit max (tonnes)">
              <input
                type="number"
                min={1}
                max={100}
                value={config.exterior.maxTonnage}
                onChange={(e) => setConfig((p) => ({ 
                  ...p, 
                  exterior: { ...p.exterior, maxTonnage: Math.max(1, Number(e.target.value)) }
                }))}
                className={inputCls(false)}
              />
            </Field>

            <Field label="Espacement (mètres)">
              <input
                type="number"
                min={1}
                max={20}
                value={config.exterior.dockSpacing}
                onChange={(e) => setConfig((p) => ({ 
                  ...p, 
                  exterior: { ...p.exterior, dockSpacing: Math.max(1, Number(e.target.value)) }
                }))}
                className={inputCls(false)}
              />
            </Field>
          </div>
        </div>

        {/* Floors */}
        {config.floors.map((floor, fi) => (
          <div key={floor.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            {/* Floor header */}
            <button
              onClick={() => setActiveFloorIdx(fi)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                {activeFloorIdx === fi
                  ? <ChevronDown size={14} className="text-slate-400 shrink-0" />
                  : <ChevronRight size={14} className="text-slate-400 shrink-0" />
                }
                <span className="text-sm font-medium text-slate-900">{floor.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{floor.aisles.length} allée{floor.aisles.length > 1 ? 's' : ''}</span>
                {config.floors.length > 1 && (
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveFloor(fi) }}
                    className="p-1 text-slate-300 hover:text-red-400 rounded transition-colors"
                  >
                    <Trash2 size={13} />
                  </span>
                )}
              </div>
            </button>

            {/* Floor body */}
            {activeFloorIdx === fi && (
              <div className="border-t border-slate-100 px-4 pt-3 pb-4 space-y-2">
                {/* Floor label edit */}
                <div className="mb-3">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1">Nom de l&apos;étage</label>
                  <input
                    type="text"
                    value={floor.label}
                    onChange={(e) => patchFloor(fi, { label: e.target.value })}
                    className={`w-full ${inputCls(false)}`}
                  />
                </div>

                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Allées</p>

                {floor.aisles.map((aisle, ai) => (
                  <div key={aisle.id} className="flex items-center gap-2">
                    {/* Code */}
                    <input
                      type="text"
                      value={aisle.code}
                      maxLength={4}
                      onChange={(e) => patchAisle(fi, ai, { code: e.target.value.toUpperCase() })}
                      className={`w-14 text-center font-mono ${inputCls(!!errors[`f${fi}a${ai}`])} h-8 text-xs`}
                    />

                    {/* Ranks stepper */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => patchAisle(fi, ai, { ranks: Math.max(1, aisle.ranks - 1) })}
                        className="w-7 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-7 text-center text-sm font-medium text-slate-900">{aisle.ranks}</span>
                      <button
                        onClick={() => patchAisle(fi, ai, { ranks: Math.min(12, aisle.ranks + 1) })}
                        className="w-7 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <span className="text-xs text-slate-400 flex-1">rang{aisle.ranks > 1 ? 's' : ''}</span>

                    {floor.aisles.length > 1 && (
                      <button
                        onClick={() => handleRemoveAisle(fi, ai)}
                        className="p-1 text-slate-300 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}

                {floor.aisles.length < 8 && (
                  <button
                    onClick={() => handleAddAisle(fi)}
                    className="w-full mt-1 h-8 flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Plus size={12} />
                    Ajouter une allée
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add floor */}
        {config.floors.length < 5 && (
          <button
            onClick={handleAddFloor}
            className="w-full h-9 flex items-center justify-center gap-2 text-sm font-medium text-slate-600 bg-white border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-800 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Ajouter un étage
          </button>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-10 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          {isSubmitting ? 'Création en cours...' : 'Créer l\'entrepôt'}
          {!isSubmitting && <span className="text-base leading-none">→</span>}
        </button>
      </div>

      {/* ── Preview panel ─────────────────────────────────────────── */}
      <div className="flex-1 sticky top-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Aperçu du plan</p>
          {config.floors.length > 1 && (
            <div className="flex gap-1">
              {config.floors.map((floor, fi) => (
                <button
                  key={floor.id}
                  onClick={() => setActiveFloorIdx(fi)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    activeFloorIdx === fi
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {floor.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          {activeFloor.aisles.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-slate-400">
              Ajoutez une allée pour voir l&apos;aperçu
            </div>
          ) : (
            <BuilderPreview floor={activeFloor} slotVolume={config.slotVolume} />
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-slate-500">
          <span>
            <span className="font-medium text-slate-900">{activeFloor.aisles.length}</span>{' '}
            allée{activeFloor.aisles.length > 1 ? 's' : ''}
          </span>
          <span>
            <span className="font-medium text-slate-900">{slotCount}</span>{' '}
            emplacements
          </span>
          <span>
            <span className="font-medium text-slate-900">{volumeTotal}</span> m³ total
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-3 h-3 rounded-sm bg-green-200 border border-green-300 inline-block" />
          Tous les emplacements sont libres à la création
        </div>
      </div>
    </div>
  )
}

function inputCls(hasError: boolean) {
  return `w-full bg-white border ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/10'} rounded-md h-9 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-4 outline-none transition-all`
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500 block">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
