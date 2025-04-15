// src/components/map/layers/RadiusCircleLayer.js
import React from "react";
import { Circle } from "react-leaflet";
import PropTypes from "prop-types";

/**
 * Renders a Circle on the map representing the search radius.
 *
 * @param {object} props
 * @param {Array<number>|null} props.centerCoords - The center coordinates as [latitude, longitude].
 * @param {number} props.radiusInMiles - The radius in miles.
 */
const RadiusCircleLayer = ({ centerCoords, radiusInMiles }) => {
  // Only render if we have a valid center and a positive radius
  if (!centerCoords || !radiusInMiles || radiusInMiles <= 0) {
    return null;
  }

  // Convert radius from miles to meters for Leaflet Circle component
  const radiusInMeters = radiusInMiles * 1609.34;

  // Define the appearance of the circle
  const pathOptions = {
    color: "#FF4500", // OrangeRed
    fillColor: "#FF4500",
    fillOpacity: 0.1,
    weight: 2,
  };

  return (
    <Circle
      center={centerCoords} // Expects [lat, lng] array
      radius={radiusInMeters}
      pathOptions={pathOptions}
    />
  );
};

// Define PropTypes for better component usage understanding and validation
RadiusCircleLayer.propTypes = {
  centerCoords: PropTypes.arrayOf(PropTypes.number), // Should be [lat, lng]
  radiusInMiles: PropTypes.number.isRequired,
};

// Set default props
RadiusCircleLayer.defaultProps = {
  centerCoords: null,
};

export default RadiusCircleLayer;
