export interface Order {
  id: string
  order_number: string
  customer_id: string | null
  company_name: string
  delivery_address: string
  site_name: string | null
  status: string
  created_at: string
  total_pallets: number
  urgency_level: 'urgent' | 'standard' | 'flexible'
  service_level: 'priority' | 'standard' | 'optimized' | null
  eligible_for_early_delivery: boolean
  eligible_for_grouped_delivery: boolean
  eligible_for_partner_carrier: boolean
  eligible_for_route_fillup: boolean
  delivery_flexibility_score: number
  requested_delivery_date: string
}

export interface ClientUser {
  id: string
  company_name: string
  main_contact_name: string | null
  main_contact_email: string | null
  created_at: string
}

export interface WarehouseAvailability {
  warehouse_id: string
  warehouse_name: string
  client_id: string
  company_name: string
  total_volume: number
  used_volume: number
  available_volume: number
  total_pallets: number
  used_pallets: number
  available_pallets: number
  free_docks: number
  occupied_docks: number
  maintenance_docks: number
}

export type OrderLine = {
  product_id: string
  quantity_pallets: number
}

export type DeliveryNeed = {
  requested_delivery_date: string
  delivery_time_window: 'morning' | 'afternoon' | 'full_day'
  urgency_level: 'urgent' | 'standard' | 'flexible'
  can_receive_early: boolean
  earliest_acceptable_delivery_date: string
  can_store_early_delivery: boolean
  grouped_delivery_allowed: boolean
  latest_acceptable_grouped_delivery_date: string
  split_delivery_allowed: boolean
  partner_delivery_allowed: boolean
}

export type ClientCreateOrderPayload = {
  delivery_destination: {
    delivery_address: string
    site_name: string
    delivery_contact_name: string
    delivery_contact_phone: string
  }
  order_lines: OrderLine[]
  delivery_need: DeliveryNeed
}
