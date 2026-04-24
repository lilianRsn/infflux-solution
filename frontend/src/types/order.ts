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
  client_warehouse_id?: string
  destination_warehouse_id?: string
  delivery_destination: {
    delivery_address: string
    site_name: string
    delivery_contact_name: string
    delivery_contact_phone: string
  }
  order_lines: OrderLine[]
  delivery_need: DeliveryNeed
}
