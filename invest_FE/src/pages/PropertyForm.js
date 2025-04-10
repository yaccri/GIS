// src/pages/PropertyForm.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import "./PropertyForm.css";
import { UserContext } from "../context/UserContext";
import PropertyFields from "../components/PropertyFields"; // Keep this
import usePropertyApi from "../hooks/usePropertyApi";
import { parseCurrency } from "../utils/currencyFormatter";
// NOTE: No need to import AddressSearch here, it's used in PropertyFields

const PropertyForm = ({
  mode,
  property,
  onDelete,
  propertyID,
  onCancel,
  onEdit,
  onSuccess,
}) => {
  const { user } = useContext(UserContext);
  const [formData, setFormData] = useState(null);
  const currentYear = new Date().getFullYear();
  // Store the full address selected from Google separately if needed for display
  const [displayAddress, setDisplayAddress] = useState("");

  const {
    isLoading,
    error,
    setError,
    fetchProperty,
    handleSubmit,
    handleDelete,
  } = usePropertyApi(mode, propertyID, onCancel, onDelete, onSuccess);

  const resetFormData = useCallback(() => {
    setFormData({
      propertyID: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      type: "",
      description: "",
      price: "",
      hoa: "",
      propertyTax: "",
      insurance: "",
      beds: "",
      baths: "",
      size: "",
      lotSize: "",
      tenantInPlace: false,
      yearBuilt: "",
      createdOn: "",
      location: {
        type: "Point",
        coordinates: [], // [longitude, latitude]
      },
    });
    setDisplayAddress(""); // Reset display address
    setError(null); // Clear any existing errors
  }, [setError]); // Dependency for setError

  // Initialize formData based on mode
  useEffect(() => {
    if (mode === "edit" || (mode === "view" && !property)) {
      const loadProperty = async () => {
        const data = await fetchProperty();
        if (data) {
          setFormData(data);
          // Set display address for edit/view using the street address
          setDisplayAddress(data.address || "");
        }
      };
      loadProperty();
    } else if (mode === "add") {
      resetFormData();
    }
  }, [mode, propertyID, fetchProperty, property, resetFormData]);

  // Update formData when property changes in view mode
  useEffect(() => {
    if (mode === "view" && property) {
      setFormData(property);
      // Make sure we show the street address in view mode
      setDisplayAddress(property.address || ""); // Use the street address component
    }
  }, [mode, property]);

  // General change handler for standard inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (["price", "hoa", "propertyTax", "insurance"].includes(name)) {
      const rawValue = parseCurrency(value);
      setFormData((prev) => ({
        ...prev,
        [name]: rawValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };
  console.log("Form Data:", formData);

  // Updated handler for AddressSearch component selection
  const handleAddressSelect = (selectedAddressData) => {
    console.log("Selected Address Data:", selectedAddressData);

    if (!selectedAddressData) return;

    // Handle the GeoJSON format coming from GoogleAddressSearch
    if (selectedAddressData.type === "Feature") {
      const { geometry, properties } = selectedAddressData;

      // Extract coordinates from the GeoJSON geometry
      const coordinates = geometry?.coordinates || [];
      //      const [lng, lat] = coordinates;

      // Extract address components from properties
      const { components, address } = properties || {};

      // Update the form state with extracted data
      setFormData((prev) => ({
        ...prev,
        // Use the street_address from components if available
        address: components?.street_address || address || prev.address,
        city: components?.city || prev.city,
        state: components?.state || prev.state,
        zipCode: components?.ZIP || prev.zipCode,
        // Set location only if coordinates are available
        location:
          coordinates.length === 2
            ? { type: "Point", coordinates: coordinates } // Already in [lng, lat] order
            : prev.location, // Keep previous location if no new coords
      }));

      // Update the display address shown in the AddressSearch input
      setDisplayAddress(address || "");
    }
  };

  const handleCancelClick = () => {
    resetFormData(); // Reset form data on cancel
    onCancel(); // Call parent cancel handler
  };

  if (isLoading) {
    return <p>Loading property...</p>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={handleCancelClick}>Close</button>
      </div>
    );
  }

  if (!formData) {
    // Added a check for null formData before rendering
    return <p>Initializing form or property not found...</p>;
  }

  const isReadOnly = mode === "view";

  return (
    <div className="property-page-container">
      <div className="property-container">
        <h2>
          {mode === "add"
            ? "Add New Property"
            : mode === "edit"
            ? "Edit Property"
            : "View Property"}
        </h2>
        {mode === "view" && user.isAdmin && (
          <div className="admin-buttons">
            <button className="edit-btn" onClick={() => onEdit(formData)}>
              Edit
            </button>
            <button
              className="delete-btn"
              onClick={() => handleDelete(propertyID || formData.propertyID)}
            >
              Delete
            </button>
          </div>
        )}
        {/* Pass formData (including location) to handleSubmit */}
        <form onSubmit={(e) => handleSubmit(e, formData)}>
          <PropertyFields
            formData={formData}
            handleChange={handleChange}
            handleAddressSelect={handleAddressSelect}
            isReadOnly={isReadOnly}
            currentYear={currentYear}
            mode={mode}
            // Pass the displayAddress to AddressSearch component
            displayAddress={displayAddress}
          />
          {!isReadOnly && (
            <div className="button-group">
              <button type="submit" className="subscribe-btn">
                {mode === "add" ? "Add Property" : "Update Property"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancelClick}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
        {/* Optional: Display coordinates for debugging/verification */}
        {!isReadOnly && formData.location?.coordinates?.length === 2 && (
          <div style={{ marginTop: "10px", fontSize: "0.8em", color: "#555" }}>
            Coords: [{formData.location.coordinates[1].toFixed(6)},{" "}
            {formData.location.coordinates[0].toFixed(6)}] {/* Lat, Lng */}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyForm;
