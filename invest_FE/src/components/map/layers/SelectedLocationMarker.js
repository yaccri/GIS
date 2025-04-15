// src/components/map/layers/SelectedLocationMarker.js
import React from "react";
import { Marker, Popup } from "react-leaflet";
import PropTypes from "prop-types";
import L from "leaflet"; // Import L if you need custom icons later

// Ensure default icon works (might be redundant if already done in Map.js, but safe)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

/**
 * Renders a Marker with a Popup for the selected location details.
 * Expects locationDetails in GeoJSON Feature format with Point geometry.
 *
 * @param {object} props
 * @param {object|null} props.locationDetails - The GeoJSON Feature object for the selected location, or null.
 */
const SelectedLocationMarker = ({ locationDetails }) => {
  // Only render if we have valid details with coordinates
  if (
    !locationDetails?.geometry?.coordinates ||
    locationDetails.geometry.coordinates.length !== 2
  ) {
    return null;
  }

  // Extract coordinates (Leaflet needs [lat, lng])
  const lat = locationDetails.geometry.coordinates[1];
  const lon = locationDetails.geometry.coordinates[0];

  // Extract popup content
  const popupContent = locationDetails.properties?.name || "Selected Point";

  return (
    <Marker position={[lat, lon]}>
      <Popup>{popupContent}</Popup>
    </Marker>
  );
};

// Define PropTypes for better component usage understanding and validation
SelectedLocationMarker.propTypes = {
  locationDetails: PropTypes.shape({
    type: PropTypes.oneOf(["Feature"]),
    geometry: PropTypes.shape({
      type: PropTypes.oneOf(["Point"]),
      coordinates: PropTypes.arrayOf(PropTypes.number),
    }),
    properties: PropTypes.shape({
      name: PropTypes.string,
      // Add other expected properties if needed
    }),
  }),
};

// Set default props in case locationDetails is undefined
SelectedLocationMarker.defaultProps = {
  locationDetails: null,
};

export default SelectedLocationMarker;
