export class InternalAuthChecker {
  private readonly internalSecretKey: string;

  constructor(secretKey: string) {
    this.internalSecretKey = secretKey;
  }

  requireInternal(headerKey?: string): void {
    if (!headerKey || headerKey !== this.internalSecretKey) {
      throw new Error("Invalid internal service key");
    }
  }
}
