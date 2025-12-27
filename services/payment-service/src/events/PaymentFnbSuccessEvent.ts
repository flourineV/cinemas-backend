export interface PaymentFnbSuccessEvent {
  paymentId: string;
  fnbOrderId: string;
  userId: string;
  amount: string; //bigNumber -> string
  method: string;
  message: string;
}