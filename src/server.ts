import app from './app';
import { connectDB } from './config/database';
import { connectRedis, redisClient } from './config/redis';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { markMessagesAsDelivered, markMessagesAsRead } from './services/messageService';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    await connectRedis();

    const server = createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"]
      }
    });

    // Set up Redis adapter for scaling
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));

    // Socket.IO middleware for authentication
    io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      // Verify token (implement auth logic)
      // For now, just pass
      next();
    });

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
      });

      socket.on('sendMessage', async (data) => {
        // Handle message sending via WebSocket
        // Emit to receiver
        io.to(`user_${data.receiverId}`).emit('newMessage', data);
      });

      socket.on('markAsDelivered', async (data) => {
        const { senderId, receiverId } = data;
        await markMessagesAsDelivered(senderId, receiverId);
        // Notify sender that messages were delivered
        io.to(`user_${senderId}`).emit('messagesDelivered', { senderId, receiverId });
      });

      socket.on('markAsRead', async (data) => {
        const { senderId, receiverId } = data;
        await markMessagesAsRead(senderId, receiverId);
        // Notify sender that messages were read
        io.to(`user_${senderId}`).emit('messagesRead', { senderId, receiverId });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();