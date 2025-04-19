// src/pages/TestGoogleAddressSearch.jsx
import React, { useState } from "react";
import AddressSearch from "../components/AddressSearch-Google";
import "./TestPages.css"; // Import the common styling

const TestGoogleAddressSearch = () => {
  // Use a more descriptive name consistent with the other test page
  const [selectedLocationData, setSelectedLocationData] = useState(null);

  // Handler function similar to the other test page
  const handleAddressSelected = (location) => {
    console.log("Address selected in Test Page (Google):", location);
    setSelectedLocationData(location);
  };

  return (
    // Use the common container class
    <div className="test-page-container">
      <h1>Test Address Search Input (Google Places)</h1>
      <p>
        This component uses the Google Places Autocomplete API to search for
        addresses.
      </p>

      {/* Use the common component area class */}
      <div className="test-component-area">
        <AddressSearch
          onAddressSelect={handleAddressSelected}
          // Add a placeholder for consistency, assuming AddressSearch-Google can use it
          // If AddressSearch-Google doesn't use a placeholder prop, this won't break anything
          placeholder="Search Google for an address..."
        />
      </div>

      {selectedLocationData && (
        // Use the common results area class
        <div className="test-results-area">
          {/* Keep the specific title mentioning GeoJSON if that's what Google returns */}
          <h2>Selected Location Data (GeoJSON):</h2>
          <pre>{JSON.stringify(selectedLocationData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestGoogleAddressSearch;
