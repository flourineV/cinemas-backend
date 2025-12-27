import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Notification Service API",
      version: "1.0.0",
      description: "API documentation for notifications, promotions, FnB orders, and contact forms",
    },
    servers: [
      {
        url: "http://localhost:8089/api",
        description: "Local server",
      },
    ],
    components: {
      schemas: {
        ContactRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            message: { type: "string" },
          },
          required: ["name", "email", "message"],
        },
        PromotionNotificationRequest: {
          type: "object",
          properties: {
            promotionCode: { type: "string" },
            promotionType: { type: "string" },
            discountType: { type: "string" },
            discountValue: { type: "number" },
            discountValueDisplay: { type: "string" },
            description: { type: "string" },
            promoDisplayUrl: { type: "string" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            validUntil: { type: "string" },
            usageRestriction: { type: "string" },
            actionUrl: { type: "string" },
          },
          required: [
            "promotionCode",
            "promotionType",
            "discountType",
            "discountValue",
            "discountValueDisplay",
            "description",
            "promoDisplayUrl",
            "startDate",
            "endDate",
          ],
        },
        FnbItemDetail: {
          type: "object",
          properties: {
            itemName: { type: "string" },
            quantity: { type: "number" },
            unitPrice: { type: "number" },
            totalPrice: { type: "number" },
          },
          required: ["itemName", "quantity", "unitPrice", "totalPrice"],
        },
        FnbOrderConfirmationRequest: {
          type: "object",
          properties: {
            userId: { type: "string", format: "uuid" },
            userEmail: { type: "string" },
            userName: { type: "string" },
            orderCode: { type: "string" },
            theaterId: { type: "string", format: "uuid" },
            totalAmount: { type: "number" },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/FnbItemDetail" },
            },
          },
          required: [
            "userId",
            "userEmail",
            "userName",
            "orderCode",
            "theaterId",
            "totalAmount",
            "items",
          ],
        },
        NotificationResponse: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            bookingId: { type: "string" },
            paymentId: { type: "string" },
            amount: { type: "number" },
            title: { type: "string" },
            message: { type: "string" },
            language: { type: "string" },
            type: { type: "string" },
            metadata: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
          required: ["id", "userId", "title", "type", "createdAt"],
        },
        PromotionNotificationResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            emailsSent: { type: "number" },
            emailsFailed: { type: "number" },
            promotionCode: { type: "string" },
          },
          required: ["message", "emailsSent", "emailsFailed", "promotionCode"],
        },
      },
    },
    paths: {
      "/notifications": {
        get: {
          summary: "Get all notifications",
          responses: {
            200: {
              description: "List of notifications",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/NotificationResponse" },
                  },
                },
              },
            },
          },
        },
      },
      "/notifications/user/{userId}": {
        get: {
          summary: "Get notifications by user ID",
          parameters: [
            {
              name: "userId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "List of notifications for user",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/NotificationResponse" },
                  },
                },
              },
            },
          },
        },
      },
      "/notifications/promotion": {
        post: {
          summary: "Create promotion notification",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PromotionNotificationRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Promotion notification response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PromotionNotificationResponse" },
                },
              },
            },
          },
        },
      },
      "/notifications/fnb-order-confirmation": {
        post: {
          summary: "Send FnB order confirmation email",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FnbOrderConfirmationRequest" },
              },
            },
          },
          responses: {
            200: { description: "FnB order confirmation email sent" },
          },
        },
      },
      "/contact/send": {
        post: {
          summary: "Send contact form email",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ContactRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Contact form submitted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
