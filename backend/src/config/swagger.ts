import swaggerJSDoc from "swagger-jsdoc";

const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Infflux Hackathon API",
            version: "2.0.0",
            description:
                "API for auth, orders, client warehouses, storage slots, loading docks, and capacity visualization."
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Local server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            },
            schemas: {
                ErrorResponse: {
                    type: "object",
                    properties: {
                        message: { type: "string", example: "Forbidden" }
                    }
                },

                RegisterRequest: {
                    type: "object",
                    required: ["email", "password", "company_name"],
                    properties: {
                        email: { type: "string", example: "client@example.com" },
                        password: { type: "string", example: "123456" },
                        role: {
                            type: "string",
                            enum: ["admin", "client", "partner"],
                            example: "client"
                        },
                        company_name: { type: "string", example: "Client A" },
                        billing_address: { type: "string", example: "12 rue Exemple, Paris" },
                        main_contact_name: { type: "string", example: "Jean Dupont" },
                        main_contact_phone: { type: "string", example: "0600000000" },
                        main_contact_email: { type: "string", example: "jean@clienta.fr" }
                    }
                },

                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", example: "client@example.com" },
                        password: { type: "string", example: "123456" }
                    }
                },

                OrderLine: {
                    type: "object",
                    required: ["product_id", "quantity_pallets"],
                    properties: {
                        product_id: { type: "string", example: "PROD_001" },
                        quantity_pallets: { type: "integer", example: 4 }
                    }
                },

                CreateOrderRequest: {
                    type: "object",
                    required: ["customer", "delivery_destination", "order_lines", "delivery_need"],
                    properties: {
                        customer: {
                            type: "object",
                            required: ["company_name"],
                            properties: {
                                customer_id: { type: "string", format: "uuid" },
                                company_name: { type: "string", example: "Client A" },
                                billing_address: { type: "string", example: "12 rue Exemple, Paris" },
                                main_contact_name: { type: "string", example: "Jean Dupont" },
                                main_contact_phone: { type: "string", example: "0600000000" },
                                main_contact_email: { type: "string", example: "jean@clienta.fr" }
                            }
                        },
                        delivery_destination: {
                            type: "object",
                            required: ["delivery_address"],
                            properties: {
                                delivery_address: {
                                    type: "string",
                                    example: "25 avenue Livraison, Lyon"
                                },
                                site_name: { type: "string", example: "Magasin Lyon" },
                                delivery_contact_name: { type: "string", example: "Sophie Martin" },
                                delivery_contact_phone: { type: "string", example: "0611111111" }
                            }
                        },
                        order_lines: {
                            type: "array",
                            items: { $ref: "#/components/schemas/OrderLine" }
                        },
                        delivery_need: {
                            type: "object",
                            required: [
                                "requested_delivery_date",
                                "delivery_time_window",
                                "urgency_level"
                            ],
                            properties: {
                                requested_delivery_date: {
                                    type: "string",
                                    format: "date",
                                    example: "2026-04-28"
                                },
                                delivery_time_window: {
                                    type: "string",
                                    enum: ["morning", "afternoon", "full_day"],
                                    example: "morning"
                                },
                                urgency_level: {
                                    type: "string",
                                    enum: ["urgent", "standard", "flexible"],
                                    example: "flexible"
                                },
                                can_receive_early: { type: "boolean", example: true },
                                earliest_acceptable_delivery_date: {
                                    type: "string",
                                    format: "date",
                                    example: "2026-04-26"
                                },
                                can_store_early_delivery: { type: "boolean", example: true },
                                available_storage_capacity_pallets: { type: "integer", example: 10 },
                                grouped_delivery_allowed: { type: "boolean", example: true },
                                latest_acceptable_grouped_delivery_date: {
                                    type: "string",
                                    format: "date",
                                    example: "2026-04-30"
                                },
                                split_delivery_allowed: { type: "boolean", example: false },
                                partner_delivery_allowed: { type: "boolean", example: true }
                            }
                        }
                    }
                },

                CreateWarehouseRequest: {
                    type: "object",
                    required: ["name", "address"],
                    properties: {
                        client_id: { type: "string", format: "uuid" },
                        name: { type: "string", example: "Entrepot Client Lyon" },
                        address: { type: "string", example: "25 avenue Livraison, Lyon" },
                        floors_count: { type: "integer", example: 2 }
                    }
                },

                CreateFloorRequest: {
                    type: "object",
                    required: ["level", "label"],
                    properties: {
                        level: { type: "integer", example: 1 },
                        label: { type: "string", example: "RDC" }
                    }
                },

                CreateAisleRequest: {
                    type: "object",
                    required: ["code"],
                    properties: {
                        code: { type: "string", example: "A" },
                        position_x: { type: "number", example: 12.5 },
                        position_y: { type: "number", example: 6.2 }
                    }
                },

                CreateExteriorRequest: {
                    type: "object",
                    required: [
                        "site_width",
                        "site_height",
                        "building_x",
                        "building_y",
                        "building_width",
                        "building_height",
                        "access_direction"
                    ],
                    properties: {
                        site_width: { type: "number", example: 100 },
                        site_height: { type: "number", example: 60 },
                        building_x: { type: "number", example: 20 },
                        building_y: { type: "number", example: 10 },
                        building_width: { type: "number", example: 50 },
                        building_height: { type: "number", example: 30 },
                        access_direction: {
                            type: "string",
                            enum: ["N", "S", "E", "W"],
                            example: "N"
                        }
                    }
                },

                CreateDockRequest: {
                    type: "object",
                    required: ["code", "position_x", "position_y", "side"],
                    properties: {
                        code: { type: "string", example: "D1" },
                        position_x: { type: "number", example: 5 },
                        position_y: { type: "number", example: 10 },
                        side: { type: "string", enum: ["N", "S", "E", "W"], example: "N" },
                        max_tonnage: { type: "number", example: 18 },
                        max_width_meters: { type: "number", example: 2.8 },
                        status: {
                            type: "string",
                            enum: ["FREE", "OCCUPIED", "MAINTENANCE"],
                            example: "FREE"
                        },
                        current_order_id: { type: "string", format: "uuid", nullable: true }
                    }
                },

                CreateParkingZoneRequest: {
                    type: "object",
                    required: ["position_x", "position_y", "width", "height", "capacity"],
                    properties: {
                        position_x: { type: "number", example: 70 },
                        position_y: { type: "number", example: 20 },
                        width: { type: "number", example: 20 },
                        height: { type: "number", example: 10 },
                        capacity: { type: "integer", example: 4 }
                    }
                },

                CreateStorageSlotRequest: {
                    type: "object",
                    required: ["aisle_id", "rank", "side", "total_volume"],
                    properties: {
                        aisle_id: { type: "string", format: "uuid" },
                        rank: { type: "string", example: "35" },
                        side: { type: "string", example: "LEFT" },
                        total_volume: { type: "number", example: 12 },
                        used_volume: { type: "number", example: 6 },
                        total_pallets: { type: "integer", example: 8 },
                        used_pallets: { type: "integer", example: 4 },
                        status: {
                            type: "string",
                            enum: ["FREE", "PARTIAL", "FULL"],
                            example: "PARTIAL"
                        }
                    }
                },

                PatchStorageSlotRequest: {
                    type: "object",
                    properties: {
                        total_volume: { type: "number", example: 12 },
                        used_volume: { type: "number", example: 8 },
                        total_pallets: { type: "integer", example: 8 },
                        used_pallets: { type: "integer", example: 5 },
                        status: {
                            type: "string",
                            enum: ["FREE", "PARTIAL", "FULL"],
                            example: "PARTIAL"
                        }
                    }
                },

                PatchLoadingDockRequest: {
                    type: "object",
                    properties: {
                        status: {
                            type: "string",
                            enum: ["FREE", "OCCUPIED", "MAINTENANCE"],
                            example: "OCCUPIED"
                        },
                        current_order_id: { type: "string", format: "uuid", nullable: true },
                        max_tonnage: { type: "number", example: 18 },
                        max_width_meters: { type: "number", example: 2.8 }
                    }
                }
            }
        },
        paths: {
            "/api/health": {
                get: {
                    tags: ["Health"],
                    summary: "Health check",
                    responses: {
                        "200": { description: "API is running" }
                    }
                }
            },

            "/api/auth/register": {
                post: {
                    tags: ["Auth"],
                    summary: "Register a new user",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/RegisterRequest" }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "User created" },
                        "400": { description: "Validation error" },
                        "409": { description: "Email already exists" }
                    }
                }
            },

            "/api/auth/login": {
                post: {
                    tags: ["Auth"],
                    summary: "Login and get JWT token",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/LoginRequest" }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Authenticated successfully" },
                        "401": { description: "Invalid credentials" }
                    }
                }
            },

            "/api/orders": {
                post: {
                    tags: ["Orders"],
                    summary: "Create a new order",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateOrderRequest" }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "Order created" },
                        "400": { description: "Validation error" },
                        "401": { description: "Unauthorized" },
                        "403": { description: "Forbidden" }
                    }
                },
                get: {
                    tags: ["Orders"],
                    summary: "Get all orders",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        "200": { description: "List of orders" },
                        "401": { description: "Unauthorized" },
                        "403": { description: "Forbidden" }
                    }
                }
            },

            "/api/orders/me": {
                get: {
                    tags: ["Orders"],
                    summary: "Get orders of the authenticated client",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        "200": { description: "Client orders" },
                        "401": { description: "Unauthorized" },
                        "403": { description: "Forbidden" }
                    }
                }
            },

            "/api/client-warehouses": {
                post: {
                    tags: ["Client Warehouses"],
                    summary: "Create a client warehouse",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateWarehouseRequest" }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "Warehouse created" },
                        "400": { description: "Validation error" },
                        "401": { description: "Unauthorized" },
                        "403": { description: "Forbidden" }
                    }
                }
            },

            "/api/client-warehouses/{clientId}": {
                get: {
                    tags: ["Client Warehouses"],
                    summary: "Get warehouses for a client",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "clientId",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    responses: {
                        "200": { description: "Client warehouses" },
                        "401": { description: "Unauthorized" },
                        "403": { description: "Forbidden" }
                    }
                }
            },

            "/api/client-warehouses/availability": {
                get: {
                    tags: ["Client Warehouses"],
                    summary: "Admin view of available capacity and dock occupancy",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        "200": { description: "Availability view" },
                        "401": { description: "Unauthorized" },
                        "403": { description: "Forbidden" }
                    }
                }
            },

            "/api/client-warehouses/{id}/floors": {
                post: {
                    tags: ["Client Warehouses"],
                    summary: "Create a floor in a warehouse",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateFloorRequest" }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "Floor created" }
                    }
                }
            },

            "/api/client-warehouses/floors/{floorId}/aisles": {
                post: {
                    tags: ["Client Warehouses"],
                    summary: "Create an aisle in a floor",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "floorId",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateAisleRequest" }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "Aisle created" }
                    }
                }
            },

            "/api/client-warehouses/{id}/layout": {
                get: {
                    tags: ["Client Warehouses"],
                    summary: "Get full warehouse layout",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    responses: {
                        "200": { description: "Warehouse layout" }
                    }
                }
            },

            "/api/client-warehouses/{id}/exterior": {
                post: {
                    tags: ["Client Warehouses"],
                    summary: "Create or update warehouse exterior",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateExteriorRequest" }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "Exterior saved" }
                    }
                },
                get: {
                    tags: ["Client Warehouses"],
                    summary: "Get warehouse exterior with docks, parking, and current order details",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    responses: {
                        "200": { description: "Warehouse exterior" }
                    }
                }
            },

            "/api/client-warehouses/{id}/loading-docks": {
                post: {
                    tags: ["Loading Docks"],
                    summary: "Create a loading dock",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateDockRequest" }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "Loading dock created" }
                    }
                }
            },

            "/api/client-warehouses/{id}/parking-zones": {
                post: {
                    tags: ["Client Warehouses"],
                    summary: "Create a parking zone",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateParkingZoneRequest" }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "Parking zone created" }
                    }
                }
            },

            "/api/client-warehouses/{id}/docks/available": {
                get: {
                    tags: ["Loading Docks"],
                    summary: "Get available docks for a warehouse",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    responses: {
                        "200": { description: "Available docks" }
                    }
                }
            },

            "/api/storage-slots": {
                post: {
                    tags: ["Storage Slots"],
                    summary: "Create a storage slot",
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateStorageSlotRequest" }
                            }
                        }
                    },
                    responses: {
                        "201": { description: "Storage slot created" }
                    }
                }
            },

            "/api/storage-slots/{id}": {
                patch: {
                    tags: ["Storage Slots"],
                    summary: "Update storage slot status and capacities",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/PatchStorageSlotRequest" }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Storage slot updated" }
                    }
                }
            },

            "/api/loading-docks/{id}": {
                patch: {
                    tags: ["Loading Docks"],
                    summary: "Update loading dock status",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/PatchLoadingDockRequest" }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Loading dock updated" }
                    }
                }
            },
            "/api/users/clients": {
                get: {
                    tags: ["Users"],
                    summary: "List client accounts for admin selector",
                    security: [{ bearerAuth: [] }],
                    responses: {
                        "200": { description: "Client list" },
                        "401": { description: "Unauthorized" },
                        "403": { description: "Forbidden" }
                    }
                }
            },
            "/api/client-warehouses/{id}": {
                patch: {
                    tags: ["Client Warehouses"],
                    summary: "Update a client warehouse",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "id",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateWarehouseRequest" }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Warehouse updated" }
                    }
                }
            },
            "/api/client-warehouses/floors/{floorId}": {
                patch: {
                    tags: ["Client Warehouses"],
                    summary: "Update a floor",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "floorId",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateFloorRequest" }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Floor updated" }
                    }
                }
            },
            "/api/client-warehouses/aisles/{aisleId}": {
                patch: {
                    tags: ["Client Warehouses"],
                    summary: "Update an aisle",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "aisleId",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateAisleRequest" }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Aisle updated" }
                    }
                }
            },
            "/api/client-warehouses/parking-zones/{parkingZoneId}": {
                patch: {
                    tags: ["Client Warehouses"],
                    summary: "Update a parking zone",
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: "path",
                            name: "parkingZoneId",
                            required: true,
                            schema: { type: "string", format: "uuid" }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/CreateParkingZoneRequest" }
                            }
                        }
                    },
                    responses: {
                        "200": { description: "Parking zone updated" }
                    }
                }
            },
        }
    },
    apis: []
});

export default swaggerSpec;
