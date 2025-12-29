// src/config/swagger.ts
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import type { OpenAPIV3 } from 'openapi-types';

const openApiDocument: OpenAPIV3.Document = {
  openapi: '3.0.1',
  info: {
    title: 'Booking Service API',
    version: '1.0.0',
    description: 'Booking service API: bookings, stats, loyalty, vouchers, and admin search.',
  },
  servers: [
    {
      url: process.env.SWAGGER_SERVER_URL ?? 'http://localhost:8085/api/bookings',
      description: 'Default server',
    },
  ],
  components: {
    securitySchemes: {
    //   bearerAuth: {
    //     type: 'http',
    //     scheme: 'bearer',
    //     bearerFormat: 'JWT',
    //     description: 'JWT bearer token for user authentication',
    //   },
      internalAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-internal-secret',
        description: 'Internal service key. Use this OR bearer token for internal endpoints.',
      },
    },
    schemas: {
      // --- Requests ---
      SeatSelectionDetail: {
        type: 'object',
        properties: {
          seatId: { type: 'string', format: 'uuid' },
          seatType: { type: 'string' },
          ticketType: { type: 'string' },
        },
        required: ['seatId', 'seatType', 'ticketType'],
        additionalProperties: false,
      },

      CreateBookingRequest: {
        type: 'object',
        properties: {
          showtimeId: { type: 'string', format: 'uuid' },
          selectedSeats: {
            type: 'array',
            items: { $ref: '#/components/schemas/SeatSelectionDetail' },
          },
          // guestName: { type: 'string' },
          // guestEmail: { type: 'string', format: 'email' },
           userId: { type: 'string', format: 'uuid' },
          // guestSessionId: { type: 'string', format: 'uuid' },
        },
        required: ['showtimeId', 'selectedSeats'],
        additionalProperties: false,
      },

      CalculatedFnbItemDto: {
        type: 'object',
        properties: {
          fnbItemId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', format: 'int32' },
          unitPrice: { type: 'string', example: '25.00' },
          totalFnbItemPrice: { type: 'string', example: '50.00' },
        },
        required: ['fnbItemId', 'quantity', 'unitPrice', 'totalFnbItemPrice'],
        additionalProperties: false,
      },

      FinalizeBookingRequest: {
        type: 'object',
        properties: {
          fnbItems: {
            type: 'array',
            items: { $ref: '#/components/schemas/CalculatedFnbItemDto' },
          },
          promotionCode: { type: 'string' },
          refundVoucherCode: { type: 'string' },
          useLoyaltyDiscount: { type: 'boolean' },
          language: { type: 'string', enum: ['vi', 'en'] },
        },
        required: ['useLoyaltyDiscount'],
        additionalProperties: false,
      },

      UpdateLoyaltyRequest: {
        type: 'object',
        properties: {
          points: { type: 'integer', format: 'int32' },
          bookingId: { type: 'string', format: 'uuid' },
          bookingCode: { type: 'string' },
          amountSpent: { type: 'string', example: '120.50' },
          description: { type: 'string' },
        },
        required: ['points', 'bookingId', 'bookingCode', 'amountSpent'],
        additionalProperties: false,
      },

      RefundVoucherRequest: {
        type: 'object',
        properties: {
          userId: { type: 'string', format: 'uuid' },
          value: { type: 'string', example: '10.00' },
          expiredAt: { type: 'string', format: 'date-time' },
        },
        required: ['userId', 'value', 'expiredAt'],
        additionalProperties: false,
      },

      BookingCriteria: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
          userId: { type: 'string', format: 'uuid' },
          userIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
          username: { type: 'string' },
          showtimeId: { type: 'string', format: 'uuid' },
          movieId: { type: 'string', format: 'uuid' },
          bookingCode: { type: 'string' },
          status: { type: 'string' },
          paymentMethod: { type: 'string' },
          // guestName: { type: 'string' },
          // guestEmail: { type: 'string', format: 'email' },
          fromDate: { type: 'string', format: 'date-time' },
          toDate: { type: 'string', format: 'date-time' },
          minPrice: { type: 'string' },
          maxPrice: { type: 'string' },
        },
        additionalProperties: false,
      },

      // --- Responses ---
      BookingSeatResponse: {
        type: 'object',
        properties: {
          seatId: { type: 'string', format: 'uuid' },
          seatNumber: { type: 'string', nullable: true },
          seatType: { type: 'string' },
          ticketType: { type: 'string' },
          price: { type: 'string' },
        },
        required: ['seatId', 'seatType', 'ticketType', 'price'],
        additionalProperties: false,
      },

      BookingResponse: {
        type: 'object',
        properties: {
          bookingId: { type: 'string', format: 'uuid' },
          bookingCode: { type: 'string' },
          userId: { type: 'string', format: 'uuid', nullable: true },
          fullName: { type: 'string', nullable: true },
          showtimeId: { type: 'string', format: 'uuid' },
          movieId: { type: 'string', format: 'uuid', nullable: true },
          movieTitle: { type: 'string', nullable: true },
          movieTitleEn: { type: 'string', nullable: true },
          theaterName: { type: 'string', nullable: true },
          theaterNameEn: { type: 'string', nullable: true },
          roomName: { type: 'string', nullable: true },
          roomNameEn: { type: 'string', nullable: true },
          showDateTime: { type: 'string', format: 'date-time', nullable: true },
          // guestName: { type: 'string', nullable: true },
          // guestEmail: { type: 'string', format: 'email', nullable: true },
          status: { type: 'string' },
          totalPrice: { type: 'string' },
          discountAmount: { type: 'string' },
          finalPrice: { type: 'string' },
          paymentMethod: { type: 'string', nullable: true },
          transactionId: { type: 'string', nullable: true },
          seats: { type: 'array', items: { $ref: '#/components/schemas/BookingSeatResponse' } },
        },
        required: ['bookingId', 'bookingCode', 'showtimeId', 'status', 'totalPrice', 'discountAmount', 'finalPrice', 'seats'],
        additionalProperties: false,
      },

      BookingStatsResponse: {
        type: 'object',
        properties: {
          totalBookings: { type: 'integer' },
          confirmedBookings: { type: 'integer' },
          cancelledBookings: { type: 'integer' },
          pendingBookings: { type: 'integer' },
          totalRevenue: { type: 'string' },
        },
        required: ['totalBookings', 'confirmedBookings', 'cancelledBookings', 'pendingBookings', 'totalRevenue'],
        additionalProperties: false,
      },

      RevenueStatsResponse: {
        type: 'object',
        properties: {
          year: { type: 'integer' },
          month: { type: 'integer', nullable: true },
          totalRevenue: { type: 'string' },
          totalBookings: { type: 'integer' },
          averageOrderValue: { type: 'string' },
        },
        required: ['year', 'totalRevenue', 'totalBookings', 'averageOrderValue'],
        additionalProperties: false,
      },

      PagedResponse_BookingResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/BookingResponse' } },
          page: { type: 'integer' },
          size: { type: 'integer' },
          totalElements: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
        required: ['data', 'page', 'size', 'totalElements', 'totalPages'],
        additionalProperties: false,
      },

      RefundVoucherResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string' },
          userId: { type: 'string', format: 'uuid' },
          value: { type: 'string' },
          isUsed: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          expiredAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'code', 'userId', 'value', 'isUsed', 'createdAt', 'expiredAt'],
        additionalProperties: false,
      },
    },
  },

  paths: {
    // Booking controller
    '/bookings': {
      post: {
        summary: 'Create a booking',
        tags: ['Booking'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBookingRequest' } } },
        },
        responses: {
          '200': { description: 'Booking created', content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingResponse' } } } },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/bookings/{id}': {
      get: {
        summary: 'Get booking by id',
        tags: ['Booking'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Booking', content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingResponse' } } } },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Not found' },
        },
        security: [{ bearerAuth: [] }],
      },
      delete: {
        summary: 'Delete booking (admin)',
        tags: ['Booking'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '204': { description: 'Deleted' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/bookings/user/{userId}': {
      get: {
        summary: 'Get bookings by user',
        tags: ['Booking'],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'List of bookings', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/BookingResponse' } } } } },
          '401': { description: 'Unauthorized' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/bookings/{id}/finalize': {
      patch: {
        summary: 'Finalize a booking',
        tags: ['Booking'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/FinalizeBookingRequest' } } },
        },
        responses: {
          '200': { description: 'Booking finalized', content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingResponse' } } } },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/bookings/{id}/cancel': {
      post: {
        summary: 'Cancel a booking',
        tags: ['Booking'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Booking cancelled', content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingResponse' } } } },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/bookings/admin/search': {
      get: {
        summary: 'Search bookings (admin)',
        tags: ['Admin'],
        parameters: [
          { name: 'keyword', in: 'query', schema: { type: 'string' } },
          { name: 'userId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'username', in: 'query', schema: { type: 'string' } },
          { name: 'showtimeId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'movieId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'bookingCode', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'paymentMethod', in: 'query', schema: { type: 'string' } },
          { name: 'guestName', in: 'query', schema: { type: 'string' } },
          { name: 'guestEmail', in: 'query', schema: { type: 'string', format: 'email' } },
          { name: 'fromDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'toDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'minPrice', in: 'query', schema: { type: 'string' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'size', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' } },
          { name: 'sortDir', in: 'query', schema: { type: 'string', default: 'desc' } },
        ],
        responses: {
          '200': { description: 'Paged bookings', content: { 'application/json': { schema: { $ref: '#/components/schemas/PagedResponse_BookingResponse' } } } },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/bookings/check': {
      get: {
        summary: 'Check if user booked a movie (internal or authenticated)',
        tags: ['Booking'],
        parameters: [
          { name: 'userId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'movieId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Has booked', content: { 'application/json': { schema: { type: 'object', properties: { hasBooked: { type: 'boolean' } } } } } },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
        // allow either internal key OR bearer token
        security: [{ internalAuth: [] }, { bearerAuth: [] }],
      },
    },

    '/bookings/count': {
      get: {
        summary: 'Get booking count by user id (internal or authenticated)',
        tags: ['Booking'],
        parameters: [{ name: 'userId', in: 'query', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Count', content: { 'application/json': { schema: { type: 'integer' } } } },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
        security: [{ internalAuth: [] }, { bearerAuth: [] }],
      },
    },

    // Stats controller
    '/stats/overview': {
      get: {
        summary: 'Booking overview stats',
        tags: ['Stats'],
        parameters: [{ name: 'theaterId', in: 'query', schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Overview stats', content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingStatsResponse' } } } },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    '/stats/revenue': {
      get: {
        summary: 'Revenue stats',
        tags: ['Stats'],
        parameters: [
          { name: 'year', in: 'query', schema: { type: 'integer' } },
          { name: 'month', in: 'query', schema: { type: 'integer' } },
          { name: 'theaterId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'provinceId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Revenue stats list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RevenueStatsResponse' } } } } },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
        security: [{ bearerAuth: [] }],
      },
    },

    // // Loyalty and voucher endpoints (examples)
    // '/api/loyalty/update': {
    //   post: {
    //     summary: 'Update loyalty points for a booking',
    //     tags: ['Loyalty'],
    //     requestBody: {
    //       required: true,
    //       content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateLoyaltyRequest' } } },
    //     },
    //     responses: {
    //       '200': { description: 'Loyalty updated', content: { 'application/json': { schema: { type: 'object' } } } },
    //       '400': { description: 'Bad request' },
    //       '401': { description: 'Unauthorized' },
    //     },
    //     security: [{ bearerAuth: [] }],
    //   },
    // },

    // '/api/refund-voucher': {
    //   post: {
    //     summary: 'Create a refund voucher for a user',
    //     tags: ['Voucher'],
    //     requestBody: {
    //       required: true,
    //       content: { 'application/json': { schema: { $ref: '#/components/schemas/RefundVoucherRequest' } } },
    //     },
    //     responses: {
    //       '200': { description: 'Voucher created', content: { 'application/json': { schema: { $ref: '#/components/schemas/RefundVoucherResponse' } } } },
    //       '400': { description: 'Bad request' },
    //       '401': { description: 'Unauthorized' },
    //     },
    //     security: [{ bearerAuth: [] }],
    //   },
    // },
  },

  tags: [
    { name: 'Booking', description: 'Booking operations' },
    { name: 'Admin', description: 'Admin-only endpoints' },
    { name: 'Stats', description: 'Statistics and reporting' },
    // { name: 'Loyalty', description: 'Loyalty related operations' },
    // { name: 'Voucher', description: 'Voucher operations' },
  ],
};

/**
 * Mounts Swagger UI at the given path on the provided Express app.
 *
 * @param app Express application instance
 * @param mountPath path to mount swagger UI (default: /api-docs)
 */
export function setupSwagger(app: Express, mountPath = '/api-docs'): void {
  app.use(mountPath, swaggerUi.serve, swaggerUi.setup(openApiDocument));
}

export default setupSwagger;
