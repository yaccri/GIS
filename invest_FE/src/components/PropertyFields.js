// src/components/PropertyFields.js
import React from "react";
import { states } from "../utils/states";
import { formatCurrencyForDisplay } from "../utils/currencyFormatter";
import { format } from "date-fns"; // to format createdOn date
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
  isReadOnly,
  currentYear,
  mode,
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

      {/* address */}
      <div className="form-group">
        <label htmlFor="address">Address:</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          readOnly={isReadOnly}
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
          readOnly={isReadOnly}
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
          disabled={isReadOnly}
        >
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state.value} value={state.value}>
              {state.label}
            </option>
          ))}
        </select>
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
          checked={formData.tenantInPlace}
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
