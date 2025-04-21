// src/components/TopBar.js
import React, { useContext, useState, useRef, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { useMapContext } from "../context/MapContext";
// Import useLocation along with other router hooks
import { Link, useNavigate, useLocation } from "react-router-dom";
import AddressSearchInput from "./AddressSearch-OpenStreetMap";
import { FaFilter, FaChevronDown, FaHome, FaBed, FaBath, FaRuler, FaCalendar, FaMoneyBill, FaUser, FaBuilding, FaShieldAlt } from "react-icons/fa";
import "./TopBar.css";
import menuIcon from "../assets/images/account.svg";

// Define the path where your MapComponent is rendered
const MAP_PAGE_PATH = "/map";

const TopBar = () => {
  const { user, updateUser, updateToken } = useContext(UserContext);
  const { selectMapLocation, updateFilters } = useMapContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminSubMenuOpen, setIsAdminSubMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filters, setLocalFilters] = useState({
    builtYear: { min: "", max: "" },
    propertyTax: { min: "", max: "" },
    hoa: { min: "", max: "" },
    insurance: { min: "", max: "" },
    rent: { min: "", max: "" }
  });
  const adminMenuTimerRef = useRef(null);
  const menuRef = useRef(null);

  // Get navigation and location hooks
  const navigate = useNavigate();
  const location = useLocation(); // Get current location object

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsAdminSubMenuOpen(false);
    clearTimeout(adminMenuTimerRef.current);
  };

  const handleSignOut = () => {
    updateUser({ isLoggedIn: false, isAdmin: false, fullName: "" });
    updateToken(null);
    closeMenu();
    navigate("/login");
  };

  // --- MODIFIED: Handle location selection and navigation ---
  const handleLocationSelectInternal = (selectedAddress) => {
    console.log("TopBar: Address selected", selectedAddress);

    // 1. Update the context immediately.
    //    MapPage will pick this up when it mounts or updates.
    selectMapLocation(selectedAddress);

    // 2. Check if navigation is needed.
    const currentPath = location.pathname; // Get the current path

    if (currentPath !== MAP_PAGE_PATH) {
      console.log(
        `TopBar: Navigating from ${currentPath} to ${MAP_PAGE_PATH} after address selection.`
      );
      // Navigate to the map page if not already there
      navigate(MAP_PAGE_PATH);
    } else {
      console.log("TopBar: Already on map page. Context updated.");
      // No navigation needed, MapPage's useEffect watching selectedLocation will handle centering/zoom.
    }

    // Note: Removed closeMenu() here as the search is not inside the menu itself.
  };
  // --- END MODIFICATION ---

  // --- Handlers for Admin Submenu ---
  const handleAdminMouseEnter = () => {
    clearTimeout(adminMenuTimerRef.current);
    if (isMenuOpen) {
      setIsAdminSubMenuOpen(true);
    }
  };

  const handleAdminMouseLeave = () => {
    adminMenuTimerRef.current = setTimeout(() => {
      setIsAdminSubMenuOpen(false);
    }, 200);
  };
  // --- End Handlers for Admin Submenu ---

  // Close menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(adminMenuTimerRef.current);
    };
  }, [isMenuOpen]);

  const toggleFilter = (filterName) => {
    setActiveFilter(activeFilter === filterName ? null : filterName);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const [mainKey, subKey] = name.split(".");
    
    const newFilters = {
      ...filters,
      [mainKey]: subKey ? {
        ...filters[mainKey],
        [subKey]: value
      } : value
    };
    
    setLocalFilters(newFilters);
    updateFilters(newFilters);
  };

  const renderFilterInputs = (filterType) => {
    if (['builtYear', 'propertyTax', 'hoa', 'insurance', 'rent'].includes(filterType)) {
      return (
        <div className="filter-dropdown">
          <div className="range-inputs">
            <input
              type="number"
              name={`${filterType}.min`}
              placeholder="Min"
              value={filters[filterType].min}
              onChange={handleFilterChange}
            />
            <span>to</span>
            <input
              type="number"
              name={`${filterType}.max`}
              placeholder="Max"
              value={filters[filterType].max}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="top-bar">
      <div className="top-bar-search">
        <AddressSearchInput
          onLocationSelect={handleLocationSelectInternal}
          placeholder="Search US Address on Map..."
        />
      </div>

      <div className="filters-container">
        <button 
          className={`filter-button ${activeFilter === 'builtYear' ? 'active' : ''}`}
          onClick={() => toggleFilter('builtYear')}
        >
          <FaCalendar /> Year Built
        </button>

        <button 
          className={`filter-button ${activeFilter === 'propertyTax' ? 'active' : ''}`}
          onClick={() => toggleFilter('propertyTax')}
        >
          <FaMoneyBill /> Property Tax
        </button>

        <button 
          className={`filter-button ${activeFilter === 'hoa' ? 'active' : ''}`}
          onClick={() => toggleFilter('hoa')}
        >
          <FaBuilding /> HOA Fees
        </button>

        <button 
          className={`filter-button ${activeFilter === 'insurance' ? 'active' : ''}`}
          onClick={() => toggleFilter('insurance')}
        >
          <FaShieldAlt /> Insurance
        </button>

        <button 
          className={`filter-button ${activeFilter === 'rent' ? 'active' : ''}`}
          onClick={() => toggleFilter('rent')}
        >
          <FaHome /> Rent
        </button>

        {activeFilter && renderFilterInputs(activeFilter)}
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

                {/* --- Admin Tools Item --- */}
                {user.isAdmin && (
                  <li
                    className="admin-tools-item"
                    onMouseEnter={handleAdminMouseEnter}
                    onMouseLeave={handleAdminMouseLeave}
                  >
                    <span className="admin-tools-trigger">
                      <span className="submenu-arrow">▸</span> Admin Tools{" "}
                      {/* Ensure arrow is styled correctly */}
                    </span>
                    {isAdminSubMenuOpen && (
                      <ul
                        className="admin-submenu"
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
