import { Server as HttpServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

type ShowtimeId = string;

export class SeatLockWebSocketHandler {
  private wss: WebSocketServer;
  private readonly showtimeSessions: Map<ShowtimeId, Set<WebSocket>> = new Map();
  private readonly pathPrefix: string;

  constructor(server: HttpServer, pathPrefix = '/ws/showtime') {
    this.pathPrefix = pathPrefix.replace(/\/+$/, '');
    this.wss = new WebSocketServer({
      server,
      // This sets the base path. We still validate and extract the UUID.
      path: this.pathPrefix,
      clientTracking: false, // we track our own sessions per showtime
    });

    this.wss.on('connection', (ws, req) => this.afterConnectionEstablished(ws, req));
  }

  // Called when a client connects
  private afterConnectionEstablished(ws: WebSocket, req: any) {
    const path = (req?.url as string) || '';
    const showtimeId = this.extractShowtimeId(path);

    if (showtimeId) {
      let sessions = this.showtimeSessions.get(showtimeId);
      if (!sessions) {
        sessions = new Set<WebSocket>();
        this.showtimeSessions.set(showtimeId, sessions);
      }
      sessions.add(ws);
      (ws as any).showtimeId = showtimeId;

      console.info(`WebSocket connected: showtimeId=${showtimeId}`);

      ws.on('close', (code, reason) => this.afterConnectionClosed(ws, code, reason));
      ws.on('error', (err) => this.handleTransportError(ws, err));
      ws.on('message', () => {
        // Optional: handle client messages (e.g., pings). This handler can be expanded if needed.
      });
    } else {
      console.warn(`Invalid WebSocket path: ${path}`);
      try {
        // 1008: Policy Violation (closest to BAD_DATA in ws)
        ws.close(1008, 'Invalid showtime path or UUID');
      } catch {
        /* noop */
      }
    }
  }

  // Called when a client disconnects
  private afterConnectionClosed(ws: WebSocket, code: number, reason: Buffer) {
    const showtimeId: ShowtimeId | undefined = (ws as any).showtimeId;
    if (showtimeId) {
      const sessions = this.showtimeSessions.get(showtimeId);
      if (sessions) {
        sessions.delete(ws);
        if (sessions.size === 0) {
          this.showtimeSessions.delete(showtimeId);
        }
      }
    }

    const reasonText = reason?.toString?.() || '';
    console.info(`WebSocket disconnected: code=${code}, reason=${reasonText}`);
  }

  // Called on transport errors
  private handleTransportError(ws: WebSocket, exception: Error) {
    console.error(`WebSocket error: ${exception.message}`);
    try {
      // 1011: Internal Error
      ws.close(1011, 'Server error');
    } catch {
      /* noop */
    }
  }

  // Broadcast a JSON-serializable message to all sessions of a showtime
  public broadcastToShowtime(showtimeId: ShowtimeId, message: unknown) {
    const sessions = this.showtimeSessions.get(showtimeId);
    if (!sessions || sessions.size === 0) return;

    let json: string;
    try {
      json = JSON.stringify(message);
    } catch (e: any) {
      console.error(`Error serializing broadcast message for showtime ${showtimeId}: ${e?.message || e}`);
      return;
    }

    for (const session of sessions) {
      if (session.readyState === WebSocket.OPEN) {
        try {
          session.send(json);
        } catch (e: any) {
          console.error(`Error sending message to session in showtime ${showtimeId}: ${e?.message || e}`);
        }
      }
    }

    console.debug(`Broadcasted to ${sessions.size} sessions for showtime ${showtimeId}`);
  }

  // Extracts the final path segment and validates it as a UUID
  private extractShowtimeId(path: string): ShowtimeId | null {
    try {
      // Normalize: remove query string and trailing slashes
      const cleanPath = path!.split('?')[0]!.replace(/\/+$/, '');
      const basePrefix = this.pathPrefix.replace(/\/+$/, '');
      // Accept both /ws/showtime and nested paths; take last segment
      const effective = cleanPath.startsWith(basePrefix) ? cleanPath : cleanPath;
      const parts = effective.split('/').filter(Boolean);
      const idPart = parts[parts.length - 1];

      if (!idPart) return null;

      // UUID v1–v5 validation
      const uuidRegex =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

      return uuidRegex.test(idPart) ? idPart : null;
    } catch {
      console.error(`Invalid UUID in path: ${path}`);
      return null;
    }
  }
}
