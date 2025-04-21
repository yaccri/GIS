// routes/authProperty.js
const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const HttpStatus = require("http-status-codes");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const { buildPropertyFilter } = require("../utils/queryBuilder");
const {
  // Import the utility functions
  getGeoFilterForNeighborhood,
  getGeoFilterForRadius,
  getGeoFilterForPolygon,
} = require("../utils/geoQueryUtils");

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
  // Ensure updates adhere to schema rules
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

// -------------------------------------------------------------------------------------------------
// --- Geospatial Search Routes ---

// GET /api/properties/radius
router.get("/radius", verifyToken, async (req, res) => {
  const { lat, lon, radius } = req.query;
  const queryParams = req.query;

  // Get standard and geo filters using utility functions
  const standardFilters = buildPropertyFilter(queryParams);
  const geoFilter = getGeoFilterForRadius(lat, lon, radius); // No await needed

  // Combine filters
  const combinedFilter = { $and: [standardFilters, geoFilter] };

  console.log(
    "Executing property radius search with filter:",
    JSON.stringify(combinedFilter)
  );

  // Perform search
  const properties = await Property.find(combinedFilter).limit(
    DEFAULT_GEO_LIMIT
  );

  res.status(HttpStatus.StatusCodes.OK).json(properties);
});

// -------------------------------------------------------------------
// GET /api/properties/in-neighborhood
router.get("/in-neighborhood", verifyToken, async (req, res) => {
  const { neighborhoodId } = req.query;
  const queryParams = req.query; // Keep other query params for standard filtering

  // Get standard and geo filters using utility functions
  const standardFilters = buildPropertyFilter(queryParams);
  // Use await because getGeoFilterForNeighborhood fetches data
  const geoFilter = await getGeoFilterForNeighborhood(neighborhoodId);

  // Combine filters
  const combinedFilter = { $and: [standardFilters, geoFilter] };

  console.log(
    "Executing property neighborhood search with filter:",
    JSON.stringify(combinedFilter)
  );

  // Perform search
  const properties = await Property.find(combinedFilter).limit(
    DEFAULT_GEO_LIMIT
  );

  res.status(HttpStatus.StatusCodes.OK).json(properties);
});

// -------------------------------------------------------------------
// POST /api/properties/in-polygon
router.post("/in-polygon", verifyToken, async (req, res) => {
  const { polygonCoordinates } = req.body; // Polygon coordinates from body
  const queryParams = req.query;

  // Get standard and geo filters using utility functions
  const standardFilters = buildPropertyFilter(queryParams);
  const geoFilter = getGeoFilterForPolygon(polygonCoordinates); // No await needed

  // Combine filters
  const combinedFilter = { $and: [standardFilters, geoFilter] };

  console.log(
    "Executing property polygon search with filter:",
    JSON.stringify(combinedFilter)
  );

  // Perform search
  const properties = await Property.find(combinedFilter).limit(
    DEFAULT_GEO_LIMIT
  );

  res.status(HttpStatus.StatusCodes.OK).json(properties);
});

module.exports = router;
