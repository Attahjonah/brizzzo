export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  deliveredAt?: Date;
  readAt?: Date;
}