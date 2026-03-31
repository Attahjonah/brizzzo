import express from 'express';
import { register, login, getUsersController } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', authenticateToken, getUsersController);

export default router;