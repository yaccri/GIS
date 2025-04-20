// routes/authProperty.js
const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const Neighborhood = require("../models/neighborhood");
const mongoose = require("mongoose");
const HttpStatus = require("http-status-codes");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const { buildPropertyFilter } = require("../utils/queryBuilder"); // Import the builder function

const DEFAULT_GEO_LIMIT = 50;

// GET /api/properties - Get all or filtered properties
// No try...catch needed due to express-async-errors
router.get("/", verifyToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  console.log("Received query parameters:", req.query);

  const filterQuery = buildPropertyFilter(req.query);

  console.log("Executing find with filter:", filterQuery);
  const properties = await Property.find(filterQuery).skip(skip).limit(limit);
  const totalProperties = await Property.countDocuments(filterQuery);
  const totalPages = Math.ceil(totalProperties / limit);

  res.status(HttpStatus.StatusCodes.OK).json({ properties, totalPages });
});

//---------------------------------------------------------------------------------
// GET /api/properties/property/:id - Get a single property by ID
router.get("/property/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const parsedID = parseInt(id);
  if (isNaN(parsedID)) {
    // Specific validation error, handled directly
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: `Invalid propertyID format: ${id}` });
  }
  const property = await Property.findOne({ propertyID: parsedID });
  if (!property) {
    // Not found, handled directly
    return res
      .status(HttpStatus.StatusCodes.NOT_FOUND)
      .json({ error: "Property not found" });
  }
  res.status(HttpStatus.StatusCodes.OK).json(property);
});

// PUT /api/properties/property/:id - Update a property
router.put("/property/:id", verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const parsedID = parseInt(id);
  if (isNaN(parsedID)) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: `Invalid propertyID format: ${id}` });
  }
  // Eensure updates adhere to schema rules
  const updatedProperty = await Property.findOneAndUpdate(
    { propertyID: parsedID },
    req.body,
    { new: true, runValidators: true }
  );
  if (!updatedProperty) {
    return res
      .status(HttpStatus.StatusCodes.NOT_FOUND)
      .json({ error: "Property not found" });
  }
  res.status(HttpStatus.StatusCodes.OK).json(updatedProperty);
});

// DELETE /api/properties/property/:id - Delete a property
router.delete("/property/:id", verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const parsedID = parseInt(id);
  if (isNaN(parsedID)) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: `Invalid propertyID format: ${id}` });
  }
  const deletedProperty = await Property.findOneAndDelete({
    propertyID: parsedID,
  });
  if (!deletedProperty) {
    return res
      .status(HttpStatus.StatusCodes.NOT_FOUND)
      .json({ error: "Property not found" });
  }
  res
    .status(HttpStatus.StatusCodes.OK)
    .json({ message: "Property deleted successfully" });
});

// POST /api/properties/property/add - Add a new property
router.post("/property/add", verifyToken, isAdmin, async (req, res) => {
  const newProperty = new Property(req.body);
  // Mongoose validation errors or duplicate key errors will be caught by the central handler
  const savedProperty = await newProperty.save();
  res.status(HttpStatus.StatusCodes.CREATED).json(savedProperty);
});

// Search for properties within a radius
router.get("/radius", verifyToken, async (req, res) => {
  const { lat, lon, radius } = req.query;

  // Validate inputs
  if (!lat || !lon || !radius) {
    return res.status(HttpStatus.StatusCodes.BAD_REQUEST).json({
      error: "Missing parameters: lat, lon, and radius are required",
    });
  }

  // Convert to numbers
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  const radiusInMiles = parseFloat(radius);

  // Validate numeric values
  if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusInMiles)) {
    return res.status(HttpStatus.StatusCodes.BAD_REQUEST).json({
      error: "Invalid parameters: lat, lon, and radius must be numbers",
    });
  }

  // Build standard filters from query parameters
  const standardFilters = buildPropertyFilter(req.query);

  // Build the geospatial filter
  const geoFilter = {
    location: {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude], // MongoDB uses [longitude, latitude] format
        },
        $maxDistance: radiusInMiles * 1609.34, // Convert miles to meters
      },
    },
  };

  // Combine standard filters and geospatial filter
  const combinedFilter = { $and: [standardFilters, geoFilter] };

  console.log(
    "Executing radius search with filter:",
    JSON.stringify(combinedFilter)
  );

  // Perform geo search with combined filters
  // Potential DB errors caught by central handler
  const properties = await Property.find(combinedFilter).limit(
    DEFAULT_GEO_LIMIT
  );

  res.status(HttpStatus.StatusCodes.OK).json(properties);
});

// Get properties within a specific neighborhood's geometry
router.get("/in-neighborhood", verifyToken, async (req, res) => {
  const { neighborhoodId } = req.query;

  // 1. Validate Input
  if (!neighborhoodId) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: "Missing required query parameter: neighborhoodId" });
  }
  if (!mongoose.Types.ObjectId.isValid(neighborhoodId)) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid neighborhoodId format" });
  }

  // 2. Find the Neighborhood to get its geometry
  const neighborhood = await Neighborhood.findById(neighborhoodId);
  if (!neighborhood) {
    return res
      .status(HttpStatus.StatusCodes.NOT_FOUND)
      .json({ error: "Neighborhood not found with the provided ID." });
  }
  if (!neighborhood.geometry) {
    console.error(
      `Neighborhood ${neighborhoodId} found but missing geometry data.`
    );
    return res
      .status(HttpStatus.StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Neighborhood data is incomplete." });
  }

  // 3. Build standard filters from query parameters
  const standardFilters = buildPropertyFilter(req.query);

  // 4. Build the geospatial filter
  const geoFilter = {
    location: {
      $geoWithin: {
        $geometry: neighborhood.geometry,
      },
    },
  };

  // 5. Combine filters
  const combinedFilter = { $and: [standardFilters, geoFilter] };

  console.log(
    "Executing neighborhood search with filter:",
    JSON.stringify(combinedFilter)
  );

  // 6. Perform Geospatial Query with combined filters
  const properties = await Property.find(combinedFilter).limit(
    DEFAULT_GEO_LIMIT
  );

  // 7. Handle Results
  res.status(HttpStatus.StatusCodes.OK).json(properties);
});

// Get properties within a specific polygon geometry
router.post("/in-polygon", verifyToken, async (req, res) => {
  const { polygonCoordinates } = req.body; // Polygon from body
  const queryParams = req.query; // Standard filters from query string

  // 1. Validate Polygon Input from body
  if (
    !polygonCoordinates ||
    !Array.isArray(polygonCoordinates) ||
    polygonCoordinates.length === 0 ||
    !Array.isArray(polygonCoordinates[0]) ||
    polygonCoordinates[0].length < 4 // Need at least 4 points for a closed polygon (first=last)
  ) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({
        error:
          "Invalid 'polygonCoordinates' in request body. Expected an array of coordinate arrays, e.g., [[[lng, lat], ...]].",
      });
  }
  // Check if the polygon is closed
  const outerRing = polygonCoordinates[0];
  if (
    outerRing[0][0] !== outerRing[outerRing.length - 1][0] ||
    outerRing[0][1] !== outerRing[outerRing.length - 1][1]
  ) {
    return res.status(HttpStatus.StatusCodes.BAD_REQUEST).json({
      error:
        "Invalid polygon: The first and last coordinates of the outer ring must be identical.",
    });
  }

  // 2. Construct GeoJSON Polygon Geometry for Query
  const polygonGeometry = {
    type: "Polygon",
    coordinates: polygonCoordinates,
  };

  // 3. Build standard filters from query parameters
  const standardFilters = buildPropertyFilter(queryParams);

  // 4. Build the geospatial filter
  const geoFilter = {
    location: {
      $geoWithin: {
        $geometry: polygonGeometry,
      },
    },
  };

  // 5. Combine filters
  const combinedFilter = { $and: [standardFilters, geoFilter] };

  console.log(
    "Executing polygon search with filter:",
    JSON.stringify(combinedFilter)
  );

  // 6. Perform Geospatial Query with combined filters
  // Invalid GeoJSON errors from MongoDB will be caught by the central handler
  const properties = await Property.find(combinedFilter).limit(
    DEFAULT_GEO_LIMIT
  );

  // 7. Handle Results
  res.status(HttpStatus.StatusCodes.OK).json(properties);
});

module.exports = router;
