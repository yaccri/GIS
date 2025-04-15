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
  Marker,
  Popup,
  useMap, // Keep useMap for internal components
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
import { UserContext } from "../context/UserContext";
import { useMapContext } from "../context/MapContext";
import {
  formatCurrencyForDisplay,
  formatPriceForPin,
} from "../utils/currencyFormatter";
import MapSidebar from "../components/map/MapSidebar";

// --- Import Custom Hooks ---
import useRadiusSearch from "../hooks/useRadiusSearch";
import useDrawnShapes from "../hooks/useDrawnShapes";
import useActiveShapeDetails from "../hooks/useActiveShapeDetails"; // <-- Import the new hook

// --- Import Custom Components ---
import AdjustZoomOnRadiusChange from "../components/map/AdjustZoomOnRadiusChange";

// --- Fix for default marker icon ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// --- Helper functions ---
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

const createNeighborhoodLabelIcon = (name) => {
  return L.divIcon({
    html: `<div class="label-content">${name}</div>`,
    className: "neighborhood-label-icon",
    iconSize: null,
    iconAnchor: [30, 8],
  });
};

function searchPropertiesInPolygon(polygon) {
  console.warn("Search properties in polygon triggered:", polygon);
  alert(
    "Searching properties within the selected polygon is not implemented yet."
  );
}

// --- React Components (Internal to Map or could be moved later) ---

// ChangeView remains internal as it's tightly coupled to selectedMapLocation context
const ChangeView = ({ center, zoom }) => {
  // Keep zoom prop definition even if not always passed
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      typeof center.lat === "number" &&
      typeof center.lon === "number"
    ) {
      // Always use flyTo for smoother transitions, even if zoom isn't specified.
      // Use the provided zoom, or default to the map's current zoom level.
      const targetZoom = zoom || map.getZoom();
      console.log(
        `Flying map to: [${center.lat}, ${center.lon}] with zoom ${targetZoom}`
      );
      map.flyTo([center.lat, center.lon], targetZoom, {
        duration: 0.75, // Duration in seconds
      });
    }
  }, [center, zoom, map]); // Keep dependencies
  return null;
};

// DrawControl remains internal as it uses onPolygonCreated callback directly
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
        const coordinates = latLngs.map((point) => [point.lat, point.lng]);
        const geoJsonCoords = [
          coordinates.map((coord) => [coord[1], coord[0]]),
        ];
        geoJsonCoords[0].push(geoJsonCoords[0][0]);
        const geoJsonGeometry = { type: "Polygon", coordinates: geoJsonCoords };
        onPolygonCreated({
          id: L.Util.stamp(layer),
          type: e.layerType,
          coordinates: coordinates,
          center: layer.getBounds().getCenter(),
          area: L.GeometryUtil.geodesicArea(latLngs),
          geoJSON: {
            type: "Feature",
            geometry: geoJsonGeometry,
            properties: { id: L.Util.stamp(layer) },
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

// RadiusCircle remains internal - simple display component
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

// MapClickHandler remains internal - uses onMapClick callback directly
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

// DisplayPolygons remains internal - simple display component
function DisplayPolygons({ polygons }) {
  return (
    <>
      {polygons.map((polygon) => {
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
  // Removed activePolygon state - now managed by useActiveShapeDetails hook
  // const [activePolygon, setActivePolygon] = useState(null);
  const [searchRadius, setSearchRadius] = useState(0);
  const [clickedNeighborhood, setClickedNeighborhood] = useState(null);
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
    isLoading: isSearching,
    error: radiusSearchError,
  } = useRadiusSearch(centerCoordsForSearch, searchRadius, token);

  const {
    shapes: drawnItems,
    addShape: handlePolygonCreated,
    deleteShape: handleDeletePolygon,
  } = useDrawnShapes();

  // Instantiate the new hook for active shape details
  const {
    activeShape: activePolygon, // Rename back for consistency
    showDetails: showPolygonCoordinates, // Rename back
    hideDetails: hideActivePolygonDetails, // Function to clear the active polygon
  } = useActiveShapeDetails();

  // --- Effects ---
  useEffect(() => {
    if (radiusSearchError) {
      console.error("Radius Search Error:", radiusSearchError);
      // alert(`Radius Search Error: ${radiusSearchError}`); // Optional user feedback
    }
  }, [radiusSearchError]);

  // --- Core Functions ---
  const fetchLocationDetailsAndNeighborhood = useCallback(async (lat, lng) => {
    setClickedNeighborhood(null);
    setSelectedLocationDetails(null);
    const tempPointGeoJSON = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: { name: `Loading... (${lat.toFixed(6)}, ${lng.toFixed(6)})` },
    };
    setSelectedLocationDetails(tempPointGeoJSON);
    let fetchedDetails = tempPointGeoJSON;
    try {
      // Fetch Reverse Geocoding
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
    try {
      // Fetch Neighborhood Data
      const neighborhoodResponse = await fetch(
        `http://localhost:4000/api/neighborhoods/by-coords?lat=${lat}&lon=${lng}`
      );
      if (neighborhoodResponse.ok)
        setClickedNeighborhood(await neighborhoodResponse.json());
      else if (neighborhoodResponse.status === 404)
        setClickedNeighborhood(null);
      else
        throw new Error(
          `Neighborhood fetch failed: ${neighborhoodResponse.statusText}`
        );
    } catch (error) {
      console.error("Error fetching neighborhood:", error);
      setClickedNeighborhood(null);
    }
  }, []);

  useEffect(() => {
    if (selectedMapLocation?.lat && selectedMapLocation?.lon) {
      fetchLocationDetailsAndNeighborhood(
        selectedMapLocation.lat,
        selectedMapLocation.lon
      );
    }
  }, [selectedMapLocation, fetchLocationDetailsAndNeighborhood]);

  const handleMapClick = useCallback(
    (latlng) => {
      const lat = parseFloat(latlng.lat.toFixed(6));
      const lng = parseFloat(latlng.lng.toFixed(6));
      fetchLocationDetailsAndNeighborhood(lat, lng);
    },
    [fetchLocationDetailsAndNeighborhood]
  );

  // Removed the old showPolygonCoordinates handler function
  // const showPolygonCoordinates = (polygon) => {
  //   setActivePolygon(polygon);
  // };

  const formatArea = (area) => {
    if (!area) return "N/A";
    if (area < 10000) return `${Math.round(area)} m²`;
    return `${(area / 1000000).toFixed(2)} km²`;
  };
  const handleRadiusChange = (e) => {
    setSearchRadius(parseFloat(e.target.value));
  };

  const exportToGeoJSON = () => {
    if (drawnItems.length === 0) {
      alert("No shapes drawn to export.");
      return;
    }
    const features = drawnItems.map(
      (item) =>
        item.geoJSON || {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              item.coordinates.map((coord) => [coord[1], coord[0]]),
            ],
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
            center={initialCenter}
            zoom={initialZoom}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            {/* --- Base Layer & View Control --- */}
            <ChangeView center={selectedMapLocation} />
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
            {selectedLocationDetails?.geometry?.coordinates && (
              <Marker
                position={[
                  selectedLocationDetails.geometry.coordinates[1],
                  selectedLocationDetails.geometry.coordinates[0],
                ]}
              >
                {" "}
                <Popup>
                  {selectedLocationDetails.properties.name || "Selected Point"}
                </Popup>{" "}
              </Marker>
            )}
            {radiusCircleCenter && searchRadius > 0 && (
              <RadiusCircle center={radiusCircleCenter} radius={searchRadius} />
            )}
            <DisplayPolygons polygons={drawnItems} />
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
        </div>
        {/* --- Radius Search Controls Overlay --- */}
        <div className="map-controls-overlay">
          {selectedLocationDetails && (
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
          formatCurrencyForDisplay={formatCurrencyForDisplay}
          drawnItems={drawnItems}
          handleDeletePolygon={handleDeletePolygon}
          showPolygonCoordinates={showPolygonCoordinates} // Pass function from hook
          formatArea={formatArea}
          exportToGeoJSON={exportToGeoJSON}
          searchPropertiesInPolygon={searchPropertiesInPolygon}
          activePolygon={activePolygon} // Pass state from hook
          setActivePolygon={hideActivePolygonDetails} // Pass function from hook to clear active polygon
        />
      </div>
    </div>
  );
};

export default MapComponent;
