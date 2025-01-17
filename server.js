import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const ATTENDANCE_FILE = path.join(__dirname, 'src', 'data', 'attendance.json');
const SUBJECTS_FILE = path.join(__dirname, 'src', 'data', 'subjects.json');

// Ensure the data directory exists
async function ensureDataDirectory() {
  const dir = path.dirname(ATTENDANCE_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Ensure the attendance file exists
async function ensureAttendanceFile() {
  try {
    await fs.access(ATTENDANCE_FILE);
  } catch {
    await fs.writeFile(ATTENDANCE_FILE, JSON.stringify({ records: [] }, null, 2));
  }
}

// Get attendance data
async function getAttendanceData() {
  await ensureAttendanceFile();
  const fileContent = await fs.readFile(ATTENDANCE_FILE, 'utf-8');
  return JSON.parse(fileContent);
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

app.post('/api/attendance', async (req, res) => {
  try {
    await ensureDataDirectory();
    const record = req.body;
    
    let data = await getAttendanceData();
    
    // Check if attendance already exists for this date and subject
    const existingRecord = data.records.find(r => 
      r.date === record.date && 
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
    
    // Remove attendance for the specified date and subject
    data.records = data.records.filter(record => {
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

// Get all attendance records
app.get('/api/attendance', async (req, res) => {
  try {
    const data = await getAttendanceData();
    res.json(data);
  } catch (error) {
    console.error('Error reading attendance records:', error);
    res.status(500).json({ message: 'Failed to read attendance records' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});