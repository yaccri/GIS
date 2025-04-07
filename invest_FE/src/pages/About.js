// src/pages/About.js
import React, { useContext } from "react";
import "./About.css"; // Import the CSS file
import { UserContext } from "../context/UserContext";

const About = () => {
  const { user } = useContext(UserContext);

  return (
    <div className="about-container">
      <div className="about-content">
        <h1>About Top Investments</h1>
        <p>
          Welcome to Top Investments, your trusted partner in navigating the
          dynamic world of real estate investment. We are dedicated to providing
          you with the most lucrative opportunities and expert guidance to help
          you achieve your financial goals.
        </p>
        <p>
          Our team of seasoned professionals brings a wealth of experience and
          in-depth market knowledge to the table. We meticulously analyze market
          trends, identify emerging opportunities, and curate a portfolio of
          high-potential properties. Whether you're a first-time investor or a
          seasoned pro, we're here to support you every step of the way.
        </p>
        <p>
          At Top Investments, we believe in transparency, integrity, and
          building long-term relationships with our clients. We're committed to
          helping you make informed decisions and maximize your returns.
        </p>
        <p>
          Explore our site to discover the latest investment opportunities,
          learn more about our services, and get in touch with our team.
        </p>
        {user.isLoggedIn && user.isAdmin && (
          <p className="admin-message">
            You are logged in as an administrator.
          </p>
        )}
      </div>
    </div>
  );
};

export default About;
