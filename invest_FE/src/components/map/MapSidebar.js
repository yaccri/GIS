// src/components/map/MapSidebar.js
import React, { useState } from "react";
import "./MapSidebar.css";
import PropertyDisplay from "./PropertyDisplay";
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
  
  // Get filters from context
  const { filters } = useMapContext();
  
  // PropertyDisplay handlers
  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
  };

  const handleClosePropertyDisplay = () => {
    setSelectedProperty(null);
  };

  // Determine headings and messages
  let resultsHeading = "Search Results";
  if (searchRadius > 0) {
    resultsHeading = `Properties within ${searchRadius} miles`;
  } else if (clickedNeighborhood) {
    resultsHeading = `Properties in ${clickedNeighborhood.name || "selected neighborhood"}`;
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

      {/* Results Section */}
      {isSearching && (
        <div className="loading-indicator sidebar-section">
          <p>Searching properties...</p>
        </div>
      )}

      {!isSearching && propertiesToDisplay.length > 0 && (
        <div className="property-results sidebar-section">
          <h3>{resultsHeading}</h3>
          <ul className="property-list">
            {propertiesToDisplay.map((property) => {
              let locationString = "Location not available";
              if (property.address) {
                locationString = `${property.address}, ${property.city || ""}`;
              } else if (
                property.location?.type === "Point" &&
                Array.isArray(property.location.coordinates) &&
                property.location.coordinates.length === 2
              ) {
                const lat = property.location.coordinates[1];
                const lon = property.location.coordinates[0];
                locationString = `Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(4)}`;
              }

              return (
                <li
                  key={property.propertyID || property._id || Math.random()}
                  className="property-item"
                  onClick={() => handlePropertyClick(property)}
                  style={{ cursor: "pointer" }}
                >
                  {property.propertyID && (
                    <div className="property-id">ID: {property.propertyID}</div>
                  )}
                  <div className="property-title">
                    {property.address || "Property without title"}
                  </div>
                  <div className="property-price">
                    {property.price
                      ? formatCurrencyForDisplay(property.price)
                      : "Price not available"}
                  </div>
                  <div className="property-location">{locationString}</div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {shouldShowNoResults && (
        <div className="no-results sidebar-section">
          <p>No properties found in current search</p>
        </div>
      )}
    </div>
  );
};

export default MapSidebar;
