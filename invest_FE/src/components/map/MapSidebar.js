// src/components/map/sidebar/MapSidebar.js
import React from "react";
import "./MapSidebar.css"; // Imports its dedicated styles
// Removed RadiusSearchPanel import as the list is now rendered here directly
// import RadiusSearchPanel from "./RadiusSearchPanel";

const MapSidebar = ({
  // Combined props for property list display
  isSearching, // Combined loading state (radius OR neighborhood)
  propertiesToDisplay, // The list of properties to show
  searchRadius, // To know if it was a radius search
  clickedNeighborhood, // To know if it was a neighborhood search
  selectedLocationDetails, // To know if *any* search context exists
  formatCurrencyForDisplay, // Utility

  // Props for Saved Polygons / Areas
  drawnItems,
  handleDeletePolygon,
  showPolygonCoordinates,
  formatArea,
  exportToGeoJSON,
  searchPropertiesInPolygon,

  // Props for Active Polygon Display
  activePolygon,
  setActivePolygon,
}) => {
  // Determine the heading for the results section
  let resultsHeading = "Search Results"; // Default
  if (searchRadius > 0) {
    resultsHeading = `Properties within ${searchRadius} miles`;
  } else if (clickedNeighborhood) {
    resultsHeading = `Properties in ${
      clickedNeighborhood.name || "Selected Neighborhood"
    }`;
  }

  // Determine if a search context is active (radius selected or neighborhood clicked)
  const isSearchActive = searchRadius > 0 || !!clickedNeighborhood;

  // Determine if the "No properties found" message should show
  const shouldShowNoResults =
    !isSearching &&
    propertiesToDisplay.length === 0 &&
    isSearchActive && // Only show if a search was actually active
    selectedLocationDetails; // And a location was selected to search around/in

  return (
    <div className="map-sidebar-container">
      {/* --- Property Results Section (Combined) --- */}
      {/* Show loading indicator if either search is running */}
      {isSearching && (
        <div className="loading-indicator sidebar-section">
          {" "}
          {/* Added sidebar-section class */}
          <p>Searching properties...</p>
        </div>
      )}

      {/* Show results if not loading AND there are properties to display */}
      {!isSearching && propertiesToDisplay.length > 0 && (
        <div className="property-results sidebar-section">
          {" "}
          {/* Added sidebar-section class */}
          <h3>{resultsHeading}</h3>
          <ul className="property-list">
            {propertiesToDisplay.map((property) => {
              // Simplified location string logic (can be enhanced)
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
          {/* Removed Save Search Button */}
        </div>
      )}

      {/* Show "No Results" message if applicable */}
      {shouldShowNoResults && (
        <div className="no-results-message sidebar-section">
          {" "}
          {/* Added sidebar-section class */}
          <p>No properties found for the current selection.</p>
        </div>
      )}

      {/* --- Saved Polygons / Areas Section --- */}
      {drawnItems && drawnItems.length > 0 && (
        <div className="saved-polygons sidebar-section">
          {" "}
          {/* Added sidebar-section class */}
          <h3>Saved Areas:</h3>
          <ul className="polygons-list">
            {drawnItems.map((polygon) => (
              <li key={polygon.id} className="polygon-item">
                <div className="polygon-header">
                  <strong>
                    {polygon.type === "polygon" ? "Polygon" : "Rectangle"}
                  </strong>
                  <span className="area-info">{formatArea(polygon.area)}</span>
                  <button
                    className="delete-button"
                    onClick={() => handleDeletePolygon(polygon.id)}
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
                      onClick={() => showPolygonCoordinates(polygon)}
                    >
                      Show Coords
                    </button>
                    <button
                      className="find-properties-button"
                      onClick={() => searchPropertiesInPolygon(polygon)}
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
              Export All Shapes
            </button>
          </div>
        </div>
      )}

      {/* --- Active Polygon Coordinates Section --- */}
      {activePolygon && (
        <div className="coordinates-display sidebar-section">
          {" "}
          {/* Added sidebar-section class */}
          <h3>Coordinates for {activePolygon.type}</h3>
          <div className="coordinates-scroll">
            <pre>{JSON.stringify(activePolygon.coordinates, null, 2)}</pre>
          </div>
          <div className="coordinates-actions">
            <button
              className="close-button"
              onClick={() => setActivePolygon(null)}
            >
              Close
            </button>
            <button
              className="find-properties-button"
              onClick={() => searchPropertiesInPolygon(activePolygon)}
            >
              Find Properties
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSidebar;
