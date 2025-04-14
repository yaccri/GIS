// src/components/AddressSearch-Google.jsx
import React, { useState, useEffect, useRef } from "react";
import { GOOGLE_MAPS_API_KEY } from "../utils/config";

const AddressSearch = ({ onAddressSelect }) => {
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (window.google && window.google.maps) return;

    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => console.log("Google Maps script loaded");
    script.onerror = () => setError("Failed to load Google Maps script");
    document.head.appendChild(script);
  }, []);

  const getAddressFields = (components) => {
    const getComponent = (type, useShort = false) =>
      components.find((c) => c.types.includes(type))?.[
        useShort ? "short_name" : "long_name"
      ] || "";

    const streetNumber = getComponent("street_number");
    const route = getComponent("route");
    const streetAddress = [streetNumber, route].filter(Boolean).join(" ");

    return {
      street_address: streetAddress,
      city: getComponent("locality"),
      neighborhood: getComponent("sublocality") || getComponent("neighborhood"),
      county: getComponent("administrative_area_level_2"),
      state: getComponent("administrative_area_level_1", true), // use short_name here
      ZIP: getComponent("postal_code"),
    };
  };

  const handleAddressChange = async (e) => {
    const input = e.target.value;
    setAddress(input);
    setError(null);

    if (input.length > 2) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            input
          )}&key=${GOOGLE_MAPS_API_KEY}&language=en-US&region=us&components=country:US`
        );
        const data = await response.json();

        if (data.status === "OK") {
          const streetAddresses = data.results.filter(
            (result) =>
              result.types.includes("street_address") ||
              result.types.includes("premise") ||
              result.types.includes("subpremise")
          );
          setSuggestions(
            streetAddresses.length > 0
              ? streetAddresses
              : data.results.slice(0, 5)
          );
        } else {
          setError(`Geocoding API error: ${data.status}`);
          setSuggestions([]);
        }
      } catch (err) {
        setError(err.message);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setAddress(suggestion.formatted_address);
    setSuggestions([]);

    const location = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          suggestion.geometry.location.lng,
          suggestion.geometry.location.lat,
        ],
      },
      properties: {
        address: suggestion.formatted_address,
        place_id: suggestion.place_id,
        types: suggestion.types,
        components: getAddressFields(suggestion.address_components),
      },
    };

    if (onAddressSelect) onAddressSelect(location);
  };

  return (
    <div className="address-search">
      <input
        type="text"
        value={address}
        onChange={handleAddressChange}
        placeholder="Enter a US street address..."
        className="address-input"
      />
      {error && <div className="error">{error}</div>}
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              onClick={() => handleSuggestionClick(s)}
              className="suggestion-item"
            >
              {s.formatted_address}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressSearch;
