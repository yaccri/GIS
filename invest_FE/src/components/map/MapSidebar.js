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
  // drawnItems,
  // handleDeletePolygon,
  // showPolygonCoordinates,
  // formatArea,
  // exportToGeoJSON,
  // searchPropertiesInPolygon,

  // // Props for Active Polygon Display
  // activePolygon,
  // setActivePolygon,
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
        </div>
      )}

      {/* Show "No Results" message if applicable */}
      {shouldShowNoResults && (
        <div className="no-results-message sidebar-section">
          {" "}
          <p>No properties found for the current selection.</p>
        </div>
      )}
    </div>
  );
};

export default MapSidebar;
