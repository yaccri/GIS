// src/pages/PropertyForm.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import "./PropertyForm.css";
import { UserContext } from "../context/UserContext";
import PropertyFields from "../components/PropertyFields";
import usePropertyApi from "../hooks/usePropertyApi";
import { parseCurrency } from "../utils/currencyFormatter";

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
    });
    setError(null); // Clear any existing errors
  }, [setError]); // Dependency for setError

  // Initialize formData based on mode
  useEffect(() => {
    if (mode === "edit" || (mode === "view" && !property)) {
      const loadProperty = async () => {
        const data = await fetchProperty();
        if (data) setFormData(data);
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
    }
  }, [mode, property]);

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
    return <p>Property not found.</p>;
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
        <form onSubmit={(e) => handleSubmit(e, formData)}>
          <PropertyFields
            formData={formData}
            handleChange={handleChange}
            isReadOnly={isReadOnly}
            currentYear={currentYear}
            mode={mode}
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
      </div>
    </div>
  );
};

export default PropertyForm;
