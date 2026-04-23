export interface UpdateDeliveryPlanStatusBody {
  status: "DRAFT" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
}
