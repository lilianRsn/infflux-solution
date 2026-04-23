'use client'

import type { FloorConfig } from '@/lib/warehouse-store'

const RANK_W = 20
const RACK_W = 52
const WALK_W = 36
const AISLE_W = RACK_W + WALK_W + RACK_W
const AISLE_GAP = 12
const SLOT_H = 40
const HEADER_H = 38
const MARGIN_V = 10
const MARGIN_R = 10

interface Props {
  readonly floor: FloorConfig
  readonly slotVolume: number
}

export default function BuilderPreview({ floor, slotVolume }: Props) {
  const aisles = floor.aisles
  const n = Math.max(aisles.length, 1)
  const maxRanks = aisles.length > 0 ? Math.max(...aisles.map((a) => a.ranks)) : 4

  const vw = RANK_W + n * AISLE_W + (n - 1) * AISLE_GAP + MARGIN_R
  const vh = MARGIN_V + HEADER_H + maxRanks * SLOT_H + MARGIN_V

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full" style={{ display: 'block' }}>
      {/* Building shell */}
      <rect x={1} y={1} width={vw - 2} height={vh - 2} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" rx="3" />

      {/* North indicator */}
      <text x={vw / 2} y={13} textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="sans-serif">
        ▲ NORD
      </text>

      {/* Rank labels */}
      {Array.from({ length: maxRanks }, (_, ri) => (
        <text
          key={ri}
          x={RANK_W - 3}
          y={MARGIN_V + HEADER_H + ri * SLOT_H + SLOT_H / 2 + 3}
          textAnchor="end"
          fontSize="7"
          fill="#cbd5e1"
          fontFamily="sans-serif"
        >
          {ri + 1}
        </text>
      ))}

      {aisles.map((aisle, i) => {
        const ax = RANK_W + i * (AISLE_W + AISLE_GAP)
        const slotY0 = MARGIN_V + HEADER_H

        return (
          <g key={aisle.id}>
            {/* Aisle code */}
            <text
              x={ax + RACK_W + WALK_W / 2}
              y={slotY0 - 9}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#475569"
              fontFamily="sans-serif"
            >
              {aisle.code || '—'}
            </text>

            {/* Walkway */}
            <rect
              x={ax + RACK_W}
              y={slotY0}
              width={WALK_W}
              height={aisle.ranks * SLOT_H}
              fill="#f8fafc"
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />

            {/* Slots */}
            {Array.from({ length: aisle.ranks }, (_, ri) => {
              const y = slotY0 + ri * SLOT_H
              return (
                <g key={ri}>
                  <rect x={ax + 1} y={y + 1} width={RACK_W - 2} height={SLOT_H - 2} fill="#dcfce7" stroke="#86efac" strokeWidth="0.75" rx="2" />
                  <text x={ax + RACK_W / 2} y={y + SLOT_H / 2 + 3} textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="sans-serif">
                    {slotVolume}m³
                  </text>
                  <rect x={ax + RACK_W + WALK_W + 1} y={y + 1} width={RACK_W - 2} height={SLOT_H - 2} fill="#dcfce7" stroke="#86efac" strokeWidth="0.75" rx="2" />
                  <text x={ax + RACK_W + WALK_W + RACK_W / 2} y={y + SLOT_H / 2 + 3} textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="sans-serif">
                    {slotVolume}m³
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
