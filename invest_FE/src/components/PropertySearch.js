// src/components/PropertySearch.js
import React, { useState, useEffect } from "react";
import "./PropertySearch.css";
import { states } from "../utils/states";
import {
  formatCurrencyForDisplay,
  parseCurrency,
} from "../utils/currencyFormatter";

const PropertySearch = ({ onSearch }) => {
  const [searchCriteria, setSearchCriteria] = useState({
    propertyID: "", // Added propertyID filter
    state: "",
    price: { min: "", max: "" }, // Changed to object
    type: "",
    yearBuilt: { min: "", max: "" }, // Changed to object
    beds: { min: "", max: "" }, // Changed to object
  });

  // State to hold formatted price values for display
  const [formattedPrice, setFormattedPrice] = useState({
    min: "",
    max: "",
  });

  useEffect(() => {
    setFormattedPrice({
      min: formatCurrencyForDisplay(searchCriteria.price.min),
      max: formatCurrencyForDisplay(searchCriteria.price.max),
    });
  }, [searchCriteria.price.min, searchCriteria.price.max]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [mainKey, subKey] = name.split("."); // Split name into main and sub keys

    setSearchCriteria((prev) => {
      if (subKey) {
        // If there's a subKey, update the nested object
        const parsedValue = mainKey === "price" ? parseCurrency(value) : value;
        return {
          ...prev,
          [mainKey]: { ...prev[mainKey], [subKey]: parsedValue },
        };
      } else {
        // Otherwise, update the main key
        return { ...prev, [mainKey]: value };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchCriteria);
  };

  const handleReset = () => {
    setSearchCriteria({
      propertyID: "", // Reset propertyID
      state: "",
      price: { min: "", max: "" },
      type: "",
      yearBuilt: { min: "", max: "" },
      beds: { min: "", max: "" },
    });
    setFormattedPrice({ min: "", max: "" });
    onSearch({});
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const [mainKey, subKey] = name.split(".");
    const parsedValue = parseCurrency(value);

    setSearchCriteria((prev) => ({
      ...prev,
      [mainKey]: { ...prev[mainKey], [subKey]: parsedValue },
    }));

    setFormattedPrice((prev) => ({
      ...prev,
      [subKey]: value,
    }));
  };

  return (
    <div className="property-search">
      <h2>Search Properties</h2>
      <form onSubmit={handleSubmit}>
        {/* Property ID */}
        <div className="form-group">
          <label htmlFor="propertyID">Property ID:</label>
          <input
            type="number"
            id="propertyID"
            name="propertyID"
            value={searchCriteria.propertyID}
            onChange={handleChange}
            min="1"
          />
        </div>

        {/* State */}
        <div className="form-group">
          <label htmlFor="state">State:</label>
          <select
            id="state"
            name="state"
            value={searchCriteria.state}
            onChange={handleChange}
          >
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div className="form-group-inline">
          <div className="form-group">
            <label htmlFor="price.min">Min Price:</label>
            <input
              type="text"
              id="price.min"
              name="price.min" // Changed name
              value={formattedPrice.min} // Access nested value
              onChange={handlePriceChange}
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="price.max">Max Price:</label>
            <input
              type="text"
              id="price.max"
              name="price.max" // Changed name
              value={formattedPrice.max} // Access nested value
              onChange={handlePriceChange}
              min="0"
            />
          </div>
        </div>

        {/* Type */}
        <div className="form-group">
          <label htmlFor="type">Type:</label>
          <select
            id="type"
            name="type"
            value={searchCriteria.type}
            onChange={handleChange}
          >
            <option value="">All Types</option>
            <option value="Single-family">Single-family</option>
            <option value="Multi-family">Multi-family</option>
            <option value="Apartment">Apartment</option>
            <option value="Townhouse">Townhouse</option>
            <option value="Mobile home">Mobile home</option>
            <option value="Vacation home">Vacation home</option>
          </select>
        </div>

        {/* Year Built */}
        <div className="form-group-inline">
          <div className="form-group">
            <label htmlFor="yearBuilt.min">Min Year Built:</label>
            <input
              type="number"
              id="yearBuilt.min"
              name="yearBuilt.min" // Changed name
              value={searchCriteria.yearBuilt.min} // Access nested value
              onChange={handleChange}
              min="1800"
            />
          </div>
          <div className="form-group">
            <label htmlFor="yearBuilt.max">Max Year Built:</label>
            <input
              type="number"
              id="yearBuilt.max"
              name="yearBuilt.max" // Changed name
              value={searchCriteria.yearBuilt.max} // Access nested value
              onChange={handleChange}
              min="1800"
            />
          </div>
        </div>

        {/* Beds */}
        <div className="form-group-inline">
          <div className="form-group">
            <label htmlFor="beds.min">Min Beds:</label>
            <input
              type="number"
              id="beds.min"
              name="beds.min" // Changed name
              value={searchCriteria.beds.min} // Access nested value
              onChange={handleChange}
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="beds.max">Max Beds:</label>
            <input
              type="number"
              id="beds.max"
              name="beds.max" // Changed name
              value={searchCriteria.beds.max} // Access nested value
              onChange={handleChange}
              min="0"
            />
          </div>
        </div>

        <div className="button-group">
          <button type="submit" className="search-btn">
            Search
          </button>
          <button type="button" className="reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertySearch;
