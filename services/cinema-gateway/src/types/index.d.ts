declare namespace Express {
  export interface Request {
    user?: {
      sub: string;
      role: "USER" | "STAFF" | "ADMIN";
      [k: string]: any;
    };
    reqId?: string;
  }
}
