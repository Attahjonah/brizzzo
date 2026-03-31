// Test script to verify backend functionality
// Run this in browser console or as a Node.js script

const BASE_URL = 'http://localhost:3000/api/v1';

async function testAuth() {
    console.log('Testing authentication...');

    // Test registration
    try {
        const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            })
        });
        console.log('Registration:', registerResponse.status);
    } catch (error) {
        console.error('Registration failed:', error);
    }

    // Test login
    try {
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginResponse.json();
        console.log('Login:', loginResponse.status, loginData);

        if (loginData.token) {
            console.log('✅ Authentication working!');
            return loginData.token;
        }
    } catch (error) {
        console.error('Login failed:', error);
    }

    return null;
}

async function testMessages(token) {
    console.log('Testing messages...');

    try {
        // Test sending message (to self for demo)
        const sendResponse = await fetch(`${BASE_URL}/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                receiverId: 1, // Assuming user ID 1
                content: 'Test message from API'
            })
        });
        console.log('Send message:', sendResponse.status);

        // Test getting messages
        const getResponse = await fetch(`${BASE_URL}/messages/1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Get messages:', getResponse.status);

        if (sendResponse.ok && getResponse.ok) {
            console.log('✅ Messaging API working!');
        }
    } catch (error) {
        console.error('Messages test failed:', error);
    }
}

async function testUsers(token) {
    console.log('Testing users endpoint...');

    try {
        const usersResponse = await fetch(`${BASE_URL}/auth/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Get users:', usersResponse.status);
        
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            console.log('Users found:', users.length);
            console.log('✅ Users API working!');
        } else {
            const errorText = await usersResponse.text();
            console.log('❌ Users API failed:', errorText);
        }
    } catch (error) {
        console.error('Users test failed:', error);
    }
}

async function runTests() {
    console.log('🚀 Starting Brizzzo Backend Tests...\n');

    const token = await testAuth();
    if (token) {
        await testUsers(token);
        await testMessages(token);
    }

    console.log('\n✨ Tests completed!');
}

// For browser console
if (typeof window !== 'undefined') {
    window.testBrizzzo = runTests;
    console.log('Run testBrizzzo() to start testing');
} else {
    // For Node.js
    runTests();
}