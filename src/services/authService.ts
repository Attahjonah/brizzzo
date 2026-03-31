import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/database';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function registerUser(username: string, email: string, password: string): Promise<User> {
  const hashedPassword = await bcrypt.hash(password, 10);
  const db = getDB();
  const [result] = await db.execute(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword]
  );
  const userId = (result as any).insertId;
  return { id: userId, username, email, password: hashedPassword, createdAt: new Date() };
}

export async function loginUser(email: string, password: string): Promise<string | null> {
  const db = getDB();
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  const users = rows as User[];
  if (users.length === 0) return null;
  const user = users[0];
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  return token;
}

export async function getUsers(): Promise<User[]> {
  const db = getDB();
  const [rows] = await db.execute('SELECT id, username, email, created_at FROM users ORDER BY username');
  return rows as User[];
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}