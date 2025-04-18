// src/hooks/useNeighborhoodPropertySearch.js
import { useState, useCallback, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { BASE_URL } from "../utils/config";

/**
 * Custom hook to fetch properties within a specific neighborhood.
 * Manages loading state, error state, and the fetched properties for neighborhood searches.
 *
 * @returns {object} An object containing:
 *  - neighborhoodProperties {Array<object>}: The array of properties found for the last successful search.
 *  - isLoading {boolean}: True if properties are currently being fetched by this hook.
 *  - error {Error | null}: An error object if the last fetch failed, otherwise null.
 *  - searchNeighborhood {function}: A function to trigger the property search for a given neighborhood ID.
 *      Accepts (neighborhoodId: string).
 */
const useNeighborhoodPropertySearch = () => {
  const [neighborhoodProperties, setNeighborhoodProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext); // Get user context to access the token
  const token = user?.token;

  /**
   * Fetches properties from the backend API that belong to the given neighborhood ID.
   * @param {string} neighborhoodId - The unique identifier for the neighborhood.
   */
  const searchNeighborhood = useCallback(
    async (neighborhoodId) => {
      // --- Input Validation ---
      if (!neighborhoodId) {
        const errMsg = "Neighborhood ID is required to search.";
        console.warn("useNeighborhoodPropertySearch:", errMsg);
        setError(new Error(errMsg));
        setNeighborhoodProperties([]); // Clear previous results
        setIsLoading(false);
        return; // Exit early
      }
      if (!token) {
        const errMsg =
          "Authentication required to search neighborhood properties.";
        console.warn("useNeighborhoodPropertySearch:", errMsg);
        setError(new Error(errMsg));
        setNeighborhoodProperties([]);
        setIsLoading(false);
        return; // Exit early
      }

      // --- Start Fetch ---
      console.log(
        `useNeighborhoodPropertySearch: Fetching properties for neighborhood ID: ${neighborhoodId}`
      );
      setIsLoading(true);
      setError(null); // Clear previous errors
      setNeighborhoodProperties([]); // Clear previous results before new fetch

      try {
        const url = `${BASE_URL}/api/properties/in-neighborhood?neighborhoodId=${neighborhoodId}`;
        const response = await fetch(url, {
          method: "GET", // Assuming GET request for this endpoint
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // --- Handle Non-OK Responses ---
        if (!response.ok) {
          let errorData = {
            error: `Request failed with status ${response.status}`,
          };
          try {
            errorData = await response.json();
          } catch (jsonError) {
            /* ignore json parsing error */
          }
          throw new Error(
            `Fetch failed for neighborhood ${neighborhoodId}: ${
              response.statusText
            } - ${errorData?.error || "Unknown server error"}`
          );
        }

        // --- Handle OK Response ---
        const data = await response.json();
        console.log(
          `useNeighborhoodPropertySearch: Found ${data.length} properties for neighborhood ${neighborhoodId}.`
        );
        setNeighborhoodProperties(data || []); // Update state with fetched properties
      } catch (err) {
        // --- Handle Fetch Errors (Network, Parsing, Thrown Errors) ---
        console.error(
          `useNeighborhoodPropertySearch: Error fetching properties for neighborhood ${neighborhoodId}:`,
          err
        );
        setError(err); // Set error state
        setNeighborhoodProperties([]); // Ensure properties are cleared on error
      } finally {
        // --- Always run after try/catch ---
        setIsLoading(false); // Ensure loading is set to false regardless of outcome
      }
    },
    [token]
  ); // Dependency: Re-create this function if the token changes

  // --- Return state and the search function ---
  return { neighborhoodProperties, isLoading, error, searchNeighborhood };
};

export default useNeighborhoodPropertySearch;
