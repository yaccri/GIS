import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const API_TOKEN = process.env.REACT_APP_API_TOKEN;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`
  }
});

export const getNeighborhoodBoundaries = async (neighborhoodName) => {
  try {
    const response = await api.get(`/neighborhoods/${neighborhoodName}/boundaries`);
    return response.data;
  } catch (error) {
    console.error('Error fetching neighborhood boundaries:', error);
    throw error;
  }
};

export const getPropertiesInNeighborhood = async (neighborhoodName) => {
  try {
    const response = await api.get(`/neighborhoods/${neighborhoodName}/properties`);
    return response.data;
  } catch (error) {
    console.error('Error fetching properties in neighborhood:', error);
    throw error;
  }
};

export const getPropertiesInRadius = async (lat, lng, radius) => {
  try {
    const response = await api.get(`/properties/radius`, {
      params: {
        lat,
        lng,
        radius
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching properties in radius:', error);
    throw error;
  }
}; 