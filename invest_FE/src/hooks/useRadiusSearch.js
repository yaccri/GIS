// src/hooks/useRadiusSearch.js
import { useState, useEffect, useCallback } from "react";
import { searchPropertiesInRadius } from "../components/SearchRadius"; // Assuming this path is correct

/**
 * Custom hook to manage the state and logic for radius-based property searches.
 *
 * @param {Array|null} centerCoordinates - The center coordinates for the search [lng, lat] or null.
 * @param {number} radius - The search radius in miles.
 * @param {string|null} token - The user authentication token.
 * @returns {object} An object containing:
 *   - results {Array}: The array of property results.
 *   - isLoading {boolean}: Indicates if a search is in progress.
 *   - error {string|null}: Any error message from the search.
 *   - triggerSearch {function}: A function to manually trigger the search (optional, primarily uses useEffect).
 */
const useRadiusSearch = (centerCoordinates, radius, token) => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Define the search function using useCallback for stability
  const triggerSearch = useCallback(async () => {
    // Validate inputs before proceeding
    if (!centerCoordinates || radius <= 0 || !token) {
      setResults([]); // Clear results if inputs are invalid
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      // centerCoordinates is already [lng, lat] as needed by searchPropertiesInRadius
      const fetchedResults = await searchPropertiesInRadius(
        centerCoordinates,
        radius,
        token
      );
      setResults(fetchedResults || []); // Ensure results is always an array
    } catch (err) {
      console.error("Error fetching properties in radius:", err);
      setError(
        err.message || "Failed to fetch properties within the specified radius."
      );
      setResults([]); // Clear results on error
    } finally {
      setIsLoading(false);
    }
  }, [centerCoordinates, radius, token]); // Dependencies for the search logic

  // Automatically trigger search when center, radius, or token changes
  useEffect(() => {
    // Only trigger if we have valid coordinates and a radius > 0
    if (centerCoordinates && radius > 0 && token) {
      triggerSearch();
    } else {
      // Clear results if conditions aren't met (e.g., radius set to 0, location cleared)
      setResults([]);
      setIsLoading(false);
      setError(null);
    }
    // The effect depends on the triggerSearch function, which itself
    // depends on centerCoordinates, radius, and token.
  }, [triggerSearch, centerCoordinates, radius, token]);

  return {
    results,
    isLoading,
    error,
    // Expose triggerSearch if manual re-triggering might be needed elsewhere,
    // though the useEffect handles the primary use case.
    // triggerSearch
  };
};

export default useRadiusSearch;
