// src/components/map/MapSidebar.js
import React, { useState } from "react";
import "./MapSidebar.css";
import PropertyDisplay from "./PropertyDisplay";
import { FaFilter, FaChevronDown } from "react-icons/fa";

const MapSidebar = ({
  isSearching,
  propertiesToDisplay,
  searchRadius,
  clickedNeighborhood,
  selectedLocationDetails,
  formatCurrencyForDisplay,
}) => {
  // State to manage PropertyDisplay visibility and selected property
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filters, setFilters] = useState({
    price: { min: "", max: "" },
    beds: { min: "", max: "" },
    type: "",
  });

  // Handler to open PropertyDisplay with the clicked property
  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
  };

  // Handler to close PropertyDisplay
  const handleClosePropertyDisplay = () => {
    setSelectedProperty(null);
  };

  const toggleFilter = (filterName) => {
    setActiveFilter(activeFilter === filterName ? null : filterName);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const [mainKey, subKey] = name.split(".");
    
    setFilters(prev => ({
      ...prev,
      [mainKey]: {
        ...prev[mainKey],
        [subKey]: value
      }
    }));
  };

  // Filter properties based on active filters
  const filteredProperties = propertiesToDisplay.filter(property => {
    if (filters.price.min && property.price < parseInt(filters.price.min)) return false;
    if (filters.price.max && property.price > parseInt(filters.price.max)) return false;
    if (filters.beds.min && property.beds < parseInt(filters.beds.min)) return false;
    if (filters.beds.max && property.beds > parseInt(filters.beds.max)) return false;
    if (filters.type && property.type !== filters.type) return false;
    return true;
  });

  // Determine the heading for the results section
  let resultsHeading = "Search Results";
  if (searchRadius > 0) {
    resultsHeading = `Properties within ${searchRadius} miles`;
  } else if (clickedNeighborhood) {
    resultsHeading = `Properties in ${
      clickedNeighborhood.name || "Selected Neighborhood"
    }`;
  }

  // Determine if a search context is active
  const isSearchActive = searchRadius > 0 || !!clickedNeighborhood;

  // Determine if the "No properties found" message should show
  const shouldShowNoResults =
    !isSearching &&
    filteredProperties.length === 0 &&
    isSearchActive &&
    selectedLocationDetails;

  return (
    <div className="map-sidebar-container">
      {/* PropertyDisplay modal */}
      <PropertyDisplay
        isOpen={!!selectedProperty}
        onClose={handleClosePropertyDisplay}
        property={selectedProperty}
        isAdmin={false}
      />

      {/* Filters Section */}
      <div className="filters-section">
        <button 
          className={`filter-button ${activeFilter === 'price' ? 'active' : ''}`}
          onClick={() => toggleFilter('price')}
        >
          <FaFilter /> Price <FaChevronDown />
        </button>

        <button 
          className={`filter-button ${activeFilter === 'beds' ? 'active' : ''}`}
          onClick={() => toggleFilter('beds')}
        >
          <FaFilter /> Beds <FaChevronDown />
        </button>

        <button 
          className={`filter-button ${activeFilter === 'type' ? 'active' : ''}`}
          onClick={() => toggleFilter('type')}
        >
          <FaFilter /> Type <FaChevronDown />
        </button>

        {activeFilter === 'price' && (
          <div className="filter-dropdown">
            <div className="price-range">
              <input
                type="number"
                name="price.min"
                placeholder="Min Price"
                value={filters.price.min}
                onChange={handleFilterChange}
              />
              <span>to</span>
              <input
                type="number"
                name="price.max"
                placeholder="Max Price"
                value={filters.price.max}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        )}

        {activeFilter === 'beds' && (
          <div className="filter-dropdown">
            <div className="beds-range">
              <input
                type="number"
                name="beds.min"
                placeholder="Min Beds"
                value={filters.beds.min}
                onChange={handleFilterChange}
              />
              <span>to</span>
              <input
                type="number"
                name="beds.max"
                placeholder="Max Beds"
                value={filters.beds.max}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        )}

        {activeFilter === 'type' && (
          <div className="filter-dropdown">
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Condo">Condo</option>
            </select>
          </div>
        )}
      </div>

      {/* Property Results Section */}
      {isSearching && (
        <div className="loading-indicator sidebar-section">
          <p>Searching properties...</p>
        </div>
      )}

      {!isSearching && filteredProperties.length > 0 && (
        <div className="property-results sidebar-section">
          <h3>{resultsHeading}</h3>
          <ul className="property-list">
            {filteredProperties.map((property) => {
              let locationString = "Location N/A";
              if (property.address) {
                locationString = `${property.address}, ${property.city || ""}`;
              } else if (
                property.location?.type === "Point" &&
                Array.isArray(property.location.coordinates) &&
                property.location.coordinates.length === 2
              ) {
                const lat = property.location.coordinates[1];
                const lon = property.location.coordinates[0];
                locationString = `Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(4)}`;
              }

              return (
                <li
                  key={property.propertyID || property._id || Math.random()}
                  className="property-item"
                  onClick={() => handlePropertyClick(property)}
                  style={{ cursor: "pointer" }}
                >
                  {property.propertyID && (
                    <div className="property-id">ID: {property.propertyID}</div>
                  )}
                  <div className="property-title">
                    {property.address || "Untitled Property"}
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

      {shouldShowNoResults && (
        <div className="no-results-message sidebar-section">
          <p>No properties found for the current selection. </p>
          <p>You may need to adjust your search criteria. </p>
          <p>Click 'Search Neighborhood' or increase the search radius.</p>
        </div>
      )}
    </div>
  );
};

export default MapSidebar;
