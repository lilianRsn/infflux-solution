import swaggerJSDoc from "swagger-jsdoc";

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Infflux Hackathon API",
      version: "1.0.0",
      description:
        "Backend API for order creation, authentication, and role-based access control."
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
            billing_address: {
              type: "string",
              example: "12 rue Exemple, Paris"
            },
            main_contact_name: { type: "string", example: "Jean Dupont" },
            main_contact_phone: { type: "string", example: "0600000000" },
            main_contact_email: {
              type: "string",
              example: "jean@clienta.fr"
            }
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
          required: [
            "customer",
            "delivery_destination",
            "order_lines",
            "delivery_need"
          ],
          properties: {
            customer: {
              type: "object",
              required: ["company_name"],
              properties: {
                customer_id: {
                  type: "string",
                  example: "9e9f43d3-4d42-4d1b-a4d5-8df1212cb001"
                },
                company_name: { type: "string", example: "Client A" },
                billing_address: {
                  type: "string",
                  example: "12 rue Exemple, Paris"
                },
                main_contact_name: {
                  type: "string",
                  example: "Jean Dupont"
                },
                main_contact_phone: {
                  type: "string",
                  example: "0600000000"
                },
                main_contact_email: {
                  type: "string",
                  example: "jean@clienta.fr"
                }
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
                delivery_contact_name: {
                  type: "string",
                  example: "Sophie Martin"
                },
                delivery_contact_phone: {
                  type: "string",
                  example: "0611111111"
                }
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
                available_storage_capacity_pallets: {
                  type: "integer",
                  example: 10
                },
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
        }
      }
    },
    paths: {
      "/api/health": {
        get: {
          summary: "Health check",
          tags: ["Health"],
          responses: {
            "200": {
              description: "API is running"
            }
          }
        }
      },
      "/api/auth/register": {
        post: {
          summary: "Register a new user",
          tags: ["Auth"],
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
          summary: "Login and get JWT token",
          tags: ["Auth"],
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
          summary: "Create a new order",
          tags: ["Orders"],
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
          summary: "Get all orders",
          tags: ["Orders"],
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
          summary: "Get orders of the authenticated client",
          tags: ["Orders"],
          security: [{ bearerAuth: [] }],
          responses: {
            "200": { description: "Client orders" },
            "401": { description: "Unauthorized" },
            "403": { description: "Forbidden" }
          }
        }
      }
    }
  },
  apis: []
});

export default swaggerSpec;
