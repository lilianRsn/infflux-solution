export interface CustomerInput {
  customer_id?: string;
  company_name: string;
  billing_address?: string;
  main_contact_name?: string;
  main_contact_phone?: string;
  main_contact_email?: string;
}

export interface DeliveryDestinationInput {
  delivery_address?: string;
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
  client_warehouse_id: string;
  customer?: CustomerInput;
  destination_warehouse_id?: string;
  delivery_destination: DeliveryDestinationInput;
  order_lines: OrderLineInput[];
  delivery_need: DeliveryNeedInput;
}

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "client" | "partner";
}
