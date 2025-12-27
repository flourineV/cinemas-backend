export interface ZaloPayCreateOrderRequest {
  app_id: number;
  app_user: string;
  app_time: number;
  amount: number;
  app_trans_id: string;
  bank_code: string;
  embed_data: string;
  item: string;
  callback_url: string;
  description: string;
  mac: string;
}
