export interface UpdateDeliveryPlanStatusBody {
  status: "DRAFT" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
}

export interface ReprogramOrderBody {
  requested_delivery_date?: string;
  delivery_time_window?: "morning" | "afternoon" | "full_day";
  urgency_level?: "urgent" | "standard" | "flexible";
  auto_replan?: boolean;
}
