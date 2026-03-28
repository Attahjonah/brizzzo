import express from 'express';
import { postMessage, fetchMessages, markAsDelivered, markAsRead } from '../controllers/messageController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.post('/send', postMessage);
router.get('/:userId', fetchMessages);
router.put('/:senderId/delivered', markAsDelivered);
router.put('/:senderId/read', markAsRead);

export default router;