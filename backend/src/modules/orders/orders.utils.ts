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

export function validateOrderPayload(
  body: CreateOrderBody,
  role: "admin" | "client" | "partner"
): string | null {
  if (!body.client_warehouse_id) return "client_warehouse_id is required";
  if (!body.order_lines || !Array.isArray(body.order_lines) || body.order_lines.length === 0) {
    return "order_lines must be a non-empty array";
  }
  if (!body.delivery_need) return "delivery_need is required";

  if (role === "admin" && !body.customer) {
    return "customer is required for admin-created orders";
  }

  if (role === "admin" && !body.customer?.customer_id) {
    return "customer.customer_id is required for admin-created orders";
  }

  if (role === "admin" && !body.customer?.company_name) {
    return "customer.company_name is required";
  }

  if (!body.delivery_need.requested_delivery_date) {
    return "delivery_need.requested_delivery_date is required";
  }

  if (!body.delivery_need.delivery_time_window) {
    return "delivery_need.delivery_time_window is required";
  }

  if (!body.delivery_need.urgency_level) {
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
