// src/pages/Properties.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import "./Properties.css";
import "../pages/PropertyForm.css";
import PropertyForm from "./PropertyForm";
import PropertySearch from "../components/PropertySearch";
import { UserContext } from "../context/UserContext";
import { formatCurrencyForDisplay } from "../utils/currencyFormatter";
import { BASE_URL } from "../utils/config";

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { user } = useContext(UserContext);

  const fetchProperties = useCallback(
    async (queryParams = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const itemsPerPage = user.itemsPerPage || 12;
        const queryString = Object.keys(queryParams)
          .map((key) => {
            const value = queryParams[key];
            if (typeof value === "object") {
              return Object.keys(value)
                .map((subKey) => `${key}[${subKey}]=${value[subKey]}`)
                .join("&");
            }
            return `${key}=${value}`;
          })
          .join("&");
        const fullQueryString = new URLSearchParams({
          ...searchParams,
          page: currentPage,
          limit: itemsPerPage,
        }).toString();
        const finalQueryString = queryString
          ? `${queryString}&${fullQueryString}`
          : fullQueryString;
        console.log("Fetching properties with query:", finalQueryString);
        const url = `${BASE_URL}/api/properties?${finalQueryString}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch properties");
        }
        const data = await response.json();
        setProperties(data.properties);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [searchParams, currentPage, user.itemsPerPage, user.token]
  );

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties, refreshTrigger]);

  const handlePropertyClick = (property) => {
    console.log("Selected property:", property);
    setSelectedProperty(property);
    setFormMode("view");
  };

  const handleSearch = (criteria) => {
    const queryParams = {};

    if (Object.keys(criteria).length === 0) {
      fetchProperties(queryParams);
      setCurrentPage(1);
      return;
    }

    if (criteria.price?.min || criteria.price?.max) {
      queryParams.price = {};
      if (criteria.price.min)
        queryParams.price.$gte = parseInt(criteria.price.min);
      if (criteria.price.max)
        queryParams.price.$lte = parseInt(criteria.price.max);
    }

    if (criteria.yearBuilt?.min || criteria.yearBuilt?.max) {
      queryParams.yearBuilt = {};
      if (criteria.yearBuilt.min)
        queryParams.yearBuilt.$gte = parseInt(criteria.yearBuilt.min);
      if (criteria.yearBuilt.max)
        queryParams.yearBuilt.$lte = parseInt(criteria.yearBuilt.max);
    }

    if (criteria.beds?.min || criteria.beds?.max) {
      queryParams.beds = {};
      if (criteria.beds.min)
        queryParams.beds.$gte = parseInt(criteria.beds.min);
      if (criteria.beds.max)
        queryParams.beds.$lte = parseInt(criteria.beds.max);
    }

    if (criteria.propertyID)
      queryParams.propertyID = parseInt(criteria.propertyID);
    if (criteria.state) queryParams.state = criteria.state;
    if (criteria.type) queryParams.type = criteria.type;

    const url = `${BASE_URL}/api/properties`;
    console.log("Search Request URL:", url);
    fetchProperties(queryParams);
    setCurrentPage(1);
  };

  const handleDeleteProperty = (propertyID) => {
    setProperties((prevProperties) =>
      prevProperties.filter((property) => property.propertyID !== propertyID)
    );
    setSelectedProperty(null);
    setFormMode(null);
  };

  const handleAddProperty = () => {
    setSelectedProperty(null);
    setFormMode("add");
  };

  const handleEditProperty = (property) => {
    setSelectedProperty(property);
    setFormMode("edit");
  };

  const handleCancel = () => {
    setSelectedProperty(null);
    setFormMode(null);
    setRefreshTrigger((prev) => prev + 1); // Refresh on cancel
  };

  const handleSuccess = () => {
    setSelectedProperty(null); // Reset selected property
    setFormMode(null); // Close the form
    setRefreshTrigger((prev) => prev + 1); // Trigger a refresh of the property list
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="properties-page-container">
      <div className="properties-sidebar">
        <PropertySearch onSearch={handleSearch} />
        <div className="pagination-container">
          {user.isAdmin && (
            <button className="subscribe-btn" onClick={handleAddProperty}>
              Add New Property
            </button>
          )}
          <div className="pagination-buttons">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              &lt;
            </button>
            <span>{`Page ${currentPage} of ${totalPages}`}</span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
      <div className="properties-list-container">
        <h2>Properties</h2>
        {isLoading && <p>Loading properties...</p>}
        {error && <p>Error: {error}</p>}
        {!isLoading && !error && properties.length === 0 && (
          <p>No properties found.</p>
        )}
        {!isLoading &&
          !error &&
          properties.length > 0 &&
          properties.map((property) => (
            <div
              key={property.propertyID}
              className="property-list-item"
              onClick={() => handlePropertyClick(property)}
            >
              <p className="property-id">ID: {property.propertyID}</p>
              <p className="property-address">
                {property.address}, {property.city}, {property.state}
              </p>
              <p className="property-details">
                ({" "}
                <strong style={{ color: "#1a3c5a" }}>
                  {property.yearBuilt}
                </strong>
                ){" "}
                <strong style={{ color: "#1a3c5a" }}>
                  {property.type} {property.beds}{" "}
                </strong>
                Beds/
                <strong style={{ color: "#1a3c5a" }}>
                  {property.baths}
                </strong>{" "}
                Baths{" "}
                <strong style={{ color: "#1a3c5a" }}>
                  {formatCurrencyForDisplay(property.price)}
                </strong>
              </p>
            </div>
          ))}
      </div>
      <div className="property-view-container">
        {formMode ? (
          <PropertyForm
            mode={formMode}
            property={selectedProperty}
            onDelete={handleDeleteProperty}
            propertyID={selectedProperty ? selectedProperty.propertyID : null}
            onCancel={handleCancel}
            onEdit={handleEditProperty}
            onSuccess={handleSuccess} // Pass the onSuccess handler
          />
        ) : (
          <p>Select a property to view details.</p>
        )}
      </div>
    </div>
  );
};

export default Properties;
