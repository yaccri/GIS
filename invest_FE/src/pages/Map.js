// src/pages/Map.js
import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import {
  MapContainer,
  TileLayer,
  // Marker, // No longer needed directly here
  // Popup, // No longer needed directly here
  useMap,
  // Circle, // No longer needed directly here
  // Polygon, // No longer needed directly here
  GeoJSON,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-geometryutil";
import "./Map.css";
import { UserContext } from "../context/UserContext";
import { useMapContext } from "../context/MapContext";
import {
  formatCurrencyForDisplay,
  // formatPriceForPin is now used within mapIconUtils
} from "../utils/currencyFormatter";
import MapSidebar from "../components/map/MapSidebar";

// --- Import Custom Hooks ---
import useRadiusSearch from "../hooks/useRadiusSearch";
import useDrawnShapes from "../hooks/useDrawnShapes";
import useActiveShapeDetails from "../hooks/useActiveShapeDetails";

// --- Import Custom Components ---
import AdjustZoomOnRadiusChange from "../components/map/AdjustZoomOnRadiusChange";
import SelectedLocationMarker from "../components/map/layers/SelectedLocationMarker";
import NeighborhoodLayer from "../components/map/layers/NeighborhoodLayer";
import RadiusCircleLayer from "../components/map/layers/RadiusCircleLayer";
import DrawnShapesLayer from "../components/map/layers/DrawnShapesLayer";
import PropertyMarkersLayer from "../components/map/layers/PropertyMarkersLayer"; // Import the new layer

// --- Import Utilities ---
// import { createPriceIcon } from '../components/map/utils/mapIconUtils'; // No longer needed here
// createNeighborhoodLabelIcon is used within NeighborhoodLayer

// --- Fix for default marker icon ---
// This setup can potentially be moved to a central initialization file or App.js
// if needed elsewhere, but keep it here for now as it affects Leaflet globally.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// --- Placeholder function (remains here for now) ---
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
      const targetZoom = zoom || map.getZoom();
      console.log(
        `Flying map to: [${center.lat}, ${center.lon}] with zoom ${targetZoom}`
      );
      map.flyTo([center.lat, center.lon], targetZoom, {
        duration: 0.75, // Duration in seconds
      });
    }
  }, [center, zoom, map]);
  return null;
};

function DrawControl({ onPolygonCreated }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const drawnItemsFeatureGroup = new L.FeatureGroup();
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
      edit: { featureGroup: drawnItemsFeatureGroup, remove: true },
    });
    map.addControl(drawControl);
    map.on(L.Draw.Event.CREATED, function (e) {
      const layer = e.layer;
      if (onPolygonCreated) {
        const latLngs = layer.getLatLngs()[0];
        // Use Leaflet GeometryUtil for area calculation
        const area = L.GeometryUtil.geodesicArea(latLngs);
        const center = layer.getBounds().getCenter();
        const coordinates = latLngs.map((point) => [point.lat, point.lng]); // Keep as [lat, lng] for internal use if preferred

        // Prepare GeoJSON geometry (correct format [lng, lat])
        const geoJsonCoords = [
          coordinates.map((coord) => [coord[1], coord[0]]), // Convert to [lng, lat]
        ];
        geoJsonCoords[0].push(geoJsonCoords[0][0]); // Close the ring

        const geoJsonGeometry = { type: "Polygon", coordinates: geoJsonCoords };
        const featureId = L.Util.stamp(layer);

        onPolygonCreated({
          id: featureId,
          type: e.layerType,
          coordinates: coordinates, // Store original [lat, lng] if needed elsewhere
          center: center,
          area: area, // Store calculated area
          geoJSON: {
            type: "Feature",
            geometry: geoJsonGeometry,
            properties: { id: featureId, area_sqm: area }, // Add properties as needed
          },
        });
      }
    });
    return () => {
      if (map && drawControl) map.removeControl(drawControl);
      if (map) map.off(L.Draw.Event.CREATED);
    };
  }, [map, onPolygonCreated]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const handleClick = (e) => {
      onMapClick(e.latlng); // e.latlng is a Leaflet LatLng object
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onMapClick]);
  return null;
}

// --- Main Map Component ---
const MapComponent = () => {
  // --- State Variables ---
  const [selectedLocationDetails, setSelectedLocationDetails] = useState(null);
  const [initialCenter] = useState([40.7128, -74.006]); // Default: New York City [lat, lng]
  const [initialZoom] = useState(13);
  const [searchRadius, setSearchRadius] = useState(0); // In miles
  const [clickedNeighborhood, setClickedNeighborhood] = useState(null); // State remains here
  const mapRef = useRef();

  // --- Context & Hooks ---
  const { user } = useContext(UserContext);
  const token = user?.token;
  const { selectedMapLocation } = useMapContext(); // Contains { lat, lon }

  // Center coordinates for radius search [lng, lat] as expected by the hook/API
  const centerCoordsForSearch = useMemo(() => {
    if (selectedLocationDetails?.geometry?.coordinates) {
      return [
        selectedLocationDetails.geometry.coordinates[0], // lng
        selectedLocationDetails.geometry.coordinates[1], // lat
      ];
    }
    return null;
  }, [selectedLocationDetails]);

  const {
    results: radiusSearchResults, // This is the array of property results
    isLoading: isSearching,
    error: radiusSearchError,
  } = useRadiusSearch(centerCoordsForSearch, searchRadius, token);

  const {
    shapes: drawnItems, // This is the array of drawn shapes
    addShape: handlePolygonCreated,
    deleteShape: handleDeletePolygon,
  } = useDrawnShapes();

  const {
    activeShape: activePolygon,
    showDetails: showPolygonCoordinates,
    hideDetails: hideActivePolygonDetails,
  } = useActiveShapeDetails();

  // --- Effects ---
  useEffect(() => {
    if (radiusSearchError) {
      console.error("Radius Search Error:", radiusSearchError);
      // Consider user-friendly error display here
    }
  }, [radiusSearchError]);

  // --- Core Functions ---
  // fetchLocationDetailsAndNeighborhood remains here as it sets the state
  const fetchLocationDetailsAndNeighborhood = useCallback(async (lat, lng) => {
    setClickedNeighborhood(null); // Reset neighborhood
    setSelectedLocationDetails(null); // Reset details immediately

    // Show temporary marker while loading
    const tempPointGeoJSON = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] }, // GeoJSON standard [lng, lat]
      properties: { name: `Loading... (${lat.toFixed(6)}, ${lng.toFixed(6)})` },
    };
    setSelectedLocationDetails(tempPointGeoJSON);

    let fetchedDetails = tempPointGeoJSON; // Start with temp data

    try {
      // Fetch Reverse Geocoding from Nominatim
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`;
      const response = await fetch(nominatimUrl);
      if (!response.ok)
        throw new Error(`Nominatim fetch failed: ${response.statusText}`);
      const data = await response.json();

      // Construct GeoJSON Feature for the selected location
      fetchedDetails = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] }, // GeoJSON standard [lng, lat]
        properties: {
          name:
            data.display_name ||
            `Point at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          type: data.type || "unknown",
          osm_id: data.osm_id || null,
          address: data.address || {}, // Store address components
          clickTime: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error fetching location details from Nominatim:", error);
      // Fallback to basic point info if Nominatim fails
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
      setSelectedLocationDetails(fetchedDetails); // Update state with fetched or fallback details
    }

    // Fetch Neighborhood Data from your backend
    try {
      const neighborhoodUrl = `http://localhost:4000/api/neighborhoods/by-coords?lat=${lat}&lon=${lng}`;
      const neighborhoodResponse = await fetch(neighborhoodUrl);

      if (neighborhoodResponse.ok) {
        const neighborhoodData = await neighborhoodResponse.json();
        setClickedNeighborhood(neighborhoodData); // Set the found neighborhood GeoJSON + properties
      } else if (neighborhoodResponse.status === 404) {
        setClickedNeighborhood(null); // No neighborhood found for these coordinates
      } else {
        // Handle other non-OK statuses (e.g., 500 server error)
        throw new Error(
          `Neighborhood fetch failed: ${neighborhoodResponse.statusText}`
        );
      }
    } catch (error) {
      console.error("Error fetching neighborhood:", error);
      setClickedNeighborhood(null); // Ensure neighborhood is reset on error
    }
  }, []); // No dependencies needed if it only uses external inputs (lat, lng)

  // Effect to react to external map location changes (e.g., from search)
  useEffect(() => {
    if (selectedMapLocation?.lat && selectedMapLocation?.lon) {
      fetchLocationDetailsAndNeighborhood(
        selectedMapLocation.lat,
        selectedMapLocation.lon
      );
    }
    // Intentionally not including fetchLocationDetailsAndNeighborhood in deps
    // to avoid re-fetching if the function reference changes unnecessarily.
    // We only want this effect to run when selectedMapLocation changes.
  }, [selectedMapLocation]);

  // Handler for clicks directly on the map
  const handleMapClick = useCallback(
    (latlng) => {
      // latlng is a Leaflet LatLng object { lat: number, lng: number }
      const lat = parseFloat(latlng.lat.toFixed(6));
      const lng = parseFloat(latlng.lng.toFixed(6));
      fetchLocationDetailsAndNeighborhood(lat, lng);
    },
    [fetchLocationDetailsAndNeighborhood] // Dependency needed as it calls this function
  );

  // Formatting function (kept here as it's simple display logic)
  const formatArea = (area) => {
    if (area === null || area === undefined) return "N/A";
    const areaSqM = parseFloat(area);
    if (isNaN(areaSqM)) return "N/A";

    if (areaSqM < 10000) {
      // Less than 1 hectare
      return `${Math.round(areaSqM)} m²`;
    } else {
      // Convert to square kilometers
      return `${(areaSqM / 1000000).toFixed(2)} km²`;
    }
  };

  const handleRadiusChange = (e) => {
    setSearchRadius(parseFloat(e.target.value));
  };

  const exportToGeoJSON = () => {
    if (drawnItems.length === 0) {
      alert("No shapes drawn to export.");
      return;
    }

    // Ensure all items have valid GeoJSON structure
    const features = drawnItems
      .map((item) => {
        if (item.geoJSON && item.geoJSON.type === "Feature") {
          return item.geoJSON; // Use the stored GeoJSON feature
        } else if (item.type === "polygon" && item.coordinates) {
          // Fallback: Construct GeoJSON if missing (should ideally be created on draw)
          console.warn(`Constructing fallback GeoJSON for item ID: ${item.id}`);
          const geoJsonCoords = [
            item.coordinates.map((coord) => [coord[1], coord[0]]), // Convert [lat, lng] -> [lng, lat]
          ];
          geoJsonCoords[0].push(geoJsonCoords[0][0]); // Close ring
          return {
            type: "Feature",
            geometry: { type: "Polygon", coordinates: geoJsonCoords },
            properties: { id: item.id, area_sqm: item.area },
          };
        }
        console.warn(`Skipping invalid item for export: ID ${item.id}`);
        return null; // Skip invalid items
      })
      .filter((feature) => feature !== null); // Remove nulls

    if (features.length === 0) {
      alert("No valid shapes could be prepared for export.");
      return;
    }

    const geoJSONCollection = { type: "FeatureCollection", features: features };
    const dataStr = JSON.stringify(geoJSONCollection, null, 2); // Pretty print JSON
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "drawn_shapes.geojson";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    document.body.appendChild(linkElement); // Required for Firefox
    linkElement.click();
    document.body.removeChild(linkElement); // Clean up
  };

  // --- Calculations for Rendering ---
  // Center for the radius circle [lat, lng] as expected by Leaflet Circle component
  const radiusCircleCenter = useMemo(() => {
    return selectedLocationDetails?.geometry?.coordinates
      ? [
          selectedLocationDetails.geometry.coordinates[1], // lat
          selectedLocationDetails.geometry.coordinates[0], // lon
        ] // Leaflet needs [lat, lon]
      : null;
  }, [selectedLocationDetails]);

  // --- Render ---
  return (
    <div className="map-page-container">
      <div className="map-container">
        <div className="map-wrapper">
          <MapContainer
            center={initialCenter} // Expects [lat, lng]
            zoom={initialZoom}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef} // Assign ref for potential direct map manipulation
          >
            {/* --- Base Layer & View Control --- */}
            <ChangeView
              center={selectedMapLocation}
              zoom={selectedMapLocation?.zoom}
            />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* --- Component to handle zoom adjustment on radius change --- */}
            <AdjustZoomOnRadiusChange
              centerCoords={radiusCircleCenter} // Pass [lat, lng]
              radius={searchRadius} // Pass radius in miles
            />

            {/* --- Dynamic Map Layers --- */}

            {/* Clicked Neighborhood Layer */}
            <NeighborhoodLayer clickedNeighborhood={clickedNeighborhood} />

            {/* Selected Location Marker */}
            <SelectedLocationMarker locationDetails={selectedLocationDetails} />

            {/* Radius Search Circle Layer */}
            <RadiusCircleLayer
              centerCoords={radiusCircleCenter} // Pass [lat, lng]
              radiusInMiles={searchRadius} // Pass radius in miles
            />

            {/* Drawn Shapes Layer */}
            <DrawnShapesLayer drawnShapes={drawnItems} />

            {/* Property Markers Layer (using dedicated component) */}
            {/* Conditionally render based on loading state and results */}
            {!isSearching && radiusSearchResults.length > 0 && (
              <PropertyMarkersLayer
                properties={radiusSearchResults}
                formatCurrencyForDisplay={formatCurrencyForDisplay} // Pass the formatting function
              />
            )}

            {/* --- Map Interaction Controls --- */}
            <DrawControl onPolygonCreated={handlePolygonCreated} />
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
        </div>
        {/* --- Radius Search Controls Overlay --- */}
        <div className="map-controls-overlay">
          {selectedLocationDetails && ( // Only show radius options if a location is selected
            <div className="radius-control">
              <strong>Search Radius:</strong>
              <div className="radio-group">
                {[0, 0.5, 1, 3, 5, 10, 20, 50].map(
                  (
                    value // Adjusted radius options
                  ) => (
                    <label key={value} className="radio-label">
                      <input
                        type="radio"
                        name="radius"
                        value={value}
                        checked={searchRadius === value}
                        onChange={handleRadiusChange}
                      />
                      <span>{value === 0 ? "None" : `${value} mi`}</span>
                    </label>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* --- Sidebar --- */}
      <div className="search-container">
        <MapSidebar
          isSearching={isSearching}
          radiusSearchResults={radiusSearchResults}
          searchRadius={searchRadius}
          selectedLocationDetails={selectedLocationDetails}
          formatCurrencyForDisplay={formatCurrencyForDisplay} // Pass formatter to sidebar too
          drawnItems={drawnItems} // Pass drawnItems to sidebar
          handleDeletePolygon={handleDeletePolygon} // Pass delete handler
          showPolygonCoordinates={showPolygonCoordinates} // Pass show details handler
          formatArea={formatArea} // Pass formatting function
          exportToGeoJSON={exportToGeoJSON} // Pass export handler
          searchPropertiesInPolygon={searchPropertiesInPolygon} // Pass placeholder function
          activePolygon={activePolygon} // Pass active polygon state
          setActivePolygon={hideActivePolygonDetails} // Pass function to clear active polygon
        />
      </div>
    </div>
  );
};

export default MapComponent;
