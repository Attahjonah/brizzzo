import { getDB } from '../config/database';
import { redisClient } from '../config/redis';
import { Message } from '../models/Message';

export async function sendMessage(senderId: number, receiverId: number, content: string): Promise<Message> {
  const db = getDB();
  const [result] = await db.execute(
    'INSERT INTO messages (sender_id, receiver_id, content, status) VALUES (?, ?, ?, ?)',
    [senderId, receiverId, content, 'sent']
  );
  const messageId = (result as any).insertId;
  const message: Message = {
    id: messageId,
    senderId,
    receiverId,
    content,
    timestamp: new Date(),
    status: 'sent'
  };

  // Invalidate cache
  await redisClient.del(`messages:${senderId}:${receiverId}`);
  await redisClient.del(`messages:${receiverId}:${senderId}`);

  return message;
}

export async function getMessages(userId1: number, userId2: number): Promise<Message[]> {
  const cacheKey = `messages:${userId1}:${userId2}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  const db = getDB();
  const [rows] = await db.execute(
    'SELECT id, sender_id as senderId, receiver_id as receiverId, content, timestamp, status, delivered_at as deliveredAt, read_at as readAt FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY timestamp ASC',
    [userId1, userId2, userId2, userId1]
  );
  const messages = (rows as any[]).map(row => ({
    ...row,
    timestamp: new Date(row.timestamp),
    deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : undefined,
    readAt: row.readAt ? new Date(row.readAt) : undefined
  }));
  await redisClient.setEx(cacheKey, 300, JSON.stringify(messages)); // cache for 5 min
  return messages;
}

export async function markMessagesAsDelivered(senderId: number, receiverId: number): Promise<void> {
  const db = getDB();
  await db.execute(
    'UPDATE messages SET status = ?, delivered_at = NOW() WHERE sender_id = ? AND receiver_id = ? AND status = ?',
    ['delivered', senderId, receiverId, 'sent']
  );

  // Invalidate cache
  await redisClient.del(`messages:${senderId}:${receiverId}`);
  await redisClient.del(`messages:${receiverId}:${senderId}`);
}

export async function markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
  const db = getDB();
  await db.execute(
    'UPDATE messages SET status = ?, read_at = NOW() WHERE sender_id = ? AND receiver_id = ? AND status IN (?, ?)',
    ['read', senderId, receiverId, 'sent', 'delivered']
  );

  // Invalidate cache
  await redisClient.del(`messages:${senderId}:${receiverId}`);
  await redisClient.del(`messages:${receiverId}:${senderId}`);
}