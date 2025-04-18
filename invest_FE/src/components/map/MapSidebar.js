// src/components/map/MapSidebar.js
import React, { useState } from "react";
import "./MapSidebar.css";
import PropertyDisplay from "./PropertyDisplay";

const MapSidebar = ({
  isSearching,
  propertiesToDisplay,
  searchRadius,
  clickedNeighborhood,
  selectedLocationDetails,
  formatCurrencyForDisplay,
}) => {
  // State to manage PropertyDisplay visibility and selected property
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Handler to open PropertyDisplay with the clicked property
  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
  };

  // Handler to close PropertyDisplay
  const handleClosePropertyDisplay = () => {
    setSelectedProperty(null);
  };

  // Determine the heading for the results section
  let resultsHeading = "Search Results";
  if (searchRadius > 0) {
    resultsHeading = `Properties within ${searchRadius} miles`;
  } else if (clickedNeighborhood) {
    resultsHeading = `Properties in ${
      clickedNeighborhood.name || "Selected Neighborhood"
    }`;
  }

  // Determine if a search context is active
  const isSearchActive = searchRadius > 0 || !!clickedNeighborhood;

  // Determine if the "No properties found" message should show
  const shouldShowNoResults =
    !isSearching &&
    propertiesToDisplay.length === 0 &&
    isSearchActive &&
    selectedLocationDetails;

  return (
    <div className="map-sidebar-container">
      {/* PropertyDisplay modal */}
      <PropertyDisplay
        isOpen={!!selectedProperty}
        onClose={handleClosePropertyDisplay}
        property={selectedProperty}
        isAdmin={false} // View-only mode
      />

      {/* Property Results Section */}
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
              let locationString = "Location N/A";
              if (property.address) {
                locationString = `${property.address}, ${property.city || ""}`;
              } else if (
                property.location?.type === "Point" &&
                Array.isArray(property.location.coordinates) &&
                property.location.coordinates.length === 2
              ) {
                const lat = property.location.coordinates[1];
                const lon = property.location.coordinates[0];
                locationString = `Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(
                  4
                )}`;
              }

              return (
                <li
                  key={property.propertyID || property._id || Math.random()}
                  className="property-item"
                  onClick={() => handlePropertyClick(property)} // Open PropertyDisplay on click
                  style={{ cursor: "pointer" }} // Indicate clickability
                >
                  {property.propertyID && (
                    <div className="property-id">ID: {property.propertyID}</div>
                  )}
                  <div className="property-title">
                    {property.address || "Untitled Property"}
                  </div>
                  <div className="property-price">
                    {property.price
                      ? formatCurrencyForDisplay(property.price)
                      : "Price N/A"}
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
          <p>No properties found for the current selection.</p>
        </div>
      )}
    </div>
  );
};

export default MapSidebar;
