// src/context/MapContext.js
import React, { createContext, useState, useContext } from "react";

// 1. Create the Context
const MapContext = createContext();

// 2. Create a Hook for easy consumption
export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
};

// 3. Create the Provider Component
export const MapProvider = ({ children }) => {
  const [selectedMapLocation, setSelectedMapLocation] = useState(null); // { lat: number, lon: number } | null

  // Function to update the location - MODIFIED TO HANDLE GEOJSON
  const selectMapLocation = (location) => {
    console.log("Location selected via Context:", location);

    // Option 1: Check for simple { lat, lon } first (if needed elsewhere)
    if (
      location &&
      typeof location.lat === "number" &&
      typeof location.lon === "number"
    ) {
      console.log("MapContext received simple {lat, lon}");
      setSelectedMapLocation({ lat: location.lat, lon: location.lon });

      // Option 2: Check if it's a GeoJSON Point Feature
    } else if (
      location &&
      location.type === "Feature" &&
      location.geometry?.type === "Point" &&
      Array.isArray(location.geometry?.coordinates) &&
      location.geometry.coordinates.length === 2
    ) {
      console.log("MapContext received GeoJSON Point Feature");
      // IMPORTANT: GeoJSON coordinates are [longitude, latitude]
      const lon = location.geometry.coordinates[0];
      const lat = location.geometry.coordinates[1];
      setSelectedMapLocation({ lat: lat, lon: lon }); // Set state with extracted lat/lon

      // Option 3: Handle invalid format
    } else {
      console.warn(
        "Received invalid or unhandled location object format in MapContext:",
        location
      );
      setSelectedMapLocation(null); // Set to null if format is not recognized
    }
  };

  // The value provided to consuming components
  const value = {
    selectedMapLocation,
    selectMapLocation,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};
