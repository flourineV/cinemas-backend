import { OpenAPIV3 } from 'openapi-types';
import type {Express} from 'express'
import swaggerUi from 'swagger-ui-express';

export const swaggerDefinition: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Payment Service API',
    version: '1.0.0',
    description: 'API documentation for CineHub Payment Service - handles payment transactions, ZaloPay integration, and payment statistics',
    contact: {
      name: 'CineHub Dev Team',
      email: 'dev@cinehub.com',
    },
  },
  servers: [
    {
      url: process.env.SWAGGER_URL ?? 'localhost:8086/api/payments',
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Payment',
      description: 'Payment transaction endpoints',
    },
    {
      name: 'ZaloPay',
      description: 'ZaloPay integration endpoints',
    },
    {
      name: 'Statistics',
      description: 'Payment statistics endpoints',
    },
  ],
  paths: {
    '/payments/create-zalopay-url': {
      post: {
        tags: ['ZaloPay'],
        summary: 'Create ZaloPay payment URL for booking',
        description: 'Creates a ZaloPay payment order and returns the payment URL',
        parameters: [
          {
            name: 'bookingId',
            in: 'query',
            required: true,
            description: 'Booking ID',
            schema: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
          },
        ],
        responses: {
          '200': {
            description: 'ZaloPay order created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ZaloPayCreateOrderResponse',
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            
          },
        },
      },
    },
    '/payments/create-zalopay-url-fnb': {
      post: {
        tags: ['ZaloPay'],
        summary: 'Create ZaloPay payment URL for F&B order',
        description: 'Creates a ZaloPay payment order for F&B and returns the payment URL',
        parameters: [
          {
            name: 'fnbOrderId',
            in: 'query',
            required: true,
            description: 'F&B Order ID',
            schema: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174002',
            },
          },
        ],
        responses: {
          '200': {
            description: 'ZaloPay F&B order created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ZaloPayCreateOrderResponse',
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            
          },
        },
      },
    },
    '/payments/callback': {
      post: {
        tags: ['ZaloPay'],
        summary: 'ZaloPay callback endpoint',
        description: 'Receives payment confirmation from ZaloPay gateway',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ZaloCallbackDTO',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Callback processed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CallbackResponse',
                },
              },
            },
          },
        },
      },
    },
    '/payments/check-status': {
      get: {
        tags: ['ZaloPay'],
        summary: 'Check transaction status with ZaloPay',
        description: 'Queries ZaloPay to check the current status of a transaction',
        parameters: [
          {
            name: 'appTransId',
            in: 'query',
            required: true,
            description: 'ZaloPay transaction ID',
            schema: {
              type: 'string',
              example: '241227_12345678',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Transaction status retrieved',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CheckStatusResponse',
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            
          },
        },
      },
    },
    '/payments/admin/search': {
      get: {
        tags: ['Payment'],
        summary: 'Search payments with criteria (Admin only)',
        description: 'Search and filter payment transactions. Requires Admin role.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'keyword',
            in: 'query',
            description: 'Search keyword (partial match for userId, bookingId, showtimeId, transactionRef)',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'userId',
            in: 'query',
            description: 'Filter by user ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
          {
            name: 'bookingId',
            in: 'query',
            description: 'Filter by booking ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
          {
            name: 'showtimeId',
            in: 'query',
            description: 'Filter by showtime ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
          {
            name: 'transactionRef',
            in: 'query',
            description: 'Filter by transaction reference',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by payment status',
            schema: {
              $ref: '#/components/schemas/PaymentStatus',
            },
          },
          {
            name: 'method',
            in: 'query',
            description: 'Filter by payment method',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'fromDate',
            in: 'query',
            description: 'Filter from date',
            schema: {
              type: 'string',
              format: 'date-time',
            },
          },
          {
            name: 'toDate',
            in: 'query',
            description: 'Filter to date',
            schema: {
              type: 'string',
              format: 'date-time',
            },
          },
          {
            name: 'minAmount',
            in: 'query',
            description: 'Minimum amount',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'maxAmount',
            in: 'query',
            description: 'Maximum amount',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number (0-indexed)',
            schema: {
              type: 'integer',
              default: 0,
            },
          },
          {
            name: 'size',
            in: 'query',
            description: 'Page size',
            schema: {
              type: 'integer',
              default: 10,
            },
          },
          {
            name: 'sortBy',
            in: 'query',
            description: 'Sort by field',
            schema: {
              type: 'string',
              default: 'createdAt',
            },
          },
          {
            name: 'sortDir',
            in: 'query',
            description: 'Sort direction',
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Payments retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PagedPaymentTransactionResponse',
                },
              },
            },
          },
          '403': {
            description: 'Forbidden - Admin access required',
            
          },
          '500': {
            description: 'Internal server error',
            
          },
        },
      },
    },
    '/payments/user/{userId}': {
      get: {
        tags: ['Payment'],
        summary: 'Get payments by user ID',
        description: 'Retrieve all payment transactions for a specific user. Users can only access their own payments.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '200': {
            description: 'User payments retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/PaymentTransactionResponse',
                  },
                },
              },
            },
          },
          '403': {
            description: 'Forbidden - Can only access own payments',
            
          },
          '500': {
            description: 'Internal server error',
            
          },
        },
      },
    },
    '/payments/{id}': {
      get: {
        tags: ['Payment'],
        summary: 'Get payment by ID',
        description: 'Retrieve a specific payment transaction by ID. Users can only access their own payments.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Payment transaction ID',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Payment retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PaymentTransactionResponse',
                },
              },
            },
          },
          '403': {
            description: 'Forbidden - Can only access own payment',
            
          },
          '404': {
            description: 'Payment not found',
            
          },
          '500': {
            description: 'Internal server error',
            
          },
        },
      },
    },
    '/stats/overview': {
      get: {
        tags: ['Statistics'],
        summary: 'Get payment statistics overview',
        description: 'Get overall payment statistics including total payments, successful, failed, pending, and total revenue. Requires Manager or Admin role.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          '200': {
            description: 'Payment statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/PaymentStatsResponse',
                },
              },
            },
          },
          '403': {
            description: 'Forbidden - Manager or Admin access required',
            
          },
          '500': {
            description: 'Internal server error',
            
          },
        },
      },
    },
    '/stats/revenue': {
      get: {
        tags: ['Statistics'],
        summary: 'Get revenue statistics',
        description: 'Get revenue statistics grouped by year/month. Requires Manager or Admin role. Payment stats cannot be filtered by theater.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'year',
            in: 'query',
            description: 'Filter by year',
            schema: {
              type: 'integer',
              example: 2024,
            },
          },
          {
            name: 'month',
            in: 'query',
            description: 'Filter by month (1-12)',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 12,
              example: 12,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Revenue statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/RevenueStatsResponse',
                  },
                },
              },
            },
          },
          '403': {
            description: 'Forbidden - Manager or Admin access required',
          },
          '500': {
            description: 'Internal server error'
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
    },
    schemas: {
      // Enums
      PaymentStatus: {
        type: 'string',
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'],
        description: 'Status of payment transaction',
      },

      // Request DTOs
      PaymentRequest: {
        type: 'object',
        required: ['userId', 'amount', 'method'],
        properties: {
          bookingId: {
            type: 'string',
            format: 'uuid',
            description: 'Booking ID',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'User ID',
            example: '123e4567-e89b-12d3-a456-426614174001',
          },
          amount: {
            type: 'string',
            description: 'Payment amount as string for precision',
            example: '150000.00',
          },
          method: {
            type: 'string',
            description: 'Payment method',
            example: 'ZALOPAY',
            enum: ['ZALOPAY', 'VNPAY', 'MOMO', 'CASH'],
          },
        },
      },

      ExtendSeatLockRequest: {
        type: 'object',
        required: ['showtimeId', 'seatIds'],
        properties: {
          showtimeId: {
            type: 'string',
            format: 'uuid',
            description: 'Showtime ID',
          },
          seatIds: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid',
            },
            description: 'List of seat IDs to extend lock',
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'User ID (for authenticated users)',
          },
          // guestSessionId: {
          //   type: 'string',
          //   description: 'Guest session ID (for guest users)',
          // },
        },
      },

      ZaloCallbackDTO: {
        type: 'object',
        required: ['data', 'mac', 'type'],
        properties: {
          data: {
            type: 'string',
            description: 'JSON string containing order info from ZaloPay',
            example: '{"app_trans_id":"241227_12345678","amount":150000}',
          },
          mac: {
            type: 'string',
            description: 'Checksum signature to verify authenticity',
            example: 'a1b2c3d4e5f6...',
          },
          type: {
            type: 'integer',
            description: 'Callback type (usually 1 or 2)',
            example: 1,
          },
        },
      },

      // Response DTOs
      PaymentResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Payment transaction ID',
          },
          bookingId: {
            type: 'string',
            format: 'uuid',
            description: 'Associated booking ID',
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'User ID',
          },
          amount: {
            type: 'string',
            description: 'Payment amount',
            example: '150000.00',
          },
          method: {
            type: 'string',
            description: 'Payment method',
            example: 'ZALOPAY',
          },
          status: {
            $ref: '#/components/schemas/PaymentStatus',
          },
          transactionRef: {
            type: 'string',
            description: 'Transaction reference from payment gateway',
            example: '241227_12345678',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },

      PaymentTransactionResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Payment transaction ID',
          },
          bookingId: {
            type: 'string',
            format: 'uuid',
            description: 'Associated booking ID',
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'User ID',
          },
          showtimeId: {
            type: 'string',
            format: 'uuid',
            description: 'Showtime ID',
          },
          seatIds: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid',
            },
            description: 'List of seat IDs',
          },
          amount: {
            type: 'string',
            description: 'Payment amount',
            example: '150000.00',
          },
          method: {
            type: 'string',
            description: 'Payment method',
            example: 'ZALOPAY',
          },
          status: {
            $ref: '#/components/schemas/PaymentStatus',
          },
          transactionRef: {
            type: 'string',
            description: 'Transaction reference',
            example: '241227_12345678',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },

      PaymentStatsResponse: {
        type: 'object',
        properties: {
          totalPayments: {
            type: 'integer',
            description: 'Total number of payments',
            example: 1000,
          },
          successfulPayments: {
            type: 'integer',
            description: 'Number of successful payments',
            example: 850,
          },
          failedPayments: {
            type: 'integer',
            description: 'Number of failed payments',
            example: 100,
          },
          pendingPayments: {
            type: 'integer',
            description: 'Number of pending payments',
            example: 50,
          },
          totalRevenue: {
            type: 'string',
            description: 'Total revenue from successful payments',
            example: '125000000.00',
          },
        },
      },

      RevenueStatsResponse: {
        type: 'object',
        properties: {
          year: {
            type: 'integer',
            description: 'Year',
            example: 2024,
          },
          month: {
            type: 'integer',
            nullable: true,
            description: 'Month (null for yearly stats)',
            example: 12,
          },
          totalRevenue: {
            type: 'string',
            description: 'Total revenue for the period',
            example: '15000000.00',
          },
          totalPayments: {
            type: 'integer',
            description: 'Total number of payments',
            example: 120,
          },
          averageOrderValue: {
            type: 'string',
            description: 'Average order value',
            example: '125000.00',
          },
        },
      },

      ZaloPayCreateOrderResponse: {
        type: 'object',
        properties: {
          return_code: {
            type: 'integer',
            description: 'Return code (1 = success)',
            example: 1,
          },
          return_message: {
            type: 'string',
            description: 'Return message',
            example: 'Success',
          },
          sub_return_code: {
            type: 'integer',
            description: 'Sub return code',
            example: 1,
          },
          sub_return_message: {
            type: 'string',
            description: 'Sub return message',
            example: 'Success',
          },
          zp_trans_token: {
            type: 'string',
            description: 'ZaloPay transaction token',
            example: 'abc123def456',
          },
          order_url: {
            type: 'string',
            description: 'URL to redirect user for payment',
            example: 'https://sbgateway.zalopay.vn/processingorder/abc123',
          },
          order_token: {
            type: 'string',
            description: 'Order token',
            example: 'xyz789',
          },
          qr_code: {
            type: 'string',
            description: 'QR code for payment',
            example: 'data:image/png;base64,...',
          },
        },
      },

      PagedPaymentTransactionResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/PaymentTransactionResponse',
            },
          },
          page: {
            type: 'integer',
            description: 'Current page number',
            example: 0,
          },
          size: {
            type: 'integer',
            description: 'Page size',
            example: 10,
          },
          totalElements: {
            type: 'integer',
            description: 'Total number of elements',
            example: 100,
          },
          totalPages: {
            type: 'integer',
            description: 'Total number of pages',
            example: 10,
          },
        },
      },

      CheckStatusResponse: {
        type: 'object',
        properties: {
          isSuccess: {
            type: 'boolean',
            description: 'Whether payment is successful',
            example: true,
          },
          returnCode: {
            type: 'integer',
            description: 'ZaloPay return code',
            example: 1,
          },
          returnMessage: {
            type: 'string',
            description: 'ZaloPay return message',
            example: 'Success',
          },
          bookingId: {
            type: 'string',
            format: 'uuid',
            description: 'Associated booking ID',
          },
        },
      },

      CallbackResponse: {
        type: 'object',
        properties: {
          return_code: {
            type: 'integer',
            description: 'Response code (-1=mac error, 0=error, 1=success)',
            example: 1,
          },
          return_message: {
            type: 'string',
            description: 'Response message',
            example: 'success',
          },
        },
      },

    },
  },
};

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDefinition, {
      explorer: true,
    })
  );
  const PORT = process.env.PORT ?? '8086'
  console.log(`📚 Swagger docs available at http://localhost:${PORT}/api-docs`);
}