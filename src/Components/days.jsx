import React, { useState, useEffect } from 'react';
import './days.css';
import scheduleData from '../data/schedule.json';
import subjectsData from '../data/subjects.json';
import AbsentRecords from './AbsentRecords';

const Days = () => {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [currentDay, setCurrentDay] = useState('');
  const [attendance, setAttendance] = useState(null);
  const [marked, setMarked] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [showAbsentRecords, setShowAbsentRecords] = useState(false);

  useEffect(() => {
    const date = new Date();
    const dayName = daysOfWeek[date.getDay()];
    setCurrentDay(dayName);
    checkTodayAttendance();
  }, []);

  const checkTodayAttendance = async () => {
    try {
      const response = await fetch('/api/attendance');
      const data = await response.json();
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = data.records.find(record => record.date === today);
      
      if (todayRecord) {
        setTodayAttendance(todayRecord);
        setAttendance(todayRecord.status);
        setMarked(true);
      }
    } catch (error) {
      console.error('Error checking today attendance:', error);
    }
  };

  const handleAttendance = (status) => {
    if (marked) return;
    setAttendance(status);
    setStatusMessage('');
  };

  const clearAttendance = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/attendance/${today}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMarked(false);
        setAttendance(null);
        setTodayAttendance(null);
        setStatusMessage('Attendance cleared successfully');
      } else {
        throw new Error('Failed to clear attendance');
      }
    } catch (error) {
      setStatusMessage('Failed to clear attendance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAttendance = async () => {
    try {
      const date = new Date();
      const dayName = currentDay;
      const todaySchedule = scheduleData.schedule[dayName] || [];

      // Create base record for the day
      const baseRecord = {
        date: date.toISOString().split('T')[0],
        day: currentDay,
        status: attendance,
        timestamp: date.toISOString()
      };

      // Save attendance for each scheduled subject
      for (const subject of todaySchedule) {
        const subjectName = subjectsData.subjects.find(s => s.id === subject.id)?.name || subject.id;
        const subjectRecord = {
          ...baseRecord,
          subject: subject.id,
          subjectName: subjectName,
          time: subject.time
        };

        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subjectRecord)
        });

        if (!response.ok) {
          const data = await response.json();
          if (data.exists) {
            setStatusMessage('Attendance already marked for today');
            await checkTodayAttendance();
            return false;
          }
          throw new Error(data.message || 'Failed to save attendance');
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving attendance:', error);
      setStatusMessage(error.message);
      return false;
    }
  };

  const handleMark = async () => {
    if (!attendance) {
      setStatusMessage('Please select attendance status first');
      return;
    }

    setIsLoading(true);
    try {
      const saved = await saveAttendance();
      if (saved) {
        setMarked(true);
        setTodayAttendance({ status: attendance, day: currentDay });
        setStatusMessage(`Attendance marked as ${attendance} for ${currentDay}`);
      }
    } catch (error) {
      setStatusMessage('Failed to save attendance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="days-container">
      <div className="day-card">
        <h2 className="day-name">{currentDay}</h2>
        <div className="attendance-options">
          <label className="attendance-label">
            <input
              type="checkbox"
              checked={attendance === 'present'}
              onChange={() => handleAttendance('present')}
              className="attendance-checkbox"
              disabled={isLoading || marked}
            />
            Present
          </label>
          <label className="attendance-label">
            <input
              type="checkbox"
              checked={attendance === 'absent'}
              onChange={() => handleAttendance('absent')}
              className="attendance-checkbox"
              disabled={isLoading || marked}
            />
            Absent
          </label>
        </div>
        <button 
          onClick={handleMark} 
          className="mark-button"
          disabled={marked || isLoading}
        >
          {isLoading ? 'Saving...' : marked ? 'Marked' : 'Mark Attendance'}
        </button>
        {statusMessage && (
          <p className={`status-message ${attendance && !isLoading ? 'success' : 'error'}`}>
            {statusMessage}
          </p>
        )}
        {todayAttendance && (
          <p className="today-status">
            Today's attendance: <span className={todayAttendance.status}>{todayAttendance.status}</span>
          </p>
        )}
        {marked && (
          <button 
            onClick={clearAttendance} 
            className="clear-button"
            disabled={isLoading}
          >
            ↺ Clear Today's Attendance
          </button>
        )}
      </div>
      <button 
        className="show-absent-button standalone"
        onClick={() => setShowAbsentRecords(true)}
      >
        Show Absent Records
      </button>
      <AbsentRecords 
        isOpen={showAbsentRecords} 
        onClose={() => setShowAbsentRecords(false)} 
      />
    </div>
  );
};

export default Days;
