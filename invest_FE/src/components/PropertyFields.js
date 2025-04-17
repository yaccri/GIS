// src/components/PropertyFields.js
import React from "react";
import { states } from "../utils/states";
import { formatCurrencyForDisplay } from "../utils/currencyFormatter";
import { format } from "date-fns"; // to format createdOn date
// Assuming you might switch between Google and OSM, keep the import flexible or choose one
// import AddressSearch from "./AddressSearch-Google";
import AddressSearch from "./AddressSearch-OpenStreetMap"; // Using OSM based on other files

// Options for property type
const PROPERTY_TYPES = [
  "Single-family",
  "Multi-family",
  "Apartment",
  "Townhouse",
  "Mobile home",
  "Vacation home",
];

const PropertyFields = ({
  formData,
  handleChange,
  handleAddressSelect,
  isReadOnly,
  currentYear,
  mode,
  displayAddress,
  roiValue, // <-- Destructure the new roiValue prop
}) => {
  // Format the createdOn date if it exists, otherwise display "N/A"
  const formattedCreatedOn = formData.createdOn
    ? format(new Date(formData.createdOn), "MMM-dd-yyyy HH:mm")
    : "N/A";

  return (
    <>
      {/* propertyID */}
      <div className="form-group">
        <label htmlFor="propertyID">Property ID:</label>
        <input
          type="number"
          id="propertyID"
          name="propertyID"
          value={formData.propertyID}
          onChange={handleChange}
          required
          min="1"
          step="1"
          disabled={isReadOnly || mode === "edit"}
        />
      </div>

      {/* address */}
      <div className="form-group">
        <label htmlFor="address">Address Search:</label>
        <AddressSearch
          id="address"
          initialValue={displayAddress}
          onLocationSelect={handleAddressSelect}
          disabled={isReadOnly}
          required
          placeholder="Start typing address..."
        />
      </div>

      {/* city */}
      <div className="form-group">
        <label htmlFor="city">City:</label>
        <input
          type="text"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
          disabled={true} // Assuming auto-filled and non-editable
        />
      </div>

      {/* state */}
      <div className="form-group">
        <label htmlFor="state">State:</label>
        <select
          id="state"
          name="state"
          value={formData.state}
          onChange={handleChange}
          required
          disabled={true} // Assuming auto-filled and non-editable
        >
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state.value} value={state.value}>
              {state.label}
            </option>
          ))}
        </select>
      </div>

      {/* zipCode */}
      <div className="form-group">
        <label htmlFor="zipCode">Zip Code:</label>
        <input
          type="text"
          id="zipCode"
          name="zipCode"
          value={formData.zipCode}
          onChange={handleChange}
          required
          disabled={true} // Assuming auto-filled and non-editable
          maxLength="10"
        />
      </div>

      {/* type */}
      <div className="form-group">
        <label htmlFor="type">Type:</label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          disabled={isReadOnly}
        >
          <option value="">Select Type</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* description */}
      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          readOnly={isReadOnly}
        />
      </div>

      {/* price */}
      <div className="form-group">
        <label htmlFor="price">Price:</label>
        <input
          type="text"
          id="price"
          name="price"
          value={formatCurrencyForDisplay(formData.price)}
          onChange={handleChange}
          required
          readOnly={isReadOnly}
        />
      </div>

      {/* HOA */}
      <div className="form-group">
        <label htmlFor="hoa">HOA/mo:</label> {/* Added /mo for clarity */}
        <input
          type="text"
          id="hoa"
          name="hoa"
          value={formatCurrencyForDisplay(formData.hoa)}
          onChange={handleChange}
          readOnly={isReadOnly}
        />
      </div>

      {/* Property Tax */}
      <div className="form-group">
        <label htmlFor="propertyTax/yr">Property Tax/yr:</label>{" "}
        {/* Added /yr */}
        <input
          type="text"
          id="propertyTax"
          name="propertyTax"
          value={formatCurrencyForDisplay(formData.propertyTax)}
          onChange={handleChange}
          readOnly={isReadOnly}
        />
      </div>

      {/* Insurance */}
      <div className="form-group">
        <label htmlFor="insurance">Insurance/mo:</label> {/* Added /mo */}
        <input
          type="text"
          id="insurance"
          name="insurance"
          value={formatCurrencyForDisplay(formData.insurance)}
          onChange={handleChange}
          readOnly={isReadOnly}
        />
      </div>

      {/* --- NEW: Rent Field --- */}
      <div className="form-group">
        <label htmlFor="Rent">Rent Estimate/mo:</label>
        <input
          type="text" // Use text to allow currency formatting during input
          id="Rent"
          name="Rent"
          value={formatCurrencyForDisplay(formData.Rent)} // Format for display
          onChange={handleChange} // Use the same handler (it parses currency)
          readOnly={isReadOnly}
          placeholder="$0" // Optional placeholder
        />
      </div>

      {/* --- NEW: ROI Field (Read-Only) --- */}
      <div className="form-group">
        <label htmlFor="roi">ROI %:</label>
        <input
          type="text"
          id="roi"
          name="roi" // Name is optional for read-only
          value={roiValue ?? "N/A"} // Display calculated value or N/A if null
          readOnly // Make it non-editable by the user
          disabled // Visually indicate it's non-interactive
          className="calculated-field" // Optional: Add class for styling
        />
      </div>
      {/* --- END NEW FIELDS --- */}

      {/* beds */}
      <div className="form-group">
        <label htmlFor="beds">Beds:</label>
        <input
          type="number"
          id="beds"
          name="beds"
          value={formData.beds}
          onChange={handleChange}
          min="0"
          step="1"
          readOnly={isReadOnly}
        />
      </div>

      {/* baths */}
      <div className="form-group">
        <label htmlFor="baths">Baths:</label>
        <input
          type="number"
          id="baths"
          name="baths"
          value={formData.baths}
          onChange={handleChange}
          min="0"
          step="0.5"
          readOnly={isReadOnly}
        />
      </div>

      {/* size */}
      <div className="form-group">
        <label htmlFor="size">Size (sq ft):</label>
        <input
          type="number"
          id="size"
          name="size"
          value={formData.size}
          onChange={handleChange}
          min="0"
          step="1"
          readOnly={isReadOnly}
        />
      </div>

      {/* lotSize */}
      <div className="form-group">
        <label htmlFor="lotSize">Lot Size (sq ft):</label>
        <input
          type="number"
          id="lotSize"
          name="lotSize"
          value={formData.lotSize}
          onChange={handleChange}
          min="0"
          step="1"
          readOnly={isReadOnly}
        />
      </div>

      {/* tenantInPlace */}
      <div className="form-group">
        <label htmlFor="tenantInPlace">Tenant in Place:</label>
        <input
          type="checkbox"
          id="tenantInPlace"
          name="tenantInPlace"
          checked={!!formData.tenantInPlace}
          onChange={handleChange}
          disabled={isReadOnly}
        />
      </div>

      {/* yearBuilt */}
      <div className="form-group">
        <label htmlFor="yearBuilt">Year Built:</label>
        <input
          type="number"
          id="yearBuilt"
          name="yearBuilt"
          value={formData.yearBuilt}
          onChange={handleChange}
          min="1800"
          max={currentYear}
          step="1"
          readOnly={isReadOnly}
        />
      </div>

      {/* createdOn */}
      <div className="form-group">
        <label htmlFor="createdOn">Created On:</label>
        <input
          type="text"
          id="createdOn"
          name="createdOn"
          value={formattedCreatedOn}
          readOnly
          disabled // Also disable visually
        />
      </div>
    </>
  );
};

export default PropertyFields;
