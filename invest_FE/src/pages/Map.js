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
//import useActiveShapeDetails from "../hooks/useActiveShapeDetails";
import usePolygonPropertySearch from "../hooks/usePolygonPropertySearch";

// --- Import Custom Components ---
import AdjustZoomOnRadiusChange from "../components/map/AdjustZoomOnRadiusChange";
import SelectedLocationMarker from "../components/map/layers/SelectedLocationMarker";
import NeighborhoodLayer from "../components/map/layers/NeighborhoodLayer";
import RadiusCircleLayer from "../components/map/layers/RadiusCircleLayer";
import PropertyMarkersLayer from "../components/map/layers/PropertyMarkersLayer";
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
        duration: 1.0,
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
  const [restaurantsByPolygon, setRestaurantsByPolygon] = useState({});
  const [markersVersion, setMarkersVersion] = useState(0); // Added to force marker layer refresh
  const mapRef = useRef();

  // --- State for Restaurants ---
  const [showRestaurants, setShowRestaurants] = useState(false);
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
    deleteShape: originalDeleteShape,
    clearShapes,
  } = useDrawnShapes();
  // const {
  //   activeShape: activePolygon,
  //   showDetails: showPolygonCoordinates,
  //   hideDetails: hideActivePolygonDetails,
  // } = useActiveShapeDetails();

  // --- Modified Delete Shape ---
  const deleteShape = useCallback(
    (id) => {
      console.log(`Deleting polygon with id: ${id}`);
      originalDeleteShape(id);
      setPropertiesByPolygon((prev) => {
        const newState = { ...prev };
        delete newState[id];
        console.log("Updated propertiesByPolygon:", newState);
        return newState;
      });
      setRestaurantsByPolygon((prev) => {
        const newState = { ...prev };
        delete newState[id];
        console.log("Updated restaurantsByPolygon:", newState);
        return newState;
      });
      setMarkersVersion((prev) => prev + 1); // Increment to force marker layer refresh
    },
    [originalDeleteShape]
  );

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
    // Only remove data for polygons that no longer exist
    setPropertiesByPolygon((prev) => {
      const currentPolygonIds = new Set(drawnItems.map((item) => item.id));
      const nextPropertiesState = {};
      Object.entries(prev).forEach(([key, value]) => {
        const numericKey = parseInt(key, 10);
        if (currentPolygonIds.has(numericKey)) {
          nextPropertiesState[key] = value;
        }
      });
      console.log(
        "useEffect updated propertiesByPolygon:",
        nextPropertiesState
      );
      return nextPropertiesState;
    });
    setRestaurantsByPolygon((prev) => {
      const currentPolygonIds = new Set(drawnItems.map((item) => item.id));
      const nextRestaurantsState = {};
      Object.entries(prev).forEach(([key, value]) => {
        const numericKey = parseInt(key, 10);
        if (currentPolygonIds.has(numericKey)) {
          nextRestaurantsState[key] = value;
        }
      });
      console.log(
        "useEffect updated restaurantsByPolygon:",
        nextRestaurantsState
      );
      return nextRestaurantsState;
    });
  }, [drawnItems]);

  // --- Core Functions ---
  const handlePolygonCreatedAndFetch = useCallback(
    (shapeData) => {
      addShape(shapeData);
      if (shapeData.id && shapeData.geoJSON) {
        // Clear non-polygon search contexts
        setSearchRadius(0);
        setClickedNeighborhood(null);
        setNeighborhoodProperties([]);
        setIsFetchingNeighborhoodProps(false);
        setSelectedLocationDetails(null);

        // Fetch properties
        fetchPropertiesForPolygon(shapeData.id, shapeData.geoJSON)
          .then((properties) => {
            setPropertiesByPolygon((prev) => ({
              ...prev,
              [shapeData.id]: properties || [],
            }));
            setMarkersVersion((prev) => prev + 1); // Refresh markers
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
            setMarkersVersion((prev) => prev + 1); // Refresh markers
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
      setSearchRadius(0);
      setPropertiesByPolygon({});
      setRestaurantsByPolygon({});
      clearShapes();
      setMarkersVersion((prev) => prev + 1); // Refresh markers

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
        setMarkersVersion((prev) => prev + 1); // Refresh markers
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
      // Only clear non-polygon contexts if no polygons are drawn
      if (drawnItems.length === 0) {
        setSearchRadius(0);
        setClickedNeighborhood(null);
        setNeighborhoodProperties([]);
        setIsFetchingNeighborhoodProps(false);
        setMarkersVersion((prev) => prev + 1); // Refresh markers
      }

      // Set temporary location details
      const tempPointGeoJSON = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: {
          name: `Loading... (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        },
      };
      setSelectedLocationDetails(tempPointGeoJSON);
      // *** I suspect that the selectedLocationDetails is redundant and can be removed. Review later. ***
      // *** If it is found redundant, remove the following fetch, and also the props from SelectedLocationMarker, MapSidebar, MapControlsOverlay ***
      let fetchedDetails = tempPointGeoJSON;
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
    [token, drawnItems.length]
  );

  useEffect(() => {
    if (selectedMapLocation?.lat && selectedMapLocation?.lon)
      fetchLocationDetailsAndNeighborhood(
        selectedMapLocation.lat,
        selectedMapLocation.lon
      );
  }, [selectedMapLocation, fetchLocationDetailsAndNeighborhood]);

  const handleMapClick = useCallback(
    (latlng) => {
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
      setClickedNeighborhood(null);
      setNeighborhoodProperties([]);
      setIsFetchingNeighborhoodProps(false);
      setPropertiesByPolygon({});
      setRestaurantsByPolygon({});
      clearShapes();
      setMarkersVersion((prev) => prev + 1); // Refresh markers
    }
  };

  const handleSearchNeighborhoodClick = useCallback(() => {
    if (clickedNeighborhood?._id) {
      setSearchRadius(0);
      setPropertiesByPolygon({});
      setRestaurantsByPolygon({});
      clearShapes();
      fetchPropertiesInNeighborhood(clickedNeighborhood._id);
    } else {
      alert("Please click on the map within a neighborhood first.");
    }
  }, [clickedNeighborhood, fetchPropertiesInNeighborhood, clearShapes]);

  // --- Fetch Restaurants Function ---
  const fetchRestaurants = useCallback(async () => {
    if (!token || !showRestaurants) {
      setRestaurantsByPolygon({});
      setIsLoadingRestaurants(false);
      setMarkersVersion((prev) => prev + 1); // Refresh markers
      return;
    }

    setIsLoadingRestaurants(true);

    try {
      let fetchedData = [];

      if (drawnItems.length > 0) {
        console.log(
          `Fetching restaurants for ${drawnItems.length} polygons...`
        );

        const fetchPromises = drawnItems
          .filter((item) => item?.geoJSON?.geometry?.coordinates)
          .map((item) => {
            const requestBody = {
              coordinates: item.geoJSON.geometry.coordinates,
            };
            return fetch(`${BASE_URL}/api/restaurants/in-polygon`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            })
              .then((res) => {
                if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                return res.json();
              })
              .then((data) => ({ id: item.id, restaurants: data || [] }))
              .catch((err) => {
                console.error(`Error for polygon ${item.id}:`, err);
                return { id: item.id, restaurants: [] };
              });
          });

        const results = await Promise.all(fetchPromises);
        const newRestaurantsByPolygon = {};
        results.forEach(({ id, restaurants }) => {
          newRestaurantsByPolygon[id] = restaurants;
        });
        setRestaurantsByPolygon((prev) => ({
          ...prev,
          ...newRestaurantsByPolygon,
        }));
        fetchedData = results.flatMap((result) => result.restaurants);
      } else if (clickedNeighborhood?._id) {
        console.log(
          "Fetching restaurants by neighborhood:",
          clickedNeighborhood._id
        );
        const url = `${BASE_URL}/api/restaurants/in-neighborhood?neighborhoodId=${clickedNeighborhood._id}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
          throw new Error(
            `Neighborhood restaurant fetch failed: ${response.statusText}`
          );
        fetchedData = (await response.json()) || [];
        setRestaurantsByPolygon({ neighborhood: fetchedData });
      } else if (searchRadius > 0 && centerCoordsForSearch) {
        console.log(
          "Fetching restaurants by radius:",
          searchRadius,
          centerCoordsForSearch
        );
        const [lng, lat] = centerCoordsForSearch;
        const url = `${BASE_URL}/api/restaurants/radius?lat=${lat}&lon=${lng}&radius=${searchRadius}`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
          throw new Error(
            `Radius restaurant fetch failed: ${response.statusText}`
          );
        fetchedData = (await response.json()) || [];
        setRestaurantsByPolygon({ radius: fetchedData });
      }

      const uniqueRestaurants = new Map();
      fetchedData.forEach((resto) => {
        if (resto?._id && !uniqueRestaurants.has(resto._id)) {
          uniqueRestaurants.set(resto._id, resto);
        }
      });
      const finalData = Array.from(uniqueRestaurants.values());
      console.log(
        `Fetched and combined ${finalData.length} unique restaurants.`
      );
      setMarkersVersion((prev) => prev + 1); // Refresh markers
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setRestaurantsByPolygon({});
      setMarkersVersion((prev) => prev + 1); // Refresh markers
    } finally {
      setIsLoadingRestaurants(false);
    }
  }, [
    token,
    showRestaurants,
    drawnItems,
    clickedNeighborhood,
    searchRadius,
    centerCoordsForSearch,
  ]);

  // --- useEffect to Trigger Fetching ---
  useEffect(() => {
    if (showRestaurants) {
      fetchRestaurants();
    } else {
      setRestaurantsByPolygon({});
      setIsLoadingRestaurants(false);
      setMarkersVersion((prev) => prev + 1); // Refresh markers
    }
  }, [showRestaurants, fetchRestaurants]);

  // --- Handler for Restaurant Toggle ---
  const handleToggleRestaurants = () => {
    setShowRestaurants((prev) => !prev);
  };

  // const exportToGeoJSON = () => {
  //   if (drawnItems.length === 0) {
  //     alert("No shapes drawn to export.");
  //     return;
  //   }
  //   const features = drawnItems.map((item) => item.geoJSON).filter((f) => f);
  //   if (features.length === 0) {
  //     alert("No valid shapes for export.");
  //     return;
  //   }
  //   const geoJSONCollection = { type: "FeatureCollection", features: features };
  //   const dataStr = JSON.stringify(geoJSONCollection, null, 2);
  //   const dataUri =
  //     "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  //   const exportFileDefaultName = "drawn_shapes.geojson";
  //   const linkElement = document.createElement("a");
  //   linkElement.setAttribute("href", dataUri);
  //   linkElement.setAttribute("download", exportFileDefaultName);
  //   document.body.appendChild(linkElement);
  //   linkElement.click();
  //   document.body.removeChild(linkElement);
  // };

  const radiusCircleCenter = useMemo(() => {
    return selectedLocationDetails?.geometry?.coordinates
      ? [
          selectedLocationDetails.geometry.coordinates[1], // lat
          selectedLocationDetails.geometry.coordinates[0], // lng
        ]
      : null;
  }, [selectedLocationDetails]);

  // --- Determine Properties and Restaurants to Display ---
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
      console.log("Displaying polygon properties:", uniquePolygonProperties);
      return uniquePolygonProperties;
    } else if (neighborhoodProperties.length > 0) {
      console.log(
        "Displaying neighborhood properties:",
        neighborhoodProperties
      );
      return neighborhoodProperties;
    } else if (searchRadius > 0 && radiusSearchResults.length > 0) {
      console.log("Displaying radius properties:", radiusSearchResults);
      return radiusSearchResults;
    }
    console.log("No properties to display");
    return [];
  }, [
    propertiesByPolygon,
    searchRadius,
    radiusSearchResults,
    neighborhoodProperties,
  ]);

  const restaurantsToDisplay = useMemo(() => {
    const allRestaurants = Object.values(restaurantsByPolygon).flat();
    const uniqueRestaurantsMap = new Map();
    allRestaurants.forEach((resto) => {
      if (resto?._id) uniqueRestaurantsMap.set(resto._id, resto);
    });
    const result = Array.from(uniqueRestaurantsMap.values());
    console.log("Displaying restaurants:", result);
    return result;
  }, [restaurantsByPolygon]);

  const isLoadingProperties =
    isLoadingPolygonProps || isSearchingRadius || isFetchingNeighborhoodProps;
  const radiusOptions = [0, 0.5, 1, 3, 5, 10, 20, 50];

  // --- Key for PropertyMarkersLayer to force re-render ---
  const propertyMarkersKey = useMemo(() => {
    const polygonKeys = Object.keys(propertiesByPolygon).sort().join("-");
    if (polygonKeys) {
      return `polygons-${polygonKeys}-${markersVersion}`;
    } else if (clickedNeighborhood?._id && neighborhoodProperties.length > 0) {
      return `neigh-${clickedNeighborhood._id}-${markersVersion}`;
    } else if (searchRadius > 0 && centerCoordsForSearch) {
      return `radius-${searchRadius}-${centerCoordsForSearch.join(
        ","
      )}-${markersVersion}`;
    }
    return `no-active-search-${propertiesToDisplay.length}-${markersVersion}`;
  }, [
    propertiesByPolygon,
    searchRadius,
    clickedNeighborhood,
    centerCoordsForSearch,
    neighborhoodProperties,
    propertiesToDisplay.length,
    markersVersion,
  ]);

  const restaurantMarkersKey = useMemo(() => {
    const restaurantKeys = Object.keys(restaurantsByPolygon).sort().join("-");
    return `restaurants-${restaurantKeys}-${markersVersion}`;
  }, [restaurantsByPolygon, markersVersion]);

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

            {/* --- Restaurant Layer --- */}
            {showRestaurants &&
              !isLoadingRestaurants &&
              restaurantsToDisplay.length > 0 && (
                <RestaurantMarkersLayer
                  key={restaurantMarkersKey}
                  restaurants={restaurantsToDisplay}
                />
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
          showRestaurants={showRestaurants}
          onToggleRestaurants={handleToggleRestaurants}
          isLoadingRestaurants={isLoadingRestaurants}
        />
      </div>

      {/* --- Sidebar --- */}
      <div className="search-container">
        <MapSidebar
          // --- Loading States ---
          isSearching={isLoadingProperties} // Combined loading state for any property search
          // isLoadingPolygonProps={isLoadingPolygonProps} // Specific loading state for polygon property search
          // isFetchingNeighborhoodProps={isFetchingNeighborhoodProps} // Specific loading state for neighborhood property search
          // isLoadingRestaurants={isLoadingRestaurants} // Loading state for restaurant search
          // --- Data ---
          propertiesToDisplay={propertiesToDisplay} // Array of properties (from polygon, neighborhood, or radius)
          // drawnItems={drawnItems} // Array of drawn shape objects (polygons/rectangles)
          // restaurantData={restaurantsToDisplay} // Array of restaurant objects to display
          // --- Context/State Information ---
          searchRadius={searchRadius} // Current radius value (number)
          clickedNeighborhood={clickedNeighborhood} // Object with details of the clicked neighborhood, or null
          selectedLocationDetails={selectedLocationDetails} // GeoJSON Feature object of the last clicked/searched point, or null
          // activePolygon={activePolygon} // The specific drawn shape object whose details are active, or null
          // showRestaurants={showRestaurants} // Boolean indicating if restaurant layer/data is active
          // --- Counts ---
          // drawnShapePropertiesCount={
          //   // Number of properties found within drawn shapes
          //   Object.keys(propertiesByPolygon).length > 0
          //     ? propertiesToDisplay.length
          //     : 0
          // }
          // neighborhoodPropertiesCount={neighborhoodProperties.length} // Number of properties found in the clicked neighborhood
          // --- Functions/Handlers ---
          formatCurrencyForDisplay={formatCurrencyForDisplay} // Utility function for formatting currency
          formatArea={formatArea} // Utility function (defined in Map.js) for formatting area
          // showPolygonCoordinates={showPolygonCoordinates} // Function from useActiveShapeDetails hook to make a shape active
          // exportToGeoJSON={exportToGeoJSON} // Function (defined in Map.js) to trigger GeoJSON export
          // setActivePolygon={hideActivePolygonDetails} // Function from useActiveShapeDetails hook to deactivate the active shape (prop name might be slightly misleading)
        />
      </div>
    </div>
  );
};

export default MapComponent;
