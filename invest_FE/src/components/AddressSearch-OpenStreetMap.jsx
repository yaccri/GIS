// src/components/AddressSearch-OpenStreetMap.jsx
import React, { useState, useRef, useEffect } from "react";
import "./AddressSearch-OpenStreetMap.css";

const AddressSearchInput = ({
  onLocationSelect,
  initialValue = "",
  placeholder = "Enter US address...",
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
      // Don't search for very short queries
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    setSuggestions([]); // Clear old suggestions immediately

    try {
      // Using Nominatim (OpenStreetMap) API
      // *** Add accept-language=en parameter ***
      const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query + ", United States" // Bias towards US results
      )}&limit=5&countrycodes=us&addressdetails=1&accept-language=en`; // Request English results

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]); // Clear suggestions on error
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

    // Only start searching after a short delay (debouncing)
    searchTimeout.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300); // 300ms delay
  };

  const handleSuggestionClick = (suggestion) => {
    // Use display_name which should be influenced by accept-language
    // Keep the selected text in the input after selection
    setInputValue(suggestion.display_name);
    setSuggestions([]); // Hide suggestions list
    if (onLocationSelect) {
      // Pass the selected suggestion object back to the parent
      // Convert Nominatim result to a basic GeoJSON-like structure for consistency
      const geojsonFeature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [parseFloat(suggestion.lon), parseFloat(suggestion.lat)], // [lon, lat]
        },
        properties: {
          // Use display_name here as well for consistency
          name: suggestion.display_name,
          osm_id: suggestion.osm_id,
          type: suggestion.type,
          importance: suggestion.importance,
          address: suggestion.address || {}, // Include address details if available
        },
      };
      onLocationSelect(geojsonFeature);
    }
  };

  const handleInputClick = () => {
    // Clear the input value when the input field itself is clicked
    setInputValue("");
    // Also clear suggestions to provide a clean slate
    setSuggestions([]);
  };

  return (
    <div className="address-search-input-container">
      <input
        type="text"
        className="address-search-box"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onClick={handleInputClick} // <-- Add the onClick handler here
        aria-label="Address Search Input"
      />
      {isLoading && <div className="address-search-loading">Loading...</div>}
      {suggestions.length > 0 && (
        <ul className="address-suggestions-list">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.osm_id + suggestion.place_id} // Combine keys for better uniqueness
              className="address-suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
              aria-selected="false"
            >
              {/* Display name should be localized based on accept-language */}
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressSearchInput;
