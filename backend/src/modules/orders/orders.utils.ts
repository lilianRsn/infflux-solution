import { CreateOrderBody, DeliveryNeedInput } from "./orders.types";

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
