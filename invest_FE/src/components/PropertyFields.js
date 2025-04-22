// src/components/PropertyFields.js
import React, { useState } from "react";
import { states } from "../utils/states";
import { formatCurrencyForDisplay } from "../utils/currencyFormatter";
import { format } from "date-fns";
import AddressSearch from "./AddressSearch-OpenStreetMap";
import { calcROI } from "../utils/calcROI";

const PROPERTY_TYPES = [
  "Single-family",
  "Multi-family",
  "Apartment",
  "Townhouse",
  "Mobile home",
  "Vacation home",
];

const requiredFields = [
  "propertyID",
  "address",
  "city",
  "state",
  "zipCode",
  "type",
  "price",
];

const isRequired = (field) => requiredFields.includes(field);

const PropertyFields = ({
  formData,
  handleChange,
  handleAddressSelect,
  isReadOnly,
  currentYear,
  mode,
  displayAddress,
  fieldErrors = {},
}) => {
  if (!formData) return null; // Prevent rendering until formData is ready

  const formattedCreatedOn = formData.createdOn
    ? format(new Date(formData.createdOn), "MMM-dd-yyyy HH:mm")
    : "N/A";

  const roiValue = calcROI({
    price: formData.price,
    rent: formData.Rent,
    hoa: formData.hoa,
    propertyTax: formData.propertyTax,
    insurance: formData.insurance,
  });

  return (
    <>
      <div className="form-group">
        <label htmlFor="propertyID">
          Property ID{isRequired("propertyID") && <span className="required-asterisk">*</span>}:
        </label>
        <input
          type="number"
          id="propertyID"
          name="propertyID"
          value={formData.propertyID}
          onChange={handleChange}
          required={isRequired("propertyID")}
          min="1"
          step="1"
          disabled={isReadOnly || mode === "edit"}
          className={fieldErrors.propertyID ? "input-error" : ""}
        />
        {fieldErrors.propertyID && <div className="field-error">{fieldErrors.propertyID}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="address">
          Address Search{isRequired("address") && <span className="required-asterisk">*</span>}:
        </label>
        <AddressSearch
          id="address"
          initialValue={displayAddress}
          onLocationSelect={handleAddressSelect}
          disabled={isReadOnly}
          required={isRequired("address")}
          placeholder="Start typing address..."
        />
      </div>
      <div className="form-group">
        <label htmlFor="city">
          City{isRequired("city") && <span className="required-asterisk">*</span>}:
        </label>
        <input
          type="text"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required={isRequired("city")}
          disabled={isReadOnly}
        />
      </div>
      <div className="form-group">
        <label htmlFor="state">
          State{isRequired("state") && <span className="required-asterisk">*</span>}:
        </label>
        <select
          id="state"
          name="state"
          value={formData.state}
          onChange={handleChange}
          required={isRequired("state")}
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
      <div className="form-group">
        <label htmlFor="zipCode">
          Zip Code{isRequired("zipCode") && <span className="required-asterisk">*</span>}:
        </label>
        <input
          type="text"
          id="zipCode"
          name="zipCode"
          value={formData.zipCode}
          onChange={handleChange}
          required={isRequired("zipCode")}
          disabled={isReadOnly}
          maxLength="10"
        />
      </div>
      <div className="form-group">
        <label htmlFor="type">
          Type{isRequired("type") && <span className="required-asterisk">*</span>}:
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required={isRequired("type")}
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
      <div className="form-group">
        <label htmlFor="price">
          Price{isRequired("price") && <span className="required-asterisk">*</span>}:
        </label>
        <input
          type="text"
          id="price"
          name="price"
          value={formatCurrencyForDisplay(formData.price)}
          onChange={handleChange}
          required={isRequired("price")}
          readOnly={isReadOnly}
        />
      </div>
      <div className="form-group">
        <label htmlFor="hoa">HOA/mo:</label>
        <input
          type="text"
          id="hoa"
          name="hoa"
          value={formatCurrencyForDisplay(formData.hoa)}
          onChange={handleChange}
          readOnly={isReadOnly}
        />
      </div>
      <div className="form-group">
        <label htmlFor="propertyTax/yr">Property Tax/yr:</label>
        <input
          type="text"
          id="propertyTax"
          name="propertyTax"
          value={formatCurrencyForDisplay(formData.propertyTax)}
          onChange={handleChange}
          readOnly={isReadOnly}
        />
      </div>
      <div className="form-group">
        <label htmlFor="insurance">Insurance/mo:</label>
        <input
          type="text"
          id="insurance"
          name="insurance"
          value={formatCurrencyForDisplay(formData.insurance)}
          onChange={handleChange}
          readOnly={isReadOnly}
        />
      </div>
      <div className="form-group">
        <label htmlFor="Rent">Rent Estimate/mo:</label>
        <input
          type="text"
          id="Rent"
          name="Rent"
          value={formatCurrencyForDisplay(formData.Rent)}
          onChange={handleChange}
          readOnly={isReadOnly}
          placeholder="$0"
        />
      </div>
      <div className="form-group">
        <label htmlFor="roi">ROI %:</label>
        <input
          type="text"
          id="roi"
          name="roi"
          value={roiValue || "N/A"}
          readOnly
          disabled
          className="calculated-field"
        />
      </div>
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
          disabled
        />
      </div>
    </>
  );
};

const PropertyForm = (props) => {
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  const handleSubmit = async (e, formData) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");
    try {
      // ...your API call...
    } catch (err) {
      // Example error handling:
      if (err.response && err.response.data && err.response.data.errors) {
        setFieldErrors(err.response.data.errors); // { propertyID: "Already exists" }
      } else if (err.response && err.response.data && err.response.data.message) {
        setGeneralError(err.response.data.message);
      } else {
        setGeneralError("An unexpected error occurred.");
      }
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, props.formData)}>
      {generalError && (
        <div className="form-error" title={generalError}>
          {generalError}
        </div>
      )}
      <PropertyFields
        {...props}
        fieldErrors={fieldErrors}
      />
      {/* ...buttons... */}
    </form>
  );
};

export default PropertyFields;
