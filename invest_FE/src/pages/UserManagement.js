import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "./UserManagement.css";
import {
  validateName,
  validateDOB,
  validatePassword,
  validateEmail,
  validateUsername,
} from "../utils/userValidation";
import { BASE_URL } from "../utils/config";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
  });
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    email: "",
    gender: "",
    dateOfBirth: "",
    preferences: { subscribe: true },
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const { user } = React.useContext(UserContext);
  const navigate = useNavigate();

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/authUser/users`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/authUser/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user");
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
      setShowUserDetails(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  // Handle row click
  const handleRowClick = async (userId) => {
    if (isEditing) return; // Don't show details while editing
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/authUser/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/authUser/users/${selectedUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user");
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
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/authUser/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Refresh users list
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddNewUser = () => {
    setIsAddingNew(true);
    setShowUserDetails(false);
    setSelectedUser(null);
    setIsEditing(false);
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    if (name === "preferences.subscribe") {
      setNewUserForm((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          subscribe: value === "yes",
        },
      }));
    } else {
      setNewUserForm((prev) => ({ ...prev, [name]: value }));
    }

    // Validate on change
    if (name === "firstName" || name === "lastName") {
      const error = validateName(value);
      setFormErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleNewUserBlur = (e) => {
    const { name, value } = e.target;
    let error = null;
    switch (name) {
      case "dateOfBirth":
        error = validateDOB(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "username":
        error = validateUsername(value);
        break;
      default:
        break;
    }
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleNewUserSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const nameError =
      validateName(newUserForm.firstName) || validateName(newUserForm.lastName);
    const dobError = validateDOB(newUserForm.dateOfBirth);
    const passwordError = validatePassword(newUserForm.password);
    const emailError = validateEmail(newUserForm.email);
    const usernameError = validateUsername(newUserForm.username);

    setFormErrors({
      firstName: validateName(newUserForm.firstName),
      lastName: validateName(newUserForm.lastName),
      dateOfBirth: dobError,
      password: passwordError,
      email: emailError,
      username: usernameError,
    });

    if (nameError || dobError || passwordError || emailError || usernameError) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/authUser/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(newUserForm),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      // Refresh users list
      fetchUsers();
      setIsAddingNew(false);
      setNewUserForm({
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        email: "",
        gender: "",
        dateOfBirth: "",
        preferences: { subscribe: true },
      });
      setFormErrors({});
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
          <button className="add-user-btn" onClick={handleAddNewUser}>
            Add New User
          </button>
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
                  className={selectedUser?._id === user._id ? "selected" : ""}
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

        {/* Sidebar for user details, edit form, or new user form */}
        {(showUserDetails || isEditing || isAddingNew) && (
          <div className="user-details-sidebar">
            {isAddingNew ? (
              <>
                <div className="user-details-header">
                  <h2>Add New User</h2>
                  <button
                    className="close-btn"
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewUserForm({
                        firstName: "",
                        lastName: "",
                        username: "",
                        password: "",
                        email: "",
                        gender: "",
                        dateOfBirth: "",
                        preferences: { subscribe: true },
                      });
                      setFormErrors({});
                    }}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleNewUserSubmit} className="edit-form">
                  <div className="form-group">
                    <label>First Name:</label>
                    <input
                      type="text"
                      name="firstName"
                      value={newUserForm.firstName}
                      onChange={handleNewUserChange}
                      onBlur={handleNewUserBlur}
                      required
                    />
                    {formErrors.firstName && (
                      <div className="error-message">
                        {formErrors.firstName}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Last Name:</label>
                    <input
                      type="text"
                      name="lastName"
                      value={newUserForm.lastName}
                      onChange={handleNewUserChange}
                      onBlur={handleNewUserBlur}
                      required
                    />
                    {formErrors.lastName && (
                      <div className="error-message">{formErrors.lastName}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Username:</label>
                    <input
                      type="text"
                      name="username"
                      value={newUserForm.username}
                      onChange={handleNewUserChange}
                      onBlur={handleNewUserBlur}
                      required
                    />
                    {formErrors.username && (
                      <div className="error-message">{formErrors.username}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Password:</label>
                    <input
                      type="password"
                      name="password"
                      value={newUserForm.password}
                      onChange={handleNewUserChange}
                      onBlur={handleNewUserBlur}
                      required
                    />
                    {formErrors.password && (
                      <div className="error-message">{formErrors.password}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      name="email"
                      value={newUserForm.email}
                      onChange={handleNewUserChange}
                      onBlur={handleNewUserBlur}
                      required
                    />
                    {formErrors.email && (
                      <div className="error-message">{formErrors.email}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Gender:</label>
                    <select
                      name="gender"
                      value={newUserForm.gender}
                      onChange={handleNewUserChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date of Birth:</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={newUserForm.dateOfBirth}
                      onChange={handleNewUserChange}
                      onBlur={handleNewUserBlur}
                      required
                    />
                    {formErrors.dateOfBirth && (
                      <div className="error-message">
                        {formErrors.dateOfBirth}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Send me promotions:</label>
                    <div className="radio-container">
                      <input
                        type="radio"
                        id="subscribeYes"
                        name="preferences.subscribe"
                        value="yes"
                        checked={newUserForm.preferences.subscribe === true}
                        onChange={handleNewUserChange}
                      />
                      <label htmlFor="subscribeYes">Yes</label>
                      <input
                        type="radio"
                        id="subscribeNo"
                        name="preferences.subscribe"
                        value="no"
                        checked={newUserForm.preferences.subscribe === false}
                        onChange={handleNewUserChange}
                      />
                      <label htmlFor="subscribeNo">No</label>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit">Create User</button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false);
                        setNewUserForm({
                          firstName: "",
                          lastName: "",
                          username: "",
                          password: "",
                          email: "",
                          gender: "",
                          dateOfBirth: "",
                          preferences: { subscribe: true },
                        });
                        setFormErrors({});
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : isEditing ? (
              <>
                <div className="user-details-header">
                  <h2>Edit User</h2>
                  <button
                    className="close-btn"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedUser(null);
                    }}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={updateUser} className="edit-form">
                  <div className="form-group">
                    <label>First Name:</label>
                    <input
                      type="text"
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name:</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Username:</label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) =>
                        setEditForm({ ...editForm, username: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit">Save</button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedUser(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
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
                    <span>{selectedUser.gender || "Not specified"}</span>
                  </div>
                  <div className="detail-group">
                    <label>Date of Birth:</label>
                    <span>
                      {selectedUser.dateOfBirth
                        ? formatDate(selectedUser.dateOfBirth)
                        : "Not specified"}
                    </span>
                  </div>
                  <div className="detail-group">
                    <label>Admin Status:</label>
                    <span>{selectedUser.isAdmin ? "Yes" : "No"}</span>
                  </div>
                  <div className="detail-group">
                    <label>Registration Date:</label>
                    <span>{formatDate(selectedUser.subscriptionTime)}</span>
                  </div>
                  <div className="detail-group">
                    <label>Preferences:</label>
                    <div className="preferences-details">
                      <div>
                        Items per page:{" "}
                        {selectedUser.preferences?.itemsPerPage || 12}
                      </div>
                      <div>
                        Subscribed to updates:{" "}
                        {selectedUser.preferences?.subscribe ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
