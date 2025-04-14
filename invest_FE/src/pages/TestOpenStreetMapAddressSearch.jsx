// src/pages/TestAddressSearch-OpenStreetMap.jsx
import React, { useState } from "react";
import AddressSearchInput from "../components/AddressSearch-OpenStreetMap.jsx";
import "./TestPages.css"; // Optional: Common styling for test pages

const TestOpenStreetMapAddressSearch = () => {
  const [selectedLocationData, setSelectedLocationData] = useState(null);

  const handleLocationSelected = (location) => {
    console.log("Location selected in Test Page:", location);
    setSelectedLocationData(location);
  };

  return (
    <div className="test-page-container">
      <h1>Test Address Search Input (Nominatim)</h1>
      <p>
        This component uses the OpenStreetMap Nominatim API to search for US
        addresses.
      </p>

      <div className="test-component-area">
        <AddressSearchInput
          onLocationSelect={handleLocationSelected}
          placeholder="Search Nominatim for a US address..."
        />
      </div>

      {selectedLocationData && (
        <div className="test-results-area">
          <h2>Selected Location Data:</h2>
          <pre>{JSON.stringify(selectedLocationData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestOpenStreetMapAddressSearch;
