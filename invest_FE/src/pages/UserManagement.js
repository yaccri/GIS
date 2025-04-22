import React, { useState, useEffect, useContext, useCallback } from "react"; // Import useCallback
//import { useNavigate } from "react-router-dom";
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

  const { user } = useContext(UserContext); // Use useContext directly
  //const navigate = useNavigate();

  // Fetch all users - wrapped in useCallback
  const fetchUsers = useCallback(async () => {
    setIsLoading(true); // Set loading true at the start of fetch
    setError(null); // Clear previous errors
    try {
      const response = await fetch(`${BASE_URL}/authUser/users`, {
        headers: {
          // Ensure user and user.token exist before fetching
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty object
        throw new Error(
          errorData.message || `Failed to fetch users (${response.status})`
        );
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err); // Log the error
      setError(err.message);
      setUsers([]); // Clear users on error
    } finally {
      setIsLoading(false);
    }
    // Add user.token as a dependency, as the fetch depends on it.
    // State setters (setIsLoading, setError, setUsers) are stable and don't need to be dependencies.
    // BASE_URL is a constant import, also stable.
  }, [user?.token]);

  // Fetch single user
  const fetchUser = async (userId) => {
    setError(null); // Clear previous errors
    try {
      // Use BASE_URL consistently
      const response = await fetch(`${BASE_URL}/authUser/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch user (${response.status})`
        );
      }

      const data = await response.json();
      setSelectedUser(data);
      setEditForm({
        firstName: data.firstName || "", // Add fallbacks for safety
        lastName: data.lastName || "",
        username: data.username || "",
        email: data.email || "",
      });
      setIsEditing(true);
      setShowUserDetails(false); // Hide details view when editing starts
      setIsAddingNew(false); // Ensure add new form is closed
    } catch (err) {
      console.error("Error fetching user:", err);
      setError(err.message);
      setSelectedUser(null); // Clear selected user on error
      setIsEditing(false); // Ensure edit mode is off on error
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    // Basic validation in case of invalid date string
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    // Using en-CA format (YYYY-MM-DD) which is often less ambiguous, or en-GB (DD/MM/YYYY)
    return date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Handle row click
  const handleRowClick = async (userId) => {
    if (isEditing || isAddingNew) return; // Don't show details while editing or adding
    setError(null);
    try {
      // Use BASE_URL consistently
      const response = await fetch(`${BASE_URL}/authUser/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch user details (${response.status})`
        );
      }

      const data = await response.json();
      setSelectedUser(data);
      setShowUserDetails(true);
    } catch (err) {
      console.error("Error fetching user details:", err);
      setError(err.message);
      setSelectedUser(null); // Clear selected user on error
      setShowUserDetails(false); // Hide details view on error
    }
  };

  // Update user
  const updateUser = async (e) => {
    e.preventDefault();
    setError(null);
    if (!selectedUser?._id) {
      setError("No user selected for update.");
      return;
    }
    try {
      // Use BASE_URL consistently
      const response = await fetch(
        `${BASE_URL}/authUser/users/${selectedUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to update user (${response.status})`
        );
      }

      // Refresh users list
      fetchUsers();
      setIsEditing(false);
      setSelectedUser(null); // Clear selection after successful update
      alert("User updated successfully!"); // Provide feedback
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err.message);
      // Optionally keep the form open on error:
      // setIsEditing(true);
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }
    setError(null);
    try {
      // Use BASE_URL consistently
      const response = await fetch(`${BASE_URL}/authUser/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to delete user (${response.status})`
        );
      }

      // Refresh users list
      fetchUsers();
      // If the deleted user was selected, clear the selection/details/edit form
      if (selectedUser?._id === userId) {
        setSelectedUser(null);
        setIsEditing(false);
        setShowUserDetails(false);
      }
      alert("User deleted successfully!"); // Provide feedback
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.message);
    }
  };

  const handleAddNewUser = () => {
    setIsAddingNew(true);
    setShowUserDetails(false);
    setSelectedUser(null);
    setIsEditing(false);
    setNewUserForm({
      // Reset form when opening
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      email: "",
      gender: "",
      dateOfBirth: "",
      preferences: { subscribe: true },
    });
    setFormErrors({}); // Clear errors
    setError(null); // Clear general errors
  };

  const handleNewUserChange = (e) => {
    const { name, value, type, checked } = e.target; // Destructure type and checked
    if (name === "preferences.subscribe") {
      setNewUserForm((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          subscribe: value === "yes", // Compare with 'yes' string value from radio button
        },
      }));
    } else {
      setNewUserForm((prev) => ({
        ...prev,
        // Use checked for checkboxes, value otherwise
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    // Validate on change (optional, can be intensive)
    if (name === "firstName" || name === "lastName") {
      const error = validateName(value);
      setFormErrors((prev) => ({ ...prev, [name]: error }));
    }
    // Add similar instant validation for other fields if desired
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
      // Add validation for first/last name on blur too if not done onChange
      case "firstName":
      case "lastName":
        error = validateName(value);
        break;
      default:
        break;
    }
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleNewUserSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous general errors

    // --- Final Validation before Submit ---
    const errors = {};
    errors.firstName = validateName(newUserForm.firstName);
    errors.lastName = validateName(newUserForm.lastName);
    errors.dateOfBirth = validateDOB(newUserForm.dateOfBirth);
    errors.password = validatePassword(newUserForm.password);
    errors.email = validateEmail(newUserForm.email);
    errors.username = validateUsername(newUserForm.username);

    // Filter out null errors (valid fields)
    const hasErrors = Object.values(errors).some((error) => error !== null);
    setFormErrors(errors); // Update state with all current errors

    if (hasErrors) {
      console.log("Validation errors:", errors);
      return; // Stop submission if there are errors
    }
    // --- End Validation ---

    try {
      // Use BASE_URL consistently
      const response = await fetch(
        `${BASE_URL}/authUser/register`, // Use the register endpoint for creation
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Admin might need auth to create users, adjust if needed based on backend
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify(newUserForm),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Use error message from backend if available
        throw new Error(
          errorData.error ||
            errorData.message ||
            `Failed to create user (${response.status})`
        );
      }

      // Refresh users list
      fetchUsers();
      setIsAddingNew(false); // Close the form on success
      // Resetting form is handled by handleAddNewUser when opening again
      alert("User created successfully!"); // Provide feedback
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.message); // Display the error message to the user
    }
  };

  // Initial fetch of users when the component mounts or fetchUsers changes (due to token change)
  useEffect(() => {
    // Only fetch if the user token is available (user is likely logged in)
    if (user?.token) {
      fetchUsers();
    } else {
      // Handle case where user is not logged in or token is missing
      setIsLoading(false);
      setError("Authentication required to manage users.");
      setUsers([]); // Ensure users list is empty
    }
    // fetchUsers is now stable due to useCallback, so this effect runs
    // when fetchUsers changes (i.e., when user.token changes) or on mount.
  }, [fetchUsers, user?.token]);

  if (isLoading) {
    return <div className="loading">Loading users...</div>;
  }

  // Display general error prominently if it exists
  // {error && <div className="error-message general-error">{error}</div>}

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h1>User Management</h1>
        <div className="header-actions">
          <button
            className="add-user-btn"
            onClick={handleAddNewUser}
            disabled={isAddingNew || isEditing}
          >
            Add New User
          </button>
        </div>
      </div>

      {/* Display general error prominently if it exists */}
      {error && <div className="error-message general-error">{error}</div>}

      <div className="content-wrapper">
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>#</th>
                {/*<th>ID</th>*/} {/* Usually not shown to regular admins */}
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Admin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map(
                  (
                    u,
                    index // Renamed user to u to avoid conflict with context user
                  ) => (
                    <tr
                      key={u._id}
                      onClick={() => handleRowClick(u._id)}
                      className={selectedUser?._id === u._id ? "selected" : ""}
                      style={{ cursor: "pointer" }} // Indicate rows are clickable
                    >
                      <td>{index + 1}</td>
                      {/*<td>{u._id}</td>*/}
                      <td>{u.firstName}</td>
                      <td>{u.lastName}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.isAdmin ? "Yes" : "No"}</td>
                      <td className="actions-cell">
                        <button
                          className="edit-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click handler
                            fetchUser(u._id);
                          }}
                          disabled={isEditing || isAddingNew} // Disable if another form is open
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click handler
                            deleteUser(u._id);
                          }}
                          // Optionally disable deleting the logged-in user: disabled={u._id === user?._id}
                          disabled={isEditing || isAddingNew} // Disable if another form is open
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
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
                    title="Close Panel"
                    onClick={() => {
                      setIsAddingNew(false);
                      // Resetting form and errors is handled by handleAddNewUser
                    }}
                  >
                    ×
                  </button>
                </div>
                <form
                  onSubmit={handleNewUserSubmit}
                  className="edit-form"
                  noValidate
                >
                  {/* Add New User Form Fields */}
                  <div className="form-group">
                    <label htmlFor="new-firstName">First Name*:</label>
                    <input
                      type="text"
                      id="new-firstName"
                      name="firstName"
                      value={newUserForm.firstName}
                      onChange={handleNewUserChange}
                      onBlur={handleNewUserBlur}
                      required
                      aria-describedby="firstNameError"
                    />
                    {formErrors.firstName && (
                      <div id="firstNameError" className="error-message">
                        {formErrors.firstName}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-lastName">Last Name*:</label>
                    <input
                      type="text"
                      id="new-lastName"
                      name="lastName"
                      value={newUserForm.lastName}
                      onChange={handleNewUserChange}
                      onBlur={handleNewUserBlur}
                      required
                      aria-describedby="lastNameError"
                    />
                    {formErrors.lastName && (
                      <div id="lastNameError" className="error-message">
                        {formErrors.lastName}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-username">Username*:</label>
                    <input
                      type="text"
                      id="new-username"
                      name="username"
                      value={newUserForm.username}
                      onChange={handleNewUserChange}
                      onBlur={handleNewUserBlur}
                      required
                      aria-describedby="usernameError"
                    />
                    {formErrors.username && (
                      <div id="usernameError" className="error-message">
                        {formErrors.username}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-password">Password*:</label>
                    <input
                      type="password"
                      id="new-password"
                      name="password"
                      value={newUserForm.password}
                      onChange={handleNewUserChange}
                      onBlur={handleNewUserBlur}
                      required
                      aria-describedby="passwordError"
                    />
                    {formErrors.password && (
                      <div id="passwordError" className="error-message">
                        {formErrors.password}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-email">Email*:</label>
                    <input
                      type="email"
                      id="new-email"
                      name="email"
                      value={newUserForm.email}
                      onChange={handleNewUserChange}
                      onBlur={handleNewUserBlur}
                      required
                      aria-describedby="emailError"
                    />
                    {formErrors.email && (
                      <div id="emailError" className="error-message">
                        {formErrors.email}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-gender">Gender:</label>
                    <select
                      id="new-gender"
                      name="gender"
                      value={newUserForm.gender}
                      onChange={handleNewUserChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="new-dateOfBirth">Date of Birth*:</label>
                    <input
                      type="date"
                      id="new-dateOfBirth"
                      name="dateOfBirth"
                      value={newUserForm.dateOfBirth}
                      onChange={handleNewUserChange}
                      onBlur={handleNewUserBlur}
                      required
                      aria-describedby="dobError"
                    />
                    {formErrors.dateOfBirth && (
                      <div id="dobError" className="error-message">
                        {formErrors.dateOfBirth}
                      </div>
                    )}
                  </div>
                  <fieldset className="form-group">
                    {" "}
                    {/* Use fieldset for radio group */}
                    <legend>Send promotions:</legend>
                    <div className="radio-container">
                      <input
                        type="radio"
                        id="new-subscribeYes"
                        name="preferences.subscribe"
                        value="yes"
                        checked={newUserForm.preferences.subscribe === true}
                        onChange={handleNewUserChange}
                      />
                      <label htmlFor="new-subscribeYes">Yes</label>
                      <input
                        type="radio"
                        id="new-subscribeNo"
                        name="preferences.subscribe"
                        value="no"
                        checked={newUserForm.preferences.subscribe === false}
                        onChange={handleNewUserChange}
                      />
                      <label htmlFor="new-subscribeNo">No</label>
                    </div>
                  </fieldset>
                  <div className="form-actions">
                    <button type="submit" className="subscribe-btn">
                      Create User
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setIsAddingNew(false);
                        // Resetting form handled by handleAddNewUser
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
                    title="Close Panel"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedUser(null); // Clear selection when cancelling edit
                      setError(null); // Clear errors
                    }}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={updateUser} className="edit-form" noValidate>
                  {/* Edit User Form Fields */}
                  <div className="form-group">
                    <label htmlFor="edit-firstName">First Name*:</label>
                    <input
                      type="text"
                      id="edit-firstName"
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, firstName: e.target.value })
                      }
                      required
                    />
                    {/* Add validation display if needed */}
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-lastName">Last Name*:</label>
                    <input
                      type="text"
                      id="edit-lastName"
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, lastName: e.target.value })
                      }
                      required
                    />
                    {/* Add validation display if needed */}
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-username">Username*:</label>
                    <input
                      type="text"
                      id="edit-username"
                      value={editForm.username}
                      onChange={(e) =>
                        setEditForm({ ...editForm, username: e.target.value })
                      }
                      required
                    />
                    {/* Add validation display if needed */}
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-email">Email*:</label>
                    <input
                      type="email"
                      id="edit-email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      required
                    />
                    {/* Add validation display if needed */}
                  </div>
                  {/* Add fields for Gender, DOB, Preferences if they should be editable */}
                  {/* Example:
                  <div className="form-group">
                    <label>Admin Status:</label>
                    <select
                      value={editForm.isAdmin ? 'true' : 'false'}
                      onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.value === 'true' })}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  */}
                  <div className="form-actions">
                    <button type="submit" className="subscribe-btn">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedUser(null);
                        setError(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Show User Details View */
              selectedUser && ( // Ensure selectedUser is not null before rendering details
                <>
                  <div className="user-details-header">
                    <h2>User Details</h2>
                    <button
                      className="close-btn"
                      title="Close Panel"
                      onClick={() => {
                        setShowUserDetails(false);
                        setSelectedUser(null);
                        setError(null);
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
                      <span>{formatDate(selectedUser.dateOfBirth)}</span>
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
                          {selectedUser.preferences?.itemsPerPage ?? 12}{" "}
                          {/* Use nullish coalescing */}
                        </div>
                        <div>
                          Subscribed to promotions:{" "}
                          {selectedUser.preferences?.subscribe ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>
                    {/* Add Edit button here if desired */}
                    <div className="form-actions details-actions">
                      <button
                        className="edit-btn"
                        onClick={() => fetchUser(selectedUser._id)}
                      >
                        Edit User
                      </button>
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
