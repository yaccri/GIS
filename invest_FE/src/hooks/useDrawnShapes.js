// src/hooks/useDrawnShapes.js
import { useState, useCallback } from "react";

/**
 * Custom hook to manage the state and logic for drawn map shapes (polygons/rectangles).
 *
 * @returns {object} An object containing:
 *   - shapes {Array}: The array of drawn shape data objects.
 *   - addShape {function}: Callback to add a new shape.
 *   - deleteShape {function}: Callback to delete a shape by its ID.
 *   - clearShapes {function}: Callback to remove all shapes.
 */
const useDrawnShapes = (initialShapes = []) => {
  const [shapes, setShapes] = useState(initialShapes);

  /**
   * Adds a new shape object to the list.
   * Expects shapeData to have at least an 'id' property.
   */
  const addShape = useCallback((shapeData) => {
    if (!shapeData || typeof shapeData.id === "undefined") {
      console.error("Cannot add shape without an ID:", shapeData);
      return;
    }
    setShapes((prevShapes) => [...prevShapes, shapeData]);
  }, []); // No dependencies needed as it only uses setShapes

  /**
   * Deletes a shape from the list based on its ID.
   */
  const deleteShape = useCallback((shapeId) => {
    setShapes((prevShapes) =>
      prevShapes.filter((shape) => shape.id !== shapeId)
    );
  }, []); // No dependencies needed

  /**
   * Removes all shapes from the list.
   */
  const clearShapes = useCallback(() => {
    setShapes([]);
  }, []); // No dependencies needed

  return {
    shapes,
    addShape,
    deleteShape,
    clearShapes,
  };
};

export default useDrawnShapes;
