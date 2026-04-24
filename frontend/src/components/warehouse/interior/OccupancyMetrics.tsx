import { computeOccupancyStats } from '@/lib/warehouse-data'
import type { WarehouseFloor } from '@/lib/warehouse-data'

interface Props {
  floor: WarehouseFloor
  reservedPallets?: number
}

export default function OccupancyMetrics({ floor, reservedPallets = 0 }: Props) {
  const s = computeOccupancyStats(floor)
  const available = s.totalVolume - s.usedVolume
  const future = Math.max(0, available - reservedPallets)
  const hasIncoming = reservedPallets > 0

  return (
    <div className="grid grid-cols-4 gap-3">
      <Card label="Taux d'occupation" value={`${s.occupancyRate}%`} />
      <Card label="Emplacements libres" value={`${s.free} / ${s.total}`} />

      {/* Carte capacité avec projection future */}
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <p className="text-xs text-slate-500 mb-1">Palettes disponibles</p>
        <p className="text-lg font-semibold text-slate-800">{available} pal.</p>

        {hasIncoming && (
          <>
            <div className="border-t border-slate-100 mt-2 pt-2">
              <p className="text-[10px] text-slate-400 mb-0.5">Après livraisons entrantes</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-base font-semibold ${future <= 5 ? 'text-red-600' : 'text-slate-600'}`}>
                  {future} pal.
                </span>
                <span className="text-[10px] text-slate-400">
                  −{reservedPallets} réservées
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <Card label="Capacité totale" value={`${s.totalVolume} pal.`} />
    </div>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-800">{value}</p>
    </div>
  )
}
