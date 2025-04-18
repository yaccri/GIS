// src/components/map/layers/PropertyMarkersLayer.js
import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet"; // Import Leaflet directly
import PropTypes from "prop-types";
import { createPriceIcon } from "../utils/mapIconUtils";

/**
 * Renders Markers with price icons and popups for property search results.
 * MANAGES LEAFLET LAYERS IMPERATIVELY due to reconciliation issues.
 *
 * @param {object} props
 * @param {Array<object>} props.properties - Array of property objects from search results.
 * @param {function} props.formatCurrencyForDisplay - Function to format currency values.
 */
const PropertyMarkersLayer = ({ properties, formatCurrencyForDisplay }) => {
  const map = useMap(); // Get the Leaflet map instance
  const markersRef = useRef(new Map()); // Use a Map to store markers: { propertyKey => L.Marker instance }

  useEffect(() => {
    console.log(
      "%cPropertyMarkersLayer EFFECT running. Properties count:",
      "color: green; font-weight: bold;",
      properties.length
    );

    const currentMarkers = markersRef.current;
    const newPropertyKeys = new Set(); // Keep track of keys in the current props

    // --- Add or Update Markers ---
    properties.forEach((property) => {
      // --- Validation (same as before) ---
      if (
        !property.location?.type === "Point" ||
        !Array.isArray(property.location.coordinates) ||
        property.location.coordinates.length !== 2
      ) {
        console.warn(
          "Skipping property with invalid location structure:",
          property
        );
        return;
      }
      const lon = property.location.coordinates[0];
      const lat = property.location.coordinates[1];
      if (
        typeof lat !== "number" ||
        typeof lon !== "number" ||
        isNaN(lat) ||
        isNaN(lon)
      ) {
        console.warn("Skipping property with invalid coordinates:", property);
        return;
      }

      // --- Consistent Key Generation (same as before) ---
      let propertyKey;
      if (property._id) propertyKey = property._id;
      else if (property.propertyID) propertyKey = `pid-${property.propertyID}`;
      else propertyKey = `prop-${lat.toFixed(6)}-${lon.toFixed(6)}`;

      newPropertyKeys.add(propertyKey); // Add key to the set for the current props

      // --- Check if marker already exists ---
      if (!currentMarkers.has(propertyKey)) {
        // Marker doesn't exist, create and add it
        console.log(`%cADDING Marker: ${propertyKey}`, "color: blue");
        const marker = L.marker([lat, lon], {
          icon: createPriceIcon(property.price),
        });

        // Create Popup Content (similar to before)
        const popupContent = `
          <div class="leaflet-popup-content-wrapper">
            <div class="leaflet-popup-content">
              <div class="popup-title">${
                property.address ||
                `Property ID: ${property.propertyID || "N/A"}`
              }</div>
              <div class="popup-details">
                <p>ID: ${property.propertyID || property._id || "N/A"}</p>
                <p>Price: ${formatCurrencyForDisplay(property.price)}</p>
                <p>Type: ${property.type || "N/A"}</p>
                <p>Beds: ${property.beds ?? "N/A"} | Baths: ${
          property.baths ?? "N/A"
        }</p>
                <p>Size: ${property.size ? `${property.size} sqft` : "N/A"}</p>
                <p>Year: ${property.yearBuilt || "N/A"}</p>
              </div>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);

        marker.addTo(map); // Add marker directly to the map
        currentMarkers.set(propertyKey, marker); // Store the marker instance
      } else {
        // Marker exists, potentially update icon/popup if needed (optional)
        // For now, we assume if it exists, it's up-to-date for this example
        // console.log(`Marker already exists: ${propertyKey}`);
      }
    });

    // --- Remove Markers ---
    // Iterate through the markers currently on the map (stored in ref)
    currentMarkers.forEach((marker, key) => {
      if (!newPropertyKeys.has(key)) {
        // If a stored marker's key is NOT in the new set of properties, remove it
        console.log(`%cREMOVING Marker: ${key}`, "color: red");
        map.removeLayer(marker); // Remove marker from the map
        currentMarkers.delete(key); // Remove from our reference map
      }
    });

    // This effect depends directly on the properties array content and the map instance
  }, [properties, map, formatCurrencyForDisplay]); // Add dependencies

  // --- Cleanup Function ---
  useEffect(() => {
    // This function runs when the component unmounts
    return () => {
      console.log(
        "%cPropertyMarkersLayer UNMOUNTING - Cleaning up markers",
        "color: orange"
      );
      markersRef.current.forEach((marker) => {
        map.removeLayer(marker); // Remove all markers managed by this instance
      });
      markersRef.current.clear(); // Clear the reference map
    };
  }, [map]); // Depend only on map for cleanup

  // This component now manages layers directly, so it doesn't render React-Leaflet components
  return null;
};

// --- PropTypes remain the same ---
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
    })
  ),
  formatCurrencyForDisplay: PropTypes.func.isRequired,
};

PropertyMarkersLayer.defaultProps = {
  properties: [],
};

export default PropertyMarkersLayer;
