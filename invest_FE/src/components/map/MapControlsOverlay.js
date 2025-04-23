// src/components/map/MapControlsOverlay.js
import React from "react";
import "./MapControlsOverlay.css"; // Ensure this CSS file has the updated styles

const MapControlsOverlay = ({
  onSearchNeighborhoodClick,
  neighborhoodInfo,
  isFetchingNeighborhoodProps,
  locationDetails, // Needed for radius controls visibility
  radiusOptions,
  searchRadius,
  onRadiusChange,
  showRestaurants, // Needed for restaurant button state/text
  onToggleRestaurants, // Needed for restaurant button action
  // NEW: Add isDrawing prop if you want to hide radius controls during drawing
  // isDrawing, // Example: You might need to pass this from Map.js
}) => {
  // Determine if any search context is active (for potentially disabling restaurant button later if needed)
  // const isSearchContextActive = !!locationDetails || !!neighborhoodInfo /* || drawnItems.length > 0 */; // Add check for drawn items if needed

  // Determine if radius controls should be shown
  // Hide if drawing OR if no location is selected for the radius center
  const showRadiusControls = locationDetails; /* && !isDrawing */ // Uncomment !isDrawing if needed

  return (
    // Use the new wrapper div
    <div className="map-controls-wrapper">
      {/* Container 1: Main Controls (Radius, Neighborhood) */}
      <div className="map-controls-main">
        {/* --- Neighborhood Search Button --- */}
        {/* Conditionally hide if drawing? Or just disable? Currently disabled logic is based on neighborhoodInfo */}
        {/* { !isDrawing && ( // Example: Optionally hide during drawing */}
        <button
          onClick={onSearchNeighborhoodClick}
          disabled={!neighborhoodInfo || isFetchingNeighborhoodProps}
          className="map-overlay-button"
          title={
            !neighborhoodInfo
              ? "Click on the map within a neighborhood first"
              : `Search properties in ${
                  neighborhoodInfo?.name || "selected area" // Use neighborhoodInfo.name directly
                }`
          }
        >
          {isFetchingNeighborhoodProps ? "Searching..." : "Search Neighborhood"}
        </button>
        {/* )} */}

        {/* --- Radius Search Radio Buttons --- */}
        {/* Only show radius options if a location is selected AND not drawing */}
        {showRadiusControls && (
          <div className="radius-control">
            <strong>Radius (mi):</strong> {/* Shortened label */}
            <div className="radio-group">
              {radiusOptions.map((value) => (
                <label key={value} className="radio-label">
                  <input
                    type="radio"
                    name="radius"
                    value={value}
                    checked={searchRadius === value}
                    onChange={onRadiusChange} // Use the passed handler
                  />
                  {/* Display 'None' for 0, value otherwise */}
                  <span>{value === 0 ? "None" : value}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Container 2: Restaurants Button */}
      {/* This container is always visible based on the new structure */}
      <div className="map-controls-restaurants">
        <button
          onClick={onToggleRestaurants}
          className="map-overlay-button restaurant-toggle-button" // Keep specific class if needed for styling
          title={
            showRestaurants
              ? "Hide restaurants in the current search area"
              : "Show restaurants in the current search area"
          }
          // disabled={!isSearchContextActive} // Optionally disable if no search context exists
        >
          {showRestaurants ? "Hide Restaurants" : "Show Restaurants"}
        </button>
      </div>
    </div>
  );
};

export default MapControlsOverlay;
