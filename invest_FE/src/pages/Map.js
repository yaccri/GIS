// src/pages/Map.js
import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet"; // Removed GeoJSON import
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
import useDrawnShapes from "../hooks/useDrawnShapes"; // Make sure path is correct
import useActiveShapeDetails from "../hooks/useActiveShapeDetails";

// --- Import Custom Components ---
import AdjustZoomOnRadiusChange from "../components/map/AdjustZoomOnRadiusChange";
import SelectedLocationMarker from "../components/map/layers/SelectedLocationMarker";
import NeighborhoodLayer from "../components/map/layers/NeighborhoodLayer";
import RadiusCircleLayer from "../components/map/layers/RadiusCircleLayer";
// import DrawnShapesLayer from "../components/map/layers/DrawnShapesLayer"; // REMOVED - Handled by DrawControl's FeatureGroup
import PropertyMarkersLayer from "../components/map/layers/PropertyMarkersLayer";
import { BASE_URL, MAP_URL } from "../utils/config"; // Combined imports

// --- Fix for default marker icon ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

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
      // console.log( // Reduced logging
      //   `Flying map to: [${center.lat}, ${center.lon}] with zoom ${targetZoom}`
      // );
      map.flyTo([center.lat, center.lon], targetZoom, {
        duration: 0.75, // Duration in seconds
      });
    }
  }, [center, zoom, map]);
  return null;
};

// --- MODIFIED DrawControl ---
function DrawControl({ onPolygonCreated, deleteShape }) {
  const map = useMap();
  const drawnItemsFeatureGroupRef = useRef(new L.FeatureGroup());

  useEffect(() => {
    if (!map) return;

    // --- Customize Leaflet Draw Text ---
    L.drawLocal.edit.toolbar.actions.save.text = "Finish";
    L.drawLocal.edit.toolbar.actions.save.title = "Finish changes.";
    L.drawLocal.edit.toolbar.actions.cancel.text = "Cancel Delete";
    L.drawLocal.edit.toolbar.actions.cancel.title =
      "Cancel deletion, discard changes.";
    // --- End Text Customization ---

    const drawnItemsFeatureGroup = drawnItemsFeatureGroupRef.current;
    map.addLayer(drawnItemsFeatureGroup);

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

    // --- Event Handlers ---
    const handleDrawCreated = (e) => {
      const layer = e.layer;
      const featureId = L.Util.stamp(layer);
      drawnItemsFeatureGroup.addLayer(layer);
      if (onPolygonCreated) {
        const latLngs = layer.getLatLngs()[0];
        const area = L.GeometryUtil.geodesicArea(latLngs);
        const center = layer.getBounds().getCenter();
        const geoJsonCoords = [latLngs.map((point) => [point.lng, point.lat])];
        geoJsonCoords[0].push(geoJsonCoords[0][0]);
        const geoJsonGeometry = { type: "Polygon", coordinates: geoJsonCoords };
        onPolygonCreated({
          id: featureId,
          type: e.layerType,
          coordinates: latLngs.map((point) => [point.lat, point.lng]),
          center: center,
          area: area,
          geoJSON: {
            type: "Feature",
            geometry: geoJsonGeometry,
            properties: { id: featureId, area_sqm: area },
          },
        });
      }
    };

    const handleDrawDeleted = (e) => {
      console.log(
        "%c Draw:Deleted event triggered!",
        "color: red; font-weight: bold;",
        e
      );
      e.layers.eachLayer((layer) => {
        const featureId = L.Util.stamp(layer);
        console.log(
          `%c Deleting layer with ID: ${featureId}`,
          "color: orange;"
        );
        if (deleteShape) {
          console.log(`%c Calling deleteShape(${featureId})`, "color: blue;");
          deleteShape(featureId); // This updates drawnItems state
        }
      });
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on("draw:deleted", handleDrawDeleted);

    // --- Cleanup function ---
    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
      map.off("draw:deleted", handleDrawDeleted);
      if (map && drawControl) map.removeControl(drawControl);
      if (map && drawnItemsFeatureGroup)
        map.removeLayer(drawnItemsFeatureGroup);
    };
  }, [map, onPolygonCreated, deleteShape]);

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
  const [searchRadius, setSearchRadius] = useState(0);
  const [clickedNeighborhood, setClickedNeighborhood] = useState(null); // Stores GeoJSON of the neighborhood boundary
  const [neighborhoodProperties, setNeighborhoodProperties] = useState([]); // Stores properties for the neighborhood (fetched on button click)
  const [isFetchingNeighborhoodProps, setIsFetchingNeighborhoodProps] =
    useState(false);
  const [propertiesByPolygon, setPropertiesByPolygon] = useState({});
  const [isLoadingPolygonProps, setIsLoadingPolygonProps] = useState(false);
  const mapRef = useRef();

  // --- Context & Hooks ---
  const { user } = useContext(UserContext);
  const token = user?.token;
  const { selectedMapLocation } = useMapContext();
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
    results: radiusSearchResults,
    isLoading: isSearchingRadius,
    error: radiusSearchError,
  } = useRadiusSearch(centerCoordsForSearch, searchRadius, token);
  const {
    shapes: drawnItems,
    addShape,
    deleteShape,
    clearShapes,
  } = useDrawnShapes();
  const {
    activeShape: activePolygon,
    showDetails: showPolygonCoordinates,
    hideDetails: hideActivePolygonDetails,
  } = useActiveShapeDetails();

  // --- Effects ---
  useEffect(() => {
    if (radiusSearchError)
      console.error("Radius Search Error:", radiusSearchError);
  }, [radiusSearchError]);

  // Effect to synchronize propertiesByPolygon state with drawnItems on deletion
  useEffect(() => {
    console.log(
      "Sync Effect Triggered. Current drawnItems count:",
      drawnItems.length
    );
    const currentPolygonIds = new Set(drawnItems.map((item) => item.id));
    console.log("IDs in current drawnItems:", Array.from(currentPolygonIds));
    const nextPropertiesState = {};
    Object.entries(propertiesByPolygon).forEach(([key, value]) => {
      const numericKey = parseInt(key, 10);
      if (currentPolygonIds.has(numericKey)) {
        nextPropertiesState[key] = value;
      } else {
        console.log(
          `%cDetected polygon ID ${key} is no longer in drawnItems. Properties will be removed.`,
          "color: orange"
        );
      }
    });
    const currentKeys = Object.keys(propertiesByPolygon).sort().join(",");
    const nextKeys = Object.keys(nextPropertiesState).sort().join(",");
    if (currentKeys !== nextKeys) {
      console.log(
        "%cUpdating propertiesByPolygon state.",
        "color: blue; font-weight: bold;",
        nextPropertiesState
      );
      setPropertiesByPolygon(nextPropertiesState);
      if (Object.keys(nextPropertiesState).length === 0) {
        console.log(
          "propertiesByPolygon is now empty, setting isLoadingPolygonProps to false."
        );
        setIsLoadingPolygonProps(false);
      }
    } else {
      console.log("No change needed for propertiesByPolygon state.");
    }
  }, [drawnItems, propertiesByPolygon]);

  // --- Core Functions ---

  // Fetch properties for a SPECIFIC polygon
  const fetchPropertiesForPolygon = useCallback(
    async (polygonId, polygonCoordinates) => {
      if (!polygonId || !polygonCoordinates || !token) return;
      setIsLoadingPolygonProps(true);
      // Clear other contexts
      setSearchRadius(0);
      setClickedNeighborhood(null);
      setNeighborhoodProperties([]);
      setIsFetchingNeighborhoodProps(false);
      setSelectedLocationDetails(null);
      console.log(`Fetching properties for polygon ID: ${polygonId}`);
      try {
        const url = `${BASE_URL}/api/properties/in-polygon`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ polygonCoordinates: polygonCoordinates }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Fetch failed for polygon ${polygonId}: ${response.statusText} - ${
              errorData.error || "Unknown error"
            }`
          );
        }
        const data = await response.json();
        console.log(
          `Found ${data.length} properties for polygon ${polygonId}.`
        );
        setPropertiesByPolygon((prev) => ({
          ...prev,
          [polygonId]: data || [],
        }));
      } catch (error) {
        console.error(
          `Error fetching properties for polygon ${polygonId}:`,
          error
        );
        setPropertiesByPolygon((prev) => {
          const newState = { ...prev };
          delete newState[polygonId];
          return newState;
        });
        alert(`Error fetching properties for the drawn area: ${error.message}`);
      } finally {
        setIsLoadingPolygonProps(false);
      }
    },
    [token]
  );

  // Handle polygon creation and trigger fetch
  const handlePolygonCreatedAndFetch = useCallback(
    (shapeData) => {
      addShape(shapeData);
      if (shapeData.id && shapeData.geoJSON?.geometry?.coordinates) {
        fetchPropertiesForPolygon(
          shapeData.id,
          shapeData.geoJSON.geometry.coordinates
        );
      } else {
        console.warn(
          "Drawn shape missing ID or valid GeoJSON coordinates for fetch."
        );
      }
    },
    [addShape, fetchPropertiesForPolygon]
  );

  // --- MODIFIED: Fetch properties in a neighborhood (NOW CALLED BY BUTTON) ---
  const fetchPropertiesInNeighborhood = useCallback(
    async (neighborhoodId) => {
      if (!neighborhoodId || !token) return;
      setIsFetchingNeighborhoodProps(true);
      setNeighborhoodProperties([]); // Clear previous results

      // Clear other potentially conflicting contexts
      setSearchRadius(0);
      setPropertiesByPolygon({}); // Clear polygon properties when searching neighborhood
      setIsLoadingPolygonProps(false);

      console.log(`Fetching properties for neighborhood ID: ${neighborhoodId}`);
      try {
        const url = `${BASE_URL}/api/properties/in-neighborhood?neighborhoodId=${neighborhoodId}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch properties for neighborhood: ${response.statusText}`
          );
        }
        const data = await response.json();
        console.log(`Found ${data.length} properties in neighborhood.`);
        setNeighborhoodProperties(data || []);
      } catch (error) {
        console.error("Error fetching properties in neighborhood:", error);
        setNeighborhoodProperties([]);
        alert(`Error fetching properties for neighborhood: ${error.message}`);
      } finally {
        setIsFetchingNeighborhoodProps(false);
      }
    },
    [token]
  );

  // --- MODIFIED: Fetch location details and FIND neighborhood (DOES NOT fetch properties) ---
  const fetchLocationDetailsAndNeighborhood = useCallback(
    async (lat, lng) => {
      // Reset states on map click - KEEP POLYGON PROPS
      setSearchRadius(0);
      setClickedNeighborhood(null); // Reset neighborhood boundary/info
      setNeighborhoodProperties([]); // Clear neighborhood properties
      setSelectedLocationDetails(null);
      setIsFetchingNeighborhoodProps(false);
      // DO NOT CLEAR setPropertiesByPolygon({});

      // Show temporary marker
      const tempPointGeoJSON = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: {
          name: `Loading... (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        },
      };
      setSelectedLocationDetails(tempPointGeoJSON);
      let fetchedDetails = tempPointGeoJSON;

      // Fetch Reverse Geocoding
      try {
        const nominatimUrl = `${MAP_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`;
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
        setSelectedLocationDetails(fetchedDetails); // Show the pin/details
      }

      // Fetch Neighborhood boundary/info from backend (but don't fetch properties yet)
      try {
        const neighborhoodUrl = `${BASE_URL}/api/neighborhoods/by-coords?lat=${lat}&lon=${lng}`;
        const neighborhoodResponse = await fetch(neighborhoodUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (neighborhoodResponse.ok) {
          const neighborhoodData = await neighborhoodResponse.json();
          setClickedNeighborhood(neighborhoodData); // Store neighborhood boundary/info
          console.log(
            "Neighborhood found:",
            neighborhoodData?.properties?.name
          );
        } else if (neighborhoodResponse.status === 404) {
          console.log("No neighborhood found for these coordinates.");
          setClickedNeighborhood(null); // Ensure it's null if not found
        } else {
          throw new Error(
            `Neighborhood fetch failed: ${neighborhoodResponse.statusText}`
          );
        }
      } catch (error) {
        console.error("Error fetching neighborhood boundary:", error);
        setClickedNeighborhood(null);
      }
    },
    [token] // Removed fetchPropertiesInNeighborhood dependency
  );

  // Effect for external map location changes
  useEffect(() => {
    if (selectedMapLocation?.lat && selectedMapLocation?.lon)
      fetchLocationDetailsAndNeighborhood(
        selectedMapLocation.lat,
        selectedMapLocation.lon
      );
  }, [selectedMapLocation, fetchLocationDetailsAndNeighborhood]);

  // Handle map clicks
  const handleMapClick = useCallback(
    (latlng) => {
      fetchLocationDetailsAndNeighborhood(
        parseFloat(latlng.lat.toFixed(6)),
        parseFloat(latlng.lng.toFixed(6))
      );
    },
    [fetchLocationDetailsAndNeighborhood]
  );

  // Format area
  const formatArea = (area) => {
    if (area === null || area === undefined) return "N/A";
    const areaSqM = parseFloat(area);
    if (isNaN(areaSqM)) return "N/A";
    if (areaSqM < 10000) return `${Math.round(areaSqM)} m²`;
    return `${(areaSqM / 1000000).toFixed(2)} km²`;
  };

  // Handle radius change
  const handleRadiusChange = (e) => {
    const newRadius = parseFloat(e.target.value);
    setSearchRadius(newRadius);
    if (newRadius > 0) {
      setClickedNeighborhood(null);
      setNeighborhoodProperties([]);
      setIsFetchingNeighborhoodProps(false);
      setPropertiesByPolygon({});
      setIsLoadingPolygonProps(false); // Clear polygon props on radius change
    }
  };

  // --- NEW: Handler for the "Search Neighborhood" button ---
  const handleSearchNeighborhoodClick = useCallback(() => {
    if (clickedNeighborhood?._id) {
      console.log(
        `Search Neighborhood button clicked for: ${clickedNeighborhood.properties?.name} (ID: ${clickedNeighborhood._id})`
      );
      // Clear conflicting search results before fetching new ones
      setSearchRadius(0);
      setPropertiesByPolygon({});
      setIsLoadingPolygonProps(false);
      // Now fetch neighborhood properties
      fetchPropertiesInNeighborhood(clickedNeighborhood._id);
    } else {
      console.log(
        "Search Neighborhood button clicked, but no neighborhood is selected/found."
      );
      alert("Please click on the map within a neighborhood first.");
    }
  }, [clickedNeighborhood, fetchPropertiesInNeighborhood]); // Added fetchPropertiesInNeighborhood dependency

  // Export drawn shapes
  const exportToGeoJSON = () => {
    if (drawnItems.length === 0) {
      alert("No shapes drawn to export.");
      return;
    }
    const features = drawnItems
      .map((item) => {
        /* ... fallback logic ... */ return item.geoJSON;
      })
      .filter((f) => f);
    if (features.length === 0) {
      alert("No valid shapes for export.");
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
  const radiusCircleCenter = useMemo(() => {
    return selectedLocationDetails?.geometry?.coordinates
      ? [
          selectedLocationDetails.geometry.coordinates[1],
          selectedLocationDetails.geometry.coordinates[0],
        ]
      : null;
  }, [selectedLocationDetails]);

  // Calculation for properties to display
  const propertiesToDisplay = useMemo(() => {
    console.log(
      "%cRecalculating propertiesToDisplay. propertiesByPolygon:",
      "color: cyan",
      propertiesByPolygon
    );
    const allPolygonProperties = Object.values(propertiesByPolygon).flat();
    const uniquePropertiesMap = new Map();
    allPolygonProperties.forEach((prop) => {
      const key = prop._id || prop.propertyID;
      if (key && !uniquePropertiesMap.has(key))
        uniquePropertiesMap.set(key, prop);
    });
    const uniquePolygonProperties = Array.from(uniquePropertiesMap.values());

    let result = [];
    // --- Priority Order ---
    if (uniquePolygonProperties.length > 0) {
      // 1. Polygon Search Results
      result = uniquePolygonProperties;
    } else if (neighborhoodProperties.length > 0) {
      // 2. Neighborhood Search Results (after button click)
      result = neighborhoodProperties;
    } else if (searchRadius > 0) {
      // 3. Radius Search Results
      result = radiusSearchResults;
    }

    console.log(
      "%cpropertiesToDisplay calculated:",
      "color: lightgreen",
      result
    );
    return result;
  }, [
    propertiesByPolygon,
    searchRadius,
    radiusSearchResults,
    neighborhoodProperties,
  ]); // Added neighborhoodProperties dependency

  // Combined loading state
  const isLoadingProperties =
    isLoadingPolygonProps || isSearchingRadius || isFetchingNeighborhoodProps;
  const radiusOptions = [0, 0.5, 1, 3, 5, 10, 20, 50];

  // --- Generate Key for PropertyMarkersLayer to force re-render ---
  // ***** THIS IS THE KEY CALCULATION TO USE *****
  const propertyMarkersKey = useMemo(() => {
    // Create a key based on the IDs of the polygons currently providing properties.
    const polygonKeys = Object.keys(propertiesByPolygon);
    if (polygonKeys.length > 0) {
      // If polygon properties are active, base key on the sorted polygon IDs present
      // Prefix ensures it's distinct from other search types
      return "polygons-" + polygonKeys.sort().join("-"); // e.g., "polygons-105-107"
    } else {
      // Key based on other active search types
      if (searchRadius > 0 && centerCoordsForSearch) {
        return `radius-${searchRadius}-${centerCoordsForSearch.join(",")}`;
      }
      if (clickedNeighborhood?._id && neighborhoodProperties.length > 0) {
        // Only change key if neighborhood props are actually loaded
        return `neigh-${clickedNeighborhood._id}`;
      }
      // Default key when no specific search is active or properties are empty
      return "no-active-search-" + propertiesToDisplay.length; // Fallback includes length as a simple differentiator
    }
  }, [
    propertiesByPolygon,
    searchRadius,
    clickedNeighborhood,
    centerCoordsForSearch,
    neighborhoodProperties,
    propertiesToDisplay,
  ]); // Added neighborhoodProperties and propertiesToDisplay

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
            {/* Base Layer & View Control */}
            <ChangeView
              center={selectedMapLocation}
              zoom={selectedMapLocation?.zoom}
            />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {/* Zoom Adjustment */}
            <AdjustZoomOnRadiusChange
              centerCoords={radiusCircleCenter}
              radius={searchRadius}
            />
            {/* Dynamic Layers */}
            <NeighborhoodLayer clickedNeighborhood={clickedNeighborhood} />{" "}
            {/* Shows boundary on click */}
            <SelectedLocationMarker
              locationDetails={selectedLocationDetails}
            />{" "}
            {/* Shows pin on click */}
            {searchRadius > 0 && (
              <RadiusCircleLayer
                centerCoords={radiusCircleCenter}
                radiusInMiles={searchRadius}
              />
            )}
            {/* Property Markers Layer - Imperative Management (No Key Needed) */}
            {/* Render unconditionally; the component handles adding/removing based on props */}
            <PropertyMarkersLayer
              properties={isLoadingProperties ? [] : propertiesToDisplay} // Pass empty array while loading
              formatCurrencyForDisplay={formatCurrencyForDisplay}
            />
            {/* Render empty layer if loading or no properties? Optional, usually not needed */}
            {(isLoadingProperties || propertiesToDisplay.length === 0) && (
              <PropertyMarkersLayer
                key={propertyMarkersKey || "empty"}
                properties={[]}
                formatCurrencyForDisplay={formatCurrencyForDisplay}
              />
            )}
            {/* Interaction Controls */}
            <DrawControl
              onPolygonCreated={handlePolygonCreatedAndFetch}
              deleteShape={deleteShape}
            />
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
        </div>

        {/* --- Controls Overlay --- */}
        <div className="map-controls-overlay">
          {/* --- NEW Search Neighborhood Button --- */}
          <button
            onClick={handleSearchNeighborhoodClick}
            disabled={!clickedNeighborhood || isFetchingNeighborhoodProps} // Disable if no neighborhood found or already fetching
            className="map-overlay-button" // Add a class for styling
            title={
              !clickedNeighborhood
                ? "Click on the map to select a location first"
                : "Search properties in the selected neighborhood"
            }
          >
            {isFetchingNeighborhoodProps
              ? "Searching..."
              : "Search Neighborhood"}
          </button>

          {/* Radius Search Controls */}
          {selectedLocationDetails && ( // Keep condition for radius controls
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
      {/* Sidebar */}
      <div className="search-container">
        <MapSidebar
          isSearching={isLoadingProperties}
          propertiesToDisplay={propertiesToDisplay}
          searchRadius={searchRadius}
          clickedNeighborhood={clickedNeighborhood} // Pass neighborhood info for display
          selectedLocationDetails={selectedLocationDetails}
          formatCurrencyForDisplay={formatCurrencyForDisplay}
          formatArea={formatArea}
          drawnItems={drawnItems}
          showPolygonCoordinates={showPolygonCoordinates}
          exportToGeoJSON={exportToGeoJSON}
          activePolygon={activePolygon}
          setActivePolygon={hideActivePolygonDetails}
          isLoadingPolygonProps={isLoadingPolygonProps}
          // Adjust count based on which search is active, or just show total displayed
          drawnShapePropertiesCount={
            Object.keys(propertiesByPolygon).length > 0
              ? propertiesToDisplay.length
              : 0
          }
          // Add neighborhood specific loading/count if needed
          isFetchingNeighborhoodProps={isFetchingNeighborhoodProps}
          neighborhoodPropertiesCount={neighborhoodProperties.length}
        />
      </div>
    </div>
  );
};

export default MapComponent;
