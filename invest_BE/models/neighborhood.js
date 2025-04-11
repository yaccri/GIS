// models/Neighborhood.js
const mongoose = require("mongoose");

const neighborhoodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    geometry: {
      type: {
        type: String,
        enum: ["Polygon", "MultiPolygon"], // Allow both Polygon and MultiPolygon
        required: true,
      },
      coordinates: {
        // Coordinates structure depends on the 'type' (Polygon or MultiPolygon)
        // Mongoose handles this flexibility with 'Mixed' or specific array structures
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    },
    // Add any other fields from your neighborhood documents if needed
  },
  { collection: "neighborhoods" }
); // Explicitly set collection name if it's not 'neighborhoods' pluralized

// IMPORTANT: Create a 2dsphere index on the geometry field for geospatial queries
neighborhoodSchema.index({ geometry: "2dsphere" });

const Neighborhood = mongoose.model("Neighborhood", neighborhoodSchema);

module.exports = Neighborhood;
