// src/components/map/RadiusSearchPanel.js
import React from "react";
import PropTypes from "prop-types";
import "./RadiusSearchPanel.css";

const RadiusSearchPanel = ({
  searchRadius, // Keep for context ("No results within X miles")
  // handleRadiusChange, // REMOVED
  isSearching,
  radiusSearchResults,
  selectedLocationDetails, // Keep for context/save button logic
  formatCurrencyForDisplay,
  saveRadiusSearchAsGeoJSON,
}) => {
  // Helper to determine if the "No properties found" message should show
  const shouldShowNoResults =
    !isSearching &&
    radiusSearchResults.length === 0 &&
    searchRadius > 0 && // Check if a search radius was selected (via overlay)
    selectedLocationDetails; // Check if a search was actually triggered around a point

  // Placeholder save function
  const handleSaveSearch = () => {
    if (saveRadiusSearchAsGeoJSON) {
      const center = selectedLocationDetails?.geometry?.coordinates
        ? [
            selectedLocationDetails.geometry.coordinates[1], // lat
            selectedLocationDetails.geometry.coordinates[0], // lon
          ]
        : null;
      saveRadiusSearchAsGeoJSON({
        center,
        radius: searchRadius,
        results: radiusSearchResults,
      });
      // Removed alert as it's just a placeholder call
    } else {
      console.warn("saveRadiusSearchAsGeoJSON function not provided.");
      alert("Save search functionality is not available.");
    }
  };

  return (
    <div className="radius-search-panel">
      {/* --- Radius Selection Controls REMOVED --- */}
      {/* {selectedLocationDetails && ( <div className="radius-control"> ... </div> )} */}

      {/* --- Loading Indicator --- */}
      {isSearching && (
        <div className="loading-indicator">
          <p>Searching properties...</p>
        </div>
      )}

      {/* --- Search Results --- */}
      {/* Show results only if not loading AND a search is active (radius > 0) */}
      {!isSearching && searchRadius > 0 && radiusSearchResults.length > 0 && (
        <div className="radius-results">
          <h3>Properties within {searchRadius} miles</h3>
          <ul className="property-list">
            {radiusSearchResults.map((property) => {
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
          {/* --- Save Search Button --- */}
          <button
            className="save-search-button"
            onClick={handleSaveSearch}
            disabled={!selectedLocationDetails || searchRadius <= 0} // Disable if no search active
          >
            Save Search Area/Results
          </button>
        </div>
      )}

      {/* --- No Results Message --- */}
      {shouldShowNoResults && (
        <div className="no-results-message">
          <p>No properties found within {searchRadius} miles.</p>
        </div>
      )}
    </div>
  );
};

// Update PropTypes
RadiusSearchPanel.propTypes = {
  searchRadius: PropTypes.number.isRequired, // Keep for context
  // handleRadiusChange: PropTypes.func.isRequired, // REMOVED
  isSearching: PropTypes.bool.isRequired,
  radiusSearchResults: PropTypes.array.isRequired,
  selectedLocationDetails: PropTypes.object,
  formatCurrencyForDisplay: PropTypes.func.isRequired,
  saveRadiusSearchAsGeoJSON: PropTypes.func,
};

export default RadiusSearchPanel;
