// src/components/map/MapControlsOverlay.js
import React from "react";
import "./MapControlsOverlay.css"; // Create this CSS file if needed for specific overlay styling

const MapControlsOverlay = ({
  onSearchNeighborhoodClick,
  neighborhoodInfo,
  isFetchingNeighborhoodProps,
  locationDetails,
  radiusOptions,
  searchRadius,
  onRadiusChange,
}) => {
  return (
    <div className="map-controls-overlay">
      {/* --- Neighborhood Search Button --- */}
      <button
        onClick={onSearchNeighborhoodClick}
        disabled={!neighborhoodInfo || isFetchingNeighborhoodProps}
        className="map-overlay-button"
        title={
          !neighborhoodInfo
            ? "Click on the map to select a location first"
            : `Search properties in ${
                neighborhoodInfo?.properties?.name || "selected area"
              }`
        }
      >
        {isFetchingNeighborhoodProps ? "Searching..." : "Search Neighborhood"}
      </button>

      {/* --- Radius Search Radio Buttons --- */}
      {/* Only show radius options if a location is selected */}
      {locationDetails && (
        <div className="radius-control">
          <strong>Search Radius:</strong>
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
                <span>{value === 0 ? "None" : `${value} mi`}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapControlsOverlay;
