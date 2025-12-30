import { NotificationType } from "../../models/NotificationType.js";

export interface NotificationResponse {
  id: string;            
  userId: string;             

  title: string;
  message?: string;
  type: NotificationType;

  // Metadata được serialize thành JSON string
  metadata?: string;

  createdAt: Date;     
  language: string;
}
