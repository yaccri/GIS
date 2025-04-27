// src/hooks/useActiveShapeDetails.js
import { useState, useCallback } from "react";

/**
 * Custom hook to manage the state for the currently "active" or selected drawn shape.
 * This is typically used to display details of a specific shape in a UI element like a sidebar.
 *
 * @param {object|null} initialActiveShape - Optional initial shape to set as active. Defaults to null.
 * @returns {object} An object containing:
 *   - activeShape {object|null}: The currently active shape data object, or null if none is active.
 *   - showDetails {function}: Callback to set a shape as active. Accepts the shape data object.
 *   - hideDetails {function}: Callback to clear the active shape (sets it to null).
 */
const useActiveShapeDetails = (initialActiveShape = null) => {
  const [activeShape, setActiveShape] = useState(initialActiveShape);

  /**
   * Sets the provided shape data object as the currently active shape.
   * @param {object} shapeData - The data object of the shape to make active.
   */
  const showDetails = useCallback((shapeData) => {
    // Basic validation: ensure we're setting an object or null
    if (shapeData && typeof shapeData === "object") {
      setActiveShape(shapeData);
    } else {
      console.warn(
        "Attempted to show details for invalid or null shape data:",
        shapeData
      );
      // Optionally clear if invalid data is passed, or just do nothing
      // setActiveShape(null);
    }
  }, []); // No dependencies needed as it only uses the setter

  /**
   * Clears the currently active shape, setting it back to null.
   */
  const hideDetails = useCallback(() => {
    setActiveShape(null);
  }, []); // No dependencies needed

  return {
    activeShape,
    showDetails,
    hideDetails,
    // Exposing the raw setter is optional, but show/hide are generally preferred for encapsulation
    // setActiveShape,
  };
};

export default useActiveShapeDetails;
