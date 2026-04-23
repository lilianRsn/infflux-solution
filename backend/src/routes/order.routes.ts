import { Router, Request, Response } from "express";
import pool from "../db";
import requireRoles from "../middleware/roles";
import {
  computeFlexibilityScore,
  validateOrderPayload,
  CreateOrderBody
} from "../utils/order";

const router = Router();

router.post(
  "/",
  requireRoles("admin", "client"),
  async (
    req: Request<{}, {}, CreateOrderBody>,
    res: Response
  ): Promise<Response> => {
    const validationError = validateOrderPayload(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { customer, delivery_destination, order_lines, delivery_need } = req.body;

    const totalPallets = order_lines.reduce(
      (sum, line) => sum + Number(line.quantity_pallets),
      0
    );

    const eligibleForEarlyDelivery =
      Boolean(delivery_need.can_receive_early) &&
      Boolean(delivery_need.can_store_early_delivery);

    const eligibleForGroupedDelivery =
      Boolean(delivery_need.grouped_delivery_allowed) &&
      delivery_need.urgency_level !== "urgent";

    const eligibleForPartnerCarrier = Boolean(delivery_need.partner_delivery_allowed);

    const eligibleForRouteFillup =
      Boolean(delivery_need.partner_delivery_allowed) &&
      delivery_need.urgency_level !== "urgent";

    const deliveryFlexibilityScore = computeFlexibilityScore(delivery_need);

    const promisedDeliveryDate = delivery_need.requested_delivery_date;
    const promisedTimeWindow = delivery_need.delivery_time_window;

    const serviceLevel =
      delivery_need.urgency_level === "urgent"
        ? "priority"
        : delivery_need.urgency_level === "standard"
        ? "standard"
        : "optimized";

    const orderNumber = `ORD-${Date.now()}`;
    const customerId =
      req.user?.role === "client" ? req.user.id : customer.customer_id || null;

    const dbClient = await pool.connect();

    try {
      await dbClient.query("BEGIN");

      const orderResult = await dbClient.query(
        `
        INSERT INTO orders (
          order_number,
          customer_id,
          company_name,
          billing_address,
          main_contact_name,
          main_contact_phone,
          main_contact_email,
          delivery_address,
          site_name,
          delivery_contact_name,
          delivery_contact_phone,
          requested_delivery_date,
          delivery_time_window,
          urgency_level,
          can_receive_early,
          earliest_acceptable_delivery_date,
          can_store_early_delivery,
          available_storage_capacity_pallets,
          grouped_delivery_allowed,
          latest_acceptable_grouped_delivery_date,
          split_delivery_allowed,
          partner_delivery_allowed,
          status,
          total_pallets,
          eligible_for_early_delivery,
          eligible_for_grouped_delivery,
          eligible_for_partner_carrier,
          eligible_for_route_fillup,
          delivery_flexibility_score,
          promised_delivery_date,
          promised_time_window,
          service_level
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
          $12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
          'pending',$23,$24,$25,$26,$27,$28,$29,$30,$31
        )
        RETURNING *
        `,
        [
          orderNumber,
          customerId,
          customer.company_name,
          customer.billing_address || null,
          customer.main_contact_name || null,
          customer.main_contact_phone || null,
          customer.main_contact_email || null,
          delivery_destination.delivery_address,
          delivery_destination.site_name || null,
          delivery_destination.delivery_contact_name || null,
          delivery_destination.delivery_contact_phone || null,
          delivery_need.requested_delivery_date,
          delivery_need.delivery_time_window,
          delivery_need.urgency_level,
          Boolean(delivery_need.can_receive_early),
          delivery_need.earliest_acceptable_delivery_date || null,
          Boolean(delivery_need.can_store_early_delivery),
          delivery_need.available_storage_capacity_pallets || null,
          Boolean(delivery_need.grouped_delivery_allowed),
          delivery_need.latest_acceptable_grouped_delivery_date || null,
          Boolean(delivery_need.split_delivery_allowed),
          Boolean(delivery_need.partner_delivery_allowed),
          totalPallets,
          eligibleForEarlyDelivery,
          eligibleForGroupedDelivery,
          eligibleForPartnerCarrier,
          eligibleForRouteFillup,
          deliveryFlexibilityScore,
          promisedDeliveryDate,
          promisedTimeWindow,
          serviceLevel
        ]
      );

      const order = orderResult.rows[0];

      for (const line of order_lines) {
        await dbClient.query(
          `
          INSERT INTO order_lines (order_id, product_id, quantity_pallets)
          VALUES ($1, $2, $3)
          `,
          [order.id, line.product_id, line.quantity_pallets]
        );
      }

      await dbClient.query("COMMIT");

      return res.status(201).json({
        message: "Order created",
        order: {
          order_id: order.id,
          order_number: order.order_number,
          status: order.status,
          created_at: order.created_at,
          total_pallets: order.total_pallets,
          eligible_for_early_delivery: order.eligible_for_early_delivery,
          eligible_for_grouped_delivery: order.eligible_for_grouped_delivery,
          eligible_for_partner_carrier: order.eligible_for_partner_carrier,
          eligible_for_route_fillup: order.eligible_for_route_fillup,
          delivery_flexibility_score: order.delivery_flexibility_score,
          promised_delivery_date: order.promised_delivery_date,
          promised_time_window: order.promised_time_window,
          service_level: order.service_level
        }
      });
    } catch (error) {
      await dbClient.query("ROLLBACK");
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error"
      });
    } finally {
      dbClient.release();
    }
  }
);

router.get(
  "/me",
  requireRoles("client"),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const result = await pool.query(
        `
        SELECT *
        FROM orders
        WHERE customer_id = $1
        ORDER BY created_at DESC
        `,
        [req.user?.id]
      );

      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error"
      });
    }
  }
);

router.get(
  "/",
  requireRoles("admin"),
  async (_req: Request, res: Response): Promise<Response> => {
    try {
      const result = await pool.query(
        `
        SELECT *
        FROM orders
        ORDER BY created_at DESC
        `
      );

      return res.json(result.rows);
    } catch (error) {
      return res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error"
      });
    }
  }
);

export default router;
