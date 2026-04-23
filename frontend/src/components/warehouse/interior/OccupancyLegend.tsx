export default function OccupancyLegend() {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm border" style={{ background: '#dcfce7', borderColor: '#86efac' }} />
        <span className="text-slate-600">Libre</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm border" style={{ background: '#fef3c7', borderColor: '#fcd34d' }} />
        <span className="text-slate-600">Partiel</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm border" style={{ background: '#fee2e2', borderColor: '#fca5a5' }} />
        <span className="text-slate-600">Plein</span>
      </div>
    </div>
  )
}
