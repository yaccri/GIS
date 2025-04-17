// src/hooks/usePolygonPropertySearch.js
import { useState, useCallback, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { BASE_URL } from "../utils/config";

/**
 * Custom hook to fetch properties within a specific polygon's boundaries.
 * Manages loading state, error state, and the fetched properties for a single fetch operation.
 *
 * @returns {object} An object containing:
 *  - properties {Array<object>}: The array of properties found within the polygon for the last successful fetch.
 *  - isLoading {boolean}: True if properties are currently being fetched by this hook instance.
 *  - error {Error | null}: An error object if the last fetch failed, otherwise null.
 *  - fetchPropertiesForPolygon {function}: A function to trigger the property fetch.
 *      Accepts (polygonId: string | number, polygonGeoJSON: object).
 *      Returns a Promise that resolves to the fetched properties or throws an error.
 */
const usePolygonPropertySearch = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext);
  const token = user?.token;

  /**
   * Fetches properties from the backend API that fall within the given polygon coordinates.
   * @param {string | number} polygonId - An identifier for the polygon (used for logging).
   * @param {object} polygonGeoJSON - A GeoJSON Feature or Geometry object representing the polygon.
   * @returns {Promise<Array<object>>} A promise that resolves to the fetched properties.
   */
  const fetchPropertiesForPolygon = useCallback(
    async (polygonId, polygonGeoJSON) => {
      // --- Input Validation ---
      const polygonCoordinates = polygonGeoJSON?.geometry?.coordinates;
      if (
        !polygonId ||
        !polygonCoordinates ||
        !Array.isArray(polygonCoordinates) ||
        polygonCoordinates.length === 0
      ) {
        console.warn(
          "usePolygonPropertySearch: Missing polygonId or valid GeoJSON coordinates."
        );
        const error = new Error("Invalid polygon data provided for search.");
        setError(error);
        setProperties([]);
        setIsLoading(false);
        throw error;
      }
      if (!token) {
        console.warn("usePolygonPropertySearch: Missing authentication token.");
        const error = new Error(
          "Authentication required to search properties."
        );
        setError(error);
        setProperties([]);
        setIsLoading(false);
        throw error;
      }

      // --- Start Fetch ---
      console.log(
        `usePolygonPropertySearch: Fetching properties for polygon ID: ${polygonId}`
      );
      setIsLoading(true);
      setError(null);

      try {
        const url = `${BASE_URL}/api/properties/in-polygon`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ polygonCoordinates: polygonCoordinates }),
        });

        if (!response.ok) {
          let errorData = {
            error: `Request failed with status ${response.status}`,
          };
          try {
            errorData = await response.json();
          } catch (jsonError) {
            console.error(
              "usePolygonPropertySearch: Could not parse error response JSON.",
              jsonError
            );
          }
          const error = new Error(
            `Fetch failed for polygon ${polygonId}: ${response.statusText} - ${
              errorData?.error || "Unknown server error"
            }`
          );
          throw error;
        }

        const data = await response.json();
        console.log(
          `usePolygonPropertySearch: Found ${data.length} properties for polygon ${polygonId}.`
        );
        setProperties(data || []);
        return data || []; // Return the fetched properties
      } catch (err) {
        console.error(
          `usePolygonPropertySearch: Error fetching properties for polygon ${polygonId}:`,
          err
        );
        setError(err);
        setProperties([]);
        throw err; // Re-throw to allow caller to handle
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  return { properties, isLoading, error, fetchPropertiesForPolygon };
};

export default usePolygonPropertySearch;
