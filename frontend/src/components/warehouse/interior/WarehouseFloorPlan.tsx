'use client'

import type { WarehouseFloor, StorageSlot } from '@/lib/warehouse-data'

const SLOT_FILL = {
  FREE: '#dcfce7',
  PARTIAL: '#fef3c7',
  FULL: '#fee2e2',
}
const SLOT_STROKE = {
  FREE: '#86efac',
  PARTIAL: '#fcd34d',
  FULL: '#fca5a5',
}

// Layout constants (SVG units = px, viewBox 680×500)
const AISLE_X = [20, 235, 450]
const RACK_W = 75
const WALK_W = 60
const SLOT_Y0 = 70
const SLOT_H = 70
const RANKS = 6

interface Props {
  floor: WarehouseFloor
  selectedSlot: StorageSlot | null
  onSlotSelect: (slot: StorageSlot | null) => void
}

export default function WarehouseFloorPlan({ floor, selectedSlot, onSlotSelect }: Props) {
  const slotMap = new Map(floor.aisles.flatMap((a) => a.slots).map((s) => [s.id, s]))

  function getSlot(code: string, rank: number, side: 'L' | 'R') {
    return slotMap.get(`${code}-${side}${rank}`) ?? null
  }

  return (
    <svg viewBox="0 0 680 500" className="w-full" style={{ display: 'block' }}>
      {/* Building shell */}
      <rect x="10" y="10" width="660" height="480" fill="#f8fafc" stroke="#334155" strokeWidth="2" rx="2" />

      {/* North indicator */}
      <text x="340" y="28" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">
        ▲ NORD
      </text>

      {floor.aisles.map((aisle, i) => {
        const ax = AISLE_X[i]
        return (
          <g key={aisle.id}>
            {/* Aisle code label */}
            <text
              x={ax + RACK_W + WALK_W / 2}
              y={56}
              textAnchor="middle"
              fontSize="13"
              fontWeight="600"
              fill="#475569"
              fontFamily="sans-serif"
            >
              {aisle.code}
            </text>

            {/* Walkway */}
            <rect
              x={ax + RACK_W}
              y={SLOT_Y0}
              width={WALK_W}
              height={RANKS * SLOT_H}
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />

            {/* Slots */}
            {Array.from({ length: RANKS }, (_, ri) => {
              const rank = ri + 1
              const y = SLOT_Y0 + ri * SLOT_H
              const leftSlot = getSlot(aisle.code, rank, 'L')
              const rightSlot = getSlot(aisle.code, rank, 'R')
              const lSelected = selectedSlot?.id === leftSlot?.id
              const rSelected = selectedSlot?.id === rightSlot?.id

              return (
                <g key={rank}>
                  {/* Left slot */}
                  {leftSlot && (
                    <g
                      onClick={() => onSlotSelect(lSelected ? null : leftSlot)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={ax + 1}
                        y={y + 1}
                        width={RACK_W - 2}
                        height={SLOT_H - 2}
                        fill={SLOT_FILL[leftSlot.status]}
                        stroke={lSelected ? '#3b82f6' : SLOT_STROKE[leftSlot.status]}
                        strokeWidth={lSelected ? 2 : 1}
                        rx="2"
                      />
                      <text
                        x={ax + RACK_W / 2}
                        y={y + SLOT_H / 2 + 4}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#64748b"
                        fontFamily="sans-serif"
                      >
                        {leftSlot.usedVolume}/{leftSlot.totalVolume}
                      </text>
                    </g>
                  )}

                  {/* Right slot */}
                  {rightSlot && (
                    <g
                      onClick={() => onSlotSelect(rSelected ? null : rightSlot)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={ax + RACK_W + WALK_W + 1}
                        y={y + 1}
                        width={RACK_W - 2}
                        height={SLOT_H - 2}
                        fill={SLOT_FILL[rightSlot.status]}
                        stroke={rSelected ? '#3b82f6' : SLOT_STROKE[rightSlot.status]}
                        strokeWidth={rSelected ? 2 : 1}
                        rx="2"
                      />
                      <text
                        x={ax + RACK_W + WALK_W + RACK_W / 2}
                        y={y + SLOT_H / 2 + 4}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#64748b"
                        fontFamily="sans-serif"
                      >
                        {rightSlot.usedVolume}/{rightSlot.totalVolume}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}

      {/* Non-storage zone (office) */}
      <rect x="12" y="420" width="5" height="68" fill="#e2e8f0" />
      <rect x="660" y="420" width="8" height="68" fill="#e2e8f0" />
    </svg>
  )
}
