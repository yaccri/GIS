import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get MongoDB connection details from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'nyc_neighborhoods';
const MONGODB_COLLECTION_NAME = process.env.MONGODB_COLLECTION_NAME || 'neighborhoods';

let client;
let db;

async function connectToDatabase() {
  if (db) return db;
  
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    console.log('Using database:', MONGODB_DB_NAME);
    console.log('Using collection:', MONGODB_COLLECTION_NAME);
    
    client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    db = client.db(MONGODB_DB_NAME);
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }
}

export async function findNeighborhoodByCoordinates(longitude, latitude) {
  try {
    const db = await connectToDatabase();
    const collection = db.collection(MONGODB_COLLECTION_NAME);
    
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
    
    console.log('Executing query:', JSON.stringify(query));
    const neighborhood = await collection.findOne(query);
    
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

// Close the connection when the application is shutting down
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
}); 