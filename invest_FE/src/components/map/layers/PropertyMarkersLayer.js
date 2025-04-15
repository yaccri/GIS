// src/components/map/layers/PropertyMarkersLayer.js
import React from "react";
import { Marker, Popup } from "react-leaflet";
import PropTypes from "prop-types";
import { createPriceIcon } from "../utils/mapIconUtils";
// Note: formatCurrencyForDisplay is passed as a prop

/**
 * Renders Markers with price icons and popups for property search results.
 *
 * @param {object} props
 * @param {Array<object>} props.properties - Array of property objects from search results.
 * @param {function} props.formatCurrencyForDisplay - Function to format currency values.
 */
const PropertyMarkersLayer = ({ properties, formatCurrencyForDisplay }) => {
  // Render nothing if the array is empty or not provided
  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <>
      {properties.map((property) => {
        // --- Validation ---
        // Ensure location is a Point with valid coordinates
        if (
          !property.location?.type === "Point" ||
          !Array.isArray(property.location.coordinates) ||
          property.location.coordinates.length !== 2
        ) {
          console.warn(
            "Skipping property with invalid location structure:",
            property
          );
          return null;
        }

        const lon = property.location.coordinates[0];
        const lat = property.location.coordinates[1];

        // Ensure lat/lon are valid numbers
        if (
          typeof lat !== "number" ||
          typeof lon !== "number" ||
          isNaN(lat) ||
          isNaN(lon)
        ) {
          console.warn(
            "Skipping property with invalid coordinates (NaN or not number):",
            property
          );
          return null;
        }

        // Ensure a unique key
        const propertyId =
          property.propertyID || property._id || `prop-${lat}-${lon}`;

        // --- Rendering ---
        return (
          <Marker
            key={propertyId}
            position={[lat, lon]} // Leaflet Marker expects [lat, lng]
            icon={createPriceIcon(property.price)} // Use imported icon creator
          >
            <Popup>
              <div className="popup-title">
                {property.address ||
                  `Property ID: ${property.propertyID || "N/A"}`}
              </div>
              <div className="popup-details">
                <p>ID: {property.propertyID || "N/A"}</p>
                <p>Price: {formatCurrencyForDisplay(property.price)}</p>
                <p>Type: {property.type || "N/A"}</p>
                <p>
                  Beds: {property.beds ?? "N/A"} | Baths:{" "}
                  {property.baths ?? "N/A"}
                </p>
                <p>Size: {property.size ? `${property.size} sqft` : "N/A"}</p>
                <p>Year: {property.yearBuilt || "N/A"}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

// Define PropTypes for better component usage understanding and validation
PropertyMarkersLayer.propTypes = {
  properties: PropTypes.arrayOf(
    PropTypes.shape({
      propertyID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      _id: PropTypes.string,
      location: PropTypes.shape({
        type: PropTypes.oneOf(["Point"]),
        coordinates: PropTypes.arrayOf(PropTypes.number),
      }),
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      address: PropTypes.string,
      type: PropTypes.string,
      beds: PropTypes.number,
      baths: PropTypes.number,
      size: PropTypes.number,
      yearBuilt: PropTypes.number,
      // Add other expected property fields if needed
    })
  ),
  formatCurrencyForDisplay: PropTypes.func.isRequired,
};

// Set default props
PropertyMarkersLayer.defaultProps = {
  properties: [],
};

export default PropertyMarkersLayer;
