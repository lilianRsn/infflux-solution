/// <reference types="jest" />

import {
  computeFlexibilityScore,
  validateOrderPayload,
  CreateOrderBody
} from "../src/utils/order";

describe("order utils", () => {
  const validPayload: CreateOrderBody = {
    customer: {
      company_name: "Client A",
      billing_address: "12 rue Exemple, Paris",
      main_contact_name: "Jean Dupont",
      main_contact_phone: "0600000000",
      main_contact_email: "jean@clienta.fr"
    },
    delivery_destination: {
      delivery_address: "25 avenue Livraison, Lyon",
      site_name: "Magasin Lyon",
      delivery_contact_name: "Sophie Martin",
      delivery_contact_phone: "0611111111"
    },
    order_lines: [
      {
        product_id: "PROD_001",
        quantity_pallets: 4
      }
    ],
    delivery_need: {
      requested_delivery_date: "2026-04-28",
      delivery_time_window: "morning",
      urgency_level: "flexible",
      can_receive_early: true,
      earliest_acceptable_delivery_date: "2026-04-26",
      can_store_early_delivery: true,
      available_storage_capacity_pallets: 10,
      grouped_delivery_allowed: true,
      latest_acceptable_grouped_delivery_date: "2026-04-30",
      split_delivery_allowed: false,
      partner_delivery_allowed: true
    }
  };

  it("returns null for a valid payload", () => {
    expect(validateOrderPayload(validPayload)).toBeNull();
  });

  it("rejects an empty order_lines array", () => {
    const payload = {
      ...validPayload,
      order_lines: []
    };

    expect(validateOrderPayload(payload)).toBe("order_lines must be a non-empty array");
  });

  it("rejects a line with invalid pallet quantity", () => {
    const payload = {
      ...validPayload,
      order_lines: [
        {
          product_id: "PROD_001",
          quantity_pallets: 0
        }
      ]
    };

    expect(validateOrderPayload(payload)).toBe(
      "Each order line must have quantity_pallets > 0"
    );
  });

  it("computes the right flexibility score for a flexible order", () => {
    const score = computeFlexibilityScore(validPayload.delivery_need);
    expect(score).toBe(90);
  });

  it("returns 0 flexibility score for urgent rigid delivery", () => {
    const score = computeFlexibilityScore({
      requested_delivery_date: "2026-04-28",
      delivery_time_window: "morning",
      urgency_level: "urgent",
      can_receive_early: false,
      can_store_early_delivery: false,
      grouped_delivery_allowed: false,
      split_delivery_allowed: false,
      partner_delivery_allowed: false
    });

    expect(score).toBe(0);
  });
});
