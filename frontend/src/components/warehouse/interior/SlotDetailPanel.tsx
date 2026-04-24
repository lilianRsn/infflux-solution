'use client'

import { useState, useEffect } from 'react'
import type { StorageSlot, SlotStatus } from '@/lib/warehouse-data'
import { Save, Loader2 } from 'lucide-react'
import { updateStorageSlot } from '@/app/actions/warehouse'

const LABELS = { FREE: 'Libre', PARTIAL: 'Partiel', FULL: 'Plein' }
const BADGE = {
  FREE: 'bg-green-100 text-green-900',
  PARTIAL: 'bg-amber-100 text-amber-950',
  FULL: 'bg-red-100 text-red-950',
}
const BAR = {
  FREE: 'bg-green-400',
  PARTIAL: 'bg-amber-400',
  FULL: 'bg-red-400',
}

interface Props {
  readonly slot: StorageSlot | null
  readonly aisleCode: string | null
  readonly readonly: boolean
  readonly onClose: () => void
  readonly onUpdate: (slot: StorageSlot) => void
}

export default function SlotDetailPanel({ slot, aisleCode, readonly, onClose, onUpdate }: Props) {
  const [usedVolume, setUsedVolume] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (slot) {
      setUsedVolume(slot.usedVolume)
    }
  }, [slot])

  if (!slot) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div>
          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-slate-300 text-2xl">📦</span>
          </div>
          <p className="text-slate-400 text-sm">
            Cliquez sur un emplacement pour voir ses détails
          </p>
        </div>
      </div>
    )
  }

  const fillPct = Math.round((slot.usedVolume / slot.totalVolume) * 100)

  async function handleSave() {
    if (!slot) return
    setIsSaving(true)
    try {
      let newStatus: SlotStatus = 'PARTIAL'
      if (usedVolume === 0) newStatus = 'FREE'
      if (usedVolume >= slot.totalVolume) newStatus = 'FULL'

      // Call Server Action
      await updateStorageSlot(slot.id, {
        used_volume: usedVolume,
        status: newStatus
      })

      onUpdate({
        ...slot,
        usedVolume: usedVolume,
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to save slot:', error)
      alert('Erreur lors de la sauvegarde sur le serveur')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emplacement</p>
          <p className="text-xl font-black text-slate-900 font-mono tracking-tighter">
            {aisleCode ?? '—'} · R{slot.rank} · {slot.side === 'L' ? 'G' : 'D'}
          </p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-all active:scale-90">
          <span className="text-xl leading-none flex items-center justify-center w-5 h-5">×</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${BADGE[slot.status]} ${
          slot.status === 'FREE' ? 'border-green-200' : slot.status === 'PARTIAL' ? 'border-amber-200' : 'border-red-200'
        }`}>
          {LABELS[slot.status]}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-500">Palettes occupées</span>
          <span className="text-slate-900">{slot.usedVolume} / {slot.totalVolume}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${BAR[slot.status]}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 font-medium text-right">{fillPct}% occupé</p>
      </div>

      <div className="space-y-2.5 text-sm border-t border-slate-100 pt-4">
        <Row label="Rangée" value={String(slot.rank)} />
        <Row label="Côté" value={slot.side === 'L' ? 'Gauche' : 'Droite'} />
        <Row label="Dernier inventaire" value={new Date(slot.updatedAt).toLocaleDateString('fr-FR')} />
      </div>

      {!readonly && (
        <div className="border-t border-slate-100 pt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block ml-1">
              Palettes utilisées
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={slot.totalVolume}
                value={usedVolume}
                onChange={(e) => setUsedVolume(Number(e.target.value))}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg h-9 px-3 text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
              />
              <button
                onClick={handleSave}
                disabled={isSaving || usedVolume === slot.usedVolume}
                className="h-9 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span className="text-xs font-bold uppercase tracking-tight">Sauver</span>
              </button>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
            <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
              L'ajustement mettra automatiquement à jour le statut (Libre/Partiel/Plein) et les indicateurs globaux.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500 font-medium text-xs">{label}</span>
      <span className="text-slate-900 font-bold text-xs font-mono">{value}</span>
    </div>
  )
}
