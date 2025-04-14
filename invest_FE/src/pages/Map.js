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
  GeoJSON, // Import GeoJSON
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-geometryutil";
import "./Map.css"; // Make sure Map.css is imported
import { searchPropertiesInRadius } from "../components/SearchRadius";
import { UserContext } from "../context/UserContext";
// Import the formatters
import {
  formatCurrencyForDisplay,
  formatPriceForPin,
} from "../utils/currencyFormatter";

// --- Fix for default marker icon (Keep this) ---
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
    className: "neighborhood-label-icon", // CSS class for styling
    iconSize: null, // Let CSS determine size based on content
    // Anchor should be center of the label
    // These values might need adjustment based on final CSS size
    iconAnchor: [30, 8], // Approx center (width/2, height/2) - ADJUST AS NEEDED
  });
};

// --- Dummy implementations (Keep these) ---
function createCircleGeometry(center, radius, segments) {
  const factor = 0.0000089;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const dx = radius * Math.cos(angle) * factor;
    const dy = radius * Math.sin(angle) * factor;
    points.push([center[0] + dx, center[1] + dy]);
  }
  return points;
}
function generateRandomPointInCircle(center, radius) {
  const factor = 0.0000089;
  const angle = Math.random() * Math.PI * 2;
  const r = radius * Math.sqrt(Math.random());
  const dx = r * Math.cos(angle) * factor;
  const dy = r * Math.sin(angle) * factor;
  return [center[0] + dx, center[1] + dy];
}
function exportSavedSearches() {
  alert("Export saved searches is not implemented yet.");
}
function viewSavedSearch(search) {
  alert(`Viewing details for saved search: ${search.centerName}`);
}
function searchPropertiesInPolygon(polygon) {
  alert("searchPropertiesInPolygon is not implemented yet.");
}

// --- React Components (Keep these) ---
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    // Use useEffect to avoid issues during render
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

function DrawControl({ onPolygonCreated }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
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
      edit: { featureGroup: drawnItems, remove: true },
    });
    map.addControl(drawControl);
    map.on(L.Draw.Event.CREATED, function (e) {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      if (onPolygonCreated) {
        const coordinates = layer
          .getLatLngs()[0]
          .map((point) => [point.lat, point.lng]);
        onPolygonCreated({
          id: Date.now().toString(),
          type: e.layerType,
          coordinates: coordinates,
          center: layer.getBounds().getCenter(),
          area: L.GeometryUtil.geodesicArea(
            coordinates.map((coord) => L.latLng(coord[0], coord[1]))
          ),
        });
      }
    });
    return () => {
      // Check if map and drawnItems exist before removing
      if (map && map.hasLayer(drawnItems)) {
        map.removeLayer(drawnItems);
      }
      if (map && drawControl) {
        map.removeControl(drawControl);
      }
      if (map) {
        map.off(L.Draw.Event.CREATED);
      }
    };
  }, [map, onPolygonCreated]);
  return null;
}

function RadiusCircle({ center, radius }) {
  if (!center || !radius) return null;
  const radiusInMeters = radius * 1609.34;
  return (
    <Circle
      center={center}
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
      onMapClick(e.latlng);
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onMapClick]);
  return null;
}

function DisplayPolygons({ polygons }) {
  return (
    <>
      {polygons.map((polygon) => {
        const latLngs = polygon.coordinates.map((coord) => [
          coord[0],
          coord[1],
        ]);
        return (
          <React.Fragment key={polygon.id}>
            {polygon.type === "polygon" ? (
              <Polygon
                positions={latLngs}
                pathOptions={{ color: "#3388ff", weight: 3, fillOpacity: 0.2 }}
              />
            ) : (
              <Polygon
                positions={latLngs}
                pathOptions={{ color: "#3388ff", weight: 3, fillOpacity: 0.2 }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

const MapComponent = () => {
  // --- State Variables ---
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapState, setMapState] = useState({
    center: [40.7128, -74.006],
    zoom: 13,
  });
  const [drawnItems, setDrawnItems] = useState([]);
  const [activePolygon, setActivePolygon] = useState(null);
  const [searchRadius, setSearchRadius] = useState(0);
  const [radiusSearchResults, setRadiusSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [activeSearch, setActiveSearch] = useState(null);
  const searchTimeout = useRef(null);
  // *** CORRECTED useState destructuring ***
  const [clickedPoint, setClickedPoint] = useState(null);
  const mapRef = useRef();
  const [coordinates, setCoordinates] = useState({
    longitude: "",
    latitude: "",
  });
  // *** ADDED state for clicked neighborhood ***
  const [clickedNeighborhood, setClickedNeighborhood] = useState(null);

  const { user } = useContext(UserContext);
  const token = user?.token;

  // --- Functions ---
  const searchAddress = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ", United States"
        )}&limit=5&countrycodes=us`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchAddress(value);
    }, 300);
  };

  const handleSelectLocation = (location) => {
    const newCenter = [parseFloat(location.lat), parseFloat(location.lon)];
    // Don't set mapState here, let handleMapClick or neighborhood fetch handle view
    // setMapState({ center: newCenter, zoom: 16 });
    const geojson = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [parseFloat(location.lon), parseFloat(location.lat)],
      },
      properties: {
        name: location.display_name,
        type: location.type,
        osm_id: location.osm_id,
      },
    };
    setSelectedLocation(geojson); // Set the selected location for marker/radius
    setSearchInput(location.display_name);
    setSuggestions([]);
    setCoordinates({ longitude: location.lon, latitude: location.lat });
    setClickedNeighborhood(null); // Clear neighborhood when selecting address

    // Trigger map click logic to fetch neighborhood and potentially adjust view
    handleMapClick({
      lat: parseFloat(location.lat),
      lng: parseFloat(location.lon),
    });
  };

  const handlePolygonCreated = (polygonData) => {
    setDrawnItems((prev) => [...prev, polygonData]);
  };
  const handleDeletePolygon = (id) => {
    setDrawnItems((prev) => prev.filter((polygon) => polygon.id !== id));
    if (activePolygon && activePolygon.id === id) setActivePolygon(null);
  };
  const showPolygonCoordinates = (polygon) => {
    setActivePolygon(polygon);
  };
  const formatArea = (area) => {
    if (area < 10000) return `${Math.round(area)} m²`;
    return `${(area / 1000000).toFixed(2)} km²`;
  };

  const exportToJson = () => {
    if (drawnItems.length === 0) {
      alert("No polygons to export");
      return;
    }
    const dataStr = JSON.stringify(drawnItems, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "polygon-data.json";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleRadiusChange = async (e) => {
    const radius = parseFloat(e.target.value);
    setSearchRadius(radius);
    if (radius > 0 && selectedLocation) {
      setIsSearching(true);
      const results = await searchPropertiesInRadius(
        selectedLocation.geometry.coordinates,
        radius,
        token
      );
      setRadiusSearchResults(results || []);
      setIsSearching(false);
    } else {
      setRadiusSearchResults([]);
    }
  };

  const saveRadiusSearchAsGeoJSON = () => {
    const currentResults = Array.isArray(radiusSearchResults)
      ? radiusSearchResults
      : [];
    if (!selectedLocation || searchRadius === 0) {
      alert("Please select a location and radius before saving");
      return;
    }
    const geoJSON = {
      type: "FeatureCollection",
      properties: {
        searchTime: new Date().toISOString(),
        searchRadius: searchRadius,
        searchRadiusUnit: "miles",
        totalResults: currentResults.length,
      },
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: selectedLocation.geometry.coordinates,
          },
          properties: {
            name: selectedLocation.properties.name,
            type: "searchCenter",
          },
        },
        {
          type: "Feature",
          geometry: createCircleGeometry(
            selectedLocation.geometry.coordinates,
            searchRadius * 1609.34,
            64
          ),
          properties: {
            type: "searchRadius",
            radius: searchRadius,
            unit: "miles",
          },
        },
      ],
    };
    currentResults.forEach((property) => {
      const coords = property.coordinates
        ? [property.coordinates.longitude, property.coordinates.latitude]
        : generateRandomPointInCircle(
            selectedLocation.geometry.coordinates,
            searchRadius * 1609.34
          );
      geoJSON.features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: coords },
        properties: {
          id: property.id,
          title: property.title,
          price: property.price,
          location: property.location,
          type: "property",
        },
      });
    });
    const newSearch = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      centerName: selectedLocation.properties.name,
      radius: searchRadius,
      resultCount: currentResults.length,
      geoJSON: geoJSON,
    };
    setSavedSearches((prev) => [...prev, newSearch]);
    alert("Search saved successfully");
  };

  // *** MODIFIED handleMapClick ***
  const handleMapClick = async (latlng) => {
    const lat = parseFloat(latlng.lat.toFixed(6));
    const lng = parseFloat(latlng.lng.toFixed(6));

    // Clear previous neighborhood
    setClickedNeighborhood(null);

    // Set temporary point for reverse geocoding
    const tempPointGeoJSON = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        name: `Loading details for ${lat}, ${lng}...`,
        clickTime: new Date().toISOString(),
      },
    };
    setClickedPoint(tempPointGeoJSON); // Use the state setter function
    setSelectedLocation(tempPointGeoJSON); // Also update selected location for consistency
    // Don't zoom in too aggressively initially, let neighborhood fetch adjust if needed
    // setMapState(prev => ({ ...prev, center: [lat, lng] })); // Let fitBounds handle view changes

    // --- Fetch Reverse Geocoding (Nominatim) ---
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (!response.ok) throw new Error("Failed to fetch location details");
      const data = await response.json();
      const detailedPointGeoJSON = {
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
      console.log("Location details:", data);
      setClickedPoint(detailedPointGeoJSON); // Use the state setter function
      setSelectedLocation(detailedPointGeoJSON); // Update selected location with details
    } catch (error) {
      console.error("Error fetching location details:", error);
      const fallbackPointGeoJSON = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: {
          name: `Point at ${lat}, ${lng}`,
          type: "unknown",
          clickTime: new Date().toISOString(),
        },
      };
      setClickedPoint(fallbackPointGeoJSON); // Use the state setter function
      setSelectedLocation(fallbackPointGeoJSON); // Update selected location with fallback
    }

    // --- Fetch Neighborhood Data ---
    try {
      console.log(`Fetching neighborhood for: Lat=${lat}, Lng=${lng}`);
      const neighborhoodResponse = await fetch(
        `http://localhost:4000/api/neighborhoods/by-coords?lat=${lat}&lon=${lng}`
      );
      if (!neighborhoodResponse.ok) {
        if (neighborhoodResponse.status === 404) {
          console.log("No neighborhood found for these coordinates.");
          setClickedNeighborhood(null); // Ensure it's null if not found
          // If no neighborhood, maybe center on the clicked point with a reasonable zoom
          if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15); // Adjust zoom level as needed
          }
        } else {
          throw new Error(
            `Failed to fetch neighborhood: ${neighborhoodResponse.statusText}`
          );
        }
      } else {
        const neighborhoodData = await neighborhoodResponse.json();
        console.log("Neighborhood data received:", neighborhoodData);
        setClickedNeighborhood(neighborhoodData);

        // Adjust map view to fit neighborhood bounds
        if (neighborhoodData && neighborhoodData.geometry) {
          const bounds = L.geoJSON(neighborhoodData.geometry).getBounds();
          if (bounds.isValid() && mapRef.current) {
            mapRef.current.fitBounds(bounds, { padding: [30, 30] }); // Fit bounds with padding
          }
        }
      }
    } catch (error) {
      console.error("Error fetching neighborhood:", error);
      setClickedNeighborhood(null); // Clear on error
      // Center on clicked point if neighborhood fetch fails
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 15);
      }
    }

    // --- Fetch Properties in Radius (if applicable) ---
    if (searchRadius > 0) {
      setIsSearching(true);
      try {
        // Use the coordinates from the click event for radius search
        const results = await searchPropertiesInRadius(
          [lng, lat],
          searchRadius,
          token
        );
        setRadiusSearchResults(results || []);
      } catch (radiusError) {
        console.error(
          "Error fetching properties in radius after click:",
          radiusError
        );
        setRadiusSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setRadiusSearchResults([]); // Clear radius results if radius is 0
    }
  };

  const exportToGeoJSON = () => {
    if (drawnItems.length === 0) {
      alert("No shapes to export");
      return;
    }
    const geoJSON = { type: "FeatureCollection", features: drawnItems };
    const dataStr = JSON.stringify(geoJSON);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "map_shapes.geojson";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    setCoordinates((prev) => ({ ...prev, [name]: value }));
  };

  // Removed findNeighborhood function as it's handled by map click

  useEffect(() => {
    // Initialize draw controls after map is ready
    const initDrawControls = () => {
      if (!mapRef.current) return;
      const map = mapRef.current;
      const editableLayers = new L.FeatureGroup();
      map.addLayer(editableLayers);
      const drawControl = new L.Control.Draw({
        position: "topleft",
        draw: {
          polygon: {
            allowIntersection: false,
            drawError: {
              color: "#e1e100",
              message: "Shape edges cannot intersect!",
            },
            shapeOptions: { color: "#3388ff", fillOpacity: 0.2, weight: 2 },
          },
          rectangle: {
            shapeOptions: { color: "#3388ff", fillOpacity: 0.2, weight: 2 },
          },
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
        },
        edit: { featureGroup: editableLayers, remove: true },
      });
      map.addControl(drawControl);
      map.on(L.Draw.Event.CREATED, (e) => {
        const layer = e.layer;
        editableLayers.addLayer(layer);
        const geoJSON = layer.toGeoJSON();
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
        const center = layer.getBounds().getCenter();
        const shapeData = {
          id: Date.now().toString(),
          type: e.layerType,
          geoJSON: geoJSON,
          area: area,
          center: center,
          coordinates: layer
            .getLatLngs()[0]
            .map((point) => [point.lat, point.lng]),
        };
        setDrawnItems((prev) => [...prev, shapeData]);
        console.log("New shape created:", shapeData);
      });
      return () => {
        // Clean up draw controls and layers
        if (map && map.hasLayer(editableLayers))
          map.removeLayer(editableLayers);
        if (map && drawControl) map.removeControl(drawControl);
        if (map) map.off(L.Draw.Event.CREATED);
      };
    };
    // Use timeout to ensure map is ready
    const timeoutId = setTimeout(initDrawControls, 500); // Reduced timeout slightly
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array ensures this runs only once

  // Calculate neighborhood center for the label marker
  let neighborhoodCenter = null;
  if (clickedNeighborhood && clickedNeighborhood.geometry) {
    try {
      // Use Leaflet's geoJSON layer to calculate bounds and center
      const geoJsonLayer = L.geoJSON(clickedNeighborhood.geometry);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        neighborhoodCenter = bounds.getCenter();
      }
    } catch (e) {
      console.error("Could not calculate neighborhood center", e);
    }
  }

  return (
    // Ensure this container has the correct CSS (e.g., padding-top)
    <div className="map-page-container">
      <div className="map-container">
        <div className="map-wrapper">
          <MapContainer
            center={mapState.center}
            zoom={mapState.zoom}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef} // Assign ref here
            // Do not use ChangeView if using fitBounds/setView in handlers
            // <ChangeView center={mapState.center} zoom={mapState.zoom} />
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* --- Display Clicked Neighborhood Polygon --- */}
            {clickedNeighborhood && clickedNeighborhood.geometry && (
              <GeoJSON
                key={clickedNeighborhood._id || Date.now()} // Add key for re-rendering
                data={clickedNeighborhood.geometry}
                style={{
                  color: "#ff7800", // Orange color for neighborhood
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.15,
                }}
              />
            )}

            {/* --- Display Clicked Neighborhood Label --- */}
            {clickedNeighborhood && neighborhoodCenter && (
              <Marker
                key={
                  `${clickedNeighborhood._id}-label` || `${Date.now()}-label`
                }
                position={neighborhoodCenter}
                icon={createNeighborhoodLabelIcon(clickedNeighborhood.name)}
                interactive={false} // Make label non-interactive
              />
            )}

            {/* --- Display selected location marker (Nominatim search or click) --- */}
            {selectedLocation && (
              <Marker
                position={[
                  selectedLocation.geometry.coordinates[1], // Lat
                  selectedLocation.geometry.coordinates[0], // Lng
                ]}
                // Use default icon
              >
                <Popup>{selectedLocation.properties.name}</Popup>
              </Marker>
            )}

            {/* --- Display radius circle --- */}
            {selectedLocation && searchRadius > 0 && (
              <RadiusCircle
                center={[
                  selectedLocation.geometry.coordinates[1], // Lat
                  selectedLocation.geometry.coordinates[0], // Lng
                ]}
                radius={searchRadius}
              />
            )}

            {/* --- Display drawn polygons --- */}
            <DisplayPolygons polygons={drawnItems} />

            {/* --- Render Property Markers with Prices --- */}
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

            {/* --- Map Controls --- */}
            <DrawControl onPolygonCreated={handlePolygonCreated} />
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
        </div>
      </div>

      {/* --- Search Container Sidebar --- */}
      <div className="search-container">
        {/* Removed Neighborhood Finder section as map click handles it */}

        {/* Address Search */}
        <h2>Search US Addresses</h2>
        <input
          type="text"
          className="search-box"
          placeholder="Enter US address..."
          value={searchInput}
          onChange={handleInputChange}
        />
        {suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.osm_id}
                className="suggestion-item"
                onClick={() => handleSelectLocation(suggestion)}
              >
                {" "}
                {suggestion.display_name}{" "}
              </li>
            ))}
          </ul>
        )}

        {/* Radius Search Controls */}
        {selectedLocation && (
          <div className="radius-control">
            <h3>Search Radius</h3>
            <div className="radio-group">
              {/* Radio buttons */}
              <label className="radio-label">
                <input
                  type="radio"
                  name="radius"
                  value="0"
                  checked={searchRadius === 0}
                  onChange={handleRadiusChange}
                />
                <span>None</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="radius"
                  value="0.1"
                  checked={searchRadius === 0.1}
                  onChange={handleRadiusChange}
                />
                <span>0.1 Mile</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="radius"
                  value="3"
                  checked={searchRadius === 3}
                  onChange={handleRadiusChange}
                />
                <span>3 Miles</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="radius"
                  value="6"
                  checked={searchRadius === 6}
                  onChange={handleRadiusChange}
                />
                <span>6 Miles</span>
              </label>
              {/* Actions */}
              <div className="radius-actions">
                <button
                  className="save-search-button"
                  onClick={saveRadiusSearchAsGeoJSON}
                >
                  Save as GeoJSON
                </button>
                <button
                  className="save-search-button"
                  style={{ marginTop: "10px" }}
                  onClick={exportToGeoJSON}
                >
                  Export All Shapes
                </button>{" "}
                {/* Changed label */}
                <button
                  className="find-properties-button"
                  style={{
                    marginTop: "10px",
                    backgroundColor: "#6610f2",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    display: "block",
                    width: "100%",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  }}
                  onClick={async () => {
                    if (!selectedLocation || searchRadius === 0) {
                      alert("Please select a location and radius first");
                      return;
                    }
                    setIsSearching(true);
                    const results = await searchPropertiesInRadius(
                      selectedLocation.geometry.coordinates,
                      searchRadius,
                      token
                    );
                    setRadiusSearchResults(results || []);
                    setIsSearching(false);
                  }}
                >
                  {" "}
                  Find Properties in This Radius{" "}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results from Radius Search (List in Sidebar) */}
        {isSearching && (
          <div className="loading-indicator">
            <p>Searching for properties...</p>
          </div>
        )}
        {!isSearching && radiusSearchResults.length > 0 && (
          <div className="radius-results">
            <h3>Properties within {searchRadius} miles</h3>
            <ul className="property-list">
              {radiusSearchResults.map((property) => {
                let locationString = "Location N/A";
                if (
                  property.location?.type === "Point" &&
                  Array.isArray(property.location.coordinates) &&
                  property.location.coordinates.length === 2
                ) {
                  const lat = property.location.coordinates[1];
                  const lon = property.location.coordinates[0];
                  locationString = `Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(
                    4
                  )}`;
                } else if (typeof property.location === "string") {
                  locationString = property.location;
                } else if (property.address) {
                  locationString = `${property.address}, ${
                    property.city || ""
                  }`;
                }
                return (
                  <li
                    key={
                      property.propertyID ||
                      property._id ||
                      property.id ||
                      Math.random()
                    }
                    className="property-item"
                  >
                    {property.propertyID && (
                      <div className="property-id">
                        ID: {property.propertyID}
                      </div>
                    )}
                    <div className="property-title">
                      {property.title ||
                        property.address ||
                        "Untitled Property"}
                    </div>
                    <div className="property-price">
                      {property.price
                        ? formatCurrencyForDisplay(property.price)
                        : "Price N/A"}
                    </div>
                    <div className="property-location">{locationString}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {!isSearching &&
          radiusSearchResults.length === 0 &&
          searchRadius > 0 &&
          selectedLocation && (
            <div className="radius-results">
              <p>No properties found within {searchRadius} miles.</p>
            </div>
          )}

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div className="saved-searches">
            <h3>Saved Radius Searches</h3>
            <div className="searches-actions">
              <button className="export-button" onClick={exportSavedSearches}>
                Export All
              </button>
            </div>
            <ul className="searches-list">
              {savedSearches.map((search) => (
                <li key={search.id} className="search-item">
                  <div className="search-header">
                    <strong>{search.centerName}</strong>
                    <span className="radius-info">{search.radius} miles</span>
                  </div>
                  <div className="search-details">
                    <p>Results: {search.resultCount}</p>
                    <p>Time: {new Date(search.timestamp).toLocaleString()}</p>
                    <button
                      className="view-search-button"
                      onClick={() => viewSavedSearch(search)}
                    >
                      View Details
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Active Search Details */}
        {activeSearch && (
          <div className="search-details-panel">
            <h3>Search Details</h3>
            <div className="search-details-content">
              <p>
                <strong>Center:</strong> {activeSearch.centerName}
              </p>
              <p>
                <strong>Radius:</strong> {activeSearch.radius} miles
              </p>
              <p>
                <strong>Results:</strong> {activeSearch.resultCount}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {new Date(activeSearch.timestamp).toLocaleString()}
              </p>
              <div className="geojson-preview">
                <h4>GeoJSON (Preview):</h4>
                <div className="geojson-scroll">
                  <pre>
                    {JSON.stringify(activeSearch.geoJSON.properties, null, 2)}
                  </pre>
                </div>
              </div>
              <button
                className="close-button"
                onClick={() => setActiveSearch(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Selected Location Info */}
        <div className="selected-location-info">
          <h3>Selected Location Information</h3>
          {selectedLocation && (
            <div className="location-details">
              <table className="info-table">
                <tbody>
                  <tr>
                    <td>Location Name:</td>
                    <td>{selectedLocation.properties.name || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>Neighborhood:</td>
                    <td>
                      {selectedLocation.properties.address?.neighbourhood ||
                        (selectedLocation.properties.name &&
                          selectedLocation.properties.name
                            .split(",")[2]
                            ?.trim()) ||
                        "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>Borough:</td>
                    <td>
                      {selectedLocation.properties.address?.borough ||
                        (selectedLocation.properties.name &&
                          selectedLocation.properties.name
                            .split(",")[3]
                            ?.trim()) ||
                        "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>Latitude:</td>
                    <td>
                      {selectedLocation.geometry.coordinates[1].toFixed(6)}
                    </td>
                  </tr>
                  <tr>
                    <td>Longitude:</td>
                    <td>
                      {selectedLocation.geometry.coordinates[0].toFixed(6)}
                    </td>
                  </tr>
                  <tr>
                    <td>Street:</td>
                    <td>
                      {selectedLocation.properties.address?.road ||
                        (selectedLocation.properties.name &&
                          selectedLocation.properties.name
                            .split(",")[0]
                            ?.trim()) ||
                        "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>House Number:</td>
                    <td>
                      {selectedLocation.properties.address?.house_number ||
                        "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>City:</td>
                    <td>
                      {selectedLocation.properties.address?.city || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>State:</td>
                    <td>
                      {selectedLocation.properties.address?.state || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>Postal Code:</td>
                    <td>
                      {selectedLocation.properties.address?.postcode || "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Saved Polygons */}
        {drawnItems.length > 0 && (
          <div className="saved-polygons">
            <h3>Saved Areas:</h3>
            <ul className="polygons-list">
              {drawnItems.map((polygon) => (
                <li key={polygon.id} className="polygon-item">
                  <div className="polygon-header">
                    <strong>
                      {polygon.type === "polygon" ? "Polygon" : "Rectangle"}
                    </strong>
                    <span className="area-info">
                      {formatArea(polygon.area)}
                    </span>
                    <button
                      className="delete-button"
                      onClick={() => handleDeletePolygon(polygon.id)}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="polygon-details">
                    <p>
                      Center: [{polygon.center.lat.toFixed(4)},{" "}
                      {polygon.center.lng.toFixed(4)}]
                    </p>
                    <p>Points: {polygon.coordinates.length}</p>
                    <div className="polygon-actions-row">
                      <button
                        className="show-coords-button"
                        onClick={() => showPolygonCoordinates(polygon)}
                      >
                        Show Coordinates
                      </button>
                      <button
                        className="download-button"
                        onClick={() => {
                          /* Download logic */
                        }}
                      >
                        Download GeoJSON
                      </button>
                      <button
                        style={{
                          backgroundColor: "#6610f2" /* other styles */,
                        }}
                        onClick={() => searchPropertiesInPolygon(polygon)}
                      >
                        Find Properties
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="polygon-actions">
              <button className="export-button" onClick={exportToJson}>
                Export All Shapes
              </button>{" "}
              {/* Changed label */}
            </div>
          </div>
        )}

        {/* Active Polygon Coordinates */}
        {activePolygon && (
          <div className="coordinates-display">
            <h3>Coordinates for {activePolygon.type}</h3>
            <div className="coordinates-scroll">
              <pre>{JSON.stringify(activePolygon.coordinates, null, 2)}</pre>
            </div>
            <div
              className="coordinates-actions"
              style={{ marginTop: "10px", display: "flex", gap: "10px" }}
            >
              <button
                className="close-button"
                onClick={() => setActivePolygon(null)}
              >
                Close
              </button>
              <button
                className="find-properties-button"
                style={{ backgroundColor: "#6610f2" /* other styles */ }}
                onClick={() => searchPropertiesInPolygon(activePolygon)}
              >
                Find Properties in This Shape
              </button>
            </div>
          </div>
        )}

        {/* Instructions Sections */}
        <div className="polygon-info">
          <h3>Drawing Tool Instructions:</h3>
          <ul className="instruction-list">
            <li>...</li>
          </ul>
          <p>...</p>
        </div>
        <div className="radius-info-instructions">
          <h3>Radius Search:</h3>
          <ul className="instruction-list">
            <li>...</li>
          </ul>
          <p>...</p>
        </div>
        <div className="polygon-draw-instructions">
          <h3>Creating a Polygon:</h3>
          <ul className="instruction-list">
            <li>...</li>
          </ul>
          <h3>Creating a Rectangle:</h3>
          <ul className="instruction-list">
            <li>...</li>
          </ul>
          <p>...</p>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
