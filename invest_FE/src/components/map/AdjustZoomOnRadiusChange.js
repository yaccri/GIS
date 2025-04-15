// src/components/map/AdjustZoomOnRadiusChange.js
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * A React component that automatically adjusts the map's zoom and center
 * when the search radius changes. It calculates the zoom level needed to
 * fit the circle and then zooms out slightly for better context.
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

        // Ensure centerCoords is in [lat, lng] format for L.latLng
        if (Array.isArray(centerCoords) && centerCoords.length === 2) {
          const centerLatLng = L.latLng(centerCoords[0], centerCoords[1]); // Create Leaflet LatLng object [lat, lng]

          // Calculate the bounding box for the circle
          const bounds = centerLatLng.toBounds(radiusInMeters);

          // Ensure the bounds are valid
          if (bounds.isValid()) {
            // 1. Calculate the zoom level that would perfectly fit the bounds
            const zoomLevelThatFits = map.getBoundsZoom(bounds);

            // --- ADJUSTMENT: Zoom out slightly ---
            // Subtract 1 zoom level from the calculated level.
            // This provides a more consistent visual "zoom out" across different radius sizes
            // compared to fixed pixel padding which has varying geographic meaning at different zooms.
            // Ensure the target zoom doesn't go below the map's minimum zoom level.
            const zoomAdjustment = 1; // <--- TRY ADJUSTING THIS VALUE (e.g., 1, 1.5, 2) if needed
            const targetZoom = Math.max(
              map.getMinZoom() || 1,
              zoomLevelThatFits - zoomAdjustment
            );
            // --- END ADJUSTMENT ---

            console.log(
              `Adjusting zoom for radius ${radius}mi. Calculated fit zoom: ${zoomLevelThatFits}, Target zoom: ${targetZoom}`
            );

            // 2. Stop any existing map movement
            map.stop();

            // 3. Use flyTo to center on the location and apply the adjusted zoom level
            map.flyTo(centerLatLng, targetZoom, {
              duration: 0.75, // Animation duration
            });
          } else {
            console.warn(
              "Calculated bounds (using toBounds) for radius circle are invalid."
            );
          }
        } else {
          console.warn(
            "Invalid centerCoords provided to AdjustZoomOnRadiusChange:",
            centerCoords
          );
        }
      } catch (error) {
        console.error("Error adjusting zoom for radius:", error);
      }
    }
    // No action needed if radius is 0 or no center is provided
  }, [map, centerCoords, radius]); // Re-run effect if map, center, or radius changes

  return null; // This component does not render anything itself
}

export default AdjustZoomOnRadiusChange;
