import fs from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, '../data/users.json');
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

export async function login(req, res) {
  try {
    const { username, password } = req.body;
    const usersData = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    const user = usersData.users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function verifyToken(req, res) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user });
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}
