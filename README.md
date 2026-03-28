# Brizzzo Backend

A scalable real-time messaging backend built with Node.js, TypeScript, Express, Socket.IO, MySQL, and Redis.

## 🚀 Features

- **Real-time Messaging**: WebSocket-based instant messaging with Socket.IO
- **Message Status Tracking**: WhatsApp-style delivery status (sent → delivered → read)
- **Horizontal Scaling**: Load balanced across multiple server instances with Redis adapter
- **Caching**: Redis-powered message caching for optimal performance
- **Authentication**: JWT-based user authentication
- **Rate Limiting**: API rate limiting for security
- **Database**: MySQL with connection pooling
- **Containerized**: Docker + Docker Compose setup

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Nginx Load    │    │   App Server 1  │
│    Balancer     │────│   (Port 3000)   │
│   (Port 80)     │    └─────────────────┘
└─────────────────┘             │
          │                     │
          │             ┌─────────────────┐
          │             │   App Server 2  │
          └─────────────│   (Port 3000)   │
                        └─────────────────┘
                               │
                               │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Pub/Sub)     │
                    └─────────────────┘
                               │
                    ┌─────────────────┐
                    │     MySQL       │
                    │   Database      │
                    └─────────────────┘
```

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)

## 🛠️ Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brizzzo-backend
   ```

2. **Start the services**
   ```bash
   docker-compose up --build
   ```

3. **Verify health**
   ```bash
   curl http://localhost:3000/health
   ```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication

#### Register User
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

Response includes JWT token for authenticated requests.

### Messages

All message endpoints require `Authorization: Bearer <token>` header.

#### Send Message
```bash
POST /api/v1/messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": 2,
  "content": "Hello, World!"
}
```

#### Get Messages
```bash
GET /api/v1/messages/{userId}
Authorization: Bearer <token>
```

Returns conversation between authenticated user and specified user.

#### Mark Messages as Delivered
```bash
PUT /api/v1/messages/{senderId}/delivered
Authorization: Bearer <token>
```

#### Mark Messages as Read
```bash
PUT /api/v1/messages/{senderId}/read
Authorization: Bearer <token>
```

## 🔌 WebSocket Events

Connect to WebSocket server with authentication:

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your_jwt_token' }
});
```

### Client Events (Emit)

#### Join User Room
```javascript
socket.emit('join', userId);
```

#### Send Message
```javascript
socket.emit('sendMessage', {
  receiverId: 2,
  content: 'Hello via WebSocket!'
});
```

#### Mark as Delivered
```javascript
socket.emit('markAsDelivered', {
  senderId: 1,
  receiverId: 2
});
```

#### Mark as Read
```javascript
socket.emit('markAsRead', {
  senderId: 1,
  receiverId: 2
});
```

### Server Events (Listen)

#### New Message Notification
```javascript
socket.on('newMessage', (data) => {
  console.log('New message:', data);
});
```

#### Messages Delivered
```javascript
socket.on('messagesDelivered', (data) => {
  console.log('Messages delivered to user:', data.receiverId);
});
```

#### Messages Read
```javascript
socket.on('messagesRead', (data) => {
  console.log('Messages read by user:', data.receiverId);
});
```

## 🧪 Testing

### Load Balancing Test
```powershell
for ($i = 1; $i -le 10; $i++) {
  (Invoke-RestMethod -Uri http://localhost:3000/health).server
}
```

### Message Status Test
1. Send a message
2. Fetch messages (marks as delivered)
3. Mark as read
4. Check status updates in responses

### Redis Caching Test
```bash
# Check cache keys
docker-compose exec redis redis-cli KEYS "messages:*"

# Check TTL
docker-compose exec redis redis-cli TTL "messages:1:2"
```

## 🏃‍♂️ Development

### Local Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm start
```

### Database Schema
The `init.sql` file contains the database schema. Tables are created automatically when MySQL container starts.

## 🔧 Configuration

### Environment Variables
- `DB_HOST`: MySQL host (default: mysql)
- `DB_USER`: MySQL user (default: root)
- `DB_PASSWORD`: MySQL password (default: password)
- `DB_NAME`: Database name (default: brizzzo_db)
- `REDIS_HOST`: Redis host (default: redis)
- `JWT_SECRET`: JWT signing secret
- `PORT`: Server port (default: 3000)

### Docker Services
- **app1/app2**: Node.js application servers
- **nginx**: Load balancer and reverse proxy
- **mysql**: Database server
- **redis**: Cache and pub/sub server

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

Response includes server ID for load balancing verification.

### Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app1
docker-compose logs nginx
```

### Redis Monitoring
```bash
docker-compose exec redis redis-cli
> MONITOR  # Watch all Redis operations
> KEYS *   # List all keys
> INFO     # Redis statistics
```

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Set strong secrets for JWT and database
2. **SSL/TLS**: Configure HTTPS in nginx
3. **Scaling**: Add more app instances to docker-compose.yml
4. **Monitoring**: Implement logging and metrics
5. **Backup**: Set up database backups

### Scaling App Instances
```yaml
services:
  app3:
    # Add more app instances
    build: .
    # ... same config as app1/app2
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

ISC License

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed**
- Ensure MySQL container is running
- Check database credentials in docker-compose.yml

**Redis Connection Failed**
- Verify Redis container is healthy
- Check Redis host configuration

**WebSocket Not Working**
- Confirm Socket.IO client is connecting to correct port
- Check nginx WebSocket proxy configuration

**Load Balancing Not Working**
- Verify both app containers are running
- Check nginx upstream configuration

### Debug Commands
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up --build --force-recreate
```