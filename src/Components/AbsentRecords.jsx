import React, { useState, useEffect } from 'react';
import './AbsentRecords.css';

const AbsentRecords = ({ isOpen, onClose }) => {
  const [absentRecords, setAbsentRecords] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchAbsentRecords();
    }
  }, [isOpen]);

  const fetchAbsentRecords = async () => {
    try {
      const response = await fetch('/api/attendance');
      const data = await response.json();
      
      // Filter for absent records
      const absents = data.records.filter(record => record.status === 'absent' && record.subject);

      // Group by subject
      const groupedRecords = absents.reduce((groups, record) => {
        const subject = record.subjectName;
        if (!groups[subject]) {
          groups[subject] = [];
        }
        groups[subject].push({
          date: record.date,
          time: record.time,
          day: record.day
        });
        return groups;
      }, {});

      // Sort dates within each subject
      Object.keys(groupedRecords).forEach(subject => {
        groupedRecords[subject].sort((a, b) => new Date(b.date) - new Date(a.date));
      });

      setAbsentRecords(groupedRecords);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching absent records:', error);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="absent-records-overlay">
      <div className="absent-records-modal">
        <div className="absent-records-header">
          <h2>Absent Records</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="absent-records-content">
          {isLoading ? (
            <div className="loading">Loading records...</div>
          ) : Object.keys(absentRecords).length === 0 ? (
            <div className="no-records">No absent records found</div>
          ) : (
            Object.entries(absentRecords).map(([subject, dates]) => (
              <div key={subject} className="subject-group">
                <h3 className="subject-header">{subject}</h3>
                <div className="dates-list">
                  {dates.map((record, index) => (
                    <div key={index} className="date-record">
                      <span className="date-info">{formatDate(record.date)}</span>
                      <span className="time-info">{record.time}</span>
                    </div>
                  ))}
                  <div className="total-absents">
                    Total: {dates.length} {dates.length === 1 ? 'absence' : 'absences'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AbsentRecords; 