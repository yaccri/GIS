// utils/geoQueryUtils.js
const mongoose = require("mongoose");
const HttpStatus = require("http-status-codes");
const Neighborhood = require("../models/neighborhood");

// Custom Error class for clearer error handling in routes (optional but good)
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
}

/**
 * Validates neighborhoodId, fetches neighborhood, and returns a $geoWithin filter.
 * Throws HttpError on validation/fetch failure.
 * @param {string} neighborhoodId - The neighborhood ID from the request query.
 * @returns {Promise<object>} - The MongoDB geospatial filter object.
 */
const getGeoFilterForNeighborhood = async (neighborhoodId) => {
  // 1. Validate Input
  if (!neighborhoodId) {
    throw new HttpError(
      HttpStatus.StatusCodes.BAD_REQUEST,
      "Missing required query parameter: neighborhoodId"
    );
  }
  if (!mongoose.Types.ObjectId.isValid(neighborhoodId)) {
    throw new HttpError(
      HttpStatus.StatusCodes.BAD_REQUEST,
      "Invalid neighborhoodId format"
    );
  }

  // 2. Find the Neighborhood to get its geometry
  const neighborhood = await Neighborhood.findById(neighborhoodId).lean(); // Use lean
  if (!neighborhood) {
    throw new HttpError(
      HttpStatus.StatusCodes.NOT_FOUND,
      "Neighborhood not found with the provided ID."
    );
  }
  if (!neighborhood.geometry) {
    console.error(
      `Neighborhood ${neighborhoodId} found but missing geometry data.`
    );
    // Treat incomplete data as an internal error preventing the search
    throw new HttpError(
      HttpStatus.StatusCodes.INTERNAL_SERVER_ERROR,
      "Neighborhood data is incomplete (missing geometry)."
    );
  }

  // 3. Build and return the geospatial filter
  return {
    location: {
      $geoWithin: {
        $geometry: neighborhood.geometry,
      },
    },
  };
};

/**
 * Validates lat, lon, radius and returns a $nearSphere filter.
 * Throws HttpError on validation failure.
 * @param {string} lat - Latitude from request query.
 * @param {string} lon - Longitude from request query.
 * @param {string} radius - Radius in miles from request query.
 * @returns {object} - The MongoDB geospatial filter object.
 */
const getGeoFilterForRadius = (lat, lon, radius) => {
  // 1. Validate inputs
  if (!lat || !lon || !radius) {
    throw new HttpError(
      HttpStatus.StatusCodes.BAD_REQUEST,
      "Missing parameters: lat, lon, and radius (in miles) are required"
    );
  }

  // 2. Convert and validate numbers
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  const radiusInMiles = parseFloat(radius);

  if (
    isNaN(latitude) ||
    isNaN(longitude) ||
    isNaN(radiusInMiles) ||
    radiusInMiles <= 0
  ) {
    throw new HttpError(
      HttpStatus.StatusCodes.BAD_REQUEST,
      "Invalid parameters: lat, lon must be numbers, radius must be a positive number"
    );
  }

  // 3. Build and return the geospatial filter
  return {
    location: {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude], // MongoDB uses [longitude, latitude]
        },
        // Convert miles to meters for $maxDistance
        $maxDistance: radiusInMiles * 1609.34,
      },
    },
  };
};

/**
 * Validates polygonCoordinates and returns a $geoWithin filter.
 * Throws HttpError on validation failure.
 * @param {Array} polygonCoordinates - The coordinates array from the request body.
 * @returns {object} - The MongoDB geospatial filter object.
 */
const getGeoFilterForPolygon = (polygonCoordinates) => {
  // 1. Validate Polygon Input from body
  if (
    !polygonCoordinates ||
    !Array.isArray(polygonCoordinates) ||
    polygonCoordinates.length === 0 ||
    !Array.isArray(polygonCoordinates[0]) ||
    polygonCoordinates[0].length < 4 // Need at least 4 points for a closed polygon (first=last)
  ) {
    throw new HttpError(
      HttpStatus.StatusCodes.BAD_REQUEST,
      "Invalid 'polygonCoordinates' in request body. Expected an array of coordinate arrays, e.g., [[[lng, lat], ...]]."
    );
  }
  // Check if the polygon is closed
  const outerRing = polygonCoordinates[0];
  if (
    outerRing[0][0] !== outerRing[outerRing.length - 1][0] ||
    outerRing[0][1] !== outerRing[outerRing.length - 1][1]
  ) {
    throw new HttpError(
      HttpStatus.StatusCodes.BAD_REQUEST,
      "Invalid polygon: The first and last coordinates of the outer ring must be identical."
    );
  }

  // 2. Construct GeoJSON Polygon Geometry for Query
  const polygonGeometry = {
    type: "Polygon",
    coordinates: polygonCoordinates,
  };

  // 3. Build and return the geospatial filter
  return {
    location: {
      $geoWithin: {
        $geometry: polygonGeometry,
      },
    },
  };
};

module.exports = {
  getGeoFilterForNeighborhood,
  getGeoFilterForRadius,
  getGeoFilterForPolygon,
  HttpError, // Export error class if used
};
