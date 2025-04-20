// utils/queryBuilder.js

/**
 * Builds a MongoDB filter object based on common property query parameters.
 * @param {object} queryParams - The request query parameters (req.query).
 * @returns {object} - A MongoDB filter object.
 */
function buildPropertyFilter(queryParams) {
  const { propertyID, state, type, price, yearBuilt, beds, baths } =
    queryParams; // Added baths
  const filter = {};

  // Add conditions to the filter dynamically
  // Basic validation added for parseInt results
  if (propertyID) {
    const parsedID = parseInt(propertyID);
    if (!isNaN(parsedID)) {
      filter.propertyID = parsedID;
    } else {
      console.warn("Invalid propertyID format received:", propertyID);
      // Decide how to handle invalid format: ignore, throw error, etc.
      // Ignoring for now.
    }
  }
  if (state) filter.state = state;
  if (type) filter.type = type;

  // Helper function for range filters
  const addRangeFilter = (field, rangeData) => {
    if (rangeData && (rangeData.$gte || rangeData.$lte)) {
      filter[field] = {};
      if (rangeData.$gte) {
        const val = parseInt(rangeData.$gte);
        if (!isNaN(val)) filter[field].$gte = val;
      }
      if (rangeData.$lte) {
        const val = parseInt(rangeData.$lte);
        if (!isNaN(val)) filter[field].$lte = val;
      }
      // Remove empty range objects
      if (Object.keys(filter[field]).length === 0) {
        delete filter[field];
      }
    }
  };

  // Handle ranges using the helper
  addRangeFilter("price", price);
  addRangeFilter("yearBuilt", yearBuilt);
  addRangeFilter("beds", beds);
  addRangeFilter("baths", baths); // Added baths filter

  console.log("Built standard filter:", filter);
  return filter;
}

module.exports = { buildPropertyFilter };
