// src/components/AddressSearch-OpenStreetMap.jsx
import React, { useState, useRef, useEffect } from "react";
import "./AddressSearch.css";
import { MAP_URL } from "../utils/config";

const AddressSearchInput = ({
  onLocationSelect,
  initialValue = "",
  placeholder = "Enter US address...",
  disabled = false, // Add disabled prop
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef(null);

  // Update internal state if initialValue prop changes externally
  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    setSuggestions([]);

    try {
      const apiUrl = `${MAP_URL}/search?format=json&q=${encodeURIComponent(
        query + ", United States"
      )}&limit=5&countrycodes=us&addressdetails=1&accept-language=en`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.display_name);
    setSuggestions([]);
    if (onLocationSelect) {
      const geojsonFeature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [parseFloat(suggestion.lon), parseFloat(suggestion.lat)],
        },
        properties: {
          name: suggestion.display_name,
          osm_id: suggestion.osm_id,
          type: suggestion.type,
          importance: suggestion.importance,
          address: suggestion.address || {},
        },
      };
      onLocationSelect(geojsonFeature);
    }
  };

  const handleInputClick = () => {
    if (!disabled) {
      setInputValue("");
      setSuggestions([]);
    }
  };

  return (
    <div className="address-search-input-container">
      <input
        type="text"
        className="address-search-box"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onClick={handleInputClick}
        aria-label="Address Search Input"
        disabled={disabled} // Add disabled prop
      />
      {isLoading && !disabled && (
        <div className="address-search-loading">Loading...</div>
      )}
      {suggestions.length > 0 && !disabled && (
        <ul className="address-suggestions-list">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.osm_id + suggestion.place_id}
              className="address-suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
              aria-selected="false"
            >
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressSearchInput;
