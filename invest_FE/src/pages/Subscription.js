// src/pages/Subscription.js
import React, { useState } from "react";
import "./Subscription.css";
import {
  validateName,
  validateDOB,
  validatePassword,
  validateEmail,
  validateUsername,
} from "../utils/userValidation";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/config";

const Subscription = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    email: "",
    gender: "",
    dateOfBirth: "",
    preferences: { subscribe: true },
  });

  const [title, setTitle] = useState("Subscription");
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const updateTitle = () => {
    if (formData.firstName && formData.lastName) {
      setTitle(`Subscription for ${formData.firstName} ${formData.lastName}`);
    } else {
      setTitle("Subscription");
    }
  };

  const handleBlur = (e) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "preferences.subscribe") {
      setFormData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          subscribe: value === "yes",
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "firstName" || name === "lastName") {
      const error = validateName(value);
      setFormErrors((prev) => ({ ...prev, [name]: error }));
      if (!error) updateTitle();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("submitting...");
    const nameError =
      validateName(formData.firstName) || validateName(formData.lastName);
    const dobError = validateDOB(formData.dateOfBirth);
    const passwordError = validatePassword(formData.password);
    const emailError = validateEmail(formData.email);
    const usernameError = validateUsername(formData.username);

    setFormErrors({
      firstName: validateName(formData.firstName),
      lastName: validateName(formData.lastName),
      dateOfBirth: dobError,
      password: passwordError,
      email: emailError,
      username: usernameError,
    });

    console.log("checking errors...");
    if (nameError || dobError || passwordError || emailError || usernameError) {
      return;
    }

    setIsSubmitting(true);
    console.log("connecting to database...");
    try {
      const response = await fetch(`${BASE_URL}/authUser/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Subscription successful:", data, formData);
        alert(
          `Subscription successful!\nUsername: ${formData.username}\n\nCheck Console log for full details`
        );
        handleReset(); // probably redundant, but just in case
        navigate("/");
      } else {
        try {
          const errorData = await response.json();
          console.error("Subscription failed:", errorData);
          alert(
            `Subscription failed:\n${
              errorData.error || "An error occurred on the server."
            }`
          );
        } catch (jsonError) {
          const errorText = await response.text();
          console.error("Subscription failed (non-JSON response):", errorText);
          alert(`Subscription failed:\nAn error occurred on the server.`);
        }
      }
    } catch (error) {
      console.error("Network error during subscription:", error);
      alert(
        "Failed to connect to the server. Please check your network or try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      email: "",
      gender: "",
      dateOfBirth: "",
      preferences: {
        subscribe: true,
      },
    });
    setTitle("Subscription");
    setFormErrors({});
  };

  return (
    <div className="subscription-page-container">
      <div className="login-container">
        <h5>{title}</h5>
        <form onSubmit={handleSubmit}>
          {/* firstName */}
          <div className="form-group">
            <label htmlFor="firstName">First Name*:</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {formErrors.firstName && (
              <div className="error-message">{formErrors.firstName}</div>
            )}
          </div>

          {/* lastName */}
          <div className="form-group">
            <label htmlFor="lastName">Last Name*:</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {formErrors.lastName && (
              <div className="error-message">{formErrors.lastName}</div>
            )}
          </div>

          {/* userName */}
          <div className="form-group">
            <label htmlFor="username">Username*:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {formErrors.username && (
              <div className="error-message">{formErrors.username}</div>
            )}
          </div>

          {/* password */}
          <div className="form-group">
            <label htmlFor="password">Password*:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {formErrors.password && (
              <div className="error-message">{formErrors.password}</div>
            )}
          </div>

          {/* email */}
          <div className="form-group">
            <label htmlFor="email">Email*:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {formErrors.email && (
              <div className="error-message">{formErrors.email}</div>
            )}
          </div>

          {/* gender */}
          <div className="form-group">
            <label htmlFor="gender">Gender:</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* dateOfBirth */}
          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth*:</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              onBlur={handleBlur}
              required
            />
            {formErrors.dateOfBirth && (
              <div className="error-message">{formErrors.dateOfBirth}</div>
            )}
          </div>

          {/* subscribe */}
          <div className="form-group">
            <label htmlFor="subscribe">Send me promotions:</label>
            <div className="radio-container">
              <input
                type="radio"
                id="subscribeYes"
                name="preferences.subscribe"
                value="yes"
                checked={formData.preferences.subscribe === true}
                onChange={handleChange}
              />
              <label htmlFor="subscribeYes">Yes</label>
              <input
                type="radio"
                id="subscribeNo"
                name="preferences.subscribe"
                value="no"
                checked={formData.preferences.subscribe === false}
                onChange={handleChange}
              />
              <label htmlFor="subscribeNo">No</label>
            </div>
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="subscribe-btn"
              disabled={isSubmitting}
            >
              Subscribe
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

export default Subscription;
