import React, { useState, useEffect } from 'react';
import './UserManagement.css';

const UserManagement = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsers(data.users.filter(user => user.username !== 'admin'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('User created successfully');
        setUsername('');
        setPassword('');
        fetchUsers(); // Refresh user list
      } else {
        setError(data.message || 'Failed to create user');
      }
    } catch (error) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/users/${username}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess(`User "${username}" deleted successfully`);
        fetchUsers(); // Refresh user list
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete user');
      }
    } catch (error) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className="user-management-overlay">
      <div className="user-management-modal">
        <div className="user-management-header">
          <h2>User Management</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="user-management-content">
          <div className="create-user-section">
            <h3>Create New User</h3>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label htmlFor="new-username">Username</label>
                <input
                  type="text"
                  id="new-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-password">Password</label>
                <input
                  type="password"
                  id="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="create-user-button"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>

          <div className="users-list-section">
            <h3>Existing Users</h3>
            {users.length === 0 ? (
              <p className="no-users">No users found</p>
            ) : (
              <div className="users-list">
                {users.map(user => (
                  <div key={user.username} className="user-item">
                    <span className="user-info">
                      <span className="username">{user.username}</span>
                      <span className="role-badge">{user.role}</span>
                    </span>
                    <button 
                      className="delete-user-button"
                      onClick={() => handleDelete(user.username)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(error || success) && (
            <div className="messages">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 