'use client'

import type { ClientWarehouseExterior, LoadingDock } from '@/lib/warehouse-data'

const DOCK_FILL = { FREE: '#dcfce7', OCCUPIED: '#fee2e2', MAINTENANCE: '#f1f5f9' }
const DOCK_STROKE = { FREE: '#86efac', OCCUPIED: '#fca5a5', MAINTENANCE: '#94a3b8' }

interface Props {
  exterior: ClientWarehouseExterior
  selectedDock: LoadingDock | null
  onDockSelect: (dock: LoadingDock | null) => void
}

export default function WarehouseExteriorPlan({ exterior, selectedDock, onDockSelect }: Props) {
  const { siteWidth, siteHeight, buildingX, buildingY, buildingWidth, buildingHeight, docks, parkingZones } = exterior
  const southWallY = buildingY + buildingHeight

  return (
    <svg
      viewBox={`-8 -8 ${siteWidth + 16} ${siteHeight + 16}`}
      className="w-full"
      style={{ display: 'block' }}
    >
      {/* Site boundary */}
      <rect x="0" y="0" width={siteWidth} height={siteHeight} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5" />

      {/* Access road (south strip) */}
      <rect x="0" y={southWallY} width={siteWidth} height={siteHeight - southWallY} fill="#d1d5db" />
      {/* Road center line */}
      <line
        x1={siteWidth / 2} y1={southWallY + 2}
        x2={siteWidth / 2} y2={siteHeight - 2}
        stroke="white" strokeWidth="0.8" strokeDasharray="4 3"
      />
      <text
        x={siteWidth / 2} y={siteHeight - 3}
        textAnchor="middle" fontSize="5" fill="#6b7280" fontFamily="sans-serif"
      >
        ENTREE / SORTIE
      </text>

      {/* Parking zones */}
      {parkingZones.map((zone) => (
        <g key={zone.id}>
          <rect
            x={zone.positionX} y={zone.positionY}
            width={zone.width} height={zone.height}
            fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5" strokeDasharray="3 2"
          />
          <text
            x={zone.positionX + zone.width / 2} y={zone.positionY + zone.height / 2}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="4.5" fill="#16a34a" fontFamily="sans-serif"
          >
            Parking — {zone.capacity} places
          </text>
        </g>
      ))}

      {/* Building */}
      <rect
        x={buildingX} y={buildingY}
        width={buildingWidth} height={buildingHeight}
        fill="#cbd5e1" stroke="#475569" strokeWidth="1"
      />
      {/* Office zone inside building (top-right corner) */}
      <rect
        x={buildingX + buildingWidth - 35} y={buildingY}
        width={35} height={25}
        fill="#94a3b8" stroke="#64748b" strokeWidth="0.5"
      />
      <text
        x={buildingX + buildingWidth - 17.5} y={buildingY + 13}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="4" fill="#f8fafc" fontFamily="sans-serif"
      >
        Bureau
      </text>
      <text
        x={buildingX + buildingWidth / 2 - 17} y={buildingY + buildingHeight / 2}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="8" fill="#475569" fontFamily="sans-serif" fontWeight="600"
      >
        BÂTIMENT
      </text>
      <text
        x={buildingX + buildingWidth / 2 - 17} y={buildingY + buildingHeight / 2 + 10}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="5" fill="#64748b" fontFamily="sans-serif"
      >
        {buildingWidth}m × {buildingHeight}m
      </text>

      {/* Docks */}
      {docks.map((dock) => {
        const isSelected = selectedDock?.id === dock.id
        return (
          <g
            key={dock.id}
            onClick={() => onDockSelect(isSelected ? null : dock)}
            style={{ cursor: 'pointer' }}
          >
            {/* Dock body */}
            <rect
              x={dock.positionX - 7} y={dock.positionY - 4}
              width={14} height={10}
              fill={DOCK_FILL[dock.status]}
              stroke={isSelected ? '#3b82f6' : DOCK_STROKE[dock.status]}
              strokeWidth={isSelected ? 1.5 : 0.75}
              rx="1"
            />
            <text
              x={dock.positionX} y={dock.positionY + 1.5}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="4" fill="#374151" fontFamily="sans-serif" fontWeight="bold"
            >
              {dock.code}
            </text>
            {/* Truck silhouette when occupied */}
            {dock.status === 'OCCUPIED' && (
              <>
                <rect
                  x={dock.positionX - 6} y={dock.positionY + 7}
                  width={12} height={8}
                  fill="#fca5a5" stroke="#ef4444" strokeWidth="0.5" rx="1"
                />
                <rect
                  x={dock.positionX - 6} y={dock.positionY + 7}
                  width={4} height={5}
                  fill="#f87171" rx="0.5"
                />
              </>
            )}
          </g>
        )
      })}

      {/* Wind rose (top-right) */}
      <g transform={`translate(${siteWidth - 10}, 8)`}>
        <circle cx="0" cy="0" r="5" fill="white" stroke="#94a3b8" strokeWidth="0.5" />
        <text textAnchor="middle" fontSize="4.5" fill="#374151" fontFamily="sans-serif" fontWeight="bold" x="0" y="-1.5">N</text>
        <line x1="0" y1="1" x2="0" y2="4.5" stroke="#374151" strokeWidth="0.75" />
        <polygon points="0,1 -1,3.5 0,3 1,3.5" fill="#374151" />
      </g>

      {/* Scale bar (bottom-right) */}
      <g transform={`translate(${siteWidth - 55}, ${siteHeight - 6})`}>
        <line x1="0" y1="0" x2="25" y2="0" stroke="#64748b" strokeWidth="0.75" />
        <line x1="0" y1="-2" x2="0" y2="2" stroke="#64748b" strokeWidth="0.75" />
        <line x1="25" y1="-2" x2="25" y2="2" stroke="#64748b" strokeWidth="0.75" />
        <text x="12.5" y="-3.5" textAnchor="middle" fontSize="4" fill="#64748b" fontFamily="sans-serif">25m</text>
      </g>
    </svg>
  )
}
