import { Request, Response } from 'express';
import { sendMessage, getMessages, markMessagesAsDelivered, markMessagesAsRead } from '../services/messageService';
import { AuthRequest } from '../middleware/authMiddleware';

export async function postMessage(req: AuthRequest, res: Response) {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;
    const message = await sendMessage(senderId, receiverId, content);
    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
}

export async function fetchMessages(req: AuthRequest, res: Response) {
  try {
    const userId1 = req.user.id;
    const userId2 = parseInt(req.params.userId, 10);
    const messages = await getMessages(userId1, userId2);

    // Mark messages as delivered when receiver fetches them
    await markMessagesAsDelivered(userId2, userId1);

    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get messages' });
  }
}

export async function markAsDelivered(req: AuthRequest, res: Response) {
  try {
    const senderId = parseInt(req.params.senderId, 10);
    const receiverId = req.user.id;
    await markMessagesAsDelivered(senderId, receiverId);
    return res.status(200).json({ message: 'Messages marked as delivered' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark messages as delivered' });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const senderId = parseInt(req.params.senderId, 10);
    const receiverId = req.user.id;
    await markMessagesAsRead(senderId, receiverId);
    return res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
}
