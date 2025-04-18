// routes/authProperty.js
const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const Neighborhood = require("../models/neighborhood");
const mongoose = require("mongoose");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// GET /api/properties - Get all or filtered properties
router.get("/", verifyToken, async (req, res) => {
  try {
    const { propertyID, state, type, price, yearBuilt, beds } = req.query;
    const page = parseInt(req.query.page) || 1; // Get page from query params or default to 1
    const limit = parseInt(req.query.limit) || 12; // Get limit from query params or default to 12
    const skip = (page - 1) * limit;

    console.log("Received query parameters:", req.query);

    const query = {};

    // Add conditions to the query dynamically
    if (propertyID) query.propertyID = propertyID;
    if (state) query.state = state;
    if (type) query.type = type;

    // Handle price range
    if (price) {
      query.price = {};
      if (price.$gte) query.price.$gte = parseInt(price.$gte);
      if (price.$lte) query.price.$lte = parseInt(price.$lte);
    }

    // Handle yearBuilt range
    if (yearBuilt) {
      query.yearBuilt = {};
      if (yearBuilt.$gte) query.yearBuilt.$gte = parseInt(yearBuilt.$gte);
      if (yearBuilt.$lte) query.yearBuilt.$lte = parseInt(yearBuilt.$lte);
    }

    // Handle beds range
    if (beds) {
      query.beds = {};
      if (beds.$gte) query.beds.$gte = parseInt(beds.$gte);
      if (beds.$lte) query.beds.$lte = parseInt(beds.$lte);
    }

    console.log("Built query:", query);
    const properties = await Property.find(query).skip(skip).limit(limit);
    const totalProperties = await Property.countDocuments(query);
    const totalPages = Math.ceil(totalProperties / limit);

    res.status(200).json({ properties, totalPages });
  } catch (err) {
    console.error("Error fetching properties:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//---------------------------------------------------------------------------------

// GET /api/properties/property/:id - Get a single property by ID
router.get("/property/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const parsedID = parseInt(id);
    if (isNaN(parsedID)) {
      return res.status(400).json({ error: `Invalid propertyID: ${id}` });
    }
    const property = await Property.findOne({ propertyID: parsedID });
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch property", details: error.message });
  }
});

// PUT /api/properties/property/:id - Update a property
router.put("/property/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const parsedID = parseInt(id);
    if (isNaN(parsedID)) {
      return res.status(400).json({ error: `Invalid propertyID: ${id}` });
    }
    const updatedProperty = await Property.findOneAndUpdate(
      { propertyID: parsedID },
      req.body,
      { new: true }
    );
    if (!updatedProperty) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.json(updatedProperty);
  } catch (error) {
    console.error("Error updating property:", error);
    return res
      .status(500)
      .json({ error: "Failed to update property", details: error.message });
  }
});

// DELETE /api/properties/property/:id - Delete a property
router.delete("/property/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const parsedID = parseInt(id);
    if (isNaN(parsedID)) {
      return res.status(400).json({ error: `Invalid propertyID: ${id}` });
    }
    const deletedProperty = await Property.findOneAndDelete({
      propertyID: parsedID,
    });
    if (!deletedProperty) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Error deleting property:", error);
    return res
      .status(500)
      .json({ error: "Failed to delete property", details: error.message });
  }
});

// POST /api/properties/property/add - Add a new property
router.post("/property/add", verifyToken, isAdmin, async (req, res) => {
  try {
    const newProperty = new Property(req.body);
    const savedProperty = await newProperty.save();
    res.status(201).json(savedProperty);
  } catch (error) {
    console.error("Error adding property:", error);
    return res
      .status(500)
      .json({ error: "Failed to add property", details: error.message });
  }
});

// Search for properties within a radius
router.get("/radius", verifyToken, async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;

    // Validate inputs
    if (!lat || !lon || !radius) {
      return res.status(400).json({
        error: "Missing parameters: lat, lon, and radius are required",
      });
    }

    // Convert to numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusInMiles = parseFloat(radius);

    // Validate numeric values
    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusInMiles)) {
      return res.status(400).json({
        error: "Invalid parameters: lat, lon, and radius must be numbers",
      });
    }

    // Perform geo search
    // Example MongoDB query using $geoWithin
    const properties = await Property.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude], // MongoDB uses [longitude, latitude] format
          },
          $maxDistance: radiusInMiles * 1609.34, // Convert miles to meters
        },
      },
    }).limit(20); // Limit to 20 results for performance

    res.json(properties);
  } catch (error) {
    console.error("Error searching properties by radius:", error);
    res.status(500).json({ error: "Server error during radius search" });
  }
});

// Get properties within a specific neighborhood's geometry
// GET /api/properties/in-neighborhood?neighborhoodId=...
router.get("/in-neighborhood", verifyToken, async (req, res) => {
  try {
    const { neighborhoodId } = req.query;

    // 1. Validate Input
    if (!neighborhoodId) {
      return res
        .status(400)
        .json({ error: "Missing required query parameter: neighborhoodId" });
    }

    // Optional but recommended: Validate if it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(neighborhoodId)) {
      return res.status(400).json({ error: "Invalid neighborhoodId format" });
    }

    // 2. Find the Neighborhood to get its geometry
    const neighborhood = await Neighborhood.findById(neighborhoodId);

    if (!neighborhood) {
      return res
        .status(404)
        .json({ error: "Neighborhood not found with the provided ID." });
    }

    if (!neighborhood.geometry) {
      return res
        .status(500)
        .json({ error: "Neighborhood found but missing geometry data." });
    }

    // 3. Perform Geospatial Query using $geoWithin
    // Find properties whose 'location' (Point) is within the neighborhood's 'geometry' (Polygon/MultiPolygon)
    const properties = await Property.find({
      location: {
        $geoWithin: {
          $geometry: neighborhood.geometry, // Use the geometry fetched from the neighborhood document
        },
      },
    }); // Add .limit() if needed

    // 4. Handle Results
    res.status(200).json(properties);
  } catch (error) {
    console.error("Error fetching properties within neighborhood:", error);
    res
      .status(500)
      .json({ error: "Internal server error while fetching properties." });
  }
});

// Get properties within a specific polygon geometry
// POST /api/properties/in-polygon
// *** Reasons for using POST instead of GET ***
//   1. Data Size: Polygon coordinates can be quite large, potentially exceeding URL length limits if passed as query parameters in a GET request.
//   2. HTTP Semantics: While GET is for retrieving data, sending complex query criteria like a polygon definition fits better with the semantics of POST,
//      where the body carries the specifics of the resource manipulation (in this case, defining the complex query boundary).
// Expects a GeoJSON Polygon coordinate structure in the request body:
// {
//   "polygonCoordinates": [
//     [ [lon1, lat1], [lon2, lat2], [lon3, lat3], ..., [lon1, lat1] ] // Outer ring
//     // Optional: [ [lon4, lat4], [lon5, lat5], ... ] // Inner ring (hole)
//   ]
// }
router.post("/in-polygon", verifyToken, async (req, res) => {
  try {
    const { polygonCoordinates } = req.body;

    // 1. Validate Input
    if (
      !polygonCoordinates ||
      !Array.isArray(polygonCoordinates) ||
      polygonCoordinates.length === 0 ||
      !Array.isArray(polygonCoordinates[0]) ||
      polygonCoordinates[0].length < 4 // A polygon needs at least 3 distinct points + closing point
    ) {
      return res.status(400).json({
        error:
          "Invalid 'polygonCoordinates' in request body. Expected a GeoJSON Polygon coordinates array (e.g., [[[lon, lat], ...]]).",
      });
    }

    // Ensure the first and last points of the outer ring are the same (required by GeoJSON spec)
    const outerRing = polygonCoordinates[0];
    if (
      outerRing[0][0] !== outerRing[outerRing.length - 1][0] ||
      outerRing[0][1] !== outerRing[outerRing.length - 1][1]
    ) {
      // Optionally, you could auto-close it, but better to enforce valid input
      return res.status(400).json({
        error:
          "Invalid polygon: The first and last coordinates of a ring must be identical.",
      });
    }

    // 2. Construct GeoJSON Polygon Geometry for Query
    const polygonGeometry = {
      type: "Polygon",
      coordinates: polygonCoordinates,
    };

    // 3. Perform Geospatial Query using $geoWithin
    // Find properties whose 'location' (Point) is within the provided 'polygonGeometry'
    const properties = await Property.find({
      location: {
        $geoWithin: {
          $geometry: polygonGeometry,
        },
      },
    }); // Add .limit() if needed for performance

    // 4. Handle Results
    res.status(200).json(properties);
  } catch (error) {
    console.error("Error fetching properties within polygon:", error);
    // Catch potential MongoDB geospatial errors
    if (error.name === "MongoError" && error.code === 2) {
      // Example: Error code 2 can indicate geospatial index issues or invalid shapes
      return res.status(400).json({
        error: "Invalid polygon geometry provided.",
        details: error.message,
      });
    }
    if (
      error.name === "MongoError" &&
      error.message.includes("Loop is not closed")
    ) {
      return res.status(400).json({
        error:
          "Invalid polygon coordinates: The first and last points of each ring must be the same.",
      });
    }
    if (
      error.name === "MongoError" &&
      error.message.includes("Point list must contain at least 3 points")
    ) {
      return res.status(400).json({
        error:
          "Invalid polygon coordinates: Each ring must have at least 3 distinct points.",
      });
    }
    // General error
    res
      .status(500)
      .json({ error: "Internal server error while fetching properties." });
  }
});

module.exports = router;
