// src/hooks/useRadiusSearch.js
import { useState, useEffect, useCallback } from "react";
import { searchPropertiesInRadius } from "../components/SearchRadius"; // Assuming this path is correct

/**
 * Custom hook to manage the state and logic for radius-based property searches.
 *
 * @returns {object} An object containing:
 *   - results {Array}: The array of property results.
 *   - isLoading {boolean}: Indicates if a search is in progress.
 *   - error {string|null}: Any error message from the search.
 *   - searchRadius {number}: The current search radius.
 *   - setSearchRadius {function}: Function to update the search radius.
 *   - triggerSearch {function}: Function to trigger the search with given parameters.
 *   - isSearching {boolean}: Alias for isLoading.
 */
const useRadiusSearch = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(0);

  // Define the search function using useCallback for stability
  const triggerSearch = useCallback(async (centerCoordinates, radius, token) => {
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
  }, []); // No dependencies needed as we pass all required data

  return {
    results,
    isLoading,
    error,
    searchRadius,
    setSearchRadius,
    triggerSearch,
    isSearching: isLoading
  };
};

export default useRadiusSearch;
