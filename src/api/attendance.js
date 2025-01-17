import fs from 'fs/promises';
import path from 'path';

const ATTENDANCE_FILE = path.join(process.cwd(), 'src/data/attendance.json');

export async function saveAttendance(record) {
  try {
    // Read existing records
    let data = { records: [] };
    try {
      const fileContent = await fs.readFile(ATTENDANCE_FILE, 'utf-8');
      data = JSON.parse(fileContent);
    } catch (error) {
      // File doesn't exist or is empty, use default empty records array
    }

    // Add new record
    data.records.push(record);

    // Save back to file
    await fs.writeFile(ATTENDANCE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving attendance:', error);
    return false;
  }
}

// API endpoint handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const record = req.body;
    const success = await saveAttendance(record);

    if (success) {
      res.status(200).json({ message: 'Attendance saved successfully' });
    } else {
      res.status(500).json({ message: 'Failed to save attendance' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 