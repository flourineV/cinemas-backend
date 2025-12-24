import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Showtime Service API",
      version: "1.0.0",
      description: "API documentation for the Showtime microservice",
    },
    servers: [
      {
        url: "http://localhost:8084/api",
      },
    ],
    components: {
      schemas: {
        ProvinceRequest: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Ho Chi Minh City" },
          },
        },

        TheaterRequest: {
          type: "object",
          required: ["provinceId", "name", "address", "description", "imageUrl"],
          properties: {
            provinceId: { type: "string", format: "uuid" },
            name: { type: "string" },
            address: { type: "string" },
            description: { type: "string" },
            imageUrl: { type: "string", format: "uri" },
          },
        },

        RoomRequest: {
          type: "object",
          required: ["theaterId", "name", "seatCount"],
          properties: {
            theaterId: { type: "string", format: "uuid" },
            name: { type: "string" },
            seatCount: { type: "integer", example: 120 },
          },
        },

        SeatRequest: {
          type: "object",
          required: ["roomId", "seatNumber", "rowLabel", "columnIndex", "type"],
          properties: {
            roomId: { type: "string", format: "uuid" },
            seatNumber: { type: "string", example: "A01" },
            rowLabel: { type: "string", example: "A" },
            columnIndex: { type: "integer", example: 1 },
            type: {
              type: "string",
              example: "VIP",
            },
          },
        },

        /* ---------- SHOWTIME ---------- */
        ShowtimeRequest: {
          type: "object",
          required: ["movieId", "theaterId", "roomId", "startTime", "endTime"],
          properties: {
            movieId: { type: "string", format: "uuid" },
            theaterId: { type: "string", format: "uuid" },
            roomId: { type: "string", format: "uuid" },
            startTime: {
              type: "string",
              format: "date-time",
              example: "2025-01-01T10:00:00Z",
            },
            endTime: {
              type: "string",
              format: "date-time",
              example: "2025-01-01T12:00:00Z",
            },
          },
        },
        BatchShowtimeRequest: {
          type: "object",
          required: ["showtimes", "skipOnConflict"],
          properties: {
            showtimes: {
              type: "array",
              items: { $ref: "#/components/schemas/ShowtimeRequest" },
            },
            skipOnConflict: {
              type: "boolean",
              example: true,
            },
          },
        },
        ValidateShowtimeRequest: {
          type: "object",
          required: ["roomId", "startTime", "endTime"],
          properties: {
            roomId: { type: "string", format: "uuid" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            excludeShowtimeId: { type: "string", format: "uuid" },
          },
        },
        /* ---------- SEATS ---------- */
        SeatSelectionDetail: {
          type: "object",
          required: ["seatId", "seatType", "ticketType"],
          properties: {
            seatId: { type: "string", format: "uuid" },
            seatType: { type: "string", example: "VIP" },
            ticketType: { type: "string", example: "ADULT" },
          },
        },
        SeatLockRequest: {
          type: "object",
          required: ["userId", "guestSessionId", "showtimeId", "selectedSeats"],
          properties: {
            userId: { type: "string" },
            guestSessionId: { type: "string" },
            showtimeId: { type: "string", format: "uuid" },
            selectedSeats: {
              type: "array",
              items: { $ref: "#/components/schemas/SeatSelectionDetail" },
            },
          },
        },
        SingleSeatLockRequest: {
          type: "object",
          required: ["userId", "guestSessionId", "showtimeId", "selectedSeat"],
          properties: {
            userId: { type: "string" },
            guestSessionId: { type: "string" },
            showtimeId: { type: "string", format: "uuid" },
            selectedSeat: {
              $ref: "#/components/schemas/SeatSelectionDetail",
            },
          },
        },
        ExtendLockRequest: {
          type: "object",
          required: ["showtimeId", "seatIds", "userId", "guestSessionId"],
          properties: {
            showtimeId: { type: "string", format: "uuid" },
            seatIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
            userId: { type: "string" },
            guestSessionId: { type: "string" },
          },
        },
        SeatReleaseRequest: {
          type: "object",
          required: ["showtimeId", "seatIds", "reason"],
          properties: {
            showtimeId: { type: "string", format: "uuid" },
            seatIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
            bookingId: {
              type: "string",
              format: "uuid",
              nullable: true,
            },
            reason: {
              type: "string",
              example: "admin_override",
            },
          },
        },
        UpdateSeatStatusRequest: {
          type: "object",
          required: ["showtimeId", "seatId", "status"],
          properties: {
            showtimeId: { type: "string", format: "uuid" },
            seatId: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: ["AVAILABLE", "LOCKED", "BOOKED"],
            },
          },
        },
        BatchInitializeSeatsRequest: {
          type: "object",
          required: ["showtimeIds"],
          properties: {
            showtimeIds: {
              type: "array",
              items: { type: "string", format: "uuid" },
            },
          },
        },
        ProvinceResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              example: 'Ho Chi Minh City'
            }
          }
        },
        RoomResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              example: 'Room A'
            },
            seatCount: {
              type: 'integer',
              example: 120
            },
            theaterName: {
              type: 'string',
              example: 'CGV Vincom'
            }
          }
        },
        TheaterResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              example: 'CGV Vincom'
            },
            address: {
              type: 'string',
              example: '72 Le Thanh Ton, District 1'
            },
            description: {
              type: 'string',
              example: 'Premium cinema with IMAX screens'
            },
            provinceName: {
              type: 'string',
              example: 'Ho Chi Minh City'
            },
            imageUrl: {
              type: 'string',
              example: 'https://example.com/theater.jpg'
            }
          }
        },
        ShowtimeResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            movieId: {
              type: 'string',
              format: 'uuid'
            },
            theaterName: {
              type: 'string',
              example: 'CGV Vincom'
            },
            roomId: {
              type: 'string',
              format: 'uuid'
            },
            roomName: {
              type: 'string',
              example: 'Room 1'
            },
            startTime: {
              type: 'string',
              format: 'date-time'
            },
            endTime: {
              type: 'string',
              format: 'date-time'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'SUSPENDED'],
              example: 'ACTIVE'
            }
          }
        },
        BatchShowtimeResponse: {
          type: 'object',
          properties: {
            totalRequested: {
              type: 'integer',
              example: 10
            },
            successCount: {
              type: 'integer',
              example: 8
            },
            failedCount: {
              type: 'integer',
              example: 2
            },
            createdShowtimes: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ShowtimeResponse'
              }
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['Showtime #3 conflicts with existing showtime']
            }
          }
        },
        ShowtimeConflictResponse: {
          type: 'object',
          properties: {
            hasConflict: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'No conflicts found'
            },
            conflictingShowtimes: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ShowtimeResponse'
              }
            }
          }
        },
        ShowtimeDetailResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            movieId: {
              type: 'string',
              format: 'uuid'
            },
            movieTitle: {
              type: 'string',
              example: 'Avatar 2'
            },
            theaterId: {
              type: 'string',
              format: 'uuid'
            },
            theaterName: {
              type: 'string'
            },
            theaterNameEn: {
              type: 'string'
            },
            provinceId: {
              type: 'string',
              format: 'uuid'
            },
            provinceName: {
              type: 'string'
            },
            provinceNameEn: {
              type: 'string'
            },
            roomId: {
              type: 'string',
              format: 'uuid'
            },
            roomName: {
              type: 'string'
            },
            roomNameEn: {
              type: 'string'
            },
            startTime: {
              type: 'string',
              format: 'date-time'
            },
            endTime: {
              type: 'string',
              format: 'date-time'
            },
            totalSeats: {
              type: 'integer',
              example: 120
            },
            bookedSeats: {
              type: 'integer',
              example: 45
            },
            availableSeats: {
              type: 'integer',
              example: 75
            }
          }
        },
        PagedShowtimeResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ShowtimeDetailResponse'
              }
            },
            page: {
              type: 'integer',
              example: 1
            },
            size: {
              type: 'integer',
              example: 20
            },
            totalElements: {
              type: 'integer',
              example: 150
            },
            totalPages: {
              type: 'integer',
              example: 8
            }
          }
        },
        AutoGenerateShowtimesResponse: {
          type: 'object',
          properties: {
            totalGenerated: {
              type: 'integer',
              example: 250
            },
            totalSkipped: {
              type: 'integer',
              example: 10
            },
            generatedMovies: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['movie-uuid-1', 'movie-uuid-2']
            },
            skippedMovies: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            message: {
              type: 'string',
              example: 'Generated 250 showtimes across 5 theaters in 7 days'
            }
          }
        },
        TheaterScheduleResponse: {
          type: 'object',
          properties: {
            theaterId: {
              type: 'string',
              format: 'uuid'
            },
            theaterName: {
              type: 'string'
            },
            theaterAddress: {
              type: 'string'
            },
            showtimes: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ShowtimeResponse'
              }
            }
          }
        },
        ShowtimesByMovieResponse: {
          type: 'object',
          properties: {
            availableDates: {
              type: 'array',
              items: {
                type: 'string',
                format: 'date'
              },
              example: ['2024-12-25', '2024-12-26', '2024-12-27']
            },
            scheduleByDate: {
              type: 'object',
              additionalProperties: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/TheaterScheduleResponse'
                }
              }
            }
          }
        },
        TheaterShowtimesResponse: {
          type: 'object',
          properties: {
            theaterId: {
              type: 'string',
              format: 'uuid'
            },
            theaterName: {
              type: 'string'
            },
            theaterAddress: {
              type: 'string'
            },
            theaterImageUrl: {
              type: 'string'
            },
            showtimes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  showtimeId: {
                    type: 'string',
                    format: 'uuid'
                  },
                  roomId: {
                    type: 'string',
                    format: 'uuid'
                  },
                  roomName: {
                    type: 'string'
                  },
                  startTime: {
                    type: 'string',
                    format: 'date-time'
                  },
                  endTime: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        MovieShowtimesResponse: {
          type: 'object',
          properties: {
            movieId: {
              type: 'string',
              format: 'uuid'
            },
            showtimes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  showtimeId: {
                    type: 'string',
                    format: 'uuid'
                  },
                  roomId: {
                    type: 'string',
                    format: 'uuid'
                  },
                  roomName: {
                    type: 'string'
                  },
                  startTime: {
                    type: 'string',
                    format: 'date-time'
                  },
                  endTime: {
                    type: 'string',
                    format: 'date-time'
                  },
                  status: {
                    type: 'string',
                    example: 'ACTIVE'
                  }
                }
              }
            }
          }
        },
        MovieWithTheatersResponse: {
          type: 'object',
          properties: {
            movieId: {
              type: 'string',
              format: 'uuid'
            },
            theaters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  theaterId: {
                    type: 'string',
                    format: 'uuid'
                  },
                  theaterName: {
                    type: 'string'
                  },
                  theaterAddress: {
                    type: 'string'
                  },
                  showtimes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        showtimeId: {
                          type: 'string',
                          format: 'uuid'
                        },
                        roomName: {
                          type: 'string'
                        },
                        startTime: {
                          type: 'string',
                          format: 'date-time'
                        },
                        endTime: {
                          type: 'string',
                          format: 'date-time'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        ShowtimeSeatResponse: {
          type: 'object',
          properties: {
            seatId: {
              type: 'string',
              format: 'uuid'
            },
            seatNumber: {
              type: 'string',
              example: 'A05'
            },
            type: {
              type: 'string',
              enum: ['NORMAL', 'VIP', 'COUPLE'],
              example: 'VIP'
            },
            status: {
              type: 'string',
              enum: ['AVAILABLE', 'LOCKED', 'BOOKED', 'UNAVAILABLE'],
              example: 'AVAILABLE'
            }
          }
        },
        ShowtimeSeatsLayoutResponse: {
          type: 'object',
          properties: {
            totalSeats: {
              type: 'integer',
              example: 120
            },
            totalRows: {
              type: 'integer',
              example: 10
            },
            totalColumns: {
              type: 'integer',
              example: 12
            },
            seats: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ShowtimeSeatResponse'
              }
            }
          }
        },
        SeatLockResponse: {
          type: 'object',
          properties: {
            showtimeId: {
              type: 'string',
              format: 'uuid'
            },
            seatId: {
              type: 'string',
              format: 'uuid'
            },
            status: {
              type: 'string',
              enum: ['LOCKED', 'AVAILABLE', 'ALREADY_LOCKED'],
              example: 'LOCKED'
            },
            ttl: {
              type: 'integer',
              description: 'Seconds until expiration',
              example: 300
            }
          }
        },
        SeatResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            seatNumber: {
              type: 'string',
              example: 'A05'
            },
            rowLabel: {
              type: 'string',
              example: 'A'
            },
            columnIndex: {
              type: 'integer',
              example: 5
            },
            type: {
              type: 'string',
              enum: ['NORMAL', 'VIP', 'COUPLE'],
              example: 'VIP'
            },
            roomName: {
              type: 'string',
              example: 'Room 1'
            }
          }
        },
        ShowtimeStatsResponse: {
          type: 'object',
          properties: {
            totalShowtimes: {
              type: 'integer',
              example: 500
            },
            activeShowtimes: {
              type: 'integer',
              example: 450
            },
            suspendedShowtimes: {
              type: 'integer',
              example: 50
            },
            upcomingShowtimes: {
              type: 'integer',
              example: 300
            }
          }
        },
      },
    },
  },
  // Paths to files with OpenAPI annotations
  apis: ["./src/controllers/*.ts", "./src/dto/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📖 Swagger UI available at http://localhost:8084/api-docs");
}
