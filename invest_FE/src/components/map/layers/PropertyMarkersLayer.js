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
  // --- Add Logging ---
  console.log(
    "%cPropertyMarkersLayer rendering with properties:",
    "color: purple; font-weight: bold;",
    properties
  );
  // --- End Logging ---

  // Render nothing if the array is empty or not provided
  if (!properties || properties.length === 0) {
    console.log(
      "%cPropertyMarkersLayer rendering null (no properties)",
      "color: gray;"
    );
    return null;
  }

  return (
    <>
      {properties.map((property) => {
        // --- Validation ---
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

        // --- Refined Unique Key Generation ---
        let propertyKey;
        if (property._id) {
          propertyKey = property._id; // Prefer MongoDB _id
        } else if (property.propertyID) {
          propertyKey = `pid-${property.propertyID}`; // Use propertyID if _id is missing
        } else {
          // Fallback - less ideal, use only if necessary
          propertyKey = `prop-${lat.toFixed(6)}-${lon.toFixed(6)}`;
          console.warn(
            `Property missing both _id and propertyID, using fallback key: ${propertyKey}`,
            property
          );
        }
        // --- End Key Generation ---

        // --- Add Logging for Marker ---
        // console.log(`Rendering Marker with key: ${propertyKey}, position: [${lat}, ${lon}]`);
        // --- End Logging ---

        // --- Rendering ---
        return (
          <Marker
            key={propertyKey} // Use the refined key
            position={[lat, lon]} // Leaflet Marker expects [lat, lng]
            icon={createPriceIcon(property.price)} // Use imported icon creator
          >
            <Popup>
              <div className="popup-title">
                {property.address ||
                  `Property ID: ${property.propertyID || "N/A"}`}
              </div>
              <div className="popup-details">
                <p>ID: {property.propertyID || property._id || "N/A"}</p>{" "}
                {/* Show _id if propertyID missing */}
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
      _id: PropTypes.string, // Added _id to prop types
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
    })
  ),
  formatCurrencyForDisplay: PropTypes.func.isRequired,
};

// Set default props
PropertyMarkersLayer.defaultProps = {
  properties: [],
};

export default PropertyMarkersLayer;
