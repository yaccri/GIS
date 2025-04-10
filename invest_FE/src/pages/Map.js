import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polygon, FeatureGroup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-geometryutil';
import './Map.css';
import { searchPropertiesInRadius } from '../components/SearchRadius';
import PolygonRectangleDrawingControls from '../components/PolygonRectangleDrawingControls';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Dummy implementation for createCircleGeometry
function createCircleGeometry(center, radius, segments) {
  // Create a simple circular geometry approximation (in degrees).
  // Note: This conversion factor is approximate.
  const factor = 0.0000089; // ~meters to degrees conversion factor
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const dx = radius * Math.cos(angle) * factor;
    const dy = radius * Math.sin(angle) * factor;
    points.push([center[0] + dx, center[1] + dy]);
  }
  return points;
}

// Dummy implementation for generateRandomPointInCircle
function generateRandomPointInCircle(center, radius) {
  // Generate a random point within the circle (radius in meters)
  const factor = 0.0000089;
  const angle = Math.random() * Math.PI * 2;
  const r = radius * Math.sqrt(Math.random());
  const dx = r * Math.cos(angle) * factor;
  const dy = r * Math.sin(angle) * factor;
  return [center[0] + dx, center[1] + dy];
}

// Dummy implementation for exportSavedSearches
function exportSavedSearches() {
  alert('Export saved searches is not implemented yet.');
}

// Dummy implementation for viewSavedSearch
function viewSavedSearch(search) {
  alert(`Viewing details for saved search: ${search.centerName}`);
}

// Dummy implementation for searchPropertiesInPolygon
function searchPropertiesInPolygon(polygon) {
  alert('searchPropertiesInPolygon is not implemented yet.');
}

// Component to update map view
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

// Drawing control component
function DrawControl({ onPolygonCreated }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Initialize FeatureGroup to store editable layers
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    
    // Initialize draw control
    const drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        marker: false,
        circlemarker: false,
        circle: false,
        rectangle: {
          shapeOptions: {
            color: '#3388ff',
            weight: 3,
            fillOpacity: 0.2
          }
        },
        polyline: false,
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: 'צורות לא יכולות להצטלב'
          },
          shapeOptions: {
            color: '#3388ff',
            weight: 3,
            fillOpacity: 0.2
          }
        }
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    });
    
    map.addControl(drawControl);
    
    // Handle the drawing created event
    map.on(L.Draw.Event.CREATED, function (e) {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      
      if (onPolygonCreated) {
        const coordinates = layer.getLatLngs()[0].map(point => [point.lat, point.lng]);
        onPolygonCreated({ 
          id: Date.now().toString(),
          type: e.layerType,
          coordinates: coordinates,
          center: layer.getBounds().getCenter(),
          area: L.GeometryUtil.geodesicArea(coordinates.map(coord => L.latLng(coord[0], coord[1])))
        });
      }
    });
    
    // Clean up on unmount
    return () => {
      map.removeLayer(drawnItems);
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED);
    };
  }, [map, onPolygonCreated]);
  
  return null;
}

// Component to display radius circle
function RadiusCircle({ center, radius }) {
  if (!center || !radius) return null;
  
  // Convert miles to meters (1 mile = 1609.34 meters)
  const radiusInMeters = radius * 1609.34;
  
  return (
    <Circle 
      center={center} 
      radius={radiusInMeters} 
      pathOptions={{
        color: '#FF4500',
        fillColor: '#FF4500',
        fillOpacity: 0.1,
        weight: 2
      }}
    />
  );
}

// Component that adds click event to map
function MapClickHandler({ onMapClick }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e) => {
      onMapClick(e.latlng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
}

// Component to display drawn polygons on the map
function DisplayPolygons({ polygons }) {
  return (
    <>
      {polygons.map(polygon => {
        const latLngs = polygon.coordinates.map(coord => [coord[0], coord[1]]);
        return (
          <React.Fragment key={polygon.id}>
            {polygon.type === 'polygon' ? (
              <Polygon 
                positions={latLngs}
                pathOptions={{
                  color: '#3388ff',
                  weight: 3,
                  fillOpacity: 0.2
                }}
              />
            ) : (
              <Polygon 
                positions={latLngs}
                pathOptions={{
                  color: '#3388ff',
                  weight: 3,
                  fillOpacity: 0.2
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

const MapComponent = () => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapState, setMapState] = useState({
    center: [40.7128, -74.0060], // New York coordinates
    zoom: 13
  });
  const [drawnItems, setDrawnItems] = useState([]);
  const [activePolygon, setActivePolygon] = useState(null);
  const [searchRadius, setSearchRadius] = useState(0); // 0 = no radius
  const [radiusSearchResults, setRadiusSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [activeSearch, setActiveSearch] = useState(null);
  const searchTimeout = useRef(null);
  const [clickedPoint, setClickedPoint] = useState(null);
  const [drawnShape, setDrawnShape] = useState(null);
  const featureGroupRef = useRef();
  const mapRef = useRef();
  const [coordinates, setCoordinates] = useState({
    longitude: '',
    latitude: ''
  });
  const [neighborhoodData, setNeighborhoodData] = useState(null);

  const searchAddress = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ', United States'
        )}&limit=5&countrycodes=us`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    // Debounce search requests
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      searchAddress(value);
    }, 300);
  };

  const handleSelectLocation = (location) => {
    const newCenter = [parseFloat(location.lat), parseFloat(location.lon)];
    setMapState({
      center: newCenter,
      zoom: 16
    });
    setSelectedLocation(location);
    setSearchInput(location.display_name);
    setSuggestions([]);

    // Create GeoJSON object
    const geojson = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(location.lon), parseFloat(location.lat)]
      },
      properties: {
        name: location.display_name,
        type: location.type,
        osm_id: location.osm_id
      }
    };

    setSelectedLocation(geojson);
  };

  const handlePolygonCreated = (polygonData) => {
    setDrawnItems(prev => [...prev, polygonData]);
  };

  const handleDeletePolygon = (id) => {
    setDrawnItems(prev => prev.filter(polygon => polygon.id !== id));
    if (activePolygon && activePolygon.id === id) {
      setActivePolygon(null);
    }
  };

  const showPolygonCoordinates = (polygon) => {
    setActivePolygon(polygon);
  };

  const formatArea = (area) => {
    if (area < 10000) {
      return `${Math.round(area)} m²`;
    } else {
      return `${(area / 1000000).toFixed(2)} km²`;
    }
  };

  const exportToJson = () => {
    if (drawnItems.length === 0) {
      alert('No polygons to export');
      return;
    }
    
    const dataStr = JSON.stringify(drawnItems, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'polygon-data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleRadiusChange = async (e) => {
    const radius = parseFloat(e.target.value);
    setSearchRadius(radius);

    if (radius > 0 && selectedLocation) {
      setIsSearching(true);
      const results = await searchPropertiesInRadius(selectedLocation.geometry.coordinates, radius);
      setRadiusSearchResults(results);
      setIsSearching(false);
    } else {
      setRadiusSearchResults([]);
    }
  };

  const saveRadiusSearchAsGeoJSON = () => {
    if (!selectedLocation || searchRadius === 0) {
      alert('Please select a location and radius before saving');
      return;
    }

    // Create a GeoJSON object from the search
    const geoJSON = {
      type: 'FeatureCollection',
      properties: {
        searchTime: new Date().toISOString(),
        searchRadius: searchRadius,
        searchRadiusUnit: 'miles',
        totalResults: radiusSearchResults.length
      },
      features: [
        // Center point
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: selectedLocation.geometry.coordinates
          },
          properties: {
            name: selectedLocation.properties.name,
            type: 'searchCenter'
          }
        },
        // Circle (as linestring approximation)
        {
          type: 'Feature',
          geometry: createCircleGeometry(
            selectedLocation.geometry.coordinates,
            searchRadius * 1609.34, // miles to meters
            64 // number of segments
          ),
          properties: {
            type: 'searchRadius',
            radius: searchRadius,
            unit: 'miles'
          }
        }
      ]
    };

    // Add properties as features
    radiusSearchResults.forEach(property => {
      // For real properties, use actual coordinates
      // For dummy data, generate random points within the circle
      const coords = property.coordinates 
        ? [property.coordinates.longitude, property.coordinates.latitude]
        : generateRandomPointInCircle(
            selectedLocation.geometry.coordinates, 
            searchRadius * 1609.34
          );

      geoJSON.features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coords
        },
        properties: {
          id: property.id,
          title: property.title,
          price: property.price,
          location: property.location,
          type: 'property'
        }
      });
    });

    // Add to saved searches
    const newSearch = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      centerName: selectedLocation.properties.name,
      radius: searchRadius,
      resultCount: radiusSearchResults.length,
      geoJSON: geoJSON
    };

    setSavedSearches(prev => [...prev, newSearch]);
    alert('Search saved successfully');
  };

  const handleMapClick = async (latlng) => {
    // Format to 6 decimal places for precision
    const lat = parseFloat(latlng.lat.toFixed(6));
    const lng = parseFloat(latlng.lng.toFixed(6));
    
    // Set temporary point while we fetch detailed information
    const tempPointGeoJSON = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        name: `Loading details for ${lat}, ${lng}...`,
        clickTime: new Date().toISOString()
      }
    };
    
    setClickedPoint(tempPointGeoJSON);
    setSelectedLocation(tempPointGeoJSON);
    setMapState({
      center: [lat, lng],
      zoom: 18
    });
    
    try {
      // Reverse geocoding using Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location details');
      }
      
      const data = await response.json();
      
      const detailedPointGeoJSON = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties: {
          name: data.display_name || `Point at ${lat}, ${lng}`,
          type: data.type || 'unknown',
          osm_id: data.osm_id || 0,
          address: data.address || {},
          clickTime: new Date().toISOString()
        }
      };
      
      console.log('Location details:', data);
      
      setClickedPoint(detailedPointGeoJSON);
      setSelectedLocation(detailedPointGeoJSON);
      
      // If radius is set, search within the radius using the imported function
      if (searchRadius > 0) {
        setIsSearching(true);
        const results = await searchPropertiesInRadius([lng, lat], searchRadius);
        setRadiusSearchResults(results);
        setIsSearching(false);
      }
      
    } catch (error) {
      console.error('Error fetching location details:', error);
      
      const fallbackPointGeoJSON = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        properties: {
          name: `Point at ${lat}, ${lng}`,
          type: 'unknown',
          clickTime: new Date().toISOString()
        }
      };
      
      setClickedPoint(fallbackPointGeoJSON);
      setSelectedLocation(fallbackPointGeoJSON);
      
      if (searchRadius > 0) {
        setIsSearching(true);
        const results = await searchPropertiesInRadius([lng, lat], searchRadius);
        setRadiusSearchResults(results);
        setIsSearching(false);
      }
    }
  };

  const downloadClickedPointData = () => {
    if (!clickedPoint) return;
    
    const dataStr = JSON.stringify(clickedPoint, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'clicked-point.geojson';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleShapeDrawn = (shape) => {
    console.log('צורה חדשה נוצרה:', shape);
    setDrawnShape(shape);
  };

  useEffect(() => {
    // Wait for map to be initialized
    const initDrawControls = () => {
      if (!mapRef.current) return;

      const map = mapRef.current;
      
      // Create a FeatureGroup to store editable layers
      const editableLayers = new L.FeatureGroup();
      map.addLayer(editableLayers);

      // Initialize draw control
      const drawControl = new L.Control.Draw({
        position: 'topleft',
        draw: {
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: 'Shape edges cannot intersect!'
            },
            shapeOptions: {
              color: '#3388ff',
              fillOpacity: 0.2,
              weight: 2
            }
          },
          rectangle: {
            shapeOptions: {
              color: '#3388ff',
              fillOpacity: 0.2,
              weight: 2
            }
          },
          // Disable other drawing tools
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false
        },
        edit: {
          featureGroup: editableLayers,
          remove: true
        }
      });

      map.addControl(drawControl);

      // Handle created shapes
      map.on(L.Draw.Event.CREATED, (e) => {
        const layer = e.layer;
        editableLayers.addLayer(layer);
        const geoJSON = layer.toGeoJSON();
        
        // Calculate area and other properties
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
        const center = layer.getBounds().getCenter();
        
        const shapeData = {
          id: Date.now().toString(),
          type: e.layerType,
          geoJSON: geoJSON,
          area: area,
          center: center,
          coordinates: layer.getLatLngs()[0].map(point => [point.lat, point.lng])
        };
        
        setDrawnItems(prev => [...prev, shapeData]);
        console.log('New shape created:', shapeData);
      });

      return () => {
        map.removeLayer(editableLayers);
        map.removeControl(drawControl);
        map.off(L.Draw.Event.CREATED);
      };
    };

    // Initialize controls after map is ready
    const timeoutId = setTimeout(initDrawControls, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Export shapes to GeoJSON
  const exportToGeoJSON = () => {
    if (drawnItems.length === 0) {
      alert('No shapes to export');
      return;
    }

    const geoJSON = {
      type: 'FeatureCollection',
      features: drawnItems
    };

    const dataStr = JSON.stringify(geoJSON);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'map_shapes.geojson';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Function to handle coordinate inputs
  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    setCoordinates(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to find neighborhood
  const findNeighborhood = async () => {
    try {
      const response = await fetch('/api/find-neighborhood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            parseFloat(coordinates.longitude),
            parseFloat(coordinates.latitude)
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch neighborhood data');
      }

      const data = await response.json();
      setNeighborhoodData(data);

      // If neighborhood found, center map on it
      if (data && data.geometry) {
        // Calculate center of the polygon
        const bounds = L.geoJSON(data.geometry).getBounds();
        const center = bounds.getCenter();
        setMapState({
          center: [center.lat, center.lng],
          zoom: 14
        });
      }
    } catch (error) {
      console.error('Error finding neighborhood:', error);
      alert('Error finding neighborhood. Please try again.');
    }
  };

  return (
    <div className="map-page-container">
      <div className="map-container">
        <div className="map-wrapper">
          <MapContainer 
            center={mapState.center} 
            zoom={mapState.zoom} 
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            <ChangeView center={mapState.center} zoom={mapState.zoom} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {/* Display neighborhood polygon if exists */}
            {neighborhoodData && neighborhoodData.geometry && (
              <GeoJSON 
                data={neighborhoodData.geometry}
                style={{
                  color: '#ff7800',
                  weight: 3,
                  opacity: 0.65,
                  fillOpacity: 0.3
                }}
              >
                <Popup>
                  <strong>Neighborhood:</strong> {neighborhoodData.name || 'Unknown'}
                </Popup>
              </GeoJSON>
            )}
            {selectedLocation && (
              <Marker position={[selectedLocation.geometry.coordinates[1], selectedLocation.geometry.coordinates[0]]}>
                <Popup>
                  {selectedLocation.properties.name}
                </Popup>
              </Marker>
            )}
            {selectedLocation && searchRadius > 0 && (
              <RadiusCircle 
                center={[selectedLocation.geometry.coordinates[1], selectedLocation.geometry.coordinates[0]]}
                radius={searchRadius}
              />
            )}
            <DisplayPolygons polygons={drawnItems} />
            <DrawControl onPolygonCreated={handlePolygonCreated} />
          </MapContainer>
        </div>
      </div>
      <div className="search-container">
        <div className="neighborhood-finder">
          <h3>Find Neighborhood</h3>
          <div className="coordinate-inputs">
            <input
              type="number"
              name="longitude"
              value={coordinates.longitude}
              onChange={handleCoordinateChange}
              placeholder="Longitude (e.g. -73.93414657)"
              step="any"
            />
            <input
              type="number"
              name="latitude"
              value={coordinates.latitude}
              onChange={handleCoordinateChange}
              placeholder="Latitude (e.g. 40.82302903)"
              step="any"
            />
          </div>
          <button 
            onClick={findNeighborhood}
            disabled={!coordinates.longitude || !coordinates.latitude}
            className="find-neighborhood-btn"
          >
            Find Neighborhood
          </button>
          {neighborhoodData && (
            <div className="neighborhood-result">
              <h4>Found Neighborhood:</h4>
              <p>{neighborhoodData.name || 'Unknown'}</p>
            </div>
          )}
        </div>

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
                {suggestion.display_name}
              </li>
            ))}
          </ul>
        )}
        
        {/* Radius Search Controls */}
        {selectedLocation && (
          <div className="radius-control">
            <h3>Search Radius</h3>
            <div className="radio-group">
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
              
              <div className="radius-actions">
                <button className="save-search-button" onClick={saveRadiusSearchAsGeoJSON}>
                  Save as GeoJSON
                </button>
                <button 
                  className="save-search-button" 
                  style={{ marginTop: '10px' }}
                  onClick={exportToGeoJSON}
                >
                  Export All to GeoJSON
                </button>
                <button 
                  className="find-properties-button" 
                  style={{ 
                    marginTop: '10px',
                    backgroundColor: '#6610f2',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'block',
                    width: '100%',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onClick={() => {
                    if (!selectedLocation || searchRadius === 0) {
                      alert('Please select a location and radius first');
                      return;
                    }
                    searchPropertiesInRadius(selectedLocation.geometry.coordinates, searchRadius);
                  }}
                >
                  Find Properties in This Radius
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Results from Radius Search */}
        {isSearching && (
          <div className="loading-indicator">
            <p>Searching for properties...</p>
          </div>
        )}
        
        {!isSearching && radiusSearchResults.length > 0 && (
          <div className="radius-results">
            <h3>Properties within {searchRadius} miles</h3>
            <ul className="property-list">
              {radiusSearchResults.map(property => (
                <li key={property.id} className="property-item">
                  <div className="property-title">{property.title}</div>
                  <div className="property-price">{property.price}</div>
                  <div className="property-location">{property.location}</div>
                </li>
              ))}
            </ul>
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
              {savedSearches.map(search => (
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
              <p><strong>Center:</strong> {activeSearch.centerName}</p>
              <p><strong>Radius:</strong> {activeSearch.radius} miles</p>
              <p><strong>Results:</strong> {activeSearch.resultCount}</p>
              <p><strong>Time:</strong> {new Date(activeSearch.timestamp).toLocaleString()}</p>
              <div className="geojson-preview">
                <h4>GeoJSON (Preview):</h4>
                <div className="geojson-scroll">
                  <pre>{JSON.stringify(activeSearch.geoJSON.properties, null, 2)}</pre>
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
        
        {selectedLocation && (
          <div className="geojson-display">
            <h3>Selected Location (GeoJSON):</h3>
            <div className="geojson-scroll">
              <pre>{JSON.stringify(selectedLocation, null, 2)}</pre>
            </div>
            <div className="geojson-actions">
              <button 
                className="export-button"
                onClick={() => {
                  const dataStr = JSON.stringify(selectedLocation, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = 'selected-location.geojson';
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
              >
                Download Selected Location
              </button>
            </div>
          </div>
        )}

        {drawnItems.length > 0 && (
          <div className="saved-polygons">
            <h3>Saved Areas:</h3>
            <ul className="polygons-list">
              {drawnItems.map(polygon => (
                <li key={polygon.id} className="polygon-item">
                  <div className="polygon-header">
                    <strong>{polygon.type === 'polygon' ? 'Polygon' : 'Rectangle'}</strong>
                    <span className="area-info">{formatArea(polygon.area)}</span>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeletePolygon(polygon.id)}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="polygon-details">
                    <p>Center: [{polygon.center.lat.toFixed(4)}, {polygon.center.lng.toFixed(4)}]</p>
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
                          const geoJSON = {
                            type: 'Feature',
                            geometry: {
                              type: 'Polygon',
                              coordinates: [polygon.coordinates.map(coord => [coord[1], coord[0]])]
                            },
                            properties: {
                              id: polygon.id,
                              type: polygon.type,
                              area: polygon.area,
                              center: [polygon.center.lng, polygon.center.lat],
                              createTime: new Date().toISOString()
                            }
                          };
                          
                          const dataStr = JSON.stringify(geoJSON, null, 2);
                          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                          const exportFileDefaultName = `polygon-${polygon.id.substring(0, 6)}.geojson`;
                          const linkElement = document.createElement('a');
                          linkElement.setAttribute('href', dataUri);
                          linkElement.setAttribute('download', exportFileDefaultName);
                          linkElement.click();
                        }}
                      >
                        Download GeoJSON
                      </button>
                      <button 
                        style={{ 
                          backgroundColor: '#6610f2',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
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
                Export All to GeoJSON
              </button>
            </div>
          </div>
        )}
        
        {activePolygon && (
          <div className="coordinates-display">
            <h3>Coordinates for {activePolygon.type}</h3>
            <div className="coordinates-scroll">
              <pre>{JSON.stringify(activePolygon.coordinates, null, 2)}</pre>
            </div>
            <div className="coordinates-actions" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <button 
                className="close-button"
                onClick={() => setActivePolygon(null)}
              >
                Close
              </button>
              <button 
                className="find-properties-button"
                style={{ 
                  backgroundColor: '#6610f2',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onClick={() => searchPropertiesInPolygon(activePolygon)}
              >
                Find Properties in This Shape
              </button>
            </div>
          </div>
        )}
        
        <div className="polygon-info">
          <h3>Drawing Tool Instructions:</h3>
          <ul className="instruction-list">
            <li>Click the polygon or rectangle icon in the top left of the map</li>
            <li>Draw on the map to define an investment area</li>
            <li>Complete the shape by clicking on the first point (for polygon)</li>
            <li>Use the edit tools to modify your shapes</li>
            <li>Use the trash icon to delete shapes</li>
          </ul>
          <p>Use these drawing tools to define specific areas for property searches or investment zones.</p>
        </div>
        
        <div className="radius-info-instructions">
          <h3>Radius Search:</h3>
          <ul className="instruction-list">
            <li>Search for an address in the search box above</li>
            <li>Select a radius size from the options (0.1, 3, or 6 miles)</li>
            <li>View search results in the selected area</li>
            <li>Save the search results or download the radius data</li>
          </ul>
          <p>You can also use the map by drawing polygons or rectangles.</p>
        </div>
        
        <div className="polygon-draw-instructions">
          <h3>Creating a Polygon:</h3>
          <ul className="instruction-list">
            <li>Click on <span className="icon-text">🔷</span> in the top left corner of the map to select the polygon tool</li>
            <li>Click on a point on the map to start drawing a polygon</li>
            <li>Continue clicking on multiple points to define the shape of the polygon</li>
            <li>Click again on the first point to close the polygon</li>
            <li>The polygon will be automatically saved and will appear in the list of saved areas</li>
          </ul>
          <h3>Creating a Rectangle:</h3>
          <ul className="instruction-list">
            <li>Click on <span className="icon-text">⬜</span> in the top left corner of the map to select the rectangle tool</li>
            <li>Click and drag on the map to create a rectangle of the desired size</li>
            <li>Release the mouse when the rectangle is the desired size</li>
          </ul>
          <p>You can edit or delete polygons using the edit tool <span className="icon-text">✏️</span> or the delete button.</p>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;