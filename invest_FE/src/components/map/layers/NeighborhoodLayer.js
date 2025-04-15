// src/components/map/layers/NeighborhoodLayer.js
import React, { useMemo } from "react";
import { GeoJSON, Marker } from "react-leaflet";
import L from "leaflet";
import { createNeighborhoodLabelIcon } from "../utils/mapIconUtils";

/**
 * Renders the GeoJSON polygon and a centered label for a clicked neighborhood.
 *
 * @param {object} props
 * @param {object|null} props.clickedNeighborhood - The GeoJSON Feature object representing the neighborhood, including geometry and properties (like name, _id).
 */
const NeighborhoodLayer = ({ clickedNeighborhood }) => {
  // Calculate the center only when the neighborhood data changes
  const neighborhoodCenter = useMemo(() => {
    if (!clickedNeighborhood?.geometry) {
      return null;
    }
    try {
      // Use Leaflet's GeoJSON layer utility to calculate bounds and center
      const geoJsonLayer = L.geoJSON(clickedNeighborhood.geometry);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        return bounds.getCenter(); // Returns Leaflet LatLng object
      }
      return null; // Return null if bounds are invalid
    } catch (e) {
      console.error("Could not calculate neighborhood center:", e);
      return null; // Return null on error
    }
  }, [clickedNeighborhood]); // Dependency: Recalculate only if clickedNeighborhood changes

  // Render nothing if there's no valid neighborhood data or geometry
  if (!clickedNeighborhood?.geometry) {
    return null;
  }

  const neighborhoodId = clickedNeighborhood._id || "neighborhood"; // Use ID or fallback

  return (
    <>
      {/* Neighborhood Polygon */}
      <GeoJSON
        key={`${neighborhoodId}-poly`} // Unique key for the polygon
        data={clickedNeighborhood.geometry} // GeoJSON geometry object
        style={{
          color: "#ff7800", // Orange
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.15,
        }}
      />

      {/* Neighborhood Label (only render if center calculation was successful) */}
      {neighborhoodCenter && clickedNeighborhood.name && (
        <Marker
          key={`${neighborhoodId}-label`} // Unique key for the label
          position={neighborhoodCenter} // Expects Leaflet LatLng or [lat, lng]
          icon={createNeighborhoodLabelIcon(clickedNeighborhood.name)}
          interactive={false} // Label should not be clickable itself
        />
      )}
    </>
  );
};

export default NeighborhoodLayer;
