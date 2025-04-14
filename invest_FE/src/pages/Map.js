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
import "./Map.css";
import { searchPropertiesInRadius } from "../components/SearchRadius";
import { UserContext } from "../context/UserContext";
import { useMapContext } from "../context/MapContext"; // Import the context hook
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

// --- Helper function to create the custom price icon (Keep this) ---
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

// --- Helper function to create the neighborhood label icon (Keep this) ---
const createNeighborhoodLabelIcon = (name) => {
  return L.divIcon({
    html: `<div class="label-content">${name}</div>`,
    className: "neighborhood-label-icon",
    iconSize: null,
    iconAnchor: [30, 8], // Adjust as needed
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

// Modified ChangeView to use flyTo for smoother transitions
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
  }, [center, zoom, map]); // Depend on center, zoom, and map instance
  return null;
};

// DrawControl remains the same
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

// RadiusCircle remains the same
function RadiusCircle({ center, radius }) {
  if (!center || !radius) return null;
  const radiusInMeters = radius * 1609.34;
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

// MapClickHandler remains the same
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

// DisplayPolygons remains the same
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
              <Polygon // Assuming rectangle is also represented as polygon coordinates
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

// --- Main Map Component ---
const MapComponent = () => {
  // --- State Variables ---
  // REMOVED: searchInput, suggestions, searchTimeout
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null); // Holds details fetched via reverse geocode/neighborhood lookup
  const [initialCenter] = useState([40.7128, -74.006]); // Default center
  const [initialZoom] = useState(13); // Default zoom
  const [selectedZoom] = useState(15); // Zoom level for selected location
  const [drawnItems, setDrawnItems] = useState([]);
  const [activePolygon, setActivePolygon] = useState(null);
  const [searchRadius, setSearchRadius] = useState(0);
  const [radiusSearchResults, setRadiusSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [activeSearch, setActiveSearch] = useState(null);
  const [clickedNeighborhood, setClickedNeighborhood] = useState(null);
  const mapRef = useRef();

  const { user } = useContext(UserContext);
  const token = user?.token;
  const { selectedMapLocation } = useMapContext(); // Get location from context

  // --- Functions ---

  // REMOVED: searchAddress, handleInputChange, handleSelectLocation

  // Function to fetch details for a given lat/lng
  const fetchLocationDetailsAndNeighborhood = async (lat, lng) => {
    // Clear previous neighborhood and details
    setClickedNeighborhood(null);
    setSelectedLocationDetails(null); // Clear previous details

    // Set temporary point for reverse geocoding display
    const tempPointGeoJSON = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        name: `Loading details for ${lat.toFixed(6)}, ${lng.toFixed(6)}...`,
        clickTime: new Date().toISOString(),
      },
    };
    setSelectedLocationDetails(tempPointGeoJSON); // Show loading state

    let fetchedDetails = tempPointGeoJSON; // Start with temp data

    // --- Fetch Reverse Geocoding (Nominatim) ---
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (!response.ok) throw new Error("Failed to fetch location details");
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
      console.log("Location details fetched:", data);
    } catch (error) {
      console.error("Error fetching location details:", error);
      // Keep fetchedDetails as the tempPointGeoJSON or create a fallback
      fetchedDetails = {
        ...tempPointGeoJSON,
        properties: {
          ...tempPointGeoJSON.properties,
          name: `Point at ${lat.toFixed(6)}, ${lng.toFixed(
            6
          )} (details fetch failed)`,
          type: "unknown",
        },
      };
    } finally {
      setSelectedLocationDetails(fetchedDetails); // Update state with fetched or fallback details
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
          setClickedNeighborhood(null);
        } else {
          throw new Error(
            `Failed to fetch neighborhood: ${neighborhoodResponse.statusText}`
          );
        }
      } else {
        const neighborhoodData = await neighborhoodResponse.json();
        console.log("Neighborhood data received:", neighborhoodData);
        setClickedNeighborhood(neighborhoodData);
        // Adjust map view slightly if needed (optional, flyTo already happened)
        // if (neighborhoodData && neighborhoodData.geometry) {
        //   const bounds = L.geoJSON(neighborhoodData.geometry).getBounds();
        //   if (bounds.isValid() && mapRef.current) {
        //     mapRef.current.fitBounds(bounds, { padding: [30, 30] });
        //   }
        // }
      }
    } catch (error) {
      console.error("Error fetching neighborhood:", error);
      setClickedNeighborhood(null);
    }

    // --- Fetch Properties in Radius (if applicable) ---
    if (searchRadius > 0) {
      setIsSearching(true);
      try {
        const results = await searchPropertiesInRadius(
          [lng, lat], // Use the provided lng, lat
          searchRadius,
          token
        );
        setRadiusSearchResults(results || []);
      } catch (radiusError) {
        console.error(
          "Error fetching properties in radius after selection:",
          radiusError
        );
        setRadiusSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setRadiusSearchResults([]);
    }
  };

  // Effect to react to changes from TopBar via Context
  useEffect(() => {
    if (
      selectedMapLocation &&
      typeof selectedMapLocation.lat === "number" &&
      typeof selectedMapLocation.lon === "number"
    ) {
      console.log("Map.js detected context change:", selectedMapLocation);
      // Trigger the detail fetching for the new location
      fetchLocationDetailsAndNeighborhood(
        selectedMapLocation.lat,
        selectedMapLocation.lon
      );
      // The <ChangeView> component will handle the map movement
    }
  }, [selectedMapLocation]); // Depend only on the context value

  // Handle manual clicks on the map
  const handleMapClick = (latlng) => {
    // latlng is a Leaflet LatLng object
    const lat = parseFloat(latlng.lat.toFixed(6));
    const lng = parseFloat(latlng.lng.toFixed(6));
    console.log("Manual map click at:", lat, lng);
    fetchLocationDetailsAndNeighborhood(lat, lng);
    // Optional: Slightly adjust view if needed, though fetch might handle it
    // if (mapRef.current) {
    //   mapRef.current.setView([lat, lng]);
    // }
  };

  // --- Other Handlers (Keep these as they are) ---
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
    // Use selectedLocationDetails which holds the currently displayed point's data
    if (radius > 0 && selectedLocationDetails?.geometry?.coordinates) {
      setIsSearching(true);
      const coords = selectedLocationDetails.geometry.coordinates; // [lng, lat]
      const results = await searchPropertiesInRadius(coords, radius, token);
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
    // Use selectedLocationDetails for saving
    if (!selectedLocationDetails?.geometry?.coordinates || searchRadius === 0) {
      alert("Please select a location and radius before saving");
      return;
    }
    const coords = selectedLocationDetails.geometry.coordinates; // [lng, lat]
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
            coordinates: coords,
          },
          properties: {
            name: selectedLocationDetails.properties.name,
            type: "searchCenter",
          },
        },
        {
          type: "Feature",
          geometry: createCircleGeometry(coords, searchRadius * 1609.34, 64),
          properties: {
            type: "searchRadius",
            radius: searchRadius,
            unit: "miles",
          },
        },
      ],
    };
    currentResults.forEach((property) => {
      const propCoords = property.location?.coordinates
        ? [property.location.coordinates[0], property.location.coordinates[1]] // Ensure [lng, lat]
        : generateRandomPointInCircle(coords, searchRadius * 1609.34);
      geoJSON.features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: propCoords },
        properties: {
          id: property.propertyID || property._id || property.id,
          title: property.title || property.address,
          price: property.price,
          location: property.location, // Keep original location data if needed
          type: "property",
          // Add other relevant property details here
          beds: property.beds,
          baths: property.baths,
          yearBuilt: property.yearBuilt,
        },
      });
    });
    const newSearch = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      centerName: selectedLocationDetails.properties.name,
      radius: searchRadius,
      resultCount: currentResults.length,
      geoJSON: geoJSON,
    };
    setSavedSearches((prev) => [...prev, newSearch]);
    alert("Search saved successfully");
  };

  const exportToGeoJSON = () => {
    // Renamed from exportToJson for clarity
    if (drawnItems.length === 0) {
      alert("No shapes to export");
      return;
    }
    // Convert drawnItems (which might have extra fields) to pure GeoJSON Features
    const features = drawnItems.map((item) => {
      // Assuming item.geoJSON holds the standard GeoJSON structure
      if (item.geoJSON) return item.geoJSON;
      // Fallback if geoJSON structure isn't stored directly (less ideal)
      return {
        type: "Feature",
        geometry: {
          type: item.type === "rectangle" ? "Polygon" : "Polygon", // Represent rectangle as Polygon
          coordinates: [item.coordinates.map((coord) => [coord[1], coord[0]])], // Convert [lat,lng] to [lng,lat] for GeoJSON standard
        },
        properties: {
          id: item.id,
          area_sqm: item.area,
          center_lat: item.center.lat,
          center_lng: item.center.lng,
        },
      };
    });

    const geoJSONCollection = { type: "FeatureCollection", features: features };
    const dataStr = JSON.stringify(geoJSONCollection, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "map_shapes.geojson";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // REMOVED: handleCoordinateChange (no manual coordinate input)
  // REMOVED: findNeighborhood (integrated into fetchLocationDetailsAndNeighborhood)
  // REMOVED: useEffect for draw controls (DrawControl component handles its own effect)

  // Calculate neighborhood center for the label marker
  let neighborhoodCenter = null;
  if (clickedNeighborhood && clickedNeighborhood.geometry) {
    try {
      const geoJsonLayer = L.geoJSON(clickedNeighborhood.geometry);
      const bounds = geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        neighborhoodCenter = bounds.getCenter();
      }
    } catch (e) {
      console.error("Could not calculate neighborhood center", e);
    }
  }

  // Determine the center for the RadiusCircle based on available data
  const radiusCircleCenter = selectedMapLocation // Prioritize context location
    ? [selectedMapLocation.lat, selectedMapLocation.lon]
    : selectedLocationDetails?.geometry?.coordinates // Fallback to fetched details
    ? [
        selectedLocationDetails.geometry.coordinates[1],
        selectedLocationDetails.geometry.coordinates[0],
      ] // Convert [lng, lat] to [lat, lon]
    : null;

  return (
    <div className="map-page-container">
      <div className="map-container">
        <div className="map-wrapper">
          <MapContainer
            center={initialCenter} // Use initial center
            zoom={initialZoom} // Use initial zoom
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            {/* Use ChangeView to handle updates from context */}
            <ChangeView center={selectedMapLocation} zoom={selectedZoom} />

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Display Clicked Neighborhood Polygon */}
            {clickedNeighborhood && clickedNeighborhood.geometry && (
              <GeoJSON
                key={clickedNeighborhood._id || Date.now()}
                data={clickedNeighborhood.geometry}
                style={{
                  color: "#ff7800",
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.15,
                }}
              />
            )}

            {/* Display Clicked Neighborhood Label */}
            {clickedNeighborhood && neighborhoodCenter && (
              <Marker
                key={
                  `${clickedNeighborhood._id}-label` || `${Date.now()}-label`
                }
                position={neighborhoodCenter}
                icon={createNeighborhoodLabelIcon(clickedNeighborhood.name)}
                interactive={false}
              />
            )}

            {/* Display marker for the location (from context or click) */}
            {selectedLocationDetails &&
              selectedLocationDetails.geometry?.coordinates && (
                <Marker
                  position={[
                    selectedLocationDetails.geometry.coordinates[1], // Lat
                    selectedLocationDetails.geometry.coordinates[0], // Lng
                  ]}
                >
                  <Popup>
                    {selectedLocationDetails.properties.name ||
                      "Selected Point"}
                  </Popup>
                </Marker>
              )}

            {/* Display radius circle */}
            {radiusCircleCenter && searchRadius > 0 && (
              <RadiusCircle
                center={radiusCircleCenter} // Use the calculated center [lat, lon]
                radius={searchRadius}
              />
            )}

            {/* Display drawn polygons */}
            <DisplayPolygons polygons={drawnItems} />

            {/* Render Property Markers with Prices */}
            {!isSearching &&
              radiusSearchResults.length > 0 &&
              radiusSearchResults.map((property) => {
                // Same rendering logic as before...
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

            {/* Map Controls */}
            <DrawControl onPolygonCreated={handlePolygonCreated} />
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
        </div>
      </div>

      {/* --- Search Container Sidebar --- */}
      <div className="search-container">
        {/* REMOVED Address Search Section */}
        {/* <div className="address-search-section"> ... </div> */}

        {/* Radius Search Controls - Conditionally render based on selectedLocationDetails */}
        {selectedLocationDetails && (
          <div className="radius-control">
            <h3>Search Radius (Miles)</h3>
            <div className="radio-group">
              {/* Radio buttons */}
              <label className="radio-label">
                <input
                  type="radio"
                  name="radius"
                  value="0"
                  checked={searchRadius === 0}
                  onChange={handleRadiusChange}
                />{" "}
                <span>None</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="radius"
                  value="0.1"
                  checked={searchRadius === 0.1}
                  onChange={handleRadiusChange}
                />{" "}
                <span>0.1</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="radius"
                  value="3"
                  checked={searchRadius === 3}
                  onChange={handleRadiusChange}
                />{" "}
                <span>3</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="radius"
                  value="6"
                  checked={searchRadius === 6}
                  onChange={handleRadiusChange}
                />{" "}
                <span>6</span>
              </label>
              {/* Actions */}
              <div className="radius-actions">
                <button
                  className="save-search-button"
                  onClick={saveRadiusSearchAsGeoJSON}
                >
                  {" "}
                  Save Search{" "}
                </button>
                {/* Manual trigger button might be redundant if radius change triggers search */}
                {/* <button className="find-properties-button" ... onClick={async () => { ... }}> Find Properties </button> */}
              </div>
            </div>
          </div>
        )}

        {/* Results from Radius Search */}
        {isSearching && (
          <div className="loading-indicator">
            <p>Searching...</p>
          </div>
        )}
        {!isSearching && radiusSearchResults.length > 0 && (
          <div className="radius-results">
            <h3>Properties within {searchRadius} miles</h3>
            <ul className="property-list">
              {radiusSearchResults.map((property) => {
                // Same rendering logic as before...
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
          selectedLocationDetails && (
            <div className="radius-results">
              <p>No properties found within {searchRadius} miles.</p>
            </div>
          )}

        {/* Saved Searches (Keep as is) */}
        {savedSearches.length > 0 && (
          <div className="saved-searches">{/* ... */}</div>
        )}
        {/* Active Search Details (Keep as is) */}
        {activeSearch && (
          <div className="search-details-panel">{/* ... */}</div>
        )}

        {/* Selected Location Info - Now uses selectedLocationDetails */}
        <div className="selected-location-info">
          <h3>Selected Location Information</h3>
          {selectedLocationDetails &&
          selectedLocationDetails.geometry?.coordinates ? (
            <div className="location-details">
              <table className="info-table">
                <tbody>
                  <tr>
                    <td>Name:</td>
                    <td>{selectedLocationDetails.properties.name || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>Neighborhood:</td>
                    <td>
                      {selectedLocationDetails.properties.address
                        ?.neighbourhood || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>Borough:</td>
                    <td>
                      {selectedLocationDetails.properties.address?.borough ||
                        "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>Latitude:</td>
                    <td>
                      {selectedLocationDetails.geometry.coordinates[1].toFixed(
                        6
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Longitude:</td>
                    <td>
                      {selectedLocationDetails.geometry.coordinates[0].toFixed(
                        6
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Street:</td>
                    <td>
                      {selectedLocationDetails.properties.address?.road ||
                        "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>House #:</td>
                    <td>
                      {selectedLocationDetails.properties.address
                        ?.house_number || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>City:</td>
                    <td>
                      {selectedLocationDetails.properties.address?.city ||
                        "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>State:</td>
                    <td>
                      {selectedLocationDetails.properties.address?.state ||
                        "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>Postcode:</td>
                    <td>
                      {selectedLocationDetails.properties.address?.postcode ||
                        "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p>
              Click on the map or use the TopBar search to select a location.
            </p>
          )}
        </div>

        {/* Saved Polygons (Keep as is) */}
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
                        Show Coords
                      </button>
                      {/* <button className="download-button" onClick={() => { }}>Download</button> */}
                      <button
                        style={{ backgroundColor: "#6610f2" }}
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
              <button className="export-button" onClick={exportToGeoJSON}>
                Export All Shapes
              </button>
            </div>
          </div>
        )}

        {/* Active Polygon Coordinates (Keep as is) */}
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
                style={{ backgroundColor: "#6610f2" }}
                onClick={() => searchPropertiesInPolygon(activePolygon)}
              >
                Find Properties
              </button>
            </div>
          </div>
        )}

        {/* Instructions Sections (Keep as is or update) */}
        {/* <div className="polygon-info"> ... </div> */}
        {/* <div className="radius-info-instructions"> ... </div> */}
        {/* <div className="polygon-draw-instructions"> ... </div> */}
      </div>
    </div>
  );
};

export default MapComponent;
