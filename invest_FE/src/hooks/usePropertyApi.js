/* /src/hooks/usePropertyApi.js */
import { useState, useContext, useMemo, useCallback } from "react";
import { UserContext } from "../context/UserContext";
import { BASE_URL } from "../utils/config";

// Correct base URL for the properties API endpoint based on your app.js
// const API_BASE_URL = `${BASE_URL}/api/properties`;
const API_BASE_URL = `${BASE_URL}/api/properties/property`;
// Validation function (can be outside useCallback as it doesn't depend on changing props/state)
const validateFormData = (data) => {
  const errors = {};
  // Check required fields based on schema
  if (!data.propertyID) errors.propertyID = "Property ID is required.";
  // Ensure address (street address component) is present
  if (!data.address || data.address.trim() === "")
    errors.address =
      "Street address is required. Please select a valid address from suggestions.";
  if (!data.city || data.city.trim() === "") errors.city = "City is required.";
  if (!data.state || data.state.trim() === "")
    errors.state = "State is required.";
  if (!data.zipCode || data.zipCode.trim() === "")
    errors.zipCode = "Zip Code is required.";
  if (!data.type || data.type.trim() === "")
    errors.type = "Property type is required.";
  if (data.price === "" || data.price === null || isNaN(data.price))
    errors.price = "Price is required and must be a number.";

  // Crucial: Check location.coordinates
  if (
    !data.location ||
    !Array.isArray(data.location.coordinates) ||
    data.location.coordinates.length !== 2
  ) {
    errors.location =
      "Valid coordinates are required. Please select an address from the suggestions to auto-fill coordinates.";
  } else if (
    !data.location.coordinates.every(
      (coord) => typeof coord === "number" && !isNaN(coord)
    )
  ) {
    errors.location = "Coordinates must be valid numbers.";
  }

  // Add other required field checks if necessary...
  // Example: Year Built validation (if needed)
  // if (data.yearBuilt && (isNaN(data.yearBuilt) || data.yearBuilt < 1800 || data.yearBuilt > new Date().getFullYear())) {
  //     errors.yearBuilt = "Please enter a valid year built.";
  // }

  return errors;
};

const usePropertyApi = (mode, urlPropertyID, onCancel, onDelete, onSuccess) => {
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProperty = useCallback(async () => {
    if (!urlPropertyID) {
      setError("No Property ID provided for fetching.");
      return null;
    }
    console.log("Fetching property with ID:", urlPropertyID);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${urlPropertyID}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to fetch property" }));
        throw new Error(errorData.message || "Failed to fetch property");
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error fetching property:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [urlPropertyID, user.token, setError]);

  const handleSubmit = useCallback(
    async (e, formData) => {
      e.preventDefault();
      setError(null); // Clear previous errors

      // *** Frontend Validation ***
      const validationErrors = validateFormData(formData);
      if (Object.keys(validationErrors).length > 0) {
        const errorMessages = Object.values(validationErrors).join("\n");
        setError(`Please fix the following errors:\n${errorMessages}`);
        console.error("Frontend Validation Errors:", validationErrors);
        return; // Stop submission
      }

      setIsLoading(true);
      setError(null);

      try {
        const method = mode === "edit" ? "PUT" : "POST";
        const url =
          mode === "edit" || mode === "view"
            ? `${API_BASE_URL}/${urlPropertyID}`
            : `${API_BASE_URL}/add`;

        // Create a copy of formData and remove createdOn for POST requests
        const dataToSend = { ...formData };
        if (method === "POST") {
          delete dataToSend.createdOn; // Remove createdOn to let backend apply default
        }

        console.log(
          "Submitting with token:",
          user.token ? "Token Present" : "NO TOKEN"
        );
        console.log("Submitting Data:", JSON.stringify(dataToSend, null, 2));
        console.log("Request URL:", url);
        console.log("Request Method:", method);

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(dataToSend),
        });

        const responseData = await response.json(); // Try to parse JSON regardless of status

        if (response.ok) {
          const action = mode === "add" ? "added" : "updated";
          console.log(`Property ${action} successfully:`, responseData);
          alert(`Property ${action} successfully!`);
          if (onSuccess) onSuccess(responseData); // Pass data back on success
          // Consider if onCancel should be called here or if onSuccess handles closing
          // if (onCancel) onCancel();
        } else {
          console.error(`Failed to ${mode} property:`, responseData);
          // Use message from backend if available, otherwise provide a generic error
          setError(
            `Failed to ${mode} property:\n${
              responseData.message ||
              responseData.error ||
              "An error occurred on the server."
            }`
          );
        }
      } catch (error) {
        console.error(`Network error during property ${mode}:`, error);
        setError(
          "Failed to connect to the server. Please check your network or try again later."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [mode, urlPropertyID, user.token, onCancel, onSuccess, setError] // Added setError dependency
  );

  const handleDelete = useCallback(
    async (idToDelete) => {
      if (!idToDelete) {
        alert("Cannot delete: No Property ID provided.");
        return;
      }
      const confirmed = window.confirm(
        `Are you sure you want to delete property ${idToDelete}?`
      );
      if (confirmed) {
        setIsLoading(true);
        setError(null);
        try {
          console.log(
            "Deleting with token:",
            user.token ? "Token Present" : "NO TOKEN"
          );
          // Correct URL for deleting a specific property
          const response = await fetch(`${API_BASE_URL}/${idToDelete}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          });

          // Check if response has content before trying to parse JSON
          const responseText = await response.text();

          if (response.ok) {
            console.log("Property deleted successfully");
            if (onDelete) onDelete(idToDelete); // Call onDelete callback with the ID
            // Consider if onCancel should be called here or if onDelete handles closing
            // if (onCancel) onCancel();
          } else {
            let errorData = { message: "Failed to delete property." };
            try {
              if (responseText) errorData = JSON.parse(responseText);
            } catch (e) {
              console.error(
                "Could not parse error response JSON:",
                responseText
              );
            }
            console.error("Failed to delete property:", errorData);
            setError(
              `Failed to delete property:\n${
                errorData.message || errorData.error || "An error occurred."
              }`
            );
            // Keep the alert for explicit user feedback on failure
            alert(
              `Failed to delete property:\n${
                errorData.message || errorData.error || "An error occurred."
              }`
            );
          }
        } catch (error) {
          console.error("Network error during property deletion:", error);
          setError(
            "Failed to connect to the server. Please check your network or try again later."
          );
          alert(
            "Failed to connect to the server. Please check your network or try again later."
          );
        } finally {
          setIsLoading(false);
        }
      }
    },
    [user.token, onCancel, onDelete, setError] // Added setError dependency
  );

  // Return setError so the parent component can clear errors if needed (e.g., in its own error display logic)
  return useMemo(
    () => ({
      isLoading,
      error,
      setError, // Expose setError
      fetchProperty,
      handleSubmit,
      handleDelete,
    }),
    [isLoading, error, setError, fetchProperty, handleSubmit, handleDelete] // Added setError to dependency array
  );
};

export default usePropertyApi;
