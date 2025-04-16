const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'nyc_neighborhoods';

let client;
let db;

async function connectToDatabase() {
  if (db) return db;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db(dbName);
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

async function findNeighborhoodByPoint(longitude, latitude) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('neighborhoods');
    
    const query = {
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          }
        }
      }
    };

    const neighborhood = await collection.findOne(query);
    return neighborhood;
  } catch (error) {
    console.error('Error finding neighborhood:', error);
    throw error;
  }
}

module.exports = {
  findNeighborhoodByPoint
}; 