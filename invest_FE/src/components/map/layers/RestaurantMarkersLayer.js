// src/components/map/layers/RestaurantMarkersLayer.js
import React from "react";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "./RestaurantMarkersLayer.css"; // We'll create this CSS file

// Define a custom icon for restaurants (a simple orange dot)
const restaurantIcon = L.divIcon({
  html: '<span class="restaurant-marker-icon" />',
  className: "", // Leaflet adds 'leaflet-div-icon' which is fine
  iconSize: [12, 12], // Size of the dot
  iconAnchor: [6, 6], // Center the icon on the coordinate
});

const RestaurantMarkersLayer = ({ restaurants }) => {
  if (!restaurants || restaurants.length === 0) {
    return null;
  }

  return (
    <>
      {restaurants.map((restaurant) => {
        let coordinates;
        let name;
        let id;

        // Handle potential GeoJSON Feature structure vs. simple object
        if (
          restaurant.type === "Feature" &&
          restaurant.geometry?.type === "Point"
        ) {
          coordinates = restaurant.geometry.coordinates; // [lng, lat]
          name = restaurant.properties?.name || "Unnamed Restaurant";
          id =
            restaurant.properties?._id ||
            restaurant._id ||
            restaurant.id ||
            Math.random(); // Use various potential ID fields or fallback
        } else if (restaurant.location?.type === "Point") {
          coordinates = restaurant.location.coordinates; // [lng, lat]
          name = restaurant.name || "Unnamed Restaurant";
          id = restaurant._id || restaurant.id || Math.random(); // Use various potential ID fields or fallback
        } else {
          console.warn(
            "Skipping restaurant with invalid location:",
            restaurant
          );
          return null; // Skip rendering if coordinates are invalid
        }

        // Ensure coordinates are valid numbers [lng, lat]
        if (
          !Array.isArray(coordinates) ||
          coordinates.length !== 2 ||
          typeof coordinates[0] !== "number" ||
          typeof coordinates[1] !== "number"
        ) {
          console.warn(
            "Skipping restaurant with invalid coordinates:",
            restaurant
          );
          return null;
        }

        const position = [coordinates[1], coordinates[0]]; // Leaflet uses [lat, lng]

        return (
          <Marker key={id} position={position} icon={restaurantIcon}>
            <Tooltip sticky>
              {/* Tooltip shows on hover */}
              {name}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
};

export default RestaurantMarkersLayer;
