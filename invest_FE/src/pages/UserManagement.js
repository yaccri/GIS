import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const { user } = React.useContext(UserContext);
  const navigate = useNavigate();

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/authUser/users`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch single user
  const fetchUser = async (userId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/authUser/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const data = await response.json();
      setSelectedUser(data);
      setEditForm({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
      });
      setIsEditing(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Handle row click
  const handleRowClick = async (userId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/authUser/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      
      const data = await response.json();
      setSelectedUser(data);
      setShowUserDetails(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Update user
  const updateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/authUser/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      // Refresh users list
      fetchUsers();
      setIsEditing(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/authUser/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Refresh users list
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h1>User Management</h1>
        <div className="header-actions">
          <button className="add-user-btn">Add New User</button>
        </div>
      </div>
      
      <div className="content-wrapper">
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr 
                  key={user._id}
                  onClick={() => handleRowClick(user._id)}
                  className={selectedUser?._id === user._id ? 'selected' : ''}
                >
                  <td>{index + 1}</td>
                  <td>{user._id}</td>
                  <td>{user.firstName}</td>
                  <td>{user.lastName}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td className="actions-cell">
                    <button 
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchUser(user._id);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteUser(user._id);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showUserDetails && selectedUser && (
          <div className="user-details-sidebar">
            <div className="user-details-header">
              <h2>User Details</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowUserDetails(false);
                  setSelectedUser(null);
                }}
              >
                ×
              </button>
            </div>
            <div className="user-details-content">
              <div className="detail-group">
                <label>ID:</label>
                <span>{selectedUser._id}</span>
              </div>
              <div className="detail-group">
                <label>First Name:</label>
                <span>{selectedUser.firstName}</span>
              </div>
              <div className="detail-group">
                <label>Last Name:</label>
                <span>{selectedUser.lastName}</span>
              </div>
              <div className="detail-group">
                <label>Username:</label>
                <span>{selectedUser.username}</span>
              </div>
              <div className="detail-group">
                <label>Email:</label>
                <span>{selectedUser.email}</span>
              </div>
              <div className="detail-group">
                <label>Gender:</label>
                <span>{selectedUser.gender || 'Not specified'}</span>
              </div>
              <div className="detail-group">
                <label>Date of Birth:</label>
                <span>{selectedUser.dateOfBirth ? formatDate(selectedUser.dateOfBirth) : 'Not specified'}</span>
              </div>
              <div className="detail-group">
                <label>Admin Status:</label>
                <span>{selectedUser.isAdmin ? 'Yes' : 'No'}</span>
              </div>
              <div className="detail-group">
                <label>Registration Date:</label>
                <span>{formatDate(selectedUser.subscriptionTime)}</span>
              </div>
              <div className="detail-group">
                <label>Preferences:</label>
                <div className="preferences-details">
                  <div>Items per page: {selectedUser.preferences?.itemsPerPage || 12}</div>
                  <div>Subscribed to updates: {selectedUser.preferences?.subscribe ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="edit-form">
          <h2>Edit User</h2>
          <form onSubmit={updateUser}>
            <div className="form-group">
              <label>First Name:</label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name:</label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit">Save</button>
              <button type="button" onClick={() => {
                setIsEditing(false);
                setSelectedUser(null);
              }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 