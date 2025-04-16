// src/components/TopBar.js
import React, { useContext, useState, useRef, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { useMapContext } from "../context/MapContext";
import { Link, useNavigate } from "react-router-dom";
import AddressSearchInput from "./AddressSearch-OpenStreetMap";
import "./TopBar.css";
import menuIcon from "../assets/images/account.svg";

const TopBar = () => {
  const { user, updateUser, updateToken } = useContext(UserContext);
  const { selectMapLocation } = useMapContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // --- New state for admin submenu ---
  const [isAdminSubMenuOpen, setIsAdminSubMenuOpen] = useState(false);
  // --- Ref for delayed closing ---
  const adminMenuTimerRef = useRef(null);

  const navigate = useNavigate();
  const menuRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // --- Modified closeMenu to close both ---
  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsAdminSubMenuOpen(false); // Close admin submenu as well
    clearTimeout(adminMenuTimerRef.current); // Clear any pending close timer
  };

  const handleSignOut = () => {
    updateUser({ isLoggedIn: false, isAdmin: false, fullName: "" });
    updateToken(null);
    closeMenu(); // Closes both menus
    navigate("/login");
  };

  const handleLocationSelectInternal = (location) => {
    selectMapLocation(location);
    closeMenu(); // Closes both menus
  };

  // --- Handlers for Admin Submenu ---
  const handleAdminMouseEnter = () => {
    clearTimeout(adminMenuTimerRef.current); // Clear timer if mouse re-enters
    if (isMenuOpen) {
      // Only open submenu if main menu is open
      setIsAdminSubMenuOpen(true);
    }
  };

  const handleAdminMouseLeave = () => {
    // Delay closing to allow moving mouse onto the submenu
    adminMenuTimerRef.current = setTimeout(() => {
      setIsAdminSubMenuOpen(false);
    }, 200); // 200ms delay, adjust as needed
  };
  // --- End Handlers for Admin Submenu ---

  // Close menu if clicking outside (existing logic should work)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu(); // Closes both menus
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(adminMenuTimerRef.current); // Clear timer on unmount/close
    };
  }, [isMenuOpen]);

  return (
    <div className="top-bar">
      <div className="top-bar-search">
        <AddressSearchInput
          onLocationSelect={handleLocationSelectInternal}
          placeholder="Search US Address on Map..."
        />
      </div>

      <div className="menu-container" ref={menuRef}>
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
            {/* Home Link */}
            <li>
              <Link to="/" onClick={closeMenu}>
                Home
              </Link>
            </li>

            {/* Logged Out Links */}
            {!user.isLoggedIn && (
              <>
                <li className="menu-separator"></li>
                <li>
                  <Link to="/subscribe" onClick={closeMenu}>
                    New Account
                  </Link>
                </li>
                <li>
                  <Link to="/login" onClick={closeMenu}>
                    Sign-In
                  </Link>
                </li>
              </>
            )}

            {/* Logged In Links */}
            {user.isLoggedIn && (
              <>
                <li className="menu-separator"></li>
                <li>
                  <Link to="/preferences" onClick={closeMenu}>
                    Edit Preferences
                  </Link>
                </li>

                {/* --- Admin Tools Item (Modified) --- */}
                {user.isAdmin && (
                  <li
                    className="admin-tools-item" // Add class for styling/positioning
                    onMouseEnter={handleAdminMouseEnter}
                    onMouseLeave={handleAdminMouseLeave} // Attach hover handlers here
                  >
                    {/* Make this a span or button, not a link */}
                    <span className="admin-tools-trigger">
                      Admin Tools <span className="submenu-arrow">▸</span>{" "}
                      {/* Arrow indicates submenu */}
                    </span>

                    {/* --- Admin Submenu (Conditional Rendering) --- */}
                    {isAdminSubMenuOpen && (
                      <ul
                        className="admin-submenu"
                        // Keep submenu open if mouse enters it
                        onMouseEnter={handleAdminMouseEnter}
                        onMouseLeave={handleAdminMouseLeave}
                      >
                        <li>
                          <Link
                            to="/testOpenStreetMapAddress"
                            onClick={closeMenu}
                          >
                            AddressSearch (OSM)
                          </Link>
                        </li>
                        <li>
                          <Link to="/testGoogleAddress" onClick={closeMenu}>
                            AddressSearch (Google)
                          </Link>
                        </li>
                        <li>
                          <Link to="/properties" onClick={closeMenu}>
                            Properties
                          </Link>
                        </li>
                      </ul>
                    )}
                    {/* --- End Admin Submenu --- */}
                  </li>
                )}
                {/* --- End Admin Tools Item --- */}

                {/* Sign Out Button */}
                <li>
                  <button
                    className="menu-signout-button"
                    onClick={handleSignOut}
                  >
                    Sign-Out
                  </button>
                </li>
              </>
            )}

            {/* About Link */}
            <li className="menu-separator"></li>
            <li>
              <Link to="/about" onClick={closeMenu}>
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
