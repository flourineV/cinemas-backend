import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, type Relation } from 'typeorm';
import { PaymentTransaction } from './PaymentTransaction.js';

@Entity('payment_seat_ids')
export class PaymentSeat {
  @PrimaryColumn({ type: 'uuid', name: 'payment_id' })
  paymentId: string; // optional, but good to store FK

  @PrimaryColumn({ type: 'uuid', name: 'seat_id' })
  seatId: string;

  @ManyToOne(() => PaymentTransaction, (payment) => payment.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Relation<PaymentTransaction>;
}
