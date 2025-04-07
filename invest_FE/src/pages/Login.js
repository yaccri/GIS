// src/pages/Login.js
import React, { useState, useContext } from "react";
import "./Login.css";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/config";

const Login = () => {
  console.log("starting Login");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateUser, updateToken } = useContext(UserContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${BASE_URL}/authUser/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Login successful:", data);
        updateToken(data.token); // Update the token in the context
        updateUser({
          fullName: data.fullName,
          isLoggedIn: true,
          isAdmin: data.isAdmin,
          itemsPerPage: data.itemsPerPage,
          subscribe: data.subscribe,
        }); // Update user object
        navigate("/"); // Redirect to home page
      } else {
        const errorData = await response.json();
        console.error("Login failed:", errorData);
        alert(`Login failed:\n${errorData.error || "An error occurred."}`);
      }
    } catch (error) {
      console.error("Network error during login:", error);
      alert(
        "Failed to connect to the server. Please check your network or try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ username: "", password: "" });
    navigate("/"); // Navigate to the home page
  };

  return (
    <div className="login-page-container">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username*:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password*:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="subscribe-btn"
              disabled={isSubmitting}
            >
              Login
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
