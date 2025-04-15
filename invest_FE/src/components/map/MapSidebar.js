// src/components/map/MapSidebar.js
import React from "react";
import "./MapSidebar.css"; // Imports its dedicated styles

// Import utility functions directly if they are pure and don't depend on MapComponent state/context
// Otherwise, expect them as props (like formatCurrencyForDisplay, formatArea)
// import { formatCurrencyForDisplay } from '../../utils/currencyFormatter'; // Example if moved from Map.js utils

const MapSidebar = ({
  // Props for Radius Search Results
  isSearching,
  radiusSearchResults,
  searchRadius,
  selectedLocationDetails, // Needed to know if a search was attempted
  formatCurrencyForDisplay, // Pass utility function as prop

  // Props for Saved Polygons / Areas
  drawnItems,
  handleDeletePolygon,
  showPolygonCoordinates,
  formatArea, // Pass utility function as prop
  exportToGeoJSON,
  searchPropertiesInPolygon, // Callback for finding properties in polygon

  // Props for Active Polygon Display
  activePolygon,
  setActivePolygon, // To close the display (setActivePolygon(null))

  // Props for Saved Searches (Optional - can be added if feature is used)
  // savedSearches,
  // viewSavedSearch,
  // exportSavedSearches,
  // activeSearch,
}) => {
  // Helper to determine if the "No properties found" message should show
  const shouldShowNoResults =
    !isSearching &&
    radiusSearchResults.length === 0 &&
    searchRadius > 0 &&
    selectedLocationDetails; // Check if a search was actually triggered

  return (
    // This div uses the .search-container class for its internal layout,
    // styled by MapSidebar.css. Its positioning/width relative to the map
    // is handled by Map.css rules applied in the parent (Map.js).
    <div className="search-container">
      {/* Results from Radius Search */}
      {isSearching && (
        <div className="loading-indicator">
          <p>Searching...</p>
        </div>
      )}
      {!isSearching && radiusSearchResults.length > 0 && (
        <div className="radius-results">
          <h3>Properties within {searchRadius} miles</h3>
          <ul className="property-list">
            {radiusSearchResults.map((property) => {
              let locationString = "Location N/A";
              if (
                property.location?.type === "Point" &&
                Array.isArray(property.location.coordinates) &&
                property.location.coordinates.length === 2
              ) {
                const lat = property.location.coordinates[1];
                const lon = property.location.coordinates[0];
                locationString = `Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(
                  4
                )}`;
              } else if (typeof property.location === "string") {
                locationString = property.location;
              } else if (property.address) {
                locationString = `${property.address}, ${property.city || ""}`;
              }
              return (
                <li
                  key={
                    property.propertyID ||
                    property._id ||
                    property.id ||
                    Math.random()
                  }
                  className="property-item"
                >
                  {property.propertyID && (
                    <div className="property-id">ID: {property.propertyID}</div>
                  )}
                  <div className="property-title">
                    {property.title || property.address || "Untitled Property"}
                  </div>
                  <div className="property-price">
                    {property.price
                      ? formatCurrencyForDisplay(property.price) // Use prop function
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
        <div className="radius-results">
          <p>No properties found within {searchRadius} miles.</p>
        </div>
      )}

      {/* Saved Searches (Placeholder - uncomment/implement if needed) */}
      {/* {savedSearches && savedSearches.length > 0 && (
        <div className="saved-searches"> ... </div>
      )} */}
      {/* Active Search Details (Placeholder - uncomment/implement if needed) */}
      {/* {activeSearch && (
        <div className="search-details-panel"> ... </div>
      )} */}

      {/* Saved Polygons / Areas */}
      {drawnItems && drawnItems.length > 0 && (
        <div className="saved-polygons">
          <h3>Saved Areas:</h3>
          <ul className="polygons-list">
            {drawnItems.map((polygon) => (
              <li key={polygon.id} className="polygon-item">
                <div className="polygon-header">
                  <strong>
                    {polygon.type === "polygon" ? "Polygon" : "Rectangle"}
                  </strong>
                  <span className="area-info">
                    {formatArea(polygon.area)} {/* Use prop function */}
                  </span>
                  <button
                    className="delete-button"
                    onClick={() => handleDeletePolygon(polygon.id)} // Use prop callback
                  >
                    &times;
                  </button>
                </div>
                <div className="polygon-details">
                  <p>
                    Center: [{polygon.center.lat.toFixed(4)},{" "}
                    {polygon.center.lng.toFixed(4)}]
                  </p>
                  <p>Points: {polygon.coordinates.length}</p>
                  <div className="polygon-actions-row">
                    <button
                      className="show-coords-button"
                      onClick={() => showPolygonCoordinates(polygon)} // Use prop callback
                    >
                      Show Coords
                    </button>
                    <button
                      className="find-properties-button" // Re-using class, style if needed
                      style={{ backgroundColor: "#6610f2" }} // Inline style kept for example, could be class-based
                      onClick={() => searchPropertiesInPolygon(polygon)} // Use prop callback
                    >
                      Find Properties
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="polygon-actions">
            <button className="export-button" onClick={exportToGeoJSON}>
              {" "}
              {/* Use prop callback */}
              Export All Shapes
            </button>
          </div>
        </div>
      )}

      {/* Active Polygon Coordinates */}
      {activePolygon && (
        <div className="coordinates-display">
          <h3>Coordinates for {activePolygon.type}</h3>
          <div className="coordinates-scroll">
            <pre>{JSON.stringify(activePolygon.coordinates, null, 2)}</pre>
          </div>
          <div
            className="coordinates-actions"
            // style={{ marginTop: "10px", display: "flex", gap: "10px" }} // Style now in CSS
          >
            <button
              className="close-button"
              onClick={() => setActivePolygon(null)} // Use prop callback
            >
              Close
            </button>
            <button
              className="find-properties-button"
              // style={{ backgroundColor: "#6610f2" }} // Style now in CSS
              onClick={() => searchPropertiesInPolygon(activePolygon)} // Use prop callback
            >
              Find Properties
            </button>
          </div>
        </div>
      )}

      {/* Instructions Sections (Keep or remove as needed) */}
      {/* <div className="polygon-info"> ... </div> */}
      {/* <div className="radius-info-instructions"> ... </div> */}
      {/* <div className="polygon-draw-instructions"> ... </div> */}
    </div>
  );
};

export default MapSidebar;
