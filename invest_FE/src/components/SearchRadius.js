// This module exports a function that searches properties within a radius.
// It replicates the behavior of the original code in Map.js.

/**
 * Searches for properties within a specified radius of given coordinates.
 * Requires an authentication token.
 *
 * @param {Array<number>} coordinates - The coordinates [longitude, latitude] for the center of the search.
 * @param {number} radius - The search radius in miles.
 * @param {string | null} token - The authentication token (JWT).
 * @returns {Promise<Array<object> | null>} A promise that resolves to an array of property objects or null if the search cannot be performed or fails.
 */
import { BASE_URL } from "../utils/config";
export const searchPropertiesInRadius = async (coordinates, radius, token) => {
  console.log("starting searchPropertiesInRadius");
  // Only search if we have a location, radius, and a token
  if (!coordinates || radius <= 0) {
    console.warn("Search requires coordinates and a positive radius.");
    return null; // Indicate search cannot be performed
  }
  if (!token) {
    console.warn(
      "Authentication token is missing. Cannot perform radius search."
    );
    // Potentially handle this by redirecting to login or showing a message
    return null; // Indicate search cannot be performed due to auth
  }

  try {
    // Note: GeoJSON is [lon, lat]
    const lat = coordinates[1];
    const lon = coordinates[0];

    // API call with Authorization header
    const response = await fetch(
      `${BASE_URL}/api/properties/radius?lat=${lat}&lon=${lon}&radius=${radius}`,
      {
        method: "GET", // Explicitly state method (good practice)
        headers: {
          Authorization: `Bearer ${token}`, // Add the Authorization header
          "Content-Type": "application/json", // Standard header
        },
      }
    );

    // Handle specific authentication errors
    if (response.status === 401 || response.status === 403) {
      console.error("Authentication failed for radius search.");
      // Optionally, trigger a logout or token refresh mechanism here
      throw new Error(`Authentication failed: ${response.status}`);
    }

    if (!response.ok) {
      // Throw an error for other non-successful responses
      throw new Error(
        `Failed to fetch properties in radius: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(
      `Found ${data.length} properties within ${radius} miles of [${lat}, ${lon}]`
    );
    return data;
  } catch (error) {
    console.error("Error searching properties in radius:", error);
    // Return null or an empty array to indicate failure, avoid dummy data in production
    return null; // Or return [];
    /*
    // Keep dummy results only for extreme debugging/offline cases
    const dummyResults = [
      { id: 1, title: 'Demo Property 1', price: '$450,000', location: 'Near search area' },
      { id: 2, title: 'Demo Property 2', price: '$320,000', location: 'Inside radius' },
      { id: 3, title: 'Demo Property 3', price: '$550,000', location: 'Within search radius' }
    ];
    return dummyResults;
    */
  }
};
