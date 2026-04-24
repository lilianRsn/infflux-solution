import pool from "../../infrastructure/database/db";
import { AppError } from "../../common/errors/app-error";
import { computeFlexibilityScore, validateOrderPayload } from "./orders.utils";
import { AuthUser, CreateOrderBody, CustomerInput } from "./orders.types";

type ClientWarehouseRecord = {
  id: string;
  client_id: string;
  name: string;
  address: string;
};

async function resolveCustomerData(
  body: CreateOrderBody,
  user: AuthUser
): Promise<{ customerId: string; customer: CustomerInput }> {
  if (user.role === "client") {
    const userResult = await pool.query(
      `
      SELECT
        id,
        company_name,
        billing_address,
        main_contact_name,
        main_contact_phone,
        main_contact_email
      FROM users
      WHERE id = $1
      `,
      [user.id]
    );

    if (!userResult.rows.length) {
      throw new AppError("User not found", 404);
    }

    const profile = userResult.rows[0];

    return {
      customerId: profile.id,
      customer: {
        customer_id: profile.id,
        company_name: profile.company_name,
        billing_address: profile.billing_address ?? undefined,
        main_contact_name: profile.main_contact_name ?? undefined,
        main_contact_phone: profile.main_contact_phone ?? undefined,
        main_contact_email: profile.main_contact_email ?? undefined
      }
    };
  }

  if (!body.customer?.customer_id) {
    throw new AppError("customer.customer_id is required for admin-created orders", 400);
  }

  return {
    customerId: body.customer.customer_id,
    customer: body.customer
  };
}

async function resolveClientWarehouse(
  clientWarehouseId: string,
  user: AuthUser,
  customerId: string
): Promise<ClientWarehouseRecord> {
  const result = await pool.query(
    `
    SELECT id, client_id, name, address
    FROM client_warehouses
    WHERE id = $1
    `,
    [clientWarehouseId]
  );

  if (!result.rows.length) {
    throw new AppError("Client warehouse not found", 404);
  }

  const warehouse = result.rows[0] as ClientWarehouseRecord;

  if (user.role === "client" && warehouse.client_id !== user.id) {
    throw new AppError("You can only create orders for your own warehouses", 403);
  }

  if (warehouse.client_id !== customerId) {
    throw new AppError("client_warehouse_id does not belong to the selected customer", 400);
  }

  return warehouse;
}

export async function createOrder(body: CreateOrderBody, user: AuthUser) {
  const validationError = validateOrderPayload(body, user.role);

  if (validationError) {
    throw new AppError(validationError, 400);
  }

  const { delivery_destination, order_lines, delivery_need, destination_warehouse_id } = body;
  const { customerId, customer } = await resolveCustomerData(body, user);
  const clientWarehouse = await resolveClientWarehouse(body.client_warehouse_id, user, customerId);

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
  const dbClient = await pool.connect();

  try {
    await dbClient.query("BEGIN");

    const orderResult = await dbClient.query(
      `
      INSERT INTO orders (
        order_number,
        customer_id,
        client_warehouse_id,
        destination_warehouse_id,
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
        planning_status,
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
        $12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,
        'pending','UNPLANNED',$24,$25,$26,$27,$28,$29,$30,$31,$32
      )
      RETURNING *
      `,
      [
        orderNumber,
        customerId,
        clientWarehouse.id,
        destination_warehouse_id || null,
        customer.company_name,
        customer.billing_address || null,
        customer.main_contact_name || null,
        customer.main_contact_phone || null,
        customer.main_contact_email || null,
        body.delivery_destination?.delivery_address || clientWarehouse.address,
        body.delivery_destination?.site_name || clientWarehouse.name,
        body.delivery_destination?.delivery_contact_name || null,
        body.delivery_destination?.delivery_contact_phone || null,
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

    return {
      message: "Order created",
      order: {
        order_id: order.id,
        order_number: order.order_number,
        client_warehouse_id: order.client_warehouse_id,
        planning_status: order.planning_status,
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
    };
  } catch (error) {
    await dbClient.query("ROLLBACK");
    throw error;
  } finally {
    dbClient.release();
  }
}

export async function getMyOrders(userId: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM orders
    WHERE customer_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
}

export async function getAllOrders() {
  const result = await pool.query(
    `
    SELECT *
    FROM orders
    ORDER BY created_at DESC
    `
  );

  return result.rows;
}

export async function getOrderById(orderId: string, user: AuthUser) {
  const orderResult = await pool.query(
    `SELECT * FROM orders WHERE id = $1`,
    [orderId]
  );

  if (!orderResult.rows.length) {
    throw new AppError("Order not found", 404);
  }

  const order = orderResult.rows[0];

  if (user.role === "client" && order.customer_id !== user.id) {
    throw new AppError("Forbidden", 403);
  }

  const linesResult = await pool.query(
    `SELECT * FROM order_lines WHERE order_id = $1 ORDER BY id`,
    [orderId]
  );

  return { ...order, order_lines: linesResult.rows };
}
