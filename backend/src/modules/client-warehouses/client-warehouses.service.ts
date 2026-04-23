import pool from "../../infrastructure/database/db";
import { AppError } from "../../common/errors/app-error";
import {
    AuthUser,
    CreateAisleBody,
    CreateDockBody,
    CreateExteriorBody,
    CreateFloorBody,
    CreateParkingBody,
    CreateWarehouseBody,
    PatchAisleBody,
    PatchExteriorBody,
    PatchFloorBody,
    PatchParkingBody,
    PatchWarehouseBody
} from "./client-warehouses.types";

async function assertWarehouseAccess(warehouseId: string, user: AuthUser) {
    if (user.role === "admin") return;

    const r = await pool.query(
        "SELECT id FROM client_warehouses WHERE id = $1 AND client_id = $2",
        [warehouseId, user.id]
    );

    if (!r.rows.length) {
        throw new AppError("Forbidden", 403);
    }
}

async function assertFloorAccess(floorId: string, user: AuthUser) {
    if (user.role === "admin") return;

    const r = await pool.query(
        `
    SELECT wf.id
    FROM warehouse_floors wf
    JOIN client_warehouses cw ON cw.id = wf.client_warehouse_id
    WHERE wf.id = $1 AND cw.client_id = $2
    `,
        [floorId, user.id]
    );

    if (!r.rows.length) {
        throw new AppError("Forbidden", 403);
    }
}

async function assertAisleAccess(aisleId: string, user: AuthUser) {
    if (user.role === "admin") return;

    const r = await pool.query(
        `
    SELECT wa.id
    FROM warehouse_aisles wa
    JOIN warehouse_floors wf ON wf.id = wa.floor_id
    JOIN client_warehouses cw ON cw.id = wf.client_warehouse_id
    WHERE wa.id = $1 AND cw.client_id = $2
    `,
        [aisleId, user.id]
    );

    if (!r.rows.length) {
        throw new AppError("Forbidden", 403);
    }
}

async function assertParkingZoneAccess(parkingZoneId: string, user: AuthUser) {
    if (user.role === "admin") return;

    const r = await pool.query(
        `
    SELECT pz.id
    FROM parking_zones pz
    JOIN client_warehouses cw ON cw.id = pz.client_warehouse_id
    WHERE pz.id = $1 AND cw.client_id = $2
    `,
        [parkingZoneId, user.id]
    );

    if (!r.rows.length) {
        throw new AppError("Forbidden", 403);
    }
}

export async function createWarehouse(body: CreateWarehouseBody, user: AuthUser) {
    const clientId = user.role === "client" ? user.id : body.client_id;

    if (!clientId || !body.name || !body.address) {
        throw new AppError("client_id, name and address are required", 400);
    }

    const r = await pool.query(
        `
    INSERT INTO client_warehouses (client_id, name, address, floors_count)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
        [clientId, body.name, body.address, body.floors_count ?? 1]
    );

    return r.rows[0];
}

export async function updateWarehouse(
    warehouseId: string,
    body: PatchWarehouseBody,
    user: AuthUser
) {
    await assertWarehouseAccess(warehouseId, user);

    const existing = await pool.query(
        "SELECT * FROM client_warehouses WHERE id = $1",
        [warehouseId]
    );

    if (!existing.rows.length) {
        throw new AppError("Warehouse not found", 404);
    }

    const current = existing.rows[0];
    const name = body.name ?? current.name;
    const address = body.address ?? current.address;
    const floorsCount = body.floors_count ?? current.floors_count;

    if (!name || !address || floorsCount <= 0) {
        throw new AppError("name, address and floors_count must be valid", 400);
    }

    const r = await pool.query(
        `
    UPDATE client_warehouses
    SET
      name = $2,
      address = $3,
      floors_count = $4,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
        [warehouseId, name, address, floorsCount]
    );

    return r.rows[0];
}

export async function createFloor(
    warehouseId: string,
    body: CreateFloorBody,
    user: AuthUser
) {
    await assertWarehouseAccess(warehouseId, user);

    if (body.level === undefined || !body.label) {
        throw new AppError("level and label are required", 400);
    }

    const r = await pool.query(
        `
    INSERT INTO warehouse_floors (client_warehouse_id, level, label)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
        [warehouseId, body.level, body.label]
    );

    return r.rows[0];
}

export async function updateFloor(
    floorId: string,
    body: PatchFloorBody,
    user: AuthUser
) {
    await assertFloorAccess(floorId, user);

    const existing = await pool.query(
        "SELECT * FROM warehouse_floors WHERE id = $1",
        [floorId]
    );

    if (!existing.rows.length) {
        throw new AppError("Floor not found", 404);
    }

    const current = existing.rows[0];
    const level = body.level ?? current.level;
    const label = body.label ?? current.label;

    const r = await pool.query(
        `
    UPDATE warehouse_floors
    SET
      level = $2,
      label = $3
    WHERE id = $1
    RETURNING *
    `,
        [floorId, level, label]
    );

    return r.rows[0];
}

export async function createAisle(
    floorId: string,
    body: CreateAisleBody,
    user: AuthUser
) {
    await assertFloorAccess(floorId, user);

    if (!body.code) {
        throw new AppError("code is required", 400);
    }

    const r = await pool.query(
        `
    INSERT INTO warehouse_aisles (floor_id, code, position_x, position_y)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
        [floorId, body.code, body.position_x ?? null, body.position_y ?? null]
    );

    return r.rows[0];
}

export async function updateAisle(
    aisleId: string,
    body: PatchAisleBody,
    user: AuthUser
) {
    await assertAisleAccess(aisleId, user);

    const existing = await pool.query(
        "SELECT * FROM warehouse_aisles WHERE id = $1",
        [aisleId]
    );

    if (!existing.rows.length) {
        throw new AppError("Aisle not found", 404);
    }

    const current = existing.rows[0];
    const code = body.code ?? current.code;
    const positionX = body.position_x ?? current.position_x;
    const positionY = body.position_y ?? current.position_y;

    if (!code) {
        throw new AppError("code is required", 400);
    }

    const r = await pool.query(
        `
    UPDATE warehouse_aisles
    SET
      code = $2,
      position_x = $3,
      position_y = $4
    WHERE id = $1
    RETURNING *
    `,
        [aisleId, code, positionX, positionY]
    );

    return r.rows[0];
}

export async function createExterior(
    warehouseId: string,
    body: CreateExteriorBody,
    user: AuthUser
) {
    await assertWarehouseAccess(warehouseId, user);

    const r = await pool.query(
        `
    INSERT INTO client_warehouse_exteriors (
      client_warehouse_id,
      site_width,
      site_height,
      building_x,
      building_y,
      building_width,
      building_height,
      access_direction
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (client_warehouse_id)
    DO UPDATE SET
      site_width = EXCLUDED.site_width,
      site_height = EXCLUDED.site_height,
      building_x = EXCLUDED.building_x,
      building_y = EXCLUDED.building_y,
      building_width = EXCLUDED.building_width,
      building_height = EXCLUDED.building_height,
      access_direction = EXCLUDED.access_direction,
      updated_at = NOW()
    RETURNING *
    `,
        [
            warehouseId,
            body.site_width,
            body.site_height,
            body.building_x,
            body.building_y,
            body.building_width,
            body.building_height,
            body.access_direction
        ]
    );

    return r.rows[0];
}

export async function updateExterior(
    warehouseId: string,
    body: PatchExteriorBody,
    user: AuthUser
) {
    await assertWarehouseAccess(warehouseId, user);

    const existing = await pool.query(
        `
    SELECT *
    FROM client_warehouse_exteriors
    WHERE client_warehouse_id = $1
    `,
        [warehouseId]
    );

    if (!existing.rows.length) {
        throw new AppError("Exterior not found", 404);
    }

    const current = existing.rows[0];

    const r = await pool.query(
        `
    UPDATE client_warehouse_exteriors
    SET
      site_width = $2,
      site_height = $3,
      building_x = $4,
      building_y = $5,
      building_width = $6,
      building_height = $7,
      access_direction = $8,
      updated_at = NOW()
    WHERE client_warehouse_id = $1
    RETURNING *
    `,
        [
            warehouseId,
            body.site_width ?? current.site_width,
            body.site_height ?? current.site_height,
            body.building_x ?? current.building_x,
            body.building_y ?? current.building_y,
            body.building_width ?? current.building_width,
            body.building_height ?? current.building_height,
            body.access_direction ?? current.access_direction
        ]
    );

    return r.rows[0];
}

export async function createDock(
    warehouseId: string,
    body: CreateDockBody,
    user: AuthUser
) {
    await assertWarehouseAccess(warehouseId, user);

    const r = await pool.query(
        `
    INSERT INTO loading_docks (
      client_warehouse_id,
      code,
      position_x,
      position_y,
      side,
      max_tonnage,
      max_width_meters,
      status,
      current_order_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
        [
            warehouseId,
            body.code,
            body.position_x,
            body.position_y,
            body.side,
            body.max_tonnage ?? null,
            body.max_width_meters ?? null,
            body.status ?? "FREE",
            body.current_order_id ?? null
        ]
    );

    return r.rows[0];
}

export async function createParkingZone(
    warehouseId: string,
    body: CreateParkingBody,
    user: AuthUser
) {
    await assertWarehouseAccess(warehouseId, user);

    const r = await pool.query(
        `
    INSERT INTO parking_zones (
      client_warehouse_id,
      position_x,
      position_y,
      width,
      height,
      capacity
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
        [
            warehouseId,
            body.position_x,
            body.position_y,
            body.width,
            body.height,
            body.capacity
        ]
    );

    return r.rows[0];
}

export async function updateParkingZone(
    parkingZoneId: string,
    body: PatchParkingBody,
    user: AuthUser
) {
    await assertParkingZoneAccess(parkingZoneId, user);

    const existing = await pool.query(
        "SELECT * FROM parking_zones WHERE id = $1",
        [parkingZoneId]
    );

    if (!existing.rows.length) {
        throw new AppError("Parking zone not found", 404);
    }

    const current = existing.rows[0];

    const r = await pool.query(
        `
    UPDATE parking_zones
    SET
      position_x = $2,
      position_y = $3,
      width = $4,
      height = $5,
      capacity = $6
    WHERE id = $1
    RETURNING *
    `,
        [
            parkingZoneId,
            body.position_x ?? current.position_x,
            body.position_y ?? current.position_y,
            body.width ?? current.width,
            body.height ?? current.height,
            body.capacity ?? current.capacity
        ]
    );

    return r.rows[0];
}

export async function getWarehousesByClient(clientId: string, user: AuthUser) {
    if (user.role === "client" && user.id !== clientId) {
        throw new AppError("Forbidden", 403);
    }

    const r = await pool.query(
        `
    SELECT *
    FROM client_warehouses
    WHERE client_id = $1
    ORDER BY created_at DESC
    `,
        [clientId]
    );

    return r.rows;
}

export async function getWarehouseLayout(warehouseId: string, user: AuthUser) {
    await assertWarehouseAccess(warehouseId, user);

    const warehouse = await pool.query(
        "SELECT * FROM client_warehouses WHERE id = $1",
        [warehouseId]
    );

    if (!warehouse.rows.length) {
        throw new AppError("Warehouse not found", 404);
    }

    const rows = await pool.query(
        `
    SELECT
      wf.id AS floor_id,
      wf.level,
      wf.label,
      wa.id AS aisle_id,
      wa.code,
      wa.position_x,
      wa.position_y,
      ss.id AS slot_id,
      ss.rank,
      ss.side,
      ss.total_volume,
      ss.used_volume,
      ss.total_pallets,
      ss.used_pallets,
      ss.status,
      ss.updated_at
    FROM warehouse_floors wf
    LEFT JOIN warehouse_aisles wa ON wa.floor_id = wf.id
    LEFT JOIN storage_slots ss ON ss.aisle_id = wa.id
    WHERE wf.client_warehouse_id = $1
    ORDER BY wf.level, wa.code, ss.rank
    `,
        [warehouseId]
    );

    const floors = new Map<string, any>();

    for (const row of rows.rows) {
        if (!floors.has(row.floor_id)) {
            floors.set(row.floor_id, {
                id: row.floor_id,
                level: row.level,
                label: row.label,
                aisles: []
            });
        }

        const floor = floors.get(row.floor_id);

        if (row.aisle_id) {
            let aisle = floor.aisles.find((a: any) => a.id === row.aisle_id);

            if (!aisle) {
                aisle = {
                    id: row.aisle_id,
                    code: row.code,
                    position_x: row.position_x,
                    position_y: row.position_y,
                    slots: []
                };
                floor.aisles.push(aisle);
            }

            if (row.slot_id) {
                aisle.slots.push({
                    id: row.slot_id,
                    rank: row.rank,
                    side: row.side,
                    total_volume: row.total_volume,
                    used_volume: row.used_volume,
                    available_volume: Number(row.total_volume) - Number(row.used_volume),
                    total_pallets: row.total_pallets,
                    used_pallets: row.used_pallets,
                    available_pallets:
                        row.total_pallets == null || row.used_pallets == null
                            ? null
                            : Number(row.total_pallets) - Number(row.used_pallets),
                    status: row.status,
                    updated_at: row.updated_at
                });
            }
        }
    }

    return {
        ...warehouse.rows[0],
        floors: [...floors.values()]
    };
}

export async function getWarehouseExterior(warehouseId: string, user: AuthUser) {
    await assertWarehouseAccess(warehouseId, user);

    const warehouse = await pool.query(
        "SELECT * FROM client_warehouses WHERE id = $1",
        [warehouseId]
    );

    if (!warehouse.rows.length) {
        throw new AppError("Warehouse not found", 404);
    }

    const exterior = await pool.query(
        `
    SELECT *
    FROM client_warehouse_exteriors
    WHERE client_warehouse_id = $1
    `,
        [warehouseId]
    );

    const docks = await pool.query(
        `
    SELECT
      ld.*,
      o.order_number,
      o.company_name,
      o.requested_delivery_date,
      o.status AS order_status
    FROM loading_docks ld
    LEFT JOIN orders o ON o.id = ld.current_order_id
    WHERE ld.client_warehouse_id = $1
    ORDER BY ld.code
    `,
        [warehouseId]
    );

    const parking = await pool.query(
        `
    SELECT *
    FROM parking_zones
    WHERE client_warehouse_id = $1
    ORDER BY created_at
    `,
        [warehouseId]
    );

    return {
        ...warehouse.rows[0],
        exterior: exterior.rows[0] ?? null,
        docks: docks.rows.map((dock) => ({
            ...dock,
            is_available: dock.status === "FREE",
            current_order:
                dock.current_order_id == null
                    ? null
                    : {
                        id: dock.current_order_id,
                        order_number: dock.order_number,
                        company_name: dock.company_name,
                        requested_delivery_date: dock.requested_delivery_date,
                        status: dock.order_status
                    }
        })),
        parking_zones: parking.rows
    };
}

export async function getAvailableDocks(warehouseId: string, user: AuthUser) {
    await assertWarehouseAccess(warehouseId, user);

    const r = await pool.query(
        `
    SELECT *,
      (status = 'FREE') AS is_available
    FROM loading_docks
    WHERE client_warehouse_id = $1
      AND status = 'FREE'
    ORDER BY code
    `,
        [warehouseId]
    );

    return r.rows;
}

export async function getOccupancyMetrics(warehouseId: string, user: AuthUser) {
    await assertWarehouseAccess(warehouseId, user);

    const warehouse = await pool.query(
        `
    SELECT id, name
    FROM client_warehouses
    WHERE id = $1
    `,
        [warehouseId]
    );

    if (!warehouse.rows.length) {
        throw new AppError("Warehouse not found", 404);
    }

    const result = await pool.query(
        `
    SELECT
      COUNT(ss.id) FILTER (WHERE ss.status = 'FREE') AS free_slots,
      COUNT(ss.id) FILTER (WHERE ss.status = 'PARTIAL') AS partial_slots,
      COUNT(ss.id) FILTER (WHERE ss.status = 'FULL') AS full_slots,
      COUNT(ss.id) AS total_slots,

      COALESCE(SUM(ss.total_volume), 0) AS max_capacity_volume,
      COALESCE(SUM(ss.used_volume), 0) AS used_volume,
      COALESCE(SUM(ss.total_volume), 0) - COALESCE(SUM(ss.used_volume), 0) AS available_volume,

      COALESCE(SUM(ss.total_pallets), 0) AS max_capacity_pallets,
      COALESCE(SUM(ss.used_pallets), 0) AS used_pallets,
      COALESCE(SUM(ss.total_pallets), 0) - COALESCE(SUM(ss.used_pallets), 0) AS available_pallets
    FROM warehouse_floors wf
    LEFT JOIN warehouse_aisles wa ON wa.floor_id = wf.id
    LEFT JOIN storage_slots ss ON ss.aisle_id = wa.id
    WHERE wf.client_warehouse_id = $1
    `,
        [warehouseId]
    );

    const metrics = result.rows[0];

    const maxCapacityVolume = Number(metrics.max_capacity_volume ?? 0);
    const usedVolume = Number(metrics.used_volume ?? 0);

    const occupancyRate =
        maxCapacityVolume > 0 ? Number(((usedVolume / maxCapacityVolume) * 100).toFixed(2)) : 0;

    return {
        warehouse_id: warehouse.rows[0].id,
        warehouse_name: warehouse.rows[0].name,
        occupancy_rate: occupancyRate,
        free_slots: Number(metrics.free_slots ?? 0),
        partial_slots: Number(metrics.partial_slots ?? 0),
        full_slots: Number(metrics.full_slots ?? 0),
        total_slots: Number(metrics.total_slots ?? 0),
        available_volume: Number(metrics.available_volume ?? 0),
        used_volume: usedVolume,
        max_capacity_volume: maxCapacityVolume,
        available_pallets: Number(metrics.available_pallets ?? 0),
        used_pallets: Number(metrics.used_pallets ?? 0),
        max_capacity_pallets: Number(metrics.max_capacity_pallets ?? 0)
    };
}


export async function getAvailability() {
    const r = await pool.query(
        `
    SELECT
      cw.id AS warehouse_id,
      cw.name AS warehouse_name,
      cw.client_id,
      u.company_name,
      COALESCE(SUM(ss.total_volume), 0) AS total_volume,
      COALESCE(SUM(ss.used_volume), 0) AS used_volume,
      COALESCE(SUM(ss.total_volume), 0) - COALESCE(SUM(ss.used_volume), 0) AS available_volume,
      COALESCE(SUM(ss.total_pallets), 0) AS total_pallets,
      COALESCE(SUM(ss.used_pallets), 0) AS used_pallets,
      COALESCE(SUM(ss.total_pallets), 0) - COALESCE(SUM(ss.used_pallets), 0) AS available_pallets,
      COUNT(ld.id) FILTER (WHERE ld.status = 'FREE') AS free_docks,
      COUNT(ld.id) FILTER (WHERE ld.status = 'OCCUPIED') AS occupied_docks,
      COUNT(ld.id) FILTER (WHERE ld.status = 'MAINTENANCE') AS maintenance_docks
    FROM client_warehouses cw
    JOIN users u ON u.id = cw.client_id
    LEFT JOIN warehouse_floors wf ON wf.client_warehouse_id = cw.id
    LEFT JOIN warehouse_aisles wa ON wa.floor_id = wf.id
    LEFT JOIN storage_slots ss ON ss.aisle_id = wa.id
    LEFT JOIN loading_docks ld ON ld.client_warehouse_id = cw.id
    GROUP BY cw.id, u.company_name
    ORDER BY cw.created_at DESC
    `
    );

    return r.rows;
}
