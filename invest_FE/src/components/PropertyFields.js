// src/components/PropertyFields.js
import React from "react";
import { states } from "../utils/states";
import { formatCurrencyForDisplay } from "../utils/currencyFormatter";
import { format } from "date-fns"; // to format createdOn date
import AddressSearch from "./GoogleAddressSearch"; // *** IMPORT AddressSearch ***

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
          disabled={isReadOnly || mode === "edit"} // Simplified logic using mode prop
        />
      </div>

      {/* address - *** Use AddressSearch, passing displayAddress *** */}
      <div className="form-group">
        <label htmlFor="address">Address Search:</label>
        <AddressSearch
          id="address" // Keep id for label association
          // Use displayAddress for the input value, formData.address holds the component part
          initialValue={displayAddress}
          onAddressSelect={handleAddressSelect} // Use the passed handler
          disabled={isReadOnly} // Pass read-only state
          required // Keep required if needed
          placeholder="Start typing address..."
          // Add any other necessary props for AddressSearch
        />
        {/* Hidden input or just rely on formData state for the actual street address */}
        {/* You could show the extracted street address for confirmation if needed: */}
        {/* {!isReadOnly && formData.address && <p style={{fontSize: '0.8em', marginTop: '2px'}}>Street Address: {formData.address}</p>} */}
      </div>

      {/* city */}
      <div className="form-group">
        <label htmlFor="city">City:</label>
        <input
          type="text"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange} // Still use standard handleChange here
          required
          readOnly={isReadOnly} // City might be auto-filled by AddressSearch, but allow manual override/view
        />
      </div>

      {/* state */}
      <div className="form-group">
        <label htmlFor="state">State:</label>
        <select
          id="state"
          name="state"
          value={formData.state}
          onChange={handleChange} // Still use standard handleChange here
          required
          disabled={isReadOnly} // State might be auto-filled, but allow manual override/view
        >
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state.value} value={state.value}>
              {state.label} {/* Display full name */}
            </option>
          ))}
        </select>
      </div>

      {/* zipCode */}
      <div className="form-group">
        <label htmlFor="zipCode">Zip Code:</label>
        <input
          type="text" // Use text for zip codes (e.g., 12345-6789)
          id="zipCode"
          name="zipCode"
          value={formData.zipCode}
          onChange={handleChange} // Use standard handler
          required
          readOnly={isReadOnly} // Zip might be auto-filled
          maxLength="10" // Optional: Limit length
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
        <label htmlFor="hoa">HOA:</label>
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
        <label htmlFor="propertyTax">Property Tax:</label>
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
        <label htmlFor="insurance">Insurance:</label>
        <input
          type="text"
          id="insurance"
          name="insurance"
          value={formatCurrencyForDisplay(formData.insurance)}
          onChange={handleChange}
          readOnly={isReadOnly}
        />
      </div>

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
          checked={!!formData.tenantInPlace} // Ensure boolean value
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
      <div className="form-group">
        <label htmlFor="createdOn">Created On:</label>
        <input
          type="text"
          id="createdOn"
          name="createdOn"
          value={formattedCreatedOn}
          readOnly
        />
      </div>
    </>
  );
};

export default PropertyFields;
