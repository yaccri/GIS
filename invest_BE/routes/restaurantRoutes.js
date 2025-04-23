// routes/restaurantRoutes.js
const express = require("express");
const router = express.Router();
const HttpStatus = require("http-status-codes");
const Restaurant = require("../models/Restaurant");
const {
  // Import the utility functions
  getGeoFilterForNeighborhood,
  getGeoFilterForRadius,
  getGeoFilterForPolygon,
} = require("../utils/geoQueryUtils");

const DEFAULT_LIMIT = 500;

// --- Routes ---

// GET /api/restaurants/in-neighborhood?neighborhoodId=<id>
router.get("/in-neighborhood", async (req, res) => {
  // Use await because getGeoFilterForNeighborhood fetches data
  const geoFilter = await getGeoFilterForNeighborhood(req.query.neighborhoodId);

  console.log(
    "Executing restaurant neighborhood search with filter:",
    JSON.stringify(geoFilter)
  );

  // Perform Geospatial Query
  const restaurants = await Restaurant.find(geoFilter)
    .limit(DEFAULT_LIMIT)
    .lean();

  // Handle Results
  res.status(HttpStatus.StatusCodes.OK).json(restaurants);
});

// -------------------------------------------------------------------------------------------------
// GET /api/restaurants/radius?lat=<lat>&lon=<lon>&radius=<miles>
router.get("/radius", async (req, res) => {
  // Keep async for consistency
  const { lat, lon, radius } = req.query;

  const geoFilter = getGeoFilterForRadius(lat, lon, radius); // No await needed

  console.log(
    "Executing restaurant radius search with filter:",
    JSON.stringify(geoFilter)
  );

  // Perform geo search
  const restaurants = await Restaurant.find(geoFilter)
    .limit(DEFAULT_LIMIT)
    .lean();

  // Handle Results
  res.status(HttpStatus.StatusCodes.OK).json(restaurants);
});

// -------------------------------------------------------------------------------------------------
// POST /api/restaurants/in-polygon
router.post("/in-polygon", async (req, res) => {
  // Keep async for consistency
  const { coordinates } = req.body;

  const geoFilter = getGeoFilterForPolygon(coordinates); // No await needed

  // Log the Filter
  console.log(
    "Executing restaurant polygon search with filter:",
    JSON.stringify(geoFilter)
  );

  // Perform Geospatial Query
  const restaurants = await Restaurant.find(geoFilter)
    .limit(DEFAULT_LIMIT)
    .lean();

  // Handle Results
  res.status(HttpStatus.StatusCodes.OK).json(restaurants);
});

module.exports = router;
