// PaymentFnbSuccessEvent - Received from Payment Service
export interface PaymentFnbSuccessEvent {
  fnbOrderId: string;
  paymentId: string;
  method: string;
}

