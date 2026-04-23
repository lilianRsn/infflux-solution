import type { ClientWarehouse, StorageSlot, WarehouseAisle, WarehouseFloor } from './warehouse-data'
import { MOCK_WAREHOUSE } from './warehouse-data'

export interface AisleConfig {
  id: string
  code: string
  ranks: number
}

export interface FloorConfig {
  id: string
  label: string
  aisles: AisleConfig[]
}

export interface ExteriorConfig {
  dockCount: number
  parkingCount: number
  maxTonnage: number
  dockSpacing: number
}

export interface WarehouseConfig {
  id: string
  name: string
  address: string
  slotVolume: number
  floors: FloorConfig[]
  exterior: ExteriorConfig
  createdAt: string
}

const STORAGE_KEY = 'infflux_warehouses_v1'

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
}

function buildSlot(aisleCode: string, rank: number, side: 'L' | 'R', volume: number): StorageSlot {
  return {
    id: `${aisleCode}-${side}${rank}`,
    rank,
    side,
    totalVolume: volume,
    usedVolume: 0,
    status: 'FREE',
    updatedAt: new Date().toISOString(),
  }
}

function buildAisle(cfg: AisleConfig, index: number, slotVolume: number): WarehouseAisle {
  const slots: StorageSlot[] = []
  for (let r = 1; r <= cfg.ranks; r++) {
    slots.push(buildSlot(cfg.code, r, 'L', slotVolume))
    slots.push(buildSlot(cfg.code, r, 'R', slotVolume))
  }
  return { id: `aisle-${cfg.code}-${index}`, code: cfg.code, positionX: index, positionY: 0, slots }
}

export function configToWarehouse(cfg: WarehouseConfig): ClientWarehouse {
  const floors: WarehouseFloor[] = cfg.floors.map((floor, fi) => ({
    id: `${cfg.id}-f${fi}`,
    level: fi,
    label: floor.label,
    aisles: floor.aisles.map((aisle, ai) => buildAisle(aisle, ai, cfg.slotVolume)),
  }))

  const exterior = cfg.exterior || {
    dockCount: 3,
    parkingCount: 5,
    maxTonnage: 26,
    dockSpacing: 40,
  }

  const docks = Array.from({ length: exterior.dockCount }, (_, i) => ({
    id: `dock-${i}`,
    code: `D${i + 1}`,
    positionX: 30 + i * (exterior.dockSpacing || 40),
    positionY: 120,
    side: 'S' as const,
    maxTonnage: exterior.maxTonnage,
    maxWidthMeters: 3.5,
    status: 'FREE' as const,
  }))

  return {
    id: cfg.id,
    clientId: 'client-self',
    name: cfg.name,
    address: cfg.address,
    floors,
    exterior: {
      siteWidth: Math.max(200, 60 + exterior.dockCount * (exterior.dockSpacing || 40)),
      siteHeight: 150,
      buildingX: 10,
      buildingY: 30,
      buildingWidth: Math.max(180, 40 + exterior.dockCount * (exterior.dockSpacing || 40)),
      buildingHeight: 90,
      accessDirection: 'S',
      docks,
      parkingZones: [
        {
          id: 'park-1',
          positionX: 10,
          positionY: 4,
          width: Math.min(180, exterior.parkingCount * 15),
          height: 23,
          capacity: exterior.parkingCount,
        },
      ],
    },
  }
}

export function loadConfigs(): WarehouseConfig[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WarehouseConfig[]) : []
  } catch {
    return []
  }
}

export function saveConfig(cfg: WarehouseConfig): void {
  const all = loadConfigs()
  const idx = all.findIndex((c) => c.id === cfg.id)
  if (idx >= 0) all[idx] = cfg
  else all.push(cfg)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function deleteConfig(id: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loadConfigs().filter((c) => c.id !== id)))
}

export function getConfig(id: string): WarehouseConfig | null {
  return loadConfigs().find((c) => c.id === id) ?? null
}

export function newWarehouseId(): string {
  return uid('wh')
}

export function newFloor(index: number): FloorConfig {
  const LABELS = ['Rez-de-chaussée', 'R+1', 'R+2', 'R+3', 'R+4']
  return {
    id: uid('floor'),
    label: LABELS[index] ?? `Niveau ${index}`,
    aisles: [{ id: uid('aisle'), code: nextCode([]), ranks: 6 }],
  }
}

function nextCode(existing: string[]): string {
  for (const l of 'ABCDEFGH') {
    for (const n of '123456789') {
      const code = `${l}${n}`
      if (!existing.includes(code)) return code
    }
  }
  return 'X1'
}

export function newAisle(existingCodes: string[]): AisleConfig {
  return { id: uid('aisle'), code: nextCode(existingCodes), ranks: 6 }
}
