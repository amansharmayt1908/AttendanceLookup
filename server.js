import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { login, verifyToken, authenticateToken } from './src/api/login.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const ATTENDANCE_FILE = path.join(__dirname, 'src', 'data', 'attendance.json');
const SUBJECTS_FILE = path.join(__dirname, 'src', 'data', 'subjects.json');
const USERS_FILE = path.join(__dirname, 'src', 'data', 'users.json');

// Ensure the data directory exists
async function ensureDataDirectory() {
  const dir = path.dirname(ATTENDANCE_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Ensure the users file exists with default admin user
async function ensureUsersFile() {
  try {
    await fs.access(USERS_FILE);
  } catch {
    const defaultUsers = {
      users: [
        {
          username: 'admin',
          password: 'admin123',
          role: 'admin'
        }
      ]
    };
    await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

// Authentication endpoints
app.post('/api/login', login);
app.get('/api/verify', verifyToken);

// Create new user endpoint
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Only admin can create users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create users' });
    }

    const usersData = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    
    // Check if username already exists
    if (usersData.users.some(u => u.username === username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Add new user
    usersData.users.push({
      username,
      password,
      role: 'user'
    });

    await fs.writeFile(USERS_FILE, JSON.stringify(usersData, null, 2));
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// Protected routes
app.use('/api/attendance', authenticateToken);
app.use('/api/subjects', authenticateToken);

// Get attendance data
async function getAttendanceData() {
  try {
    await fs.access(ATTENDANCE_FILE);
    const fileContent = await fs.readFile(ATTENDANCE_FILE, 'utf-8');
    return JSON.parse(fileContent);
  } catch {
    return { records: [] };
  }
}

// Save attendance data
async function saveAttendanceData(data) {
  await fs.writeFile(ATTENDANCE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Get subjects data
async function getSubjectsData() {
  try {
    const fileContent = await fs.readFile(SUBJECTS_FILE, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading subjects file:', error);
    return { subjects: [] };
  }
}

// Get subjects endpoint
app.get('/api/subjects', async (req, res) => {
  try {
    const data = await getSubjectsData();
    res.json(data);
  } catch (error) {
    console.error('Error serving subjects:', error);
    res.status(500).json({ message: 'Failed to load subjects' });
  }
});

// Get all attendance records (filtered by user)
app.get('/api/attendance', async (req, res) => {
  try {
    const data = await getAttendanceData();
    // Filter records for the current user
    const userRecords = data.records.filter(record => record.username === req.user.username);
    res.json({ 
      records: userRecords,
      currentUser: req.user.username 
    });
  } catch (error) {
    console.error('Error reading attendance records:', error);
    res.status(500).json({ message: 'Failed to read attendance records' });
  }
});

// Save attendance record
app.post('/api/attendance', async (req, res) => {
  try {
    await ensureDataDirectory();
    const record = {
      ...req.body,
      username: req.user.username
    };
    
    let data = await getAttendanceData();
    
    // Check if attendance already exists for this user, date and subject
    const existingRecord = data.records.find(r => 
      r.date === record.date && 
      r.username === req.user.username &&
      (!r.subject || r.subject === record.subject)
    );
    
    if (existingRecord) {
      return res.status(400).json({ 
        message: 'Attendance already marked for this date',
        exists: true 
      });
    }

    // Add new record
    data.records.push(record);
    await saveAttendanceData(data);
    
    res.status(200).json({ message: 'Attendance saved successfully' });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Clear attendance for a specific date and subject
app.delete('/api/attendance/:date/:subject?', async (req, res) => {
  try {
    const { date, subject } = req.params;
    let data = await getAttendanceData();
    
    // Remove attendance for the specified user, date and subject
    data.records = data.records.filter(record => {
      if (record.username !== req.user.username) return true;
      if (subject) {
        return !(record.date === date && record.subject === subject);
      }
      return record.date !== date;
    });
    
    await saveAttendanceData(data);
    
    res.status(200).json({ message: 'Attendance cleared successfully' });
  } catch (error) {
    console.error('Error clearing attendance:', error);
    res.status(500).json({ message: 'Failed to clear attendance' });
  }
});

// Get all users endpoint
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Only admin can get users list
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can view users' });
    }

    const usersData = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    res.json({ users: usersData.users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Delete user endpoint
app.delete('/api/users/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;

    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can delete users' });
    }

    // Cannot delete admin user
    if (username === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    const usersData = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));
    
    // Check if user exists
    const userIndex = usersData.users.findIndex(u => u.username === username);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove user
    usersData.users.splice(userIndex, 1);
    await fs.writeFile(USERS_FILE, JSON.stringify(usersData, null, 2));

    // Also delete user's attendance records
    let attendanceData = await getAttendanceData();
    attendanceData.records = attendanceData.records.filter(record => record.username !== username);
    await saveAttendanceData(attendanceData);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Initialize the server
async function initializeServer() {
  await ensureDataDirectory();
  await ensureUsersFile();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

initializeServer().catch(console.error);