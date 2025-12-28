export interface PaymentFnbFailedEvent {
  paymentId: string;
  fnbOrderId: string;
  userId: string;
  amount: string; //bigNumber -> string
  method: string;
  message: string;
  reason: string;
}