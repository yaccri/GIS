// src/components/map/MapSidebar.js
import React, { useState } from "react";
import "./MapSidebar.css";
import PropertyDisplay from "./PropertyDisplay";
import { FaFilter, FaDollarSign, FaBed, FaHome } from "react-icons/fa";
import { useMapContext } from "../../context/MapContext";

const MapSidebar = ({
  isSearching,
  propertiesToDisplay,
  searchRadius,
  setSearchRadius,
  clickedNeighborhood,
  selectedLocationDetails,
  formatCurrencyForDisplay,
}) => {
  // State for PropertyDisplay
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // State for filters visibility
  const [showFilters, setShowFilters] = useState(false);
  
  // Get filters and update function from context
  const { filters, updateFilters } = useMapContext();
  
  // PropertyDisplay handlers
  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
  };

  const handleClosePropertyDisplay = () => {
    setSelectedProperty(null);
  };

  // Apply filters
  const applyFilters = () => {
    updateFilters({
      price: {
        min: document.getElementById('minPrice').value,
        max: document.getElementById('maxPrice').value
      },
      beds: {
        min: document.getElementById('minBeds').value,
        max: document.getElementById('maxBeds').value
      },
      type: document.getElementById('propertyType').value
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchRadius(0);
    updateFilters({
      price: { min: "", max: "" },
      beds: { min: "", max: "" },
      type: ""
    });
  };

  // Determine headings and messages
  let resultsHeading = "תוצאות חיפוש";
  if (searchRadius > 0) {
    resultsHeading = `נכסים במרחק ${searchRadius} מייל`;
  } else if (clickedNeighborhood) {
    resultsHeading = `נכסים ב${clickedNeighborhood.name || "שכונה נבחרת"}`;
  }

  const isSearchActive = searchRadius > 0 || !!clickedNeighborhood;
  const shouldShowNoResults = !isSearching && propertiesToDisplay.length === 0 && isSearchActive && selectedLocationDetails;

  return (
    <div className="map-sidebar-container">
      <PropertyDisplay
        isOpen={!!selectedProperty}
        onClose={handleClosePropertyDisplay}
        property={selectedProperty}
        isAdmin={false}
      />

      {/* Filters Section */}
      <div className="filters-section sidebar-section">
        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> סינון
        </button>
        
        {showFilters && (
          <div className="filters-container">
            <div className="filter-group">
              <label><FaDollarSign /> טווח מחירים</label>
              <div className="price-inputs">
                <input
                  id="minPrice"
                  type="number"
                  placeholder="מחיר מינימום"
                  value={filters.price.min}
                  onChange={(e) => updateFilters({
                    price: { ...filters.price, min: e.target.value }
                  })}
                />
                <input
                  id="maxPrice"
                  type="number"
                  placeholder="מחיר מקסימום"
                  value={filters.price.max}
                  onChange={(e) => updateFilters({
                    price: { ...filters.price, max: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="filter-group">
              <label><FaBed /> מספר חדרים</label>
              <div className="beds-inputs">
                <input
                  id="minBeds"
                  type="number"
                  placeholder="מינימום חדרים"
                  value={filters.beds.min}
                  onChange={(e) => updateFilters({
                    beds: { ...filters.beds, min: e.target.value }
                  })}
                />
                <input
                  id="maxBeds"
                  type="number"
                  placeholder="מקסימום חדרים"
                  value={filters.beds.max}
                  onChange={(e) => updateFilters({
                    beds: { ...filters.beds, max: e.target.value }
                  })}
                />
              </div>
            </div>

            <div className="filter-group">
              <label><FaHome /> סוג נכס</label>
              <select
                id="propertyType"
                value={filters.type}
                onChange={(e) => updateFilters({ type: e.target.value })}
              >
                <option value="">הכל</option>
                <option value="house">בית פרטי</option>
                <option value="apartment">דירה</option>
                <option value="condo">קונדו</option>
                <option value="land">קרקע</option>
              </select>
            </div>

            <div className="filter-actions">
              <button onClick={applyFilters} className="apply-filters">החל סינון</button>
              <button onClick={resetFilters} className="reset-filters">אפס סינון</button>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {isSearching && (
        <div className="loading-indicator sidebar-section">
          <p>מחפש נכסים...</p>
        </div>
      )}

      {!isSearching && propertiesToDisplay.length > 0 && (
        <div className="property-results sidebar-section">
          <h3>{resultsHeading}</h3>
          <ul className="property-list">
            {propertiesToDisplay.map((property) => {
              let locationString = "מיקום לא זמין";
              if (property.address) {
                locationString = `${property.address}, ${property.city || ""}`;
              } else if (
                property.location?.type === "Point" &&
                Array.isArray(property.location.coordinates) &&
                property.location.coordinates.length === 2
              ) {
                const lat = property.location.coordinates[1];
                const lon = property.location.coordinates[0];
                locationString = `קו רוחב: ${lat.toFixed(4)}, קו אורך: ${lon.toFixed(4)}`;
              }

              return (
                <li
                  key={property.propertyID || property._id || Math.random()}
                  className="property-item"
                  onClick={() => handlePropertyClick(property)}
                  style={{ cursor: "pointer" }}
                >
                  {property.propertyID && (
                    <div className="property-id">מזהה: {property.propertyID}</div>
                  )}
                  <div className="property-title">
                    {property.address || "נכס ללא כותרת"}
                  </div>
                  <div className="property-price">
                    {property.price
                      ? formatCurrencyForDisplay(property.price)
                      : "מחיר לא זמין"}
                  </div>
                  <div className="property-location">{locationString}</div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {shouldShowNoResults && (
        <div className="no-results-message sidebar-section">
          <p>לא נמצאו נכסים בבחירה הנוכחית.</p>
          <p>נסה לשנות את קריטריוני החיפוש.</p>
          <p>לחץ על 'חיפוש בשכונה' או הגדל את רדיוס החיפוש.</p>
        </div>
      )}
    </div>
  );
};

export default MapSidebar;
