// src/pages/PropertyForm.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import "./PropertyForm.css";
import { UserContext } from "../context/UserContext";
import PropertyFields from "../components/PropertyFields";
import usePropertyApi from "../hooks/usePropertyApi";
import { parseCurrency } from "../utils/currencyFormatter";
import { states } from "../utils/states";

// Add a map of required fields based on your schema
const requiredFields = [
  "propertyID",
  "address",
  "city",
  "state",
  "zipCode",
  "type",
  "price",
  "location.type",
  "location.coordinates",
];

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
        coordinates: [],
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
          setDisplayAddress(String(data.address || ""));
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
      setDisplayAddress(String(property.address || ""));
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
      const { address, name } = properties || {};

      console.log("Address components:", { address, name });

      const streetAddress =
        [address?.house_number, address?.road].filter(Boolean).join(" ") ||
        name ||
        "";
      console.log("Computed streetAddress:", streetAddress);

      const city =
        address?.city ||
        address?.town ||
        address?.village ||
        address?.hamlet ||
        "";
      console.log("Computed city:", city);

      const fullState = address?.state || "";
      console.log("Full state name:", fullState);
      const stateObj = states.find(
        (state) => state.label.toLowerCase() === fullState.toLowerCase()
      );
      const state = stateObj ? stateObj.value : "";
      console.log("Converted state to 2-letter code:", state);

      const zipCode = address?.postcode || "";
      console.log("Computed zipCode:", zipCode);

      setFormData((prev) => ({
        ...prev,
        address: streetAddress || prev.address,
        city: city || prev.city,
        state: state || prev.state,
        zipCode: zipCode || prev.zipCode,
        location:
          coordinates.length === 2
            ? { type: "Point", coordinates: coordinates }
            : prev.location,
      }));
      const newDisplayAddress = String(streetAddress || name || ""); // Prioritize streetAddress
      console.log("Setting displayAddress to:", newDisplayAddress);
      setDisplayAddress(newDisplayAddress);
    }
  };

  const handleCancelClick = () => {
    resetFormData();
    onCancel();
  };

  if (isLoading) {
    return <p>Loading property...</p>;
  }

  if (!formData) {
    return <p>Initializing form...</p>;
  }

  const isReadOnly = mode === "view";

  // Pass requiredFields to PropertyFields
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
        {error && (
          <div className="form-error" title={error}>
            Error: {error}
          </div>
        )}
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
            requiredFields={requiredFields}
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
