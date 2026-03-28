import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/authService';

export async function register(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;
    const user = await registerUser(username, email, password);
    return res.status(201).json({ message: 'User registered', user: { id: user.id, username, email } });
  } catch (error) {
    return res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const token = await loginUser(email, password);
    if (!token) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    return res.json({ token });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
}
