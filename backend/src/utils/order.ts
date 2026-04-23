export interface CustomerInput {
  customer_id?: string;
  company_name: string;
  billing_address?: string;
  main_contact_name?: string;
  main_contact_phone?: string;
  main_contact_email?: string;
}

export interface DeliveryDestinationInput {
  delivery_address: string;
  site_name?: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
}

export interface OrderLineInput {
  product_id: string;
  quantity_pallets: number;
}

export interface DeliveryNeedInput {
  requested_delivery_date: string;
  delivery_time_window: "morning" | "afternoon" | "full_day";
  urgency_level: "urgent" | "standard" | "flexible";
  can_receive_early?: boolean;
  earliest_acceptable_delivery_date?: string;
  can_store_early_delivery?: boolean;
  available_storage_capacity_pallets?: number;
  grouped_delivery_allowed?: boolean;
  latest_acceptable_grouped_delivery_date?: string;
  split_delivery_allowed?: boolean;
  partner_delivery_allowed?: boolean;
}

export interface CreateOrderBody {
  customer: CustomerInput;
  delivery_destination: DeliveryDestinationInput;
  order_lines: OrderLineInput[];
  delivery_need: DeliveryNeedInput;
}

export function computeFlexibilityScore(deliveryNeed: DeliveryNeedInput): number {
  let score = 0;

  if (deliveryNeed.urgency_level === "flexible") score += 30;
  if (deliveryNeed.can_receive_early) score += 20;
  if (deliveryNeed.can_store_early_delivery) score += 20;
  if (deliveryNeed.grouped_delivery_allowed) score += 15;
  if (deliveryNeed.split_delivery_allowed) score += 10;
  if (deliveryNeed.partner_delivery_allowed) score += 5;

  return score;
}

export function validateOrderPayload(body: CreateOrderBody): string | null {
  if (!body.customer) return "customer is required";
  if (!body.delivery_destination) return "delivery_destination is required";
  if (!body.order_lines || !Array.isArray(body.order_lines) || body.order_lines.length === 0) {
    return "order_lines must be a non-empty array";
  }
  if (!body.delivery_need) return "delivery_need is required";

  const { customer, delivery_destination, delivery_need } = body;

  if (!customer.company_name) return "customer.company_name is required";
  if (!delivery_destination.delivery_address) {
    return "delivery_destination.delivery_address is required";
  }
  if (!delivery_need.requested_delivery_date) {
    return "delivery_need.requested_delivery_date is required";
  }
  if (!delivery_need.delivery_time_window) {
    return "delivery_need.delivery_time_window is required";
  }
  if (!delivery_need.urgency_level) {
    return "delivery_need.urgency_level is required";
  }

  for (const line of body.order_lines) {
    if (!line.product_id) return "Each order line must have product_id";
    if (!line.quantity_pallets || line.quantity_pallets <= 0) {
      return "Each order line must have quantity_pallets > 0";
    }
  }

  return null;
}
