// src/components/TopBar.js
import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "./TopBar.css";
import menuIcon from "../assets/images/account.svg";

const TopBar = () => {
  const { user, updateUser, updateToken } = useContext(UserContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = () => {
    updateUser({ isLoggedIn: false });
    updateToken(null);
  };

  const adminText = user.isAdmin ? "(Admin)" : "";

  return (
    <div className="top-bar">
      <div className="top-bar-header">
        <div className="header-top">
          <div className="welcome-message">
            {user.isLoggedIn && `Welcome ${user.fullName} ${adminText}`}
          </div>
          <div className="top-bar-title">Invest with Confidence</div>
        </div>
        {/* Horizontal navigation menu with search input */}
        <div className="horizontal-nav">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Enter an address, neighborhood, city, or ZIP code" 
          />
          <Link to="/" className="nav-button">Home</Link>
          <Link to="/about" className="nav-button">About</Link>
          <Link to="/us-real-estate" className="nav-button">US Real Estate</Link>
          <Link to="/map-view" className="nav-button">Map View</Link>
          <button className="menu-button" onClick={toggleMenu}>
            <img src={menuIcon} alt="Menu" className="menu-icon" />
          </button>
        </div>
        {isMenuOpen && (
          <ul className="menu-list">
            <li>
              <Link to="/" onClick={toggleMenu}>Home</Link>
            </li>
            {!user.isLoggedIn && (
              <>
                <li>
                  <Link to="/subscribe" onClick={toggleMenu}>New Account</Link>
                </li>
                <li>
                  <Link to="/login" onClick={toggleMenu}>Sign-In</Link>
                </li>
                <li className="menu-separator"></li>
              </>
            )}
            {user.isLoggedIn && (
              <>
                <li>
                  <Link to="/preferences" onClick={toggleMenu}>Edit Preferences</Link>
                </li>
                <li>
                  <button onClick={() => { handleSignOut(); toggleMenu(); }}>
                    Sign-Out
                  </button>
                </li>
                <li className="menu-separator"></li>
              </>
            )}
            <li>
              <Link to="/about" onClick={toggleMenu}>About</Link>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
};

export default TopBar;
