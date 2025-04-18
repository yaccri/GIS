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
      Rent: "",
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
    setDisplayAddress("");
    setError(null);
  }, [setError]);

  useEffect(() => {
    if (mode === "edit" || (mode === "view" && !property)) {
      const loadProperty = async () => {
        const data = await fetchProperty();
        if (data) {
          setFormData({ Rent: "", ...data });
          setDisplayAddress(data.address || "");
        } else {
          resetFormData();
        }
      };
      loadProperty();
    } else if (mode === "add") {
      resetFormData();
    }
  }, [mode, propertyID, fetchProperty, property, resetFormData]);

  useEffect(() => {
    if (mode === "view" && property) {
      setFormData({ Rent: "", ...property });
      setDisplayAddress(property.address || "");
    }
  }, [mode, property]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [name]: ["price", "hoa", "propertyTax", "insurance", "Rent"].includes(
          name
        )
          ? parseCurrency(value)
          : type === "checkbox"
          ? checked
          : value,
      };
      console.log(`handleChange: ${name}=${value}, newFormData:`, newFormData);
      return newFormData;
    });
  };

  const handleAddressSelect = (selectedAddressData) => {
    console.log("Selected Address Data:", selectedAddressData);

    if (!selectedAddressData) return;

    if (selectedAddressData.type === "Feature") {
      const { geometry, properties } = selectedAddressData;
      const coordinates = geometry?.coordinates || [];
      const { components, address } = properties || {};

      setFormData((prev) => ({
        ...prev,
        address: components?.street_address || address || prev.address,
        city: components?.city || prev.city,
        state: components?.state || prev.state,
        zipCode: components?.ZIP || prev.zipCode,
        location:
          coordinates.length === 2
            ? { type: "Point", coordinates: coordinates }
            : prev.location,
      }));
      setDisplayAddress(address || "");
    }
  };

  const handleCancelClick = () => {
    resetFormData();
    onCancel();
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
    return <p>Initializing form...</p>;
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
            handleAddressSelect={handleAddressSelect}
            isReadOnly={isReadOnly}
            currentYear={currentYear}
            mode={mode}
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
