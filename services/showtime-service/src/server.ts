import "dotenv/config";
import { createServer } from "http";
import app from './app.js';
import { SeatLockWebSocketHandler } from "./websocket/SeatLockWebSocketHandler.js";

// Port from env or default
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Create HTTP server wrapping Express
const server = createServer(app);

// Initialize WebSocket handler for seat locking
const seatLockHandler = new SeatLockWebSocketHandler(server);

// Example: you can later broadcast seat lock/unlock events like this:
// seatLockHandler.broadcastToShowtime(showtimeId, { type: "LOCKED", seatId: "A1" });

server.listen(PORT, () => {
  console.log(`🚀 Showtime service running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket endpoint available at ws://localhost:${PORT}/ws/showtime/{showtimeId}`);
});
