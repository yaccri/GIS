// Function to find neighborhood by coordinates
export async function findNeighborhoodByCoordinates(longitude, latitude) {
  try {
    const response = await fetch('/api/find-neighborhood', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude)
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch neighborhood data');
    }

    const neighborhood = await response.json();
    
    if (!neighborhood) {
      throw new Error('No neighborhood found for these coordinates');
    }
    
    return {
      geometry: neighborhood.geometry,
      name: neighborhood.properties.name,
      borough: neighborhood.properties.borough
    };
  } catch (error) {
    console.error('Error finding neighborhood:', error);
    throw error;
  }
} 