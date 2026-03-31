# Brizzzo Frontend

A modern, responsive frontend for the Brizzzo real-time messaging application with a WhatsApp-style direct messaging interface.

## Features

- **User Authentication**: Login and registration forms
- **Direct Messaging Interface**: WhatsApp-style DM experience
- **Real-time Messaging**: WebSocket-powered instant messaging
- **Message Status**: Sent, delivered, and read status indicators
- **User Profiles**: Display user avatars, names, and emails
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations

## Interface Overview

### Direct Messages Layout
- **Left Panel**: List of available users with avatars and contact info
- **Right Panel**: Chat interface that appears when selecting a user
- **Chat Header**: Shows selected user's details and back button
- **Message Area**: Displays conversation between two users
- **Input Area**: Message composition with send button

### User Experience
1. **Select User**: Click on any user from the left panel
2. **View Profile**: See user's name, email, and avatar in chat header
3. **Chat**: Send and receive messages in real-time
4. **Status Tracking**: See message delivery and read status
5. **Switch Conversations**: Use back button or select different user

## Files

- `index.html` - Main HTML structure with DM interface
- `style.css` - Modern CSS with responsive DM layout
- `app.js` - JavaScript application logic for DM functionality

## Setup

1. Ensure the backend is running on `http://localhost:3000`
2. Open `index.html` in a web browser
3. Register a new account or login with existing credentials
4. Start chatting by selecting users from the list

## Usage

### Getting Started
1. **Authentication**: Register or login to access the chat
2. **View Users**: See all available users in the left panel
3. **Start DM**: Click on a user to open their direct message chat
4. **Send Messages**: Type your message and press Enter or click Send
5. **Real-time Updates**: Messages appear instantly for both sender and receiver

### Advanced Features
- **Message Status**: Track if messages are sent, delivered, or read
- **User Avatars**: Visual representation with first letter of username
- **Responsive Design**: Adapts to different screen sizes
- **Connection Status**: Shows online/offline WebSocket status

## Technologies

- **HTML5**: Semantic markup with modern structure
- **CSS3**: Flexbox and Grid layouts, smooth animations
- **JavaScript (ES6+)**: Async/await, modern DOM manipulation
- **Socket.IO Client**: Real-time WebSocket communication
- **Fetch API**: RESTful API communication

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## API Integration

The frontend integrates with the following backend endpoints:

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/auth/users` - Fetch available users (requires authentication)
- `GET /api/v1/messages/{userId}` - Load conversation messages
- `POST /api/v1/messages/send` - Send new messages
- `WebSocket` - Real-time message events

## User Management

### Real Users from Database
The app fetches real users from the MySQL database instead of using mock data:

1. **Authenticated Access**: Users endpoint requires JWT token
2. **Auto-filtering**: Current user is automatically excluded from the list
3. **Real-time Updates**: Refresh button to update users list
4. **Fallback Support**: Falls back to mock users if API is unavailable

### User Registration Flow
When a new user registers:
1. User is created in the database
2. Other logged-in users can refresh their users list to see the new user
3. New user appears in DM lists for existing users

## Testing Real User Functionality

1. **Start Backend**: `docker-compose up -d`
2. **Open Multiple Tabs**: Open `frontend/index.html` in different browser tabs
3. **Register Users**: Create different accounts in each tab
4. **Login & Refresh**: Login with different users and click the refresh button (🔄)
5. **Verify Users**: Check that newly registered users appear in the DM lists
6. **Test Messaging**: Send messages between real users

## Development

### Code Structure
- **Class-based Architecture**: `BrizzzoApp` class manages all functionality
- **Event-driven**: DOM events trigger user interactions
- **State Management**: Internal state tracks current user and conversation
- **Error Handling**: Graceful fallbacks for API failures

### Key Methods
- `loadUsers()` - Fetches and displays available users
- `selectUser(userId)` - Opens DM chat with selected user
- `sendMessage()` - Sends message via API and WebSocket
- `displayMessage()` - Renders messages in chat area

## Testing

To test the full DM experience:

1. Start the backend: `docker-compose up -d`
2. Open `frontend/index.html` in multiple browser tabs
3. Register different users in each tab
4. Select users and test real-time messaging
5. Verify message status indicators work correctly
6. Test the back button and user switching functionality

## Testing

To test the full application:

1. Start the backend services (Docker Compose)
2. Open the frontend in multiple browser tabs/windows
3. Register different users in each tab
4. Send messages between users to test real-time functionality
5. Verify message status updates work correctly