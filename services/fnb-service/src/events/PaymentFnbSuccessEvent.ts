export interface PaymentFnbSuccessEvent {
  paymentId: string;
  fnbOrderId: string;
  userId: string;
  amount: string;
  method: string;
  message: string;
}
