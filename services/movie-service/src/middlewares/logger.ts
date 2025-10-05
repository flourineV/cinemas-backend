import pino from "pino";
import pinoHttp from "pino-http";
export const logger = pino({ level: process.env.LOG_LEVEL || "info" });
export const loggerHttp = pinoHttp({ logger });
