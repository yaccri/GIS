// src/components/TopBar.js
import React, { useContext, useState } from "react";
import { UserContext } from "../context/UserContext";
import { useMapContext } from "../context/MapContext"; // Import the hook
import { Link } from "react-router-dom";
import AddressSearchInput from "./AddressSearch-OpenStreetMap";
import "./TopBar.css";
import menuIcon from "../assets/images/account.svg";

// Remove onLocationSelect from props
const TopBar = () => {
  const { user, updateUser, updateToken } = useContext(UserContext);
  const { selectMapLocation } = useMapContext(); // Get the function from context
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSignOut = () => {
    updateUser({ isLoggedIn: false });
    updateToken(null);
    setIsMenuOpen(false);
  };

  // This function now directly calls the context function
  const handleLocationSelectInternal = (location) => {
    selectMapLocation(location); // Use the context function
  };

  return (
    <div className="top-bar">
      <div className="top-bar-search">
        <AddressSearchInput
          onLocationSelect={handleLocationSelectInternal} // Pass the internal handler
          placeholder="Search US Address on Map..."
        />
      </div>

      {/* ... rest of TopBar remains the same ... */}
      <div className="menu-container">
        {user.isLoggedIn && (
          <span className="user-name-display">
            {user.fullName}
            {user.isAdmin ? " (Admin)" : ""}
          </span>
        )}
        <button className="menu-button" onClick={toggleMenu}>
          <img src={menuIcon} alt="Menu" className="menu-icon" />
        </button>
        {isMenuOpen && (
          <ul className="menu-list">
            {/* ... menu items remain the same ... */}
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
                <li className="menu-separator"></li>
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
                    className="menu-signout-button"
                    onClick={handleSignOut}
                  >
                    Sign-Out
                  </button>
                </li>
                <li className="menu-separator"></li>
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

// No need for defaultProps for onLocationSelect anymore
// TopBar.defaultProps = { ... };

export default TopBar;
