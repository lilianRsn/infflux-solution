'use client'

import type { WarehouseAisle, WarehouseFloor, StorageSlot } from '@/lib/warehouse-data'

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

const RACK_W = 75
const WALK_W = 60
const SLOT_H = 70
const SLOT_Y0 = 70
const AISLE_STRIDE = RACK_W + WALK_W + RACK_W + 5
const MARGIN_L = 20
const MARGIN_R = 30
const MARGIN_B = 30

interface Props {
  floor: WarehouseFloor
  selectedSlot: StorageSlot | null
  onSlotSelect: (slot: StorageSlot | null) => void
}

function getSlot(aisle: WarehouseAisle, rank: number, side: 'L' | 'R'): StorageSlot | null {
  return aisle.slots.find((s) => s.rank === rank && s.side === side) ?? null
}

export default function WarehouseFloorPlan({ floor, selectedSlot, onSlotSelect }: Props) {
  const maxRanks = floor.aisles.length > 0
    ? Math.max(...floor.aisles.flatMap((a) => a.slots.map((s) => s.rank)), 1)
    : 6

  const svgW = MARGIN_L + floor.aisles.length * AISLE_STRIDE + MARGIN_R
  const svgH = SLOT_Y0 + maxRanks * SLOT_H + MARGIN_B

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ display: 'block' }}>
      {/* Building shell */}
      <rect
        x="5" y="5"
        width={svgW - 10} height={svgH - 10}
        fill="#f8fafc" stroke="#334155" strokeWidth="2" rx="2"
      />

      {/* North indicator */}
      <text x={svgW / 2} y="24" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">
        ▲ NORD
      </text>

      {floor.aisles.map((aisle, i) => {
        const ax = MARGIN_L + i * AISLE_STRIDE

        return (
          <g key={aisle.id}>
            {/* Aisle label */}
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
              height={maxRanks * SLOT_H}
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />

            {/* Rank number labels on left margin */}
            {Array.from({ length: maxRanks }, (_, ri) => {
              const rank = ri + 1
              const y = SLOT_Y0 + ri * SLOT_H
              return (
                <text
                  key={`rank-${rank}`}
                  x={ax - 4}
                  y={y + SLOT_H / 2 + 4}
                  textAnchor="end"
                  fontSize="9"
                  fill="#cbd5e1"
                  fontFamily="sans-serif"
                >
                  {rank}
                </text>
              )
            })}

            {/* Slots */}
            {Array.from({ length: maxRanks }, (_, ri) => {
              const rank = ri + 1
              const y = SLOT_Y0 + ri * SLOT_H
              const leftSlot = getSlot(aisle, rank, 'L')
              const rightSlot = getSlot(aisle, rank, 'R')
              const lSelected = selectedSlot?.id === leftSlot?.id
              const rSelected = selectedSlot?.id === rightSlot?.id

              return (
                <g key={rank}>
                  {leftSlot && (
                    <g
                      onClick={() => onSlotSelect(lSelected ? null : leftSlot)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={ax + 1} y={y + 1}
                        width={RACK_W - 2} height={SLOT_H - 2}
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

                  {rightSlot && (
                    <g
                      onClick={() => onSlotSelect(rSelected ? null : rightSlot)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={ax + RACK_W + WALK_W + 1} y={y + 1}
                        width={RACK_W - 2} height={SLOT_H - 2}
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
    </svg>
  )
}
