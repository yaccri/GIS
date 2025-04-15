// src/components/map/AdjustZoomOnRadiusChange.js
import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * A React component that automatically adjusts the map's zoom and center
 * to fit a circle defined by a center coordinate and radius.
 * It uses the useMap hook and should be placed inside a MapContainer.
 *
 * @param {object} props
 * @param {Array<number>|null} props.centerCoords - The center coordinates as [latitude, longitude].
 * @param {number} props.radius - The radius in miles.
 */
function AdjustZoomOnRadiusChange({ centerCoords, radius }) {
  const map = useMap();

  useEffect(() => {
    // Only proceed if we have a map instance, valid center coordinates, and a positive radius
    if (map && centerCoords && radius > 0) {
      try {
        const radiusInMeters = radius * 1609.34; // Convert miles to meters
        const centerLatLng = L.latLng(centerCoords[0], centerCoords[1]); // Create Leaflet LatLng object [lat, lng]

        // Use latLng.toBounds() to calculate the bounding box directly
        const bounds = centerLatLng.toBounds(radiusInMeters);

        // Ensure the bounds are valid before trying to fit
        if (bounds.isValid()) {
          console.log("Attempting flyToBounds for radius:", bounds); // Debug log

          // 1. Stop any existing map movement/animation
          map.stop();

          // 2. Use flyToBounds for a smoother transition
          map.flyToBounds(bounds, {
            padding: [50, 50],
            duration: 0.75, // Duration in seconds
            easeLinearity: 0.25, // Controls the easing
            // 'animate: true' is implicit in flyToBounds
          });
        } else {
          console.warn(
            "Calculated bounds (using toBounds) for radius circle are invalid."
          );
        }
      } catch (error) {
        console.error("Error adjusting zoom for radius:", error);
      }
    }
    // If radius is 0 or no center, we don't adjust zoom here.
  }, [map, centerCoords, radius]); // Re-run effect if map, center, or radius changes

  return null; // This component does not render anything itself
}

export default AdjustZoomOnRadiusChange;
