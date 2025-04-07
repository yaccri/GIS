// src/pages/Preferences.js
import React, { useState, useEffect, useContext } from "react";
import "./Preferences.css";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/config";

const Preferences = () => {
  const { user, updateUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    itemsPerPage: 12,
    subscribe: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (user.isLoggedIn) {
        console.log("Preferences.js: user.token:", user.token);
        try {
          const response = await fetch(`${BASE_URL}/authUser/preferences`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          });
          if (!response.ok) {
            throw new Error("Failed to fetch preferences");
          }
          const data = await response.json();
          setFormData({
            email: data.email,
            itemsPerPage: data.itemsPerPage,
            subscribe: data.subscribe,
          });
        } catch (err) {
          setError(err.message);
        }
      }
    };
    fetchPreferences();
  }, [user.isLoggedIn, user.token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    console.log("Preferences.js: formData:", formData);
    try {
      const response = await fetch(`${BASE_URL}/authUser/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Preferences updated successfully:", data);
        alert("Preferences updated successfully!");
        updateUser({ ...user, itemsPerPage: formData.itemsPerPage });
      } else {
        const errorData = await response.json();
        console.error("Failed to update preferences:", errorData);
        setError(errorData.error || "An error occurred.");
        alert(
          `Failed to update preferences:\n${
            errorData.error || "An error occurred."
          }`
        );
      }
    } catch (err) {
      console.error("Network error during preferences update:", err);
      setError(
        "Failed to connect to the server. Please check your network or try again later."
      );
      alert(
        "Failed to connect to the server. Please check your network or try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="preferences-page-container">
      <div className="preferences-container">
        <h2>Preferences</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Items Per Page */}
          <div className="form-group">
            <label htmlFor="itemsPerPage">Items Per Page:</label>
            <input
              type="number"
              id="itemsPerPage"
              name="itemsPerPage"
              value={formData.itemsPerPage}
              onChange={handleChange}
              min="3"
              max="50"
            />
          </div>

          {/* Subscribe */}
          <div className="form-group">
            <label htmlFor="subscribe">Send me promotions:</label>
            <div className="radio-container">
              <input
                type="checkbox"
                id="subscribe"
                name="subscribe"
                checked={formData.subscribe}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="subscribe-btn"
              disabled={isSubmitting}
            >
              Update Preferences
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={handleCancel}
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

export default Preferences;
