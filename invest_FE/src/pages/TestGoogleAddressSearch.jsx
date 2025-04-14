// src/pages/TestGoogleAddressSearch.jsx
import React, { useState } from "react";
import AddressSearch from "../components/AddressSearch-Google";

const TestGoogleAddressSearch = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Test Address Search</h1>
      <AddressSearch onAddressSelect={setSelectedLocation} />
      {selectedLocation && (
        <div className="result">
          <h2>Selected Location (GeoJSON)</h2>
          <pre>{JSON.stringify(selectedLocation, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestGoogleAddressSearch;
