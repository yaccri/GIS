// routes/neighborhood.js
const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Neighborhood = require("../models/neighborhood");

// Get neighborhood by coordinates ***
// GET /api/neighborhoods/by-coords?lat=...&lon=... (/api/neighborhoods/by-coords?lat=40.7128&lon=-74.0060)
router.get("/by-coords", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    // 1. Validate Input
    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: "Missing required query parameters: lat and lon" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res
        .status(400)
        .json({ error: "Invalid coordinates: lat and lon must be numbers" });
    }

    // 2. Construct GeoJSON Point for Query
    const point = {
      type: "Point",
      coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
    };

    // 3. Perform Geospatial Query using $geoIntersects
    // This finds documents where the 'geometry' field intersects the specified point.
    // Since we're looking for a polygon containing the point, intersection works.
    const neighborhood = await Neighborhood.findOne({
      geometry: {
        $geoIntersects: {
          $geometry: point,
        },
      },
    });

    // 4. Handle Results
    if (!neighborhood) {
      return res.status(404).json({
        message: "No neighborhood found containing the specified coordinates.",
      });
    }

    res.status(200).json(neighborhood);
  } catch (error) {
    console.error("Error fetching neighborhood by coordinates:", error);
    res.status(500).json({
      error: "Internal server error while fetching neighborhood data.",
    });
  }
});

module.exports = router;
