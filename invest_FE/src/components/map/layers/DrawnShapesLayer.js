// src/components/map/layers/DrawnShapesLayer.js
import React from "react";
import { Polygon } from "react-leaflet";
import PropTypes from "prop-types";

/**
 * Renders a collection of drawn polygons or rectangles on the map.
 *
 * @param {object} props
 * @param {Array<object>} props.drawnShapes - An array of shape objects, each expected to have an `id` and `coordinates` (array of [lat, lng]).
 */
const DrawnShapesLayer = ({ drawnShapes }) => {
  // Render nothing if the array is empty or not provided
  if (!drawnShapes || drawnShapes.length === 0) {
    return null;
  }

  // Define the appearance of the drawn shapes
  const pathOptions = {
    color: "#3388ff", // Blue
    weight: 3,
    fillOpacity: 0.2,
  };

  return (
    <>
      {drawnShapes.map((shape) => {
        // Ensure coordinates exist and are in the expected format [[lat, lng], ...]
        // The useDrawnShapes hook stores coordinates in this format.
        if (!shape.coordinates || !Array.isArray(shape.coordinates)) {
          console.warn("Skipping shape with invalid coordinates:", shape);
          return null;
        }

        // Leaflet Polygon expects positions as [[lat, lng], ...]
        const latLngs = shape.coordinates.map((coord) => [coord[0], coord[1]]);

        // Use shape.id which should be unique (generated by L.Util.stamp or similar)
        return (
          <Polygon
            key={shape.id}
            positions={latLngs}
            pathOptions={pathOptions}
            // Optional: Add event handlers if needed later (e.g., onClick)
            // eventHandlers={{
            //   click: () => {
            //     console.log(`Clicked shape ID: ${shape.id}`);
            //     // Potentially call a function passed via props
            //   },
            // }}
          />
        );
      })}
    </>
  );
};

// Define PropTypes for better component usage understanding and validation
DrawnShapesLayer.propTypes = {
  drawnShapes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      coordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
        .isRequired,
      // Include other expected properties if necessary (e.g., type, area, center)
      type: PropTypes.string,
      area: PropTypes.number,
      center: PropTypes.object,
      geoJSON: PropTypes.object,
    })
  ),
};

// Set default props
DrawnShapesLayer.defaultProps = {
  drawnShapes: [],
};

export default DrawnShapesLayer;
