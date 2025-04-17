// src/pages/Map.js
import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-geometryutil";
import "./Map.css";
import { UserContext } from "../context/UserContext";
import { useMapContext } from "../context/MapContext";
import { formatCurrencyForDisplay } from "../utils/currencyFormatter";
import MapSidebar from "../components/map/MapSidebar";

// --- Import Custom Hooks ---
import useRadiusSearch from "../hooks/useRadiusSearch";
import useDrawnShapes from "../hooks/useDrawnShapes";
import useActiveShapeDetails from "../hooks/useActiveShapeDetails";
import usePolygonPropertySearch from "../hooks/usePolygonPropertySearch";
import useNeighborhoodPropertySearch from "../hooks/useNeighborhoodPropertySearch"; // *** ADDED ***

// --- Import Custom Components ---
import AdjustZoomOnRadiusChange from "../components/map/AdjustZoomOnRadiusChange";
import SelectedLocationMarker from "../components/map/layers/SelectedLocationMarker";
import NeighborhoodLayer from "../components/map/layers/NeighborhoodLayer";
import RadiusCircleLayer from "../components/map/layers/RadiusCircleLayer";
import PropertyMarkersLayer from "../components/map/layers/PropertyMarkersLayer";
import { BASE_URL, MAP_URL } from "../utils/config";

// --- Fix for default marker icon ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// --- React Components (Internal to Map) ---
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      typeof center.lat === "number" &&
      typeof center.lon === "number"
    ) {
      const targetZoom = zoom || map.getZoom();
      map.flyTo([center.lat, center.lon], targetZoom, {
        duration: 0.75,
      });
    }
  }, [center, zoom, map]);
  return null;
};

// --- DrawControl ---
function DrawControl({ onPolygonCreated, deleteShape }) {
  const map = useMap();
  const drawnItemsFeatureGroupRef = useRef(new L.FeatureGroup());

  useEffect(() => {
    if (!map) return;
    L.drawLocal.edit.toolbar.actions.save.text = "Finish";
    L.drawLocal.edit.toolbar.actions.save.title = "Finish changes.";
    L.drawLocal.edit.toolbar.actions.cancel.text = "Cancel Delete";
    L.drawLocal.edit.toolbar.actions.cancel.title =
      "Cancel deletion, discard changes.";
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
      e.layers.eachLayer((layer) => {
        const featureId = L.Util.stamp(layer);
        if (deleteShape) deleteShape(featureId);
      });
    };
    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on("draw:deleted", handleDrawDeleted);
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
    const handleClick = (e) => onMapClick(e.latlng);
    map.on("click", handleClick);
    return () => map.off("click", handleClick);
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
  const [clickedNeighborhood, setClickedNeighborhood] = useState(null);
  // *** REMOVED: State managed by useNeighborhoodPropertySearch hook ***
  // const [neighborhoodProperties, setNeighborhoodProperties] = useState([]);
  // const [isFetchingNeighborhoodProps, setIsFetchingNeighborhoodProps] = useState(false);
  const [propertiesByPolygon, setPropertiesByPolygon] = useState({});
  const mapRef = useRef();

  // --- Context & Hooks ---
  const { user } = useContext(UserContext);
  const token = user?.token;
  const { selectedMapLocation } = useMapContext();
  const {
    isLoading: isLoadingPolygonProps,
    error: polygonError,
    fetchPropertiesForPolygon,
  } = usePolygonPropertySearch();
  // *** ADDED: Instantiate the neighborhood search hook ***
  const {
    neighborhoodProperties, // Get state from hook
    isLoading: isFetchingNeighborhoodProps, // Get loading state from hook
    error: neighborhoodSearchError, // Get error state from hook
    searchNeighborhood, // Get the trigger function from hook
  } = useNeighborhoodPropertySearch();
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
    // clearShapes, // Available but not used
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

  useEffect(() => {
    if (polygonError) {
      console.error("Polygon Search Error:", polygonError);
      alert(
        `Error fetching properties for the drawn area: ${polygonError.message}`
      );
    }
  }, [polygonError]);

  // *** ADDED: Effect to handle neighborhood search errors ***
  useEffect(() => {
    if (neighborhoodSearchError) {
      console.error("Neighborhood Search Error:", neighborhoodSearchError);
      alert(
        `Error fetching properties for neighborhood: ${neighborhoodSearchError.message}`
      );
    }
  }, [neighborhoodSearchError]);

  // Sync propertiesByPolygon with drawnItems on deletion
  useEffect(() => {
    const currentPolygonIds = new Set(drawnItems.map((item) => item.id));
    const nextPropertiesState = {};
    Object.entries(propertiesByPolygon).forEach(([key, value]) => {
      const numericKey = parseInt(key, 10);
      if (currentPolygonIds.has(numericKey)) {
        nextPropertiesState[key] = value;
      }
    });
    const currentKeys = Object.keys(propertiesByPolygon).sort().join(",");
    const nextKeys = Object.keys(nextPropertiesState).sort().join(",");
    if (currentKeys !== nextKeys) {
      setPropertiesByPolygon(nextPropertiesState);
    }
  }, [drawnItems, propertiesByPolygon]);

  // --- Core Functions ---
  const handlePolygonCreatedAndFetch = useCallback(
    (shapeData) => {
      addShape(shapeData);
      if (shapeData.id && shapeData.geoJSON) {
        // Clear other search contexts
        setSearchRadius(0);
        setClickedNeighborhood(null);
        // setNeighborhoodProperties([]); // State now managed by hook
        // setIsFetchingNeighborhoodProps(false); // State now managed by hook
        setSelectedLocationDetails(null);

        // Fetch properties and update propertiesByPolygon
        fetchPropertiesForPolygon(shapeData.id, shapeData.geoJSON)
          .then((properties) => {
            setPropertiesByPolygon((prev) => ({
              ...prev,
              [shapeData.id]: properties || [],
            }));
          })
          .catch((error) => {
            console.error(
              `Failed to fetch properties for polygon ${shapeData.id}:`,
              error
            );
            setPropertiesByPolygon((prev) => {
              const newState = { ...prev };
              delete newState[shapeData.id];
              return newState;
            });
          });
      } else {
        console.warn("Drawn shape missing ID or valid GeoJSON for fetch.");
      }
    },
    [addShape, fetchPropertiesForPolygon] // Removed hook state setters
  );

  // *** REMOVED: Old fetchPropertiesInNeighborhood useCallback ***
  // const fetchPropertiesInNeighborhood = useCallback( ... );

  // Fetch location details and FIND neighborhood (DOES NOT fetch properties)
  const fetchLocationDetailsAndNeighborhood = useCallback(
    async (lat, lng) => {
      // Clear previous search contexts *except* drawn polygons
      setSearchRadius(0);
      setClickedNeighborhood(null);
      // setNeighborhoodProperties([]); // State managed by hook
      setSelectedLocationDetails(null);
      // setIsFetchingNeighborhoodProps(false); // State managed by hook

      const tempPointGeoJSON = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: {
          name: `Loading... (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        },
      };
      setSelectedLocationDetails(tempPointGeoJSON);
      let fetchedDetails = tempPointGeoJSON;

      try {
        // Fetch Nominatim details
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
        setSelectedLocationDetails(fetchedDetails);
      }

      try {
        // Fetch neighborhood boundary from our backend
        const neighborhoodUrl = `${BASE_URL}/api/neighborhoods/by-coords?lat=${lat}&lon=${lng}`;
        const neighborhoodResponse = await fetch(neighborhoodUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
        console.error("Error fetching neighborhood boundary:", error);
        setClickedNeighborhood(null);
      }
    },
    [token] // Removed hook state setters
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
  const formatArea = useCallback((area) => {
    if (area === null || area === undefined) return "N/A";
    const areaSqM = parseFloat(area);
    if (isNaN(areaSqM)) return "N/A";
    if (areaSqM < 10000) return `${Math.round(areaSqM)} m²`;
    return `${(areaSqM / 1000000).toFixed(2)} km²`;
  }, []);

  // Handle radius change
  const handleRadiusChange = useCallback((e) => {
    const newRadius = parseFloat(e.target.value);
    setSearchRadius(newRadius);
    if (newRadius > 0) {
      setClickedNeighborhood(null);
      // setNeighborhoodProperties([]); // State managed by hook
      // setIsFetchingNeighborhoodProps(false); // State managed by hook
      setPropertiesByPolygon({});
    }
  }, []); // Removed hook state setters

  // *** MODIFIED: Use the hook's search function ***
  const handleSearchNeighborhoodClick = useCallback(() => {
    if (clickedNeighborhood?._id) {
      // Clear other search types
      setSearchRadius(0);
      setPropertiesByPolygon({});
      // Trigger the fetch using the hook's function
      searchNeighborhood(clickedNeighborhood._id); // *** Use hook function ***
    } else {
      alert("Please click on the map within a neighborhood first.");
    }
  }, [clickedNeighborhood, searchNeighborhood]); // *** Updated dependencies ***

  // Export drawn shapes
  const exportToGeoJSON = useCallback(() => {
    if (drawnItems.length === 0) {
      alert("No shapes drawn to export.");
      return;
    }
    const features = drawnItems.map((item) => item.geoJSON).filter((f) => f);
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
  }, [drawnItems]);

  // --- Calculations for Rendering ---
  const radiusCircleCenter = useMemo(() => {
    return selectedLocationDetails?.geometry?.coordinates
      ? [
          selectedLocationDetails.geometry.coordinates[1],
          selectedLocationDetails.geometry.coordinates[0],
        ]
      : null;
  }, [selectedLocationDetails]);

  // *** UPDATED: propertiesToDisplay uses neighborhoodProperties from hook ***
  const propertiesToDisplay = useMemo(() => {
    const allPolygonProperties = Object.values(propertiesByPolygon).flat();
    const uniquePropertiesMap = new Map();
    allPolygonProperties.forEach((prop) => {
      const key = prop._id || prop.propertyID;
      if (key && !uniquePropertiesMap.has(key))
        uniquePropertiesMap.set(key, prop);
    });
    const uniquePolygonProperties = Array.from(uniquePropertiesMap.values());

    if (uniquePolygonProperties.length > 0) {
      return uniquePolygonProperties;
    }
    // Use neighborhoodProperties directly from the hook's state
    if (neighborhoodProperties.length > 0) {
      return neighborhoodProperties;
    }
    if (searchRadius > 0) {
      return radiusSearchResults;
    }
    return [];
  }, [
    propertiesByPolygon,
    searchRadius,
    radiusSearchResults,
    neighborhoodProperties, // Now comes from the hook
  ]);

  // *** UPDATED: isLoadingProperties uses isFetchingNeighborhoodProps from hook ***
  const isLoadingProperties =
    isLoadingPolygonProps || isSearchingRadius || isFetchingNeighborhoodProps;
  const radiusOptions = [0, 0.5, 1, 3, 5, 10, 20, 50];

  // *** UPDATED: propertyMarkersKey uses neighborhoodProperties from hook ***
  const propertyMarkersKey = useMemo(() => {
    const polygonKeys = Object.keys(propertiesByPolygon);
    if (polygonKeys.length > 0) {
      return "polygons-" + polygonKeys.sort().join("-");
    }
    // Use neighborhoodProperties directly from the hook's state
    if (neighborhoodProperties.length > 0 && clickedNeighborhood?._id) {
      return `neigh-${clickedNeighborhood._id}`;
    }
    if (searchRadius > 0 && centerCoordsForSearch) {
      return `radius-${searchRadius}-${centerCoordsForSearch.join(",")}`;
    }
    return "no-active-search-" + Date.now(); // Use timestamp for fallback
  }, [
    propertiesByPolygon,
    searchRadius,
    clickedNeighborhood,
    centerCoordsForSearch,
    neighborhoodProperties, // Now comes from the hook
    // propertiesToDisplay, // Removed as it caused unnecessary key changes
  ]);

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
            <ChangeView
              center={selectedMapLocation}
              zoom={selectedMapLocation?.zoom}
            />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <AdjustZoomOnRadiusChange
              centerCoords={radiusCircleCenter}
              radius={searchRadius}
            />
            <NeighborhoodLayer clickedNeighborhood={clickedNeighborhood} />
            <SelectedLocationMarker locationDetails={selectedLocationDetails} />
            {searchRadius > 0 && radiusCircleCenter && (
              <RadiusCircleLayer
                centerCoords={radiusCircleCenter}
                radiusInMiles={searchRadius}
              />
            )}
            {/* PropertyMarkersLayer now uses the stable key */}
            <PropertyMarkersLayer
              key={propertyMarkersKey} // Use the calculated key
              properties={isLoadingProperties ? [] : propertiesToDisplay}
              formatCurrencyForDisplay={formatCurrencyForDisplay}
            />
            {/* Removed redundant PropertyMarkersLayer */}
            <DrawControl
              onPolygonCreated={handlePolygonCreatedAndFetch}
              deleteShape={deleteShape}
            />
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
        </div>

        {/* --- Map Overlay Controls --- */}
        <div className="map-controls-overlay">
          {/* Button uses isFetchingNeighborhoodProps from hook */}
          <button
            onClick={handleSearchNeighborhoodClick}
            disabled={!clickedNeighborhood || isFetchingNeighborhoodProps}
            className="map-overlay-button"
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
        {/* Pass hook state down to Sidebar */}
        <MapSidebar
          isSearching={isLoadingProperties}
          propertiesToDisplay={propertiesToDisplay}
          searchRadius={searchRadius}
          clickedNeighborhood={clickedNeighborhood}
          selectedLocationDetails={selectedLocationDetails}
          formatCurrencyForDisplay={formatCurrencyForDisplay}
          formatArea={formatArea}
          drawnItems={drawnItems}
          showPolygonCoordinates={showPolygonCoordinates}
          exportToGeoJSON={exportToGeoJSON}
          activePolygon={activePolygon}
          setActivePolygon={hideActivePolygonDetails}
          isLoadingPolygonProps={isLoadingPolygonProps}
          drawnShapePropertiesCount={
            Object.keys(propertiesByPolygon).length > 0
              ? propertiesToDisplay.length
              : 0
          }
          isFetchingNeighborhoodProps={isFetchingNeighborhoodProps} // Pass hook's loading state
          neighborhoodPropertiesCount={neighborhoodProperties.length} // Pass hook's results count
        />
      </div>
    </div>
  );
};

export default MapComponent;
