// src/components/TopBar.js
import React, { useContext, useState } from "react";
import { UserContext } from "../context/UserContext";
import { Link } from "react-router-dom";
import "./TopBar.css";
import menuIcon from "../assets/images/account.svg";

const TopBar = () => {
  const { user, updateUser, updateToken } = useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = () => {
    updateUser({ isLoggedIn: false }); // Update isLoggedIn to false
    updateToken(null); // Remove the token
  };
  const adminText = user.isAdmin ? "(Admin)" : ""; // Determine the text based on user type
  return (
    <div className="top-bar">
      <div className="welcome-message">
        {user.isLoggedIn && `Welcome ${user.fullName} ${adminText}`}
      </div>
      <div className="top-bar-title">Invest with Confidence</div>
      <div className="menu-container">
        <button className="menu-button" onClick={toggleMenu}>
          <img src={menuIcon} alt="Menu" className="menu-icon" />
        </button>
        {isMenuOpen && (
          <ul className="menu-list">
            <li>
              <Link to="/" onClick={toggleMenu}>
                Home
              </Link>
            </li>
            {!user.isLoggedIn && (
              <>
                <li>
                  <Link to="/subscribe" onClick={toggleMenu}>
                    New Account
                  </Link>
                </li>
                <li>
                  <Link to="/login" onClick={toggleMenu}>
                    Sign-In
                  </Link>
                </li>
                <li className="menu-separator"></li> {/* Separating line */}
              </>
            )}
            {user.isLoggedIn && (
              <>
                <li>
                  <Link to="/preferences" onClick={toggleMenu}>
                    Edit Preferences
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => {
                      handleSignOut();
                      toggleMenu();
                    }}
                  >
                    Sign-Out
                  </button>
                </li>
                <li className="menu-separator"></li> {/* Separating line */}
              </>
            )}
            <li>
              <Link to="/about" onClick={toggleMenu}>
                About
              </Link>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default TopBar;
