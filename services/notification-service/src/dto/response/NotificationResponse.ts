import { NotificationType } from "../../models/NotificationType.js";

export interface NotificationResponse {
  id: string;            
  userId: string;        
  bookingId?: string;    
  paymentId?: string;    
  amount?: number;       

  title: string;
  message?: string;
  language?: string;     
  type: NotificationType;

  // Metadata được serialize thành JSON string
  metadata?: string;

  createdAt: Date;     
}
