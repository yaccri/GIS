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
import MapControlsOverlay from "../components/map/MapControlsOverlay";

// --- Import Custom Hooks ---
import useRadiusSearch from "../hooks/useRadiusSearch";
import useDrawnShapes from "../hooks/useDrawnShapes";
import useActiveShapeDetails from "../hooks/useActiveShapeDetails";
import usePolygonPropertySearch from "../hooks/usePolygonPropertySearch";

// --- Import Custom Components ---
import AdjustZoomOnRadiusChange from "../components/map/AdjustZoomOnRadiusChange";
import SelectedLocationMarker from "../components/map/layers/SelectedLocationMarker";
import NeighborhoodLayer from "../components/map/layers/NeighborhoodLayer";
import RadiusCircleLayer from "../components/map/layers/RadiusCircleLayer";
import PropertyMarkersLayer from "../components/map/layers/PropertyMarkersLayer";
// --- NEW: Import Restaurant Layer (Step 4) ---
import RestaurantMarkersLayer from "../components/map/layers/RestaurantMarkersLayer";
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

    // --- Customize Leaflet Draw Text ---
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
        geoJsonCoords[0].push(geoJsonCoords[0][0]); // Close the polygon loop
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

    const handleDrawEdited = (e) => {
      e.layers.eachLayer((layer) => {
        const featureId = L.Util.stamp(layer);
        if (onPolygonCreated) {
          const latLngs = layer.getLatLngs()[0];
          const area = L.GeometryUtil.geodesicArea(latLngs);
          const center = layer.getBounds().getCenter();
          const geoJsonCoords = [
            latLngs.map((point) => [point.lng, point.lat]),
          ];
          geoJsonCoords[0].push(geoJsonCoords[0][0]); // Close the polygon loop
          const geoJsonGeometry = {
            type: "Polygon",
            coordinates: geoJsonCoords,
          };
          onPolygonCreated({
            id: featureId,
            type: layer instanceof L.Rectangle ? "rectangle" : "polygon",
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
      });
    };

    const handleDrawDeleted = (e) => {
      e.layers.eachLayer((layer) => {
        const featureId = L.Util.stamp(layer);
        if (deleteShape) {
          deleteShape(featureId);
        }
      });
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on(L.Draw.Event.EDITED, handleDrawEdited);
    map.on("draw:deleted", handleDrawDeleted);

    // --- Cleanup ---
    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
      map.off(L.Draw.Event.EDITED, handleDrawEdited);
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
  const [clickedNeighborhood, setClickedNeighborhood] = useState(null);
  const [neighborhoodProperties, setNeighborhoodProperties] = useState([]);
  const [isFetchingNeighborhoodProps, setIsFetchingNeighborhoodProps] =
    useState(false);
  const [propertiesByPolygon, setPropertiesByPolygon] = useState({});
  const mapRef = useRef();

  // --- State for Restaurants (Step 1) ---
  const [showRestaurants, setShowRestaurants] = useState(false);
  const [restaurantData, setRestaurantData] = useState([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);

  // --- Context & Hooks ---
  const { user } = useContext(UserContext);
  const token = user?.token;
  const { selectedMapLocation } = useMapContext();
  const {
    isLoading: isLoadingPolygonProps,
    error: polygonError,
    fetchPropertiesForPolygon,
  } = usePolygonPropertySearch();
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

  useEffect(() => {
    if (polygonError) {
      console.error("Polygon Search Error:", polygonError);
      alert(
        `Error fetching properties for the drawn area: ${polygonError.message}`
      );
    }
  }, [polygonError]);

  useEffect(() => {
    // Clean up propertiesByPolygon when drawnItems change
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
        setNeighborhoodProperties([]);
        setIsFetchingNeighborhoodProps(false);
        setSelectedLocationDetails(null); // Clear point selection

        // Fetch properties for the new polygon
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
            // Remove the polygon's entry if fetch fails
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
    [addShape, fetchPropertiesForPolygon]
  );

  const fetchPropertiesInNeighborhood = useCallback(
    async (neighborhoodId) => {
      if (!neighborhoodId || !token) return;
      setIsFetchingNeighborhoodProps(true);
      setNeighborhoodProperties([]);
      // Clear other search contexts
      setSearchRadius(0);
      setPropertiesByPolygon({});
      clearShapes(); // Clear drawn polygons when searching neighborhood

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
        setNeighborhoodProperties(data || []);
      } catch (error) {
        console.error("Error fetching properties in neighborhood:", error);
        setNeighborhoodProperties([]);
        alert(`Error fetching properties for neighborhood: ${error.message}`);
      } finally {
        setIsFetchingNeighborhoodProps(false);
      }
    },
    [token, clearShapes]
  );

  const fetchLocationDetailsAndNeighborhood = useCallback(
    async (lat, lng) => {
      // Clear other search contexts
      setSearchRadius(0);
      setClickedNeighborhood(null);
      setNeighborhoodProperties([]);
      setIsFetchingNeighborhoodProps(false);
      setPropertiesByPolygon({});
      clearShapes(); // Clear drawn polygons on map click

      // Set temporary location details
      const tempPointGeoJSON = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: {
          name: `Loading... (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        },
      };
      setSelectedLocationDetails(tempPointGeoJSON);

      let fetchedDetails = tempPointGeoJSON;
      // Fetch details from Nominatim
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
        setSelectedLocationDetails(fetchedDetails);
      }

      // Fetch neighborhood boundary
      try {
        const neighborhoodUrl = `${BASE_URL}/api/neighborhoods/by-coords?lat=${lat}&lon=${lng}`;
        const neighborhoodResponse = await fetch(neighborhoodUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (neighborhoodResponse.ok) {
          const neighborhoodData = await neighborhoodResponse.json();
          setClickedNeighborhood(neighborhoodData);
        } else if (neighborhoodResponse.status === 404) {
          setClickedNeighborhood(null); // No neighborhood found
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
    [token, clearShapes]
  );

  useEffect(() => {
    // Fetch details when selectedMapLocation changes from context
    if (selectedMapLocation?.lat && selectedMapLocation?.lon)
      fetchLocationDetailsAndNeighborhood(
        selectedMapLocation.lat,
        selectedMapLocation.lon
      );
  }, [selectedMapLocation, fetchLocationDetailsAndNeighborhood]);

  const handleMapClick = useCallback(
    (latlng) => {
      // Fetch details on direct map click
      fetchLocationDetailsAndNeighborhood(
        parseFloat(latlng.lat.toFixed(6)),
        parseFloat(latlng.lng.toFixed(6))
      );
    },
    [fetchLocationDetailsAndNeighborhood]
  );

  const formatArea = (area) => {
    if (area === null || area === undefined) return "N/A";
    const areaSqM = parseFloat(area);
    if (isNaN(areaSqM)) return "N/A";
    if (areaSqM < 10000) return `${Math.round(areaSqM)} m²`;
    return `${(areaSqM / 1000000).toFixed(2)} km²`;
  };

  const handleRadiusChange = (e) => {
    const newRadius = parseFloat(e.target.value);
    setSearchRadius(newRadius);
    if (newRadius > 0) {
      // Clear other search contexts when radius is selected
      setClickedNeighborhood(null);
      setNeighborhoodProperties([]);
      setIsFetchingNeighborhoodProps(false);
      setPropertiesByPolygon({});
      clearShapes(); // Clear drawn polygons
    }
  };

  const handleSearchNeighborhoodClick = useCallback(() => {
    if (clickedNeighborhood?._id) {
      // Clear other search contexts
      setSearchRadius(0);
      setPropertiesByPolygon({});
      clearShapes(); // Clear drawn polygons

      // Fetch properties for the neighborhood
      fetchPropertiesInNeighborhood(clickedNeighborhood._id);
    } else {
      alert("Please click on the map within a neighborhood first.");
    }
  }, [clickedNeighborhood, fetchPropertiesInNeighborhood, clearShapes]);

  // --- Fetch Restaurants Function (Step 3) ---
  const fetchRestaurants = useCallback(async () => {
    if (!token) {
      console.log("No token, skipping restaurant fetch.");
      setRestaurantData([]);
      return;
    }

    // Determine active search context (prioritize Polygon > Neighborhood > Radius)
    let url = "";
    let options = {
      method: "GET", // Default GET
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json", // Needed for POST
      },
      body: null,
    };
    let canFetch = false;

    // Use the latest drawn polygon if available
    const latestPolygon =
      drawnItems.length > 0 ? drawnItems[drawnItems.length - 1] : null;

    if (latestPolygon?.geoJSON?.geometry?.coordinates) {
      // Check deeper for coordinates
      console.log("Fetching restaurants by polygon:", latestPolygon.id);
      url = `${BASE_URL}/api/restaurants/in-polygon`;
      options.method = "POST";

      // Construct the body EXACTLY as the backend expects
      const requestBody = {
        coordinates: latestPolygon.geoJSON.geometry.coordinates,
      };
      options.body = JSON.stringify(requestBody); // Stringify the new object

      canFetch = true;
    } else if (clickedNeighborhood?._id) {
      console.log(
        "Fetching restaurants by neighborhood:",
        clickedNeighborhood._id
      );
      url = `${BASE_URL}/api/restaurants/in-neighborhood?neighborhoodId=${clickedNeighborhood._id}`;
      canFetch = true;
    } else if (searchRadius > 0 && centerCoordsForSearch) {
      console.log(
        "Fetching restaurants by radius:",
        searchRadius,
        centerCoordsForSearch
      );
      const [lng, lat] = centerCoordsForSearch;
      url = `${BASE_URL}/api/restaurants/radius?lat=${lat}&lon=${lng}&radius=${searchRadius}`;
      canFetch = true;
    } else {
      console.log("No active search context for restaurants.");
      setRestaurantData([]); // Clear data if no context
      setIsLoadingRestaurants(false); // Ensure loading is off
      return; // Don't fetch if no context
    }

    if (!canFetch || !url) {
      setRestaurantData([]);
      setIsLoadingRestaurants(false);
      return;
    }

    setIsLoadingRestaurants(true);
    setRestaurantData([]); // Clear previous results before fetching
    console.log("Fetching restaurants with URL:", url);
    console.log("With options:", options);
    console.log("With token:", token);
    console.log("With headers:", options.headers);
    console.log("With body:", options.body);
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to get error details
        throw new Error(
          errorData.message ||
            `Failed to fetch restaurants: ${response.statusText}`
        );
      }
      const data = await response.json();
      console.log("Fetched restaurants:", data);
      setRestaurantData(data || []);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setRestaurantData([]); // Clear data on error
      // Consider showing an alert or notification to the user
      // alert(`Error fetching restaurants: ${error.message}`);
    } finally {
      setIsLoadingRestaurants(false);
    }
  }, [
    token,
    drawnItems,
    clickedNeighborhood,
    searchRadius,
    centerCoordsForSearch,
    BASE_URL,
  ]);

  // --- useEffect to Trigger Fetching (Step 3) ---
  useEffect(() => {
    if (showRestaurants) {
      fetchRestaurants();
    } else {
      // Clear data and loading state when restaurants are hidden
      setRestaurantData([]);
      setIsLoadingRestaurants(false);
    }
  }, [showRestaurants, fetchRestaurants]);

  // --- Handler for Restaurant Toggle (Step 2 - Modified) ---
  const handleToggleRestaurants = () => {
    setShowRestaurants((prev) => !prev);
  };

  const exportToGeoJSON = () => {
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
  };

  const radiusCircleCenter = useMemo(() => {
    return selectedLocationDetails?.geometry?.coordinates
      ? [
          selectedLocationDetails.geometry.coordinates[1], // lat
          selectedLocationDetails.geometry.coordinates[0], // lng
        ]
      : null;
  }, [selectedLocationDetails]);

  // --- Determine Properties to Display ---
  const propertiesToDisplay = useMemo(() => {
    const allPolygonProperties = Object.values(propertiesByPolygon).flat();
    const uniquePropertiesMap = new Map();
    allPolygonProperties.forEach((prop) => {
      const key = prop._id || prop.propertyID;
      if (key && !uniquePropertiesMap.has(key)) {
        uniquePropertiesMap.set(key, prop);
      }
    });
    const uniquePolygonProperties = Array.from(uniquePropertiesMap.values());

    if (uniquePolygonProperties.length > 0) {
      return uniquePolygonProperties;
    } else if (neighborhoodProperties.length > 0) {
      return neighborhoodProperties;
    } else if (searchRadius > 0 && radiusSearchResults.length > 0) {
      return radiusSearchResults;
    }
    return [];
  }, [
    propertiesByPolygon,
    searchRadius,
    radiusSearchResults,
    neighborhoodProperties,
  ]);

  const isLoadingProperties =
    isLoadingPolygonProps || isSearchingRadius || isFetchingNeighborhoodProps;
  const radiusOptions = [0, 0.5, 1, 3, 5, 10, 20, 50];

  // --- Key for PropertyMarkersLayer to force re-render ---
  const propertyMarkersKey = useMemo(() => {
    const polygonKeys = Object.keys(propertiesByPolygon);
    if (polygonKeys.length > 0) {
      return "polygons-" + polygonKeys.sort().join("-");
    } else if (clickedNeighborhood?._id && neighborhoodProperties.length > 0) {
      return `neigh-${clickedNeighborhood._id}`;
    } else if (searchRadius > 0 && centerCoordsForSearch) {
      return `radius-${searchRadius}-${centerCoordsForSearch.join(",")}`;
    }
    return "no-active-search-" + propertiesToDisplay.length;
  }, [
    propertiesByPolygon,
    searchRadius,
    clickedNeighborhood,
    centerCoordsForSearch,
    neighborhoodProperties,
    propertiesToDisplay.length,
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
            {/* --- Base Layers & Controls --- */}
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
            <DrawControl
              onPolygonCreated={handlePolygonCreatedAndFetch}
              deleteShape={deleteShape}
            />
            <MapClickHandler onMapClick={handleMapClick} />

            {/* --- Dynamic Data Layers --- */}
            <NeighborhoodLayer clickedNeighborhood={clickedNeighborhood} />
            <SelectedLocationMarker locationDetails={selectedLocationDetails} />
            {searchRadius > 0 && radiusCircleCenter && (
              <RadiusCircleLayer
                centerCoords={radiusCircleCenter}
                radiusInMiles={searchRadius}
              />
            )}
            {/* Property Markers Layer */}
            <PropertyMarkersLayer
              key={propertyMarkersKey}
              properties={isLoadingProperties ? [] : propertiesToDisplay}
              formatCurrencyForDisplay={formatCurrencyForDisplay}
            />

            {/* --- NEW: Restaurant Layer (Step 4) --- */}
            {showRestaurants &&
              !isLoadingRestaurants &&
              restaurantData.length > 0 && (
                <RestaurantMarkersLayer restaurants={restaurantData} />
              )}
          </MapContainer>
        </div>

        {/* --- Map Overlays --- */}
        <MapControlsOverlay
          onSearchNeighborhoodClick={handleSearchNeighborhoodClick}
          neighborhoodInfo={clickedNeighborhood}
          isFetchingNeighborhoodProps={isFetchingNeighborhoodProps}
          locationDetails={selectedLocationDetails}
          radiusOptions={radiusOptions}
          searchRadius={searchRadius}
          onRadiusChange={handleRadiusChange}
          // Pass Restaurant State and Handler
          showRestaurants={showRestaurants}
          onToggleRestaurants={handleToggleRestaurants}
          isLoadingRestaurants={isLoadingRestaurants}
        />
      </div>

      {/* --- Sidebar --- */}
      <div className="search-container">
        <MapSidebar
          // Property related props
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
          isFetchingNeighborhoodProps={isFetchingNeighborhoodProps}
          neighborhoodPropertiesCount={neighborhoodProperties.length}
          // Restaurant related props
          isLoadingRestaurants={isLoadingRestaurants}
          restaurantData={restaurantData}
          showRestaurants={showRestaurants}
        />
      </div>
    </div>
  );
};

export default MapComponent;
