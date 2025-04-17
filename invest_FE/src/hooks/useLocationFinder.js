// src/hooks/useLocationFinder.js
import { useState, useCallback, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { BASE_URL, MAP_URL } from "../utils/config";

/**
 * Custom hook to find location details (reverse geocode) and the corresponding neighborhood boundary.
 * Manages loading state, error state, and the fetched location/neighborhood information.
 *
 * @returns {object} An object containing:
 *  - locationDetails {object | null}: GeoJSON Feature object for the found location (or temporary point).
 *  - neighborhoodInfo {object | null}: GeoJSON Feature object for the found neighborhood boundary.
 *  - isLoading {boolean}: True if location/neighborhood details are currently being fetched.
 *  - error {Error | null}: An error object if the last fetch failed, otherwise null.
 *  - findLocationDetails {function}: A function to trigger the search for a given lat/lng.
 *      Accepts (lat: number, lng: number).
 */
const useLocationFinder = () => {
  const [locationDetails, setLocationDetails] = useState(null);
  const [neighborhoodInfo, setNeighborhoodInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext);
  const token = user?.token;

  /**
   * Fetches reverse geocoding details from Nominatim and the corresponding neighborhood
   * boundary from the backend API based on latitude and longitude.
   * @param {number} lat - Latitude.
   * @param {number} lng - Longitude.
   */
  const findLocationDetails = useCallback(
    async (lat, lng) => {
      if (typeof lat !== "number" || typeof lng !== "number") {
        const errMsg = "Invalid latitude or longitude provided.";
        console.warn("useLocationFinder:", errMsg);
        setError(new Error(errMsg));
        setLocationDetails(null);
        setNeighborhoodInfo(null);
        setIsLoading(false);
        return;
      }

      console.log(`useLocationFinder: Finding details for ${lat}, ${lng}`);
      setIsLoading(true);
      setError(null);
      setLocationDetails(null); // Clear previous details
      setNeighborhoodInfo(null); // Clear previous neighborhood

      // Set temporary location details for immediate feedback
      const tempPointGeoJSON = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: {
          name: `Loading... (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        },
      };
      setLocationDetails(tempPointGeoJSON);

      let fetchedNominatimDetails = tempPointGeoJSON;
      let nominatimError = null;
      let neighborhoodError = null;

      try {
        // --- Fetch Nominatim Details ---
        try {
          const nominatimUrl = `${MAP_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`;
          const response = await fetch(nominatimUrl);
          if (!response.ok)
            throw new Error(`Nominatim fetch failed: ${response.statusText}`);
          const data = await response.json();
          fetchedNominatimDetails = {
            type: "Feature",
            geometry: { type: "Point", coordinates: [lng, lat] },
            properties: {
              name:
                data.display_name ||
                `Point at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              type: data.type || "unknown",
              osm_id: data.osm_id || null,
              address: data.address || {},
              clickTime: new Date().toISOString(),
            },
          };
        } catch (err) {
          console.error(
            "useLocationFinder: Error fetching location details from Nominatim:",
            err
          );
          nominatimError = err; // Store Nominatim specific error
          fetchedNominatimDetails = {
            ...tempPointGeoJSON,
            properties: {
              ...tempPointGeoJSON.properties,
              name: `Point at ${lat.toFixed(6)}, ${lng.toFixed(
                6
              )} (details fetch failed)`,
            },
          };
        } finally {
          setLocationDetails(fetchedNominatimDetails); // Update with fetched or error state
        }

        // --- Fetch Neighborhood Boundary (requires token) ---
        if (token) {
          try {
            const neighborhoodUrl = `${BASE_URL}/api/neighborhoods/by-coords?lat=${lat}&lon=${lng}`;
            const neighborhoodResponse = await fetch(neighborhoodUrl, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (neighborhoodResponse.ok) {
              const neighborhoodData = await neighborhoodResponse.json();
              setNeighborhoodInfo(neighborhoodData); // Set neighborhood GeoJSON Feature
              console.log(
                "useLocationFinder: Neighborhood found:",
                neighborhoodData?.properties?.name
              );
            } else if (neighborhoodResponse.status === 404) {
              console.log(
                "useLocationFinder: No neighborhood found for these coordinates."
              );
              setNeighborhoodInfo(null); // Explicitly set to null if not found
            } else {
              throw new Error(
                `Neighborhood fetch failed: ${neighborhoodResponse.statusText}`
              );
            }
          } catch (err) {
            console.error(
              "useLocationFinder: Error fetching neighborhood boundary:",
              err
            );
            neighborhoodError = err; // Store neighborhood specific error
            setNeighborhoodInfo(null); // Ensure null on error
          }
        } else {
          console.warn(
            "useLocationFinder: No token available, skipping neighborhood fetch."
          );
          setNeighborhoodInfo(null);
        }

        // Set overall error state if either fetch failed
        if (nominatimError || neighborhoodError) {
          setError(nominatimError || neighborhoodError); // Prioritize Nominatim error message if both failed
        }
      } catch (overallError) {
        // Catch any unexpected errors during the process
        console.error("useLocationFinder: Unexpected error:", overallError);
        setError(overallError);
        // Ensure states are cleared on unexpected error
        setLocationDetails(fetchedNominatimDetails); // Keep potentially failed Nominatim details
        setNeighborhoodInfo(null);
      } finally {
        setIsLoading(false); // Ensure loading is set to false
      }
    },
    [token]
  ); // Dependency on token

  return {
    locationDetails,
    neighborhoodInfo,
    isLoading,
    error,
    findLocationDetails,
  };
};

export default useLocationFinder;
