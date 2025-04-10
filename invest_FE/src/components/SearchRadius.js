// This module exports a function that searches properties within a radius.
// It replicates the behavior of the original code in Map.js.

export const searchPropertiesInRadius = async (coordinates, radius) => {
  // Only search if we have a location and radius
  if (!coordinates || radius <= 0) return null;
  
  try {
    // Note: GeoJSON is [lon, lat]
    const lat = coordinates[1];
    const lon = coordinates[0];
    
    // Example API call – replace with your actual backend API if needed.
    const response = await fetch(`http://localhost:4000/api/properties/radius?lat=${lat}&lon=${lon}&radius=${radius}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Found ${data.length} properties within ${radius} miles of [${lat}, ${lon}]`);
    return data;
    
  } catch (error) {
    console.error('Error searching properties in radius:', error);
    // Return dummy results for demo purposes
    const dummyResults = [
      { id: 1, title: 'Demo Property 1', price: '$450,000', location: 'Near search area' },
      { id: 2, title: 'Demo Property 2', price: '$320,000', location: 'Inside radius' },
      { id: 3, title: 'Demo Property 3', price: '$550,000', location: 'Within search radius' }
    ];
    return dummyResults;
  }
};