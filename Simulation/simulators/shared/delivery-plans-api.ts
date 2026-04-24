import { ApiClient } from "./api-client";

export type DeliveryPlanStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BLOCKED";

export type PlanTimeWindow = "morning" | "afternoon" | "full_day";

export interface GeneratedPlan {
  delivery_plan_id: string;
  order_id: string;
  order_number: string;
  allocated_pallets: number;
  trucks: string[];
  assigned_docks: string[];
  planned_delivery_date: string;
  planned_time_window: PlanTimeWindow;
}

export interface BlockedOrder {
  order_id: string;
  order_number: string;
  blocked_reason: string;
}

export interface GenerateDeliveryPlansResult {
  generated_count: number;
  blocked_count: number;
  partially_planned_count: number;
  generated_plans: GeneratedPlan[];
  blocked_orders: BlockedOrder[];
  partially_planned_orders: Array<BlockedOrder & { remaining_pallets: number }>;
}

export interface DeliveryPlanSummary {
  id: string;
  planned_delivery_date: string;
  planned_time_window: PlanTimeWindow;
  client_warehouse_id: string;
  client_warehouse_name: string;
  status: DeliveryPlanStatus;
  total_pallets: number;
  priority_score: number;
  orders_count: string | number;
  trucks_count: string | number;
  docks_count: string | number;
}

export function generateDeliveryPlans(
  client: ApiClient
): Promise<GenerateDeliveryPlansResult> {
  return client.post<GenerateDeliveryPlansResult>("/api/delivery-plans/generate", {});
}

export function listDeliveryPlans(client: ApiClient): Promise<DeliveryPlanSummary[]> {
  return client.get<DeliveryPlanSummary[]>("/api/delivery-plans");
}

export function getDeliveryPlan(
  client: ApiClient,
  planId: string
): Promise<DeliveryPlanSummary & Record<string, unknown>> {
  return client.get(`/api/delivery-plans/${planId}`);
}

export function updateDeliveryPlanStatus(
  client: ApiClient,
  planId: string,
  status: DeliveryPlanStatus
): Promise<DeliveryPlanSummary> {
  return client.patch<DeliveryPlanSummary>(
    `/api/delivery-plans/${planId}/status`,
    { status }
  );
}
