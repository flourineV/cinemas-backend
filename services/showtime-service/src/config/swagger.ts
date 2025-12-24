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
  },
  // Paths to files with OpenAPI annotations
  apis: ["./src/controllers/*.ts", "./src/dto/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📖 Swagger UI available at http://localhost:8084/api-docs");
}
