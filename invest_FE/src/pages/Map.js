// src/pages/Map.js
import React, { useState, useRef, useEffect, useContext } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
  Polygon,
  GeoJSON,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-geometryutil";
import "./Map.css"; // Contains styles for map, overlay, and sidebar elements
import { searchPropertiesInRadius } from "../components/SearchRadius";
import { UserContext } from "../context/UserContext";
import { useMapContext } from "../context/MapContext";
import {
  formatCurrencyForDisplay, // Import for passing down and potentially using in popups
  formatPriceForPin,
} from "../utils/currencyFormatter";
import MapSidebar from "../components/map/MapSidebar"; // *** CORRECTED IMPORT PATH ***

// --- Fix for default marker icon ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// --- Helper function to create the custom price icon ---
const createPriceIcon = (price) => {
  const formattedPrice = formatPriceForPin(price);
  return L.divIcon({
    html: `<div class="price-marker-content">${formattedPrice}</div>`,
    className: "price-marker-icon",
    iconSize: null,
    iconAnchor: [0, 15],
    popupAnchor: [0, -15],
  });
};

// --- Helper function to create the neighborhood label icon ---
const createNeighborhoodLabelIcon = (name) => {
  return L.divIcon({
    html: `<div class="label-content">${name}</div>`,
    className: "neighborhood-label-icon",
    iconSize: null,
    iconAnchor: [30, 8],
  });
};

// --- Dummy/Helper implementations ---
function createCircleGeometry(center, radius, segments) {
  const factor = 0.0000089; // Rough conversion factor for meters to degrees at mid-latitudes
  const points = [];
  const radiusInDegrees =
    (radius * factor) / Math.cos((center[1] * Math.PI) / 180); // Adjust for latitude

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const dx = radiusInDegrees * Math.cos(angle);
    const dy = radiusInDegrees * Math.sin(angle);
    // Ensure coordinates are within valid ranges if needed, though Leaflet handles wrapping
    points.push([center[1] + dy, center[0] + dx]); // GeoJSON format [lng, lat]
  }
  return { type: "Polygon", coordinates: [points] }; // Return GeoJSON Polygon geometry
}

function generateRandomPointInCircle(center, radius) {
  const factor = 0.0000089;
  const angle = Math.random() * Math.PI * 2;
  const r = radius * Math.sqrt(Math.random()); // Use sqrt for uniform distribution
  const radiusInDegrees = (r * factor) / Math.cos((center[1] * Math.PI) / 180); // Adjust for latitude

  const dx = radiusInDegrees * Math.cos(angle);
  const dy = radiusInDegrees * Math.sin(angle);
  return [center[0] + dx, center[1] + dy]; // [lng, lat]
}

// Keep this function here as it's passed to the sidebar
function searchPropertiesInPolygon(polygon) {
  console.warn("Search properties in polygon triggered:", polygon);
  alert(
    "Searching properties within the selected polygon is not implemented yet."
  );
}

// --- React Components (Internal to Map or could be moved later) ---

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      typeof center.lat === "number" &&
      typeof center.lon === "number"
    ) {
      console.log(
        `Flying map to: [${center.lat}, ${center.lon}] with zoom ${zoom}`
      );
      map.flyTo([center.lat, center.lon], zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

function DrawControl({ onPolygonCreated }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const drawnItems = new L.FeatureGroup();
    // map.addLayer(drawnItems); // Don't add drawn items to map here, parent manages display
    const drawControl = new L.Control.Draw({
      position: "topleft",
      draw: {
        marker: false,
        circlemarker: false,
        circle: false,
        polyline: false,
        rectangle: {
          shapeOptions: { color: "#3388ff", weight: 3, fillOpacity: 0.2 },
        },
        polygon: {
          allowIntersection: false,
          drawError: { color: "#e1e100", message: "Shapes cannot intersect" },
          shapeOptions: { color: "#3388ff", weight: 3, fillOpacity: 0.2 },
        },
      },
      edit: { featureGroup: drawnItems, remove: true }, // Basic edit/remove
    });
    map.addControl(drawControl);
    map.on(L.Draw.Event.CREATED, function (e) {
      const layer = e.layer;
      if (onPolygonCreated) {
        const latLngs = layer.getLatLngs()[0]; // For polygon/rectangle
        const coordinates = latLngs.map((point) => [point.lat, point.lng]); // [lat, lng] format
        const geoJsonCoords = [
          coordinates.map((coord) => [coord[1], coord[0]]),
        ]; // Convert to GeoJSON [lng, lat] format
        const geoJsonGeometry = {
          type: e.layerType === "rectangle" ? "Polygon" : "Polygon", // Represent both as Polygon
          coordinates: geoJsonCoords,
        };
        onPolygonCreated({
          id: L.Util.stamp(layer), // Use Leaflet's internal ID
          type: e.layerType,
          coordinates: coordinates, // Keep [lat, lng] for internal use if needed
          center: layer.getBounds().getCenter(),
          area: L.GeometryUtil.geodesicArea(latLngs),
          geoJSON: {
            // Store standard GeoJSON representation
            type: "Feature",
            geometry: geoJsonGeometry,
            properties: { id: L.Util.stamp(layer) },
          },
        });
      }
    });
    // Add handlers for edit/delete events if needed to update parent state
    // map.on(L.Draw.Event.EDITED, function (e) { ... });
    // map.on(L.Draw.Event.DELETED, function (e) { ... });

    return () => {
      // Clean up controls and listeners
      if (map && drawControl) {
        map.removeControl(drawControl);
      }
      if (map) {
        map.off(L.Draw.Event.CREATED);
        // map.off(L.Draw.Event.EDITED);
        // map.off(L.Draw.Event.DELETED);
      }
    };
  }, [map, onPolygonCreated]);
  return null;
}

function RadiusCircle({ center, radius }) {
  if (!center || !radius) return null;
  const radiusInMeters = radius * 1609.34; // Convert miles to meters
  return (
    <Circle
      center={center} // Expects [lat, lon]
      radius={radiusInMeters}
      pathOptions={{
        color: "#FF4500",
        fillColor: "#FF4500",
        fillOpacity: 0.1,
        weight: 2,
      }}
    />
  );
}

function MapClickHandler({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const handleClick = (e) => {
      onMapClick(e.latlng); // Pass Leaflet LatLng object
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onMapClick]);
  return null;
}

// Component to display polygons from state
function DisplayPolygons({ polygons }) {
  return (
    <>
      {polygons.map((polygon) => {
        // Use the stored [lat, lng] coordinates
        const latLngs = polygon.coordinates.map((coord) => [
          coord[0],
          coord[1],
        ]);
        return (
          <Polygon
            key={polygon.id}
            positions={latLngs}
            pathOptions={{ color: "#3388ff", weight: 3, fillOpacity: 0.2 }}
          />
        );
      })}
    </>
  );
}

// --- Main Map Component ---
const MapComponent = () => {
  // --- State Variables ---
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null);
  const [initialCenter] = useState([40.7128, -74.006]);
  const [initialZoom] = useState(13);
  const [selectedZoom] = useState(15);
  const [drawnItems, setDrawnItems] = useState([]); // Holds polygon/rectangle data objects
  const [activePolygon, setActivePolygon] = useState(null); // For showing coords in sidebar
  const [searchRadius, setSearchRadius] = useState(0);
  const [radiusSearchResults, setRadiusSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]); // State for saved radius searches
  const [activeSearch, setActiveSearch] = useState(null); // State for viewing saved search details
  const [clickedNeighborhood, setClickedNeighborhood] = useState(null);
  const mapRef = useRef();

  const { user } = useContext(UserContext);
  const token = user?.token;
  const { selectedMapLocation } = useMapContext();

  // --- Core Functions ---

  const fetchLocationDetailsAndNeighborhood = async (lat, lng) => {
    setClickedNeighborhood(null);
    setSelectedLocationDetails(null);
    setRadiusSearchResults([]); // Clear radius results on new click

    const tempPointGeoJSON = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: { name: `Loading... (${lat.toFixed(6)}, ${lng.toFixed(6)})` },
    };
    setSelectedLocationDetails(tempPointGeoJSON);

    let fetchedDetails = tempPointGeoJSON;

    // Fetch Reverse Geocoding (Nominatim)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`
      );
      if (!response.ok) throw new Error("Nominatim fetch failed");
      const data = await response.json();
      fetchedDetails = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: {
          name: data.display_name || `Point at ${lat}, ${lng}`,
          type: data.type || "unknown",
          osm_id: data.osm_id || 0,
          address: data.address || {},
          clickTime: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error fetching location details:", error);
      fetchedDetails = {
        ...tempPointGeoJSON,
        properties: {
          ...tempPointGeoJSON.properties,
          name: `Point at ${lat.toFixed(6)}, ${lng.toFixed(
            6
          )} (details fetch failed)`,
        },
      };
    } finally {
      setSelectedLocationDetails(fetchedDetails);
    }

    // Fetch Neighborhood Data
    try {
      const neighborhoodResponse = await fetch(
        `http://localhost:4000/api/neighborhoods/by-coords?lat=${lat}&lon=${lng}`
      );
      if (neighborhoodResponse.ok) {
        const neighborhoodData = await neighborhoodResponse.json();
        setClickedNeighborhood(neighborhoodData);
      } else if (neighborhoodResponse.status === 404) {
        setClickedNeighborhood(null);
      } else {
        throw new Error(
          `Neighborhood fetch failed: ${neighborhoodResponse.statusText}`
        );
      }
    } catch (error) {
      console.error("Error fetching neighborhood:", error);
      setClickedNeighborhood(null);
    }

    // Trigger radius search if radius is set
    if (searchRadius > 0) {
      await triggerRadiusSearch(lng, lat, searchRadius);
    }
  };

  // Separate function to trigger radius search
  const triggerRadiusSearch = async (lng, lat, radius) => {
    if (radius <= 0 || !lat || !lng) {
      setRadiusSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchPropertiesInRadius([lng, lat], radius, token);
      setRadiusSearchResults(results || []);
    } catch (radiusError) {
      console.error("Error fetching properties in radius:", radiusError);
      setRadiusSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Effect for context changes
  useEffect(() => {
    if (selectedMapLocation?.lat && selectedMapLocation?.lon) {
      fetchLocationDetailsAndNeighborhood(
        selectedMapLocation.lat,
        selectedMapLocation.lon
      );
      // ChangeView component handles map movement
    }
  }, [selectedMapLocation]);

  // Handler for manual map clicks
  const handleMapClick = (latlng) => {
    const lat = parseFloat(latlng.lat.toFixed(6));
    const lng = parseFloat(latlng.lng.toFixed(6));
    fetchLocationDetailsAndNeighborhood(lat, lng);
  };

  // Handler for when a polygon/rectangle is created by DrawControl
  const handlePolygonCreated = (polygonData) => {
    setDrawnItems((prev) => [...prev, polygonData]);
  };

  // Handler to delete a drawn polygon
  const handleDeletePolygon = (id) => {
    setDrawnItems((prev) => prev.filter((polygon) => polygon.id !== id));
    if (activePolygon && activePolygon.id === id) setActivePolygon(null); // Close details if active
  };

  // Handler to show polygon coordinates in the sidebar
  const showPolygonCoordinates = (polygon) => {
    setActivePolygon(polygon);
  };

  // Utility function for formatting area (passed to sidebar)
  const formatArea = (area) => {
    if (!area) return "N/A";
    if (area < 10000) return `${Math.round(area)} m²`;
    return `${(area / 1000000).toFixed(2)} km²`;
  };

  // Handler for radius change from the overlay controls
  const handleRadiusChange = async (e) => {
    const radius = parseFloat(e.target.value);
    setSearchRadius(radius);

    // Trigger search immediately based on the currently selected location
    if (selectedLocationDetails?.geometry?.coordinates) {
      const [lng, lat] = selectedLocationDetails.geometry.coordinates;
      await triggerRadiusSearch(lng, lat, radius);
    } else {
      setRadiusSearchResults([]); // Clear results if no location selected
    }
  };

  // Handler to save the current radius search results
  const saveRadiusSearchAsGeoJSON = () => {
    const currentResults = Array.isArray(radiusSearchResults)
      ? radiusSearchResults
      : [];
    if (!selectedLocationDetails?.geometry?.coordinates || searchRadius === 0) {
      alert("Please select a location and set a radius before saving.");
      return;
    }
    const [lng, lat] = selectedLocationDetails.geometry.coordinates;
    const centerCoords = [lng, lat]; // GeoJSON format

    const geoJSON = {
      type: "FeatureCollection",
      properties: {
        searchTime: new Date().toISOString(),
        searchRadiusMiles: searchRadius,
        centerName:
          selectedLocationDetails.properties.name ||
          `Center at ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        totalResults: currentResults.length,
      },
      features: [
        // Feature for the search center point
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: centerCoords },
          properties: {
            name: selectedLocationDetails.properties.name,
            type: "searchCenter",
          },
        },
        // Feature for the search radius circle (as a Polygon)
        {
          type: "Feature",
          geometry: createCircleGeometry(
            centerCoords,
            searchRadius * 1609.34,
            64
          ), // Pass center [lng, lat], radius in meters
          properties: {
            type: "searchRadius",
            radius: searchRadius,
            unit: "miles",
          },
        },
        // Features for each property result
        ...currentResults.map((property) => {
          const propCoords = property.location?.coordinates
            ? [
                property.location.coordinates[0],
                property.location.coordinates[1],
              ] // Ensure [lng, lat]
            : generateRandomPointInCircle(centerCoords, searchRadius * 1609.34); // Fallback if no coords

          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: propCoords },
            properties: {
              // Include desired property details
              id: property.propertyID || property._id || property.id,
              title: property.title || property.address,
              price: property.price,
              beds: property.beds,
              baths: property.baths,
              yearBuilt: property.yearBuilt,
              type: "propertyResult",
              // Add original location data if needed: location: property.location
            },
          };
        }),
      ],
    };

    const newSearch = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      centerName:
        selectedLocationDetails.properties.name ||
        `Center ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      radius: searchRadius,
      resultCount: currentResults.length,
      geoJSON: geoJSON, // Store the full GeoJSON
    };
    setSavedSearches((prev) => [...prev, newSearch]);
    alert(
      `Search saved: ${newSearch.centerName} (${newSearch.radius} mi, ${newSearch.resultCount} results)`
    );
  };

  // Handler to export drawn shapes to GeoJSON (passed to sidebar)
  const exportToGeoJSON = () => {
    if (drawnItems.length === 0) {
      alert("No shapes drawn to export.");
      return;
    }
    // Use the stored GeoJSON feature representation directly
    const features = drawnItems.map(
      (item) =>
        item.geoJSON || {
          // Fallback if geoJSON wasn't stored correctly
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              item.coordinates.map((coord) => [coord[1], coord[0]]),
            ], // Convert [lat,lng] to [lng,lat]
          },
          properties: { id: item.id, area_sqm: item.area },
        }
    );

    const geoJSONCollection = { type: "FeatureCollection", features: features };
    const dataStr = JSON.stringify(geoJSONCollection, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "drawn_shapes.geojson";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // --- Calculations for Rendering ---
  let neighborhoodCenter = null;
  if (clickedNeighborhood?.geometry) {
    try {
      const bounds = L.geoJSON(clickedNeighborhood.geometry).getBounds();
      if (bounds.isValid()) neighborhoodCenter = bounds.getCenter();
    } catch (e) {
      console.error("Could not calculate neighborhood center", e);
    }
  }

  const radiusCircleCenter = selectedLocationDetails?.geometry?.coordinates
    ? [
        selectedLocationDetails.geometry.coordinates[1],
        selectedLocationDetails.geometry.coordinates[0],
      ] // Convert [lng, lat] to [lat, lon] for Leaflet Circle
    : null;

  // --- Render ---
  return (
    // The main flex container
    <div className="map-page-container">
      {/* First flex item: The map area */}
      <div className="map-container">
        {" "}
        {/* Needs position: relative in CSS */}
        <div className="map-wrapper">
          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            {/* --- Base Layer & View Control --- */}
            <ChangeView center={selectedMapLocation} zoom={selectedZoom} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* --- Dynamic Map Layers --- */}
            {/* Clicked Neighborhood Polygon */}
            {clickedNeighborhood?.geometry && (
              <GeoJSON
                key={clickedNeighborhood._id || "neighborhood-poly"}
                data={clickedNeighborhood.geometry}
                style={{
                  color: "#ff7800",
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.15,
                }}
              />
            )}
            {/* Clicked Neighborhood Label */}
            {clickedNeighborhood && neighborhoodCenter && (
              <Marker
                key={
                  clickedNeighborhood._id
                    ? `${clickedNeighborhood._id}-label`
                    : "neighborhood-label"
                }
                position={neighborhoodCenter}
                icon={createNeighborhoodLabelIcon(clickedNeighborhood.name)}
                interactive={false}
              />
            )}
            {/* Selected Location Marker */}
            {selectedLocationDetails?.geometry?.coordinates && (
              <Marker
                position={[
                  selectedLocationDetails.geometry.coordinates[1],
                  selectedLocationDetails.geometry.coordinates[0],
                ]}
              >
                <Popup>
                  {selectedLocationDetails.properties.name || "Selected Point"}
                </Popup>
              </Marker>
            )}
            {/* Radius Search Circle */}
            {radiusCircleCenter && searchRadius > 0 && (
              <RadiusCircle center={radiusCircleCenter} radius={searchRadius} />
            )}
            {/* Drawn Polygons/Rectangles */}
            <DisplayPolygons polygons={drawnItems} />
            {/* Property Markers from Radius Search */}
            {!isSearching &&
              radiusSearchResults.length > 0 &&
              radiusSearchResults.map((property) => {
                if (
                  property.location?.type === "Point" &&
                  Array.isArray(property.location.coordinates) &&
                  property.location.coordinates.length === 2
                ) {
                  const lat = property.location.coordinates[1];
                  const lon = property.location.coordinates[0];
                  const propertyId =
                    property.propertyID ||
                    property._id ||
                    property.id ||
                    Math.random();
                  return (
                    <Marker
                      key={propertyId}
                      position={[lat, lon]}
                      icon={createPriceIcon(property.price)}
                    >
                      <Popup>
                        <div className="popup-title">
                          {property.title || property.address || "Property"}
                        </div>
                        <div className="popup-details">
                          <p>ID: {property.propertyID || "N/A"}</p>
                          <p>
                            Price: {formatCurrencyForDisplay(property.price)}
                          </p>
                          <p>Type: {property.type || "N/A"}</p>
                          <p>
                            Beds: {property.beds || "N/A"} | Baths:{" "}
                            {property.baths || "N/A"}
                          </p>
                          <p>Year: {property.yearBuilt || "N/A"}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}

            {/* --- Map Interaction Controls --- */}
            <DrawControl onPolygonCreated={handlePolygonCreated} />
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
        </div>{" "}
        {/* End of map-wrapper */}
        {/* --- CORRECTED PLACEMENT for Radius Search Controls Overlay --- */}
        {/* This div is positioned absolutely relative to map-container */}
        {/* It does NOT participate in the main map-page-container flex layout */}
        <div className="map-controls-overlay">
          {selectedLocationDetails && ( // Only show when a location is selected
            <div className="radius-control">
              <strong>Search Radius (Miles):</strong>
              <div className="radio-group">
                {[0, 0.1, 3, 6].map((value) => (
                  <label key={value} className="radio-label">
                    <input
                      type="radio"
                      name="radius"
                      value={value}
                      checked={searchRadius === value}
                      onChange={handleRadiusChange}
                    />
                    <span>{value === 0 ? "None" : value}</span>
                  </label>
                ))}
                <div className="radius-actions">
                  <button
                    className="save-search-button"
                    onClick={saveRadiusSearchAsGeoJSON}
                    disabled={
                      searchRadius === 0 ||
                      !selectedLocationDetails?.geometry?.coordinates
                    } // Disable if no radius/location
                  >
                    Save Search
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* --- End of CORRECTED PLACEMENT --- */}
      </div>{" "}
      {/* End of map-container */}
      {/* Second flex item: The sidebar */}
      <div className="search-container">
        <MapSidebar
          isSearching={isSearching}
          radiusSearchResults={radiusSearchResults}
          searchRadius={searchRadius}
          selectedLocationDetails={selectedLocationDetails}
          formatCurrencyForDisplay={formatCurrencyForDisplay}
          drawnItems={drawnItems}
          handleDeletePolygon={handleDeletePolygon}
          showPolygonCoordinates={showPolygonCoordinates}
          formatArea={formatArea}
          exportToGeoJSON={exportToGeoJSON}
          searchPropertiesInPolygon={searchPropertiesInPolygon}
          activePolygon={activePolygon}
          setActivePolygon={setActivePolygon}
          // savedSearches={savedSearches}
          // viewSavedSearch={viewSavedSearch}
          // exportSavedSearches={exportSavedSearches}
          // activeSearch={activeSearch}
        />
      </div>{" "}
      {/* End of search-container */}
    </div> // End of map-page-container
  );
};

export default MapComponent;
