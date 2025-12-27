export interface ZaloCallbackDTO {
  /** ZaloPay returns a JSON string containing order info */
  data: string;

  /** Checksum signature to verify authenticity */
  mac: string;

  /** Callback type (usually 1 or 2) */
  type: number;
}
