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