// src/pages/Map.js
import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { MapContainer, TileLayer, useMap, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-geometryutil";
import "./Map.css"; // Ensure this contains the .map-controls-overlay styles
import { UserContext } from "../context/UserContext";
import { useMapContext } from "../context/MapContext";
import { formatCurrencyForDisplay } from "../utils/currencyFormatter";
// Correct import path for MapSidebar
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
import PropertyMarkersLayer from "../components/map/layers/PropertyMarkersLayer";

// --- Import Utilities ---
// ... (No changes needed here)

// --- Fix for default marker icon ---
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
        const area = L.GeometryUtil.geodesicArea(latLngs);
        const center = layer.getBounds().getCenter();
        const coordinates = latLngs.map((point) => [point.lat, point.lng]);

        const geoJsonCoords = [
          coordinates.map((coord) => [coord[1], coord[0]]),
        ];
        geoJsonCoords[0].push(geoJsonCoords[0][0]);

        const geoJsonGeometry = { type: "Polygon", coordinates: geoJsonCoords };
        const featureId = L.Util.stamp(layer);

        onPolygonCreated({
          id: featureId,
          type: e.layerType,
          coordinates: coordinates,
          center: center,
          area: area,
          geoJSON: {
            type: "Feature",
            geometry: geoJsonGeometry,
            properties: { id: featureId, area_sqm: area },
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
      onMapClick(e.latlng);
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
  const [initialCenter] = useState([40.7128, -74.006]);
  const [initialZoom] = useState(13);
  const [searchRadius, setSearchRadius] = useState(0); // Controls radius search AND circle display
  const [clickedNeighborhood, setClickedNeighborhood] = useState(null);
  const [neighborhoodProperties, setNeighborhoodProperties] = useState([]); // State for neighborhood properties
  // Add loading state specific to neighborhood properties fetch? (Optional enhancement)
  const [isFetchingNeighborhoodProps, setIsFetchingNeighborhoodProps] =
    useState(false); // Added loading state
  const mapRef = useRef();

  // --- Context & Hooks ---
  const { user } = useContext(UserContext);
  const token = user?.token; // Get token for authenticated requests
  const { selectedMapLocation } = useMapContext();

  // Center coordinates for radius search [lng, lat]
  const centerCoordsForSearch = useMemo(() => {
    if (selectedLocationDetails?.geometry?.coordinates) {
      return [
        selectedLocationDetails.geometry.coordinates[0], // lng
        selectedLocationDetails.geometry.coordinates[1], // lat
      ];
    }
    return null;
  }, [selectedLocationDetails]);

  // Hook for radius-based property search
  const {
    results: radiusSearchResults,
    isLoading: isSearchingRadius, // Renamed for clarity
    error: radiusSearchError,
  } = useRadiusSearch(centerCoordsForSearch, searchRadius, token);

  // Hook for drawn shapes
  const {
    shapes: drawnItems,
    addShape: handlePolygonCreated,
    deleteShape: handleDeletePolygon,
  } = useDrawnShapes();

  // Hook for active shape details (coordinates display)
  const {
    activeShape: activePolygon,
    showDetails: showPolygonCoordinates,
    hideDetails: hideActivePolygonDetails,
  } = useActiveShapeDetails();

  // --- Effects ---
  useEffect(() => {
    if (radiusSearchError) {
      console.error("Radius Search Error:", radiusSearchError);
    }
  }, [radiusSearchError]);

  // --- Core Functions ---

  // Function to fetch properties within a specific neighborhood
  const fetchPropertiesInNeighborhood = useCallback(
    async (neighborhoodId) => {
      if (!neighborhoodId) return;
      setIsFetchingNeighborhoodProps(true); // Set loading state
      console.log(`Fetching properties for neighborhood ID: ${neighborhoodId}`);
      try {
        const url = `http://localhost:4000/api/properties/in-neighborhood?neighborhoodId=${neighborhoodId}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch properties for neighborhood: ${response.statusText}`
          );
        }
        const data = await response.json();
        console.log(`Found ${data.length} properties in neighborhood.`);
        setNeighborhoodProperties(data || []); // Set the fetched properties
      } catch (error) {
        console.error("Error fetching properties in neighborhood:", error);
        setNeighborhoodProperties([]); // Clear properties on error
      } finally {
        setIsFetchingNeighborhoodProps(false); // Clear loading state
      }
    },
    [token]
  ); // Dependency on token

  // Function to fetch location details and potentially neighborhood + its properties
  const fetchLocationDetailsAndNeighborhood = useCallback(
    async (lat, lng) => {
      // --- Reset states on any map click ---
      setSearchRadius(0); // Reset radius search immediately
      setClickedNeighborhood(null);
      setNeighborhoodProperties([]); // Clear neighborhood properties
      setSelectedLocationDetails(null); // Reset details immediately
      setIsFetchingNeighborhoodProps(false); // Reset loading state

      // Show temporary marker while loading
      const tempPointGeoJSON = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: {
          name: `Loading... (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        },
      };
      setSelectedLocationDetails(tempPointGeoJSON);

      let fetchedDetails = tempPointGeoJSON;

      // Fetch Reverse Geocoding (Nominatim)
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`;
        const response = await fetch(nominatimUrl);
        if (!response.ok)
          throw new Error(`Nominatim fetch failed: ${response.statusText}`);
        const data = await response.json();
        fetchedDetails = {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lng, lat] },
          properties: {
            name:
              data.display_name ||
              `Point at ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            type: data.type || "unknown",
            osm_id: data.osm_id || null,
            address: data.address || {},
            clickTime: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error("Error fetching location details from Nominatim:", error);
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

      // Fetch Neighborhood Data from backend AND trigger property fetch if found
      try {
        const neighborhoodUrl = `http://localhost:4000/api/neighborhoods/by-coords?lat=${lat}&lon=${lng}`;
        const neighborhoodResponse = await fetch(neighborhoodUrl);

        if (neighborhoodResponse.ok) {
          const neighborhoodData = await neighborhoodResponse.json();
          setClickedNeighborhood(neighborhoodData); // Set the found neighborhood GeoJSON + properties

          // --- Trigger property fetch for this neighborhood ---
          if (neighborhoodData?._id) {
            fetchPropertiesInNeighborhood(neighborhoodData._id); // No await needed here, let it run async
          } else {
            console.warn("Neighborhood data received but missing _id.");
            setNeighborhoodProperties([]); // Ensure clear if ID is missing
          }
          // --- End trigger ---
        } else if (neighborhoodResponse.status === 404) {
          // No neighborhood found, states already cleared at the beginning
          console.log("No neighborhood found for these coordinates.");
        } else {
          throw new Error(
            `Neighborhood fetch failed: ${neighborhoodResponse.statusText}`
          );
        }
      } catch (error) {
        console.error("Error fetching neighborhood:", error);
        // Ensure states are clear on error
        setClickedNeighborhood(null);
        setNeighborhoodProperties([]);
        setIsFetchingNeighborhoodProps(false); // Ensure loading is off on error
      }
    },
    [fetchPropertiesInNeighborhood]
  ); // Added fetchPropertiesInNeighborhood dependency

  // Effect to react to external map location changes (e.g., from search bar)
  useEffect(() => {
    if (selectedMapLocation?.lat && selectedMapLocation?.lon) {
      fetchLocationDetailsAndNeighborhood(
        selectedMapLocation.lat,
        selectedMapLocation.lon
      );
    }
  }, [selectedMapLocation, fetchLocationDetailsAndNeighborhood]); // Added fetchLocationDetailsAndNeighborhood dependency

  // Handler for clicks directly on the map
  const handleMapClick = useCallback(
    (latlng) => {
      const lat = parseFloat(latlng.lat.toFixed(6));
      const lng = parseFloat(latlng.lng.toFixed(6));
      fetchLocationDetailsAndNeighborhood(lat, lng);
    },
    [fetchLocationDetailsAndNeighborhood]
  );

  // Formatting function for area display
  const formatArea = (area) => {
    if (area === null || area === undefined) return "N/A";
    const areaSqM = parseFloat(area);
    if (isNaN(areaSqM)) return "N/A";
    if (areaSqM < 10000) return `${Math.round(areaSqM)} m²`;
    return `${(areaSqM / 1000000).toFixed(2)} km²`;
  };

  // Handler for radius change from the overlay controls
  const handleRadiusChange = (e) => {
    const newRadius = parseFloat(e.target.value);
    setSearchRadius(newRadius);
    // If a radius is selected, clear neighborhood context
    if (newRadius > 0) {
      setClickedNeighborhood(null);
      setNeighborhoodProperties([]);
      setIsFetchingNeighborhoodProps(false); // Ensure neighborhood loading is off
    }
  };

  // Function to export drawn shapes
  const exportToGeoJSON = () => {
    if (drawnItems.length === 0) {
      alert("No shapes drawn to export.");
      return;
    }
    const features = drawnItems
      .map((item) => {
        if (item.geoJSON && item.geoJSON.type === "Feature") {
          return item.geoJSON;
        } else if (item.type === "polygon" && item.coordinates) {
          console.warn(`Constructing fallback GeoJSON for item ID: ${item.id}`);
          const geoJsonCoords = [
            item.coordinates.map((coord) => [coord[1], coord[0]]),
          ];
          geoJsonCoords[0].push(geoJsonCoords[0][0]);
          return {
            type: "Feature",
            geometry: { type: "Polygon", coordinates: geoJsonCoords },
            properties: { id: item.id, area_sqm: item.area },
          };
        }
        console.warn(`Skipping invalid item for export: ID ${item.id}`);
        return null;
      })
      .filter((feature) => feature !== null);

    if (features.length === 0) {
      alert("No valid shapes could be prepared for export.");
      return;
    }

    const geoJSONCollection = { type: "FeatureCollection", features: features };
    const dataStr = JSON.stringify(geoJSONCollection, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "drawn_shapes.geojson";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  // --- Calculations for Rendering ---
  // Center for the radius circle [lat, lng]
  const radiusCircleCenter = useMemo(() => {
    return selectedLocationDetails?.geometry?.coordinates
      ? [
          selectedLocationDetails.geometry.coordinates[1], // lat
          selectedLocationDetails.geometry.coordinates[0], // lon
        ]
      : null;
  }, [selectedLocationDetails]);

  // Determine which set of properties to display on the map AND sidebar
  const propertiesToDisplay = useMemo(() => {
    // Prioritize radius search results if a radius is selected
    if (searchRadius > 0) {
      return radiusSearchResults;
    }
    // Otherwise, show neighborhood properties if available
    return neighborhoodProperties;
  }, [searchRadius, radiusSearchResults, neighborhoodProperties]);

  // Determine overall loading state for the sidebar property list
  const isLoadingProperties = isSearchingRadius || isFetchingNeighborhoodProps;

  // Define radius options for the overlay
  const radiusOptions = [0, 0.5, 1, 3, 5, 10, 20, 50];

  // --- Render ---
  return (
    <div className="map-page-container">
      <div className="map-container">
        <div className="map-wrapper">
          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
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
              centerCoords={radiusCircleCenter}
              radius={searchRadius}
            />

            {/* --- Dynamic Map Layers --- */}
            <NeighborhoodLayer clickedNeighborhood={clickedNeighborhood} />
            <SelectedLocationMarker locationDetails={selectedLocationDetails} />
            {/* Render radius circle only if radius > 0 */}
            {searchRadius > 0 && (
              <RadiusCircleLayer
                centerCoords={radiusCircleCenter}
                radiusInMiles={searchRadius}
              />
            )}
            <DrawnShapesLayer drawnShapes={drawnItems} />

            {/* Property Markers Layer - Displays either radius or neighborhood results */}
            {/* Render if not loading EITHER search, AND there are props to display */}
            {!isLoadingProperties && propertiesToDisplay.length > 0 && (
              <PropertyMarkersLayer
                properties={propertiesToDisplay}
                formatCurrencyForDisplay={formatCurrencyForDisplay}
              />
            )}

            {/* --- Map Interaction Controls --- */}
            <DrawControl onPolygonCreated={handlePolygonCreated} />
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
        </div>

        {/* --- Radius Search Controls Overlay --- */}
        <div className="map-controls-overlay">
          {selectedLocationDetails && (
            <div className="radius-control">
              <strong>Search Radius:</strong>
              <div className="radio-group">
                {radiusOptions.map((value) => (
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
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* --- Sidebar --- */}
      <div className="search-container">
        <MapSidebar
          // Pass combined loading state and the properties to display
          isSearching={isLoadingProperties} // Combined loading state
          propertiesToDisplay={propertiesToDisplay} // Properties for the list
          // Pass context for messages/headings
          searchRadius={searchRadius}
          clickedNeighborhood={clickedNeighborhood} // Pass neighborhood info
          selectedLocationDetails={selectedLocationDetails} // Still needed for context
          // Utilities
          formatCurrencyForDisplay={formatCurrencyForDisplay}
          formatArea={formatArea}
          // Drawn Shapes Props
          drawnItems={drawnItems}
          handleDeletePolygon={handleDeletePolygon}
          showPolygonCoordinates={showPolygonCoordinates}
          exportToGeoJSON={exportToGeoJSON}
          searchPropertiesInPolygon={searchPropertiesInPolygon}
          // Active Polygon Props
          activePolygon={activePolygon}
          setActivePolygon={hideActivePolygonDetails}

          // REMOVED props specific only to radius search results display
          // radiusSearchResults={radiusSearchResults}
        />
      </div>
    </div>
  );
};

export default MapComponent;
