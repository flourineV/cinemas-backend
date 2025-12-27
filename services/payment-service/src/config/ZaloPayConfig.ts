export interface IZaloPayConfig {
  appId: string;
  key1: string;
  key2: string;
  endpoint: string;
  callbackUrl: string;
  redirectUrl: string;
}

export class ZaloPayConfig implements IZaloPayConfig {
  public appId: string;
  public key1: string;
  public key2: string;
  public endpoint: string;
  public callbackUrl: string;
  public redirectUrl: string;

  constructor() {
    if (!process.env.ZALOPAY_APP_ID ||
        !process.env.ZALOPAY_KEY1 ||
        !process.env.ZALOPAY_KEY2 ||
        !process.env.ZALOPAY_ENDPOINT ||
        !process.env.ZALOPAY_CALLBACK_URL ||
        !process.env.ZALOPAY_REDIRECT_URL) {
      throw new Error('Missing ZaloPay configuration in environment variables');
    }

    this.appId = process.env.ZALOPAY_APP_ID;
    this.key1 = process.env.ZALOPAY_KEY1;
    this.key2 = process.env.ZALOPAY_KEY2;
    this.endpoint = process.env.ZALOPAY_ENDPOINT;
    this.callbackUrl = process.env.ZALOPAY_CALLBACK_URL;
    this.redirectUrl = process.env.ZALOPAY_REDIRECT_URL;
  }
}
