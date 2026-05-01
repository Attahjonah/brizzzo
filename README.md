# Brizzzo Messaging App

A scalable messaging app backend built with Node.js, Express, TypeScript, MySQL, and Redis.

## Features

- User authentication (register/login)
- Send and receive messages
- Rate limiting on APIs
- Caching with Redis
- Dockerized for easy deployment
- Load balancing with Nginx (2 servers)

## Setup

### Development

1. Install dependencies: `npm install`
2. Start services: `docker-compose up`

### Production

1. Build and run: `docker-compose -f docker-compose.prod.yml up --build`

## API Endpoints

- POST /api/auth/register
- POST /api/auth/login
- POST /api/messages/send (auth required)
- GET /api/messages/:userId (auth required)

## Environment Variables

Set in .env file:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME
- REDIS_HOST
- REDIS_PORT
- JWT_SECRET
- PORT