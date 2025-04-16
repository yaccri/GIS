// src/components/map/MapSidebar.js
import React, { useState, useEffect } from "react";
import HoveringPropertyForm from "../HoveringPropertyForm"; // Import the hovering form
import "./MapSidebar.css";

// Read isAdmin from localStorage (assuming you store login result as "loginResult")
function getIsAdmin() {
  try {
    const loginData = JSON.parse(localStorage.getItem("loginResult"));
    return loginData?.isAdmin === true;
  } catch {
    return false;
  }
}

const MapSidebar = ({
  radiusSearchResults,
}) => {
  const [isAdmin, setIsAdmin] = useState(getIsAdmin());
  const [selectedProperty, setSelectedProperty] = useState(null); // Track the selected property
  const [isHoveringFormOpen, setHoveringFormOpen] = useState(false); // Track if the hovering form is open

  // Listen for both "storage" and a custom "loginStatusChanged" event
  useEffect(() => {
    // Handler to update isAdmin state
    const updateIsAdmin = () => setIsAdmin(getIsAdmin());

    // Listen for localStorage changes (other tabs/windows)
    window.addEventListener("storage", updateIsAdmin);

    // Listen for custom event (same tab, after login)
    window.addEventListener("loginStatusChanged", updateIsAdmin);

    // Also check on mount
    setIsAdmin(getIsAdmin());

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener("storage", updateIsAdmin);
      window.removeEventListener("loginStatusChanged", updateIsAdmin);
    };
  }, []);

  console.log("isAdmin in MapSidebar:", isAdmin); // This should now show true or false

  const handlePropertyClick = (property) => {
    setSelectedProperty(property); // Set the selected property
    setHoveringFormOpen(true); // Open the form
  };

  return (
    <div>
      <ul className="property-list">
        {radiusSearchResults.map((property) => (
          <li
            key={property.propertyID || property.id}
            onClick={() => handlePropertyClick(property)}
            className="property-card"
            style={{ cursor: "pointer", border: "1px solid #ccc", borderRadius: "8px", margin: "8px 0", padding: "12px", background: "#fafafa" }}
          >
            <div><strong>ID:</strong> {property.propertyID || property.id}</div>
            <div><strong>Address:</strong> {property.address}</div>
            <div><strong>Type:</strong> {property.type}</div>
            <div><strong>Beds:</strong> {property.beds} | <strong>Baths:</strong> {property.baths}</div>
            <div><strong>Price:</strong> {property.price ? `$${property.price}` : "N/A"}</div>
          </li>
        ))}
      </ul>
      {isHoveringFormOpen && (
        <HoveringPropertyForm
          isOpen={isHoveringFormOpen}
          onClose={() => setHoveringFormOpen(false)}
          property={selectedProperty}
          isAdmin={isAdmin}
          onEdit={(updatedProperty) => {
            // handle edit
            setHoveringFormOpen(false);
          }}
          onDelete={(propertyID) => {
            // handle delete
            setHoveringFormOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default MapSidebar;
