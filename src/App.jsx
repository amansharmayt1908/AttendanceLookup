import { useState, useEffect } from 'react'
import './App.css'
import Days from './Components/days'
import SubjectAttendance from './Components/SubjectAttendance'
import Login from './Components/Login'
import UserManagement from './Components/UserManagement'

function App() {
  const [mode, setMode] = useState('daily');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUserRole(data.user.role);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (token) => {
    setIsAuthenticated(true);
    checkAuth(); // Get user role after login
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className='container'>
      <div className="heading">
        <h1>Attendance Lookup</h1>
        <div className="mode-switch">
          <button 
            className={`mode-button ${mode === 'daily' ? 'active' : ''}`}
            onClick={() => setMode('daily')}
          >
            Daily Attendance
          </button>
          <button 
            className={`mode-button ${mode === 'subject' ? 'active' : ''}`}
            onClick={() => setMode('subject')}
          >
            Subject-wise Attendance
          </button>
        </div>
        <div className="header-buttons">
          {userRole === 'admin' && (
            <button 
              className="manage-users-button"
              onClick={() => setShowUserManagement(true)}
            >
              Manage Users
            </button>
          )}
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      {mode === 'daily' ? <Days /> : <SubjectAttendance />}
      {showUserManagement && (
        <UserManagement onClose={() => setShowUserManagement(false)} />
      )}
    </div>
  )
}

export default App

