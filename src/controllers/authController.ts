
import { Request, Response } from 'express';
import { registerUser, loginUser, getUsers as getUsersService } from '../services/authService';
import { AuthRequest } from '../middleware/authMiddleware';

export async function register(req: Request, res: Response): Promise<Response> {
  try {
    const { username, email, password } = req.body;
    const user = await registerUser(username, email, password);
    return res.status(201).json({ message: 'User registered', user: { id: user.id, username, email } });

  } catch (error) {
    return res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response): Promise<Response> {
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

export async function getUsersController(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const allUsers = await getUsersService();
    // Filter out the current user
    const otherUsers = allUsers.filter((user: any) => user.id !== req.user.id);
    return res.json(otherUsers);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}
