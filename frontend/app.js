// Frontend JavaScript for Brizzzo Messaging App

class BrizzzoApp {
    constructor() {
        this.token = null;
        this.currentUser = null;
        this.selectedUserId = null;
        this.socket = null;
        this.users = [];
        this.onlineUserIds = [];

        this.initializeElements();
        this.attachEventListeners();
        this.checkAuthStatus();
    }

    initializeElements() {
        // Auth elements
        this.authSection = document.getElementById('auth-section');
        this.chatSection = document.getElementById('chat-section');
        this.loginTab = document.getElementById('login-tab');
        this.registerTab = document.getElementById('register-tab');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.authMessage = document.getElementById('auth-message');

        // Chat elements
        this.currentUserSpan = document.getElementById('current-user');
        this.connectionStatus = document.getElementById('connection-status');
        this.logoutBtn = document.getElementById('logout-btn');
        this.usersList = document.getElementById('users-list');
        this.refreshUsersBtn = document.getElementById('refresh-users-btn');
        this.userSearchInput = document.getElementById('user-search-input');

        // Profile modal elements
        this.profileModal = document.getElementById('user-profile-modal');
        this.closeProfileModalBtn = document.getElementById('close-profile-modal');
        this.profileAvatar = document.getElementById('profile-avatar');
        this.profileUsername = document.getElementById('profile-username');
        this.profileStatusDot = document.getElementById('profile-status-dot');
        this.profileStatusLabel = document.getElementById('profile-status-label');
        this.profileEmail = document.getElementById('profile-email');
        this.profileJoined = document.getElementById('profile-joined');
        this.chatArea = document.getElementById('chat-area');
        this.chatWithHeader = document.getElementById('chat-with-header');
        this.chatWithName = document.getElementById('chat-with-name');
        this.chatWithEmail = document.getElementById('chat-with-email');
        this.chatWithAvatar = document.getElementById('chat-with-avatar');
        this.backToUsersBtn = document.getElementById('back-to-users-btn');
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInputArea = document.getElementById('message-input-area');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
    }

    attachEventListeners() {
        // Auth tabs
        this.loginTab.addEventListener('click', () => this.switchAuthTab('login'));
        this.registerTab.addEventListener('click', () => this.switchAuthTab('register'));

        // Auth forms
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        // Chat elements
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.refreshUsersBtn.addEventListener('click', () => this.refreshUsers());
        this.userSearchInput.addEventListener('input', () => this.renderUsers());
        this.closeProfileModalBtn.addEventListener('click', () => this.hideProfileModal());
        this.profileModal.addEventListener('click', (e) => {
            if (e.target === this.profileModal) this.hideProfileModal();
        });
        this.backToUsersBtn.addEventListener('click', () => this.deselectUser());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    switchAuthTab(tab) {
        this.loginTab.classList.toggle('active', tab === 'login');
        this.registerTab.classList.toggle('active', tab === 'register');
        this.loginForm.classList.toggle('active', tab === 'login');
        this.registerForm.classList.toggle('active', tab === 'register');
        this.authMessage.textContent = '';
    }

    async handleRegister(e) {
        e.preventDefault();

        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('http://localhost:3000/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAuthMessage('Registration successful! Please login.', 'success');
                this.switchAuthTab('login');
                // Refresh users list for other logged-in users (via WebSocket if implemented)
            } else {
                this.showAuthMessage(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showAuthMessage('Network error. Please try again.', 'error');
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('http://localhost:3000/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                this.token = data.token;
                this.currentUser = data.user || { email };
                localStorage.setItem('brizzzo_token', this.token);
                localStorage.setItem('brizzzo_user', JSON.stringify(this.currentUser));
                this.showChat();
                this.initializeWebSocket();
                this.loadUsers();
            } else {
                this.showAuthMessage(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            this.showAuthMessage('Network error. Please try again.', 'error');
        }
    }

    handleLogout() {
        this.token = null;
        this.currentUser = null;
        this.selectedUserId = null;
        localStorage.removeItem('brizzzo_token');
        localStorage.removeItem('brizzzo_user');

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.deselectUser(); // Reset chat UI
        this.showAuth();
    }

    checkAuthStatus() {
        const token = localStorage.getItem('brizzzo_token');
        const user = localStorage.getItem('brizzzo_user');

        if (token && user) {
            this.token = token;
            this.currentUser = JSON.parse(user);
            this.showChat();
            this.initializeWebSocket();
            this.loadUsers();
        }
    }

    showAuth() {
        this.authSection.classList.remove('hidden');
        this.chatSection.classList.add('hidden');
    }

    showChat() {
        this.authSection.classList.add('hidden');
        this.chatSection.classList.remove('hidden');
        this.currentUserSpan.textContent = this.currentUser.email || 'User';
    }

    showAuthMessage(message, type) {
        this.authMessage.textContent = message;
        this.authMessage.className = `auth-message ${type}`;
    }

    initializeWebSocket() {
        this.socket = io('http://localhost:3000', {
            auth: { token: this.token }
        });

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket');
            this.connectionStatus.textContent = '● Online';
            this.connectionStatus.className = 'status online';

            // Join user room
            this.socket.emit('join', this.currentUser.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
            this.connectionStatus.textContent = '● Offline';
            this.connectionStatus.className = 'status offline';
        });

        this.socket.on('newMessage', (message) => {
            // Only display message if we're currently chatting with the sender
            if (this.selectedUserId && this.selectedUserId == message.senderId) {
                this.displayMessage(message, 'received');
            } else {
                // Show notification for messages from other users
                this.showMessageNotification(message);
            }
        });

        this.socket.on('messagesDelivered', (data) => {
            this.updateMessageStatus(data.senderId, data.receiverId, 'delivered');
        });

        this.socket.on('messagesRead', (data) => {
            this.updateMessageStatus(data.senderId, data.receiverId, 'read');
        });

        this.socket.on('onlineUsers', (userIds) => {
            this.onlineUserIds = userIds;
            this.renderUsers();
        });
    }

    async loadUsers() {
        try {
            const response = await fetch('http://localhost:3000/api/v1/auth/users', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const allUsers = await response.json();
                // Filter out current user and show other registered users
                this.users = allUsers.filter(user => user.id !== this.currentUser.id);
                console.log(`Loaded ${this.users.length} users from database`);
            } else {
                console.warn('Failed to load users from API:', response.status, response.statusText);
                this.users = [];
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = [];
        }

        this.renderUsers();
    }

    renderUsers() {
        this.usersList.innerHTML = '';

        // Filter users by search input
        const search = this.userSearchInput.value.trim().toLowerCase();
        const filteredUsers = search
            ? this.users.filter(user =>
                user.username.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search)
            )
            : this.users;

        if (filteredUsers.length === 0) {
            // Show message when no users are available
            const noUsersMessage = document.createElement('div');
            noUsersMessage.className = 'no-users-message';
            noUsersMessage.innerHTML = search
                ? `<p>🔍 No users found</p><small>Try a different search.</small>`
                : `<p>👥 No other users yet</p><small>Invite friends to join and start chatting!</small>`;
            this.usersList.appendChild(noUsersMessage);
            return;
        }

        filteredUsers.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.dataset.userId = user.id;

            // Create avatar
            const avatar = document.createElement('div');
            avatar.className = 'user-avatar';
            avatar.textContent = user.username.charAt(0).toUpperCase();

            // Online status dot
            const statusDot = document.createElement('span');
            statusDot.className = 'user-status-dot ' + (this.onlineUserIds.includes(user.id) ? 'online' : 'offline');
            avatar.appendChild(statusDot);

            // Create user info
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info-content';

            const userName = document.createElement('div');
            userName.className = 'user-name';
            userName.textContent = user.username;

            const userEmail = document.createElement('div');
            userEmail.className = 'user-email';
            userEmail.textContent = user.email;

            userInfo.appendChild(userName);
            userInfo.appendChild(userEmail);

            // Show profile modal on avatar or name click
            avatar.style.cursor = 'pointer';
            userName.style.cursor = 'pointer';
            avatar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showProfileModal(user);
            });
            userName.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showProfileModal(user);
            });

            userElement.appendChild(avatar);
            userElement.appendChild(userInfo);

            userElement.addEventListener('click', () => this.selectUser(user.id));
            this.usersList.appendChild(userElement);
        });

    }

    showProfileModal(user) {
        this.profileAvatar.textContent = user.username.charAt(0).toUpperCase();
        this.profileUsername.textContent = user.username;
        this.profileEmail.textContent = user.email;
        this.profileStatusDot.className = 'user-status-dot ' + (this.onlineUserIds.includes(user.id) ? 'online' : 'offline');
        this.profileStatusLabel.textContent = this.onlineUserIds.includes(user.id) ? 'Online' : 'Offline';
        this.profileJoined.textContent = user.created_at ? new Date(user.created_at).toLocaleDateString() : '-';
        this.profileModal.style.display = 'flex';
    }

    hideProfileModal() {
        this.profileModal.style.display = 'none';
    }

    showMessageNotification(message) {
        // Find the sender user
        const sender = this.users.find(user => user.id == message.senderId);
        if (!sender) return;

        // Add notification indicator to user in list
        const userElement = document.querySelector(`[data-user-id="${message.senderId}"]`);
        if (userElement && !userElement.classList.contains('has-notification')) {
            userElement.classList.add('has-notification');
            const avatar = userElement.querySelector('.user-avatar');
            if (avatar) {
                const notificationDot = document.createElement('span');
                notificationDot.className = 'notification-dot';
                avatar.appendChild(notificationDot);
            }
        }

        // Browser notification (if permission granted)
        if (Notification.permission === 'granted') {
            new Notification(`New message from ${sender.username}`, {
                body: message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content,
                icon: '/favicon.ico' // You can add a favicon
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }

    async refreshUsers() {
        console.log('Refreshing users list...');
        await this.loadUsers();
    }

    selectUser(userId) {
        this.selectedUserId = userId;
        const selectedUser = this.users.find(user => user.id === userId);

        if (selectedUser) {
            // Clear notification for this user
            const userElement = document.querySelector(`[data-user-id="${userId}"]`);
            if (userElement) {
                userElement.classList.remove('has-notification');
                const notificationDot = userElement.querySelector('.notification-dot');
                if (notificationDot) {
                    notificationDot.remove();
                }
            }

            // Update UI to show selected user
            this.showChatWithUser(selectedUser);

            // Update active state in user list
            document.querySelectorAll('.user-item').forEach(item => {
                item.classList.remove('active');
            });
            const selectedElement = document.querySelector(`[data-user-id="${userId}"]`);
            if (selectedElement) {
                selectedElement.classList.add('active');
            }

            // Load messages for this conversation
            this.loadMessages(userId);
        }
    }

    deselectUser() {
        this.selectedUserId = null;

        // Hide chat header and message input
        this.chatWithHeader.style.display = 'none';
        this.messageInputArea.style.display = 'none';
        this.backToUsersBtn.style.display = 'none';

        // Show no chat selected message
        this.chatMessages.innerHTML = `
            <div class="no-chat-selected">
                <p>👋 Select a user from the list to start a conversation</p>
            </div>
        `;

        // Remove active state from all users
        document.querySelectorAll('.user-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    showChatWithUser(user) {
        // Update chat header
        this.chatWithName.textContent = user.username;
        this.chatWithEmail.textContent = user.email;
        this.chatWithAvatar.textContent = user.username.charAt(0).toUpperCase();

        // Show chat header and message input
        this.chatWithHeader.style.display = 'flex';
        this.messageInputArea.style.display = 'flex';
        this.backToUsersBtn.style.display = 'block';

        // Clear messages area
        this.chatMessages.innerHTML = '';
    }

    async loadMessages(userId) {
        try {
            const response = await fetch(`http://localhost:3000/api/v1/messages/${userId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const messages = await response.json();
                this.displayMessages(messages);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }

    displayMessages(messages) {
        this.chatMessages.innerHTML = '';
        messages.forEach(message => {
            const isSent = message.senderId === this.currentUser.id;
            this.displayMessage(message, isSent ? 'sent' : 'received');
        });
    }

    displayMessage(message, type) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${type}`;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;

        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.textContent = message.content;

        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        const messageDate = new Date(message.timestamp);
        const today = new Date();
        const isToday = messageDate.toDateString() === today.toDateString();
        const isThisYear = messageDate.getFullYear() === today.getFullYear();

        if (isToday) {
            timeElement.textContent = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (isThisYear) {
            timeElement.textContent = messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                                    ' ' + messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            timeElement.textContent = messageDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) +
                                    ' ' + messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        messageElement.appendChild(contentElement);
        messageElement.appendChild(timeElement);

        if (type === 'sent') {
            message.status = message.status || 'sent';
            const statusElement = document.createElement('div');
            statusElement.className = 'message-status';
            statusElement.innerHTML = this.getStatusIcon(message.status);
            messageElement.appendChild(statusElement);
        }

        wrapper.appendChild(messageElement);
        this.chatMessages.appendChild(wrapper);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    getStatusIcon(status) {
        switch (status) {
            case 'sent': return '<span style="color: #fff;">✓</span>';
            case 'delivered': return '<span style="color: #fff;">✓✓</span>';
            case 'read': return '<span style="color: #2196F3;">✓✓</span>';
            default: return '';
        }
    }

    async sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content || !this.selectedUserId) return;

        try {
            const response = await fetch('http://localhost:3000/api/v1/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    receiverId: this.selectedUserId,
                    content: content
                })
            });

            if (response.ok) {
                const message = await response.json();
                this.displayMessage(message, 'sent');
                this.messageInput.value = '';

                // Emit via WebSocket
                this.socket.emit('sendMessage', {
                    receiverId: this.selectedUserId,
                    content: content
                });
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    updateMessageStatus(senderId, receiverId, status) {
        // Update message status in UI
        const messages = this.chatMessages.querySelectorAll('.message.sent');
        messages.forEach(message => {
            const statusElement = message.querySelector('.message-status');
            if (statusElement) {
                statusElement.innerHTML = this.getStatusIcon(status);
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BrizzzoApp();
});