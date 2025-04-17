// src/pages/PropertyForm.js
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo, // Import useMemo
} from "react";
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

  // --- Updated resetFormData to include Rent ---
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
      Rent: "", // Added Rent field
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

  // Initialize formData based on mode
  useEffect(() => {
    if (mode === "edit" || (mode === "view" && !property)) {
      const loadProperty = async () => {
        const data = await fetchProperty();
        if (data) {
          // Ensure Rent field exists in fetched data or initialize it
          setFormData({ Rent: "", ...data }); // Default Rent to "" if not present
          setDisplayAddress(data.address || "");
        } else {
          // Handle case where property fetch fails but we are in edit/view
          resetFormData(); // Reset to default structure if fetch fails
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
      // Ensure Rent field exists in property data or initialize it
      setFormData({ Rent: "", ...property }); // Default Rent to "" if not present
      setDisplayAddress(property.address || "");
    }
  }, [mode, property]);

  // --- Updated handleChange to handle Rent ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Add 'Rent' to the list of fields parsed as currency
    if (["price", "hoa", "propertyTax", "insurance", "Rent"].includes(name)) {
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

  // --- Calculate ROI using useMemo ---
  const roiValue = useMemo(() => {
    if (!formData) return null; // Guard clause if formData is null

    // Extract and parse values, defaulting potentially missing ones to 0
    // Crucially, check Rent and Price specifically for validity
    const rent = parseFloat(formData.Rent) || 0;
    const price = parseFloat(formData.price) || 0;
    const hoa = parseFloat(formData.hoa) || 0;
    const insurance = parseFloat(formData.insurance) || 0;
    const propertyTax = parseFloat(formData.propertyTax) || 0;

    // If Rent or Price are zero or invalid, ROI is null
    if (rent <= 0 || price <= 0) {
      return null;
    }

    // Calculate ROI based on the provided formula:
    // (((Rent*0.8 - HOA - insurance)) * 12) - PropertyTax) / Price)
    // Assuming: Rent=Monthly, HOA=Monthly, Insurance=Monthly, PropertyTax=Annual, Price=Total
    const numerator = (rent * 0.8 - hoa - insurance) * 12 - propertyTax;
    const roi = (numerator / price) * 100; // Calculate as percentage

    // Format the result
    return roi.toFixed(2) + "%";
  }, [
    formData?.Rent,
    formData?.price,
    formData?.hoa,
    formData?.insurance,
    formData?.propertyTax,
  ]); // Dependencies for recalculation

  // Updated handler for AddressSearch component selection
  const handleAddressSelect = (selectedAddressData) => {
    // ... (existing handleAddressSelect logic - no changes needed here for ROI) ...
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

  // --- Loading/Error/Initial State Handling ---
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

  // Ensure formData is initialized before rendering the form fields
  if (!formData) {
    return <p>Initializing form...</p>;
  }

  const isReadOnly = mode === "view";

  // --- Render ---
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
          {/* Pass formData, handlers, and calculated ROI to PropertyFields */}
          <PropertyFields
            formData={formData}
            handleChange={handleChange}
            handleAddressSelect={handleAddressSelect}
            isReadOnly={isReadOnly}
            currentYear={currentYear}
            mode={mode}
            displayAddress={displayAddress}
            roiValue={roiValue} // Pass calculated ROI value
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
        {/* Debugging display */}
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
