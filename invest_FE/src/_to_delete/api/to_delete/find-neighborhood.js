const { MongoClient } = require('mongodb');

// MongoDB connection URI (replace with your actual connection string)
const uri = process.env.MONGODB_URI;

async function findNeighborhood(req, res) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('your_database_name'); // Replace with your database name

    const { coordinates } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ error: 'Invalid coordinates format' });
    }

    // MongoDB query to find the neighborhood containing the point
    const neighborhood = await db.collection('neighborhoods').findOne({
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: coordinates
          }
        }
      }
    });

    if (!neighborhood) {
      return res.status(404).json({ error: 'No neighborhood found for these coordinates' });
    }

    res.json(neighborhood);
  } catch (error) {
    console.error('Error finding neighborhood:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.close();
  }
}

module.exports = findNeighborhood; 