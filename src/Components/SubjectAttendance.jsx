import React, { useState, useEffect } from 'react';
import './SubjectAttendance.css';
import subjectsData from '../data/subjects.json';
import scheduleData from '../data/schedule.json';

const SubjectAttendance = () => {
  const [subjectsStatus, setSubjectsStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [todaySchedule, setTodaySchedule] = useState([]);

  useEffect(() => {
    const date = new Date();
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    const schedule = scheduleData.schedule[dayName] || [];
    
    // Combine schedule with subject names
    const scheduledSubjects = schedule.map(slot => ({
      ...slot,
      name: subjectsData.subjects.find(s => s.id === slot.id)?.name || slot.id
    }));
    
    setTodaySchedule(scheduledSubjects);
    checkTodayAttendance();
  }, []);

  const checkTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/attendance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      const today = new Date().toISOString().split('T')[0];
      
      const todayRecords = data.records.filter(record => record.date === today);
      const newStatus = {};
      
      todayRecords.forEach(record => {
        if (record.subject) {
          newStatus[record.subject] = {
            status: record.status,
            marked: true
          };
        }
      });
      
      setSubjectsStatus(newStatus);
    } catch (error) {
      console.error('Error checking today attendance:', error);
    }
  };

  const handleAttendance = async (subject, status) => {
    if (subjectsStatus[subject.id]?.marked) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const date = new Date();
      const record = {
        date: date.toISOString().split('T')[0],
        subject: subject.id,
        subjectName: subject.name,
        time: subject.time,
        status: status,
        timestamp: date.toISOString()
      };

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save attendance');
      }

      setSubjectsStatus(prev => ({
        ...prev,
        [subject.id]: {
          status: status,
          marked: true
        }
      }));
      setStatusMessage(`Attendance marked as ${status} for ${subject.name}`);
    } catch (error) {
      console.error('Error saving attendance:', error);
      setStatusMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAttendance = async (subject) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/attendance/${today}/${subject.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSubjectsStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[subject.id];
          return newStatus;
        });
        setStatusMessage(`Attendance cleared for ${subject.name}`);
      } else {
        throw new Error('Failed to clear attendance');
      }
    } catch (error) {
      setStatusMessage('Failed to clear attendance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAll = async (status) => {
    setIsLoading(true);
    try {
      for (const subject of todaySchedule) {
        if (!subjectsStatus[subject.id]?.marked) {
          await handleAttendance(subject, status);
        }
      }
      setStatusMessage(`All subjects marked as ${status}`);
    } catch (error) {
      setStatusMessage('Failed to mark all subjects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllAttendance = async () => {
    setIsLoading(true);
    try {
      for (const subject of todaySchedule) {
        if (subjectsStatus[subject.id]?.marked) {
          await clearAttendance(subject);
        }
      }
      setStatusMessage('All attendance cleared');
    } catch (error) {
      setStatusMessage('Failed to clear all attendance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (todaySchedule.length === 0) {
    return (
      <div className="subject-attendance-container">
        <div className="no-classes">
          No classes scheduled for today
        </div>
      </div>
    );
  }

  return (
    <div className="subject-attendance-container">
      <div className="mark-all-buttons">
        <button 
          onClick={() => handleMarkAll('present')}
          className="mark-all-button present"
          disabled={isLoading}
        >
          Mark All Present
        </button>
        <button 
          onClick={() => handleMarkAll('absent')}
          className="mark-all-button absent"
          disabled={isLoading}
        >
          Mark All Absent
        </button>
        <button 
          onClick={clearAllAttendance}
          className="mark-all-button clear"
          disabled={isLoading}
        >
          Clear All
        </button>
      </div>

      <div className="subjects-list-column">
        {todaySchedule.map(subject => (
          <div key={subject.id} className="subject-row">
            <div className="subject-info">
              <div className="subject-name">{subject.name}</div>
              <div className="subject-time">{subject.time}</div>
            </div>
            <div className="attendance-options">
              <label className="attendance-label">
                <input
                  type="checkbox"
                  checked={subjectsStatus[subject.id]?.status === 'present'}
                  onChange={() => handleAttendance(subject, 'present')}
                  disabled={isLoading || subjectsStatus[subject.id]?.marked}
                  className="attendance-checkbox"
                />
                Present
              </label>
              <label className="attendance-label">
                <input
                  type="checkbox"
                  checked={subjectsStatus[subject.id]?.status === 'absent'}
                  onChange={() => handleAttendance(subject, 'absent')}
                  disabled={isLoading || subjectsStatus[subject.id]?.marked}
                  className="attendance-checkbox"
                />
                Absent
              </label>
              {subjectsStatus[subject.id]?.marked && (
                <button 
                  onClick={() => clearAttendance(subject)}
                  className="clear-button"
                  disabled={isLoading}
                >
                  ↺ Clear
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {statusMessage && (
        <p className={`status-message ${statusMessage.includes('Failed') ? 'error' : 'success'}`}>
          {statusMessage}
        </p>
      )}
    </div>
  );
};

export default SubjectAttendance; 