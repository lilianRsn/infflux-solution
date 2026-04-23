export type SlotStatus = 'FREE' | 'PARTIAL' | 'FULL'
export type DockStatus = 'FREE' | 'OCCUPIED' | 'MAINTENANCE'
export type CardinalDirection = 'N' | 'S' | 'E' | 'W'

export interface StorageSlot {
  id: string
  rank: number
  side: 'L' | 'R'
  totalVolume: number
  usedVolume: number
  status: SlotStatus
  updatedAt: string
}

export interface WarehouseAisle {
  id: string
  code: string
  positionX: number
  positionY: number
  slots: StorageSlot[]
}

export interface WarehouseFloor {
  id: string
  level: number
  label: string
  aisles: WarehouseAisle[]
}

export interface LoadingDock {
  id: string
  code: string
  positionX: number
  positionY: number
  side: CardinalDirection
  maxTonnage: number
  maxWidthMeters: number
  status: DockStatus
  currentOrderId?: string
}

export interface ParkingZone {
  id: string
  positionX: number
  positionY: number
  width: number
  height: number
  capacity: number
}

export interface ClientWarehouseExterior {
  siteWidth: number
  siteHeight: number
  buildingX: number
  buildingY: number
  buildingWidth: number
  buildingHeight: number
  accessDirection: CardinalDirection
  docks: LoadingDock[]
  parkingZones: ParkingZone[]
}

export interface ClientWarehouse {
  id: string
  clientId: string
  name: string
  address: string
  floors: WarehouseFloor[]
  exterior: ClientWarehouseExterior
}

function slot(
  id: string,
  rank: number,
  side: 'L' | 'R',
  status: SlotStatus,
): StorageSlot {
  const totalVolume = 20
  const usedVolume =
    status === 'FREE' ? 0 : status === 'FULL' ? 20 : (rank * 3 + (side === 'L' ? 1 : 2)) % 10 + 4
  return { id, rank, side, totalVolume, usedVolume, status, updatedAt: '2026-04-23T10:00:00Z' }
}

export const MOCK_WAREHOUSE: ClientWarehouse = {
  id: 'wh-001',
  clientId: 'client-001',
  name: 'Entrepôt Lyon-Nord',
  address: '12 Rue des Logisticiens, 69100 Villeurbanne',
  floors: [
    {
      id: 'floor-rdc',
      level: 0,
      label: 'Rez-de-chaussée',
      aisles: [
        {
          id: 'aisle-A1',
          code: 'A1',
          positionX: 0,
          positionY: 0,
          slots: [
            slot('A1-L1', 1, 'L', 'FULL'),
            slot('A1-L2', 2, 'L', 'PARTIAL'),
            slot('A1-L3', 3, 'L', 'FREE'),
            slot('A1-L4', 4, 'L', 'FULL'),
            slot('A1-L5', 5, 'L', 'PARTIAL'),
            slot('A1-L6', 6, 'L', 'FREE'),
            slot('A1-R1', 1, 'R', 'FULL'),
            slot('A1-R2', 2, 'R', 'FULL'),
            slot('A1-R3', 3, 'R', 'PARTIAL'),
            slot('A1-R4', 4, 'R', 'FREE'),
            slot('A1-R5', 5, 'R', 'FREE'),
            slot('A1-R6', 6, 'R', 'PARTIAL'),
          ],
        },
        {
          id: 'aisle-A2',
          code: 'A2',
          positionX: 1,
          positionY: 0,
          slots: [
            slot('A2-L1', 1, 'L', 'FREE'),
            slot('A2-L2', 2, 'L', 'FREE'),
            slot('A2-L3', 3, 'L', 'FULL'),
            slot('A2-L4', 4, 'L', 'PARTIAL'),
            slot('A2-L5', 5, 'L', 'FREE'),
            slot('A2-L6', 6, 'L', 'FULL'),
            slot('A2-R1', 1, 'R', 'FULL'),
            slot('A2-R2', 2, 'R', 'PARTIAL'),
            slot('A2-R3', 3, 'R', 'FREE'),
            slot('A2-R4', 4, 'R', 'FREE'),
            slot('A2-R5', 5, 'R', 'FULL'),
            slot('A2-R6', 6, 'R', 'PARTIAL'),
          ],
        },
        {
          id: 'aisle-A3',
          code: 'A3',
          positionX: 2,
          positionY: 0,
          slots: [
            slot('A3-L1', 1, 'L', 'FREE'),
            slot('A3-L2', 2, 'L', 'FREE'),
            slot('A3-L3', 3, 'L', 'FREE'),
            slot('A3-L4', 4, 'L', 'FULL'),
            slot('A3-L5', 5, 'L', 'PARTIAL'),
            slot('A3-L6', 6, 'L', 'FULL'),
            slot('A3-R1', 1, 'R', 'FREE'),
            slot('A3-R2', 2, 'R', 'PARTIAL'),
            slot('A3-R3', 3, 'R', 'FULL'),
            slot('A3-R4', 4, 'R', 'FULL'),
            slot('A3-R5', 5, 'R', 'FREE'),
            slot('A3-R6', 6, 'R', 'FREE'),
          ],
        },
      ],
    },
  ],
  exterior: {
    siteWidth: 200,
    siteHeight: 150,
    buildingX: 10,
    buildingY: 30,
    buildingWidth: 180,
    buildingHeight: 90,
    accessDirection: 'S',
    docks: [
      {
        id: 'dock-D1',
        code: 'D1',
        positionX: 35,
        positionY: 120,
        side: 'S',
        maxTonnage: 26,
        maxWidthMeters: 3.5,
        status: 'FREE',
      },
      {
        id: 'dock-D2',
        code: 'D2',
        positionX: 75,
        positionY: 120,
        side: 'S',
        maxTonnage: 19,
        maxWidthMeters: 3.0,
        status: 'OCCUPIED',
        currentOrderId: 'ORD-2026-0142',
      },
      {
        id: 'dock-D3',
        code: 'D3',
        positionX: 115,
        positionY: 120,
        side: 'S',
        maxTonnage: 26,
        maxWidthMeters: 3.5,
        status: 'MAINTENANCE',
      },
      {
        id: 'dock-D4',
        code: 'D4',
        positionX: 155,
        positionY: 120,
        side: 'S',
        maxTonnage: 12,
        maxWidthMeters: 2.5,
        status: 'FREE',
      },
    ],
    parkingZones: [
      {
        id: 'park-1',
        positionX: 10,
        positionY: 4,
        width: 110,
        height: 23,
        capacity: 8,
      },
    ],
  },
}

export function computeOccupancyStats(floor: WarehouseFloor) {
  const allSlots = floor.aisles.flatMap((a) => a.slots)
  const total = allSlots.length
  const free = allSlots.filter((s) => s.status === 'FREE').length
  const partial = allSlots.filter((s) => s.status === 'PARTIAL').length
  const full = allSlots.filter((s) => s.status === 'FULL').length
  const totalVolume = allSlots.reduce((sum, s) => sum + s.totalVolume, 0)
  const usedVolume = allSlots.reduce((sum, s) => sum + s.usedVolume, 0)
  const occupancyRate = Math.round((usedVolume / totalVolume) * 100)
  return { total, free, partial, full, totalVolume, usedVolume, occupancyRate }
}

export function computeDockStats(docks: LoadingDock[]) {
  const free = docks.filter((d) => d.status === 'FREE').length
  const occupied = docks.filter((d) => d.status === 'OCCUPIED').length
  const maintenance = docks.filter((d) => d.status === 'MAINTENANCE').length
  const maxTonnage = Math.max(...docks.map((d) => d.maxTonnage))
  return { total: docks.length, free, occupied, maintenance, maxTonnage }
}
