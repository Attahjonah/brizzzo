import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import { authLimiter, apiLimiter } from './middleware/rateLimiter';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rates
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', apiLimiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/messages', messageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', server: process.env.SERVER_ID || 'dev' });
});

export default app;