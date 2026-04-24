export type TruckStatus = 'AVAILABLE' | 'ON_ROUTE' | 'LOADING' | 'MAINTENANCE'
export type PlanStatus = 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
export type TimeWindow = 'morning' | 'afternoon' | 'full_day'
export type PlanningStatus =
  | 'UNPLANNED'
  | 'PARTIALLY_PLANNED'
  | 'PLANNED'
  | 'BLOCKED'
  | 'DELIVERED'

export interface Truck {
  id: string
  name: string
  license_plate: string
  max_palettes: number
  max_weight_kg: number
  max_volume_m3: number
  status: TruckStatus
  current_route: string | null
  fill_percent: number
  driver_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DeliveryPlan {
  id: string
  planned_delivery_date: string
  planned_time_window: TimeWindow
  client_warehouse_id: string
  client_warehouse_name: string
  status: PlanStatus
  total_pallets: number
  total_volume_m3: number
  priority_score: number
  orders_count: number
  trucks_count: number
  docks_count: number
  created_at: string
  updated_at: string
}

export interface PlanOrder {
  id: string
  order_number: string
  company_name: string
  requested_delivery_date: string
  delivery_time_window: TimeWindow
  urgency_level: 'urgent' | 'standard' | 'flexible'
  total_pallets: number
  planning_status: PlanningStatus
  allocated_pallets: number
}

export interface PlanTruck {
  id: string
  name: string
  license_plate: string
  max_palettes: number
  max_volume_m3: number
  max_weight_kg: number
  status: TruckStatus
  assigned_pallets: number
  assigned_volume_m3: number
}

export interface DockAssignment {
  id: string
  code: string
  side: 'N' | 'S' | 'E' | 'W'
  position_x: number
  position_y: number
  truck_id: string
  truck_code: string
}

export interface DeliveryPlanDetail extends DeliveryPlan {
  client_warehouse_address: string
  orders: PlanOrder[]
  trucks: PlanTruck[]
  dock_assignments: DockAssignment[]
}

export interface GeneratePlansResult {
  generated_count: number
  blocked_count: number
  partially_planned_count: number
  generated_plans: Array<{
    delivery_plan_id: string
    order_id: string
    order_number: string
    allocated_pallets: number
    trucks: string[]
    assigned_docks: string[]
    planned_delivery_date: string
    planned_time_window: TimeWindow
  }>
  blocked_orders: Array<{
    order_id: string
    order_number: string
    blocked_reason: string
  }>
  partially_planned_orders: Array<{
    order_id: string
    order_number: string
    remaining_pallets: number
    blocked_reason: string
  }>
}

export interface AdminPlanningOrder {
  id: string
  order_number: string
  customer_id: string | null
  client_warehouse_id: string | null
  company_name: string
  site_name: string | null
  requested_delivery_date: string
  delivery_time_window: TimeWindow
  urgency_level: 'urgent' | 'standard' | 'flexible'
  planning_status: PlanningStatus
  blocked_reason: string | null
  total_pallets: number
  split_delivery_allowed: boolean
  created_at: string
}

export interface ReprogramOrderPayload {
  requested_delivery_date?: string
  delivery_time_window?: TimeWindow
  urgency_level?: 'urgent' | 'standard' | 'flexible'
  auto_replan?: boolean
}
