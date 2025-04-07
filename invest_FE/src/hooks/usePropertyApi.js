/* /src/hooks/usePropertyApi.js */
import { useState, useContext, useMemo, useCallback } from "react";
import { UserContext } from "../context/UserContext";
import { BASE_URL } from "../utils/config";

const API_BASE_URL = `${BASE_URL}/api/properties/property`;

const usePropertyApi = (mode, urlPropertyID, onCancel, onDelete, onSuccess) => {
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProperty = useCallback(async () => {
    console.log("Fetching property with ID:", urlPropertyID);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${urlPropertyID}`, {
        headers: {
          Authorization: `Bearer ${user.token}`, // Add the token here
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch property");
      }
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [urlPropertyID, user.token]); // Add user.token as a dependency

  const handleSubmit = useCallback(
    async (e, formData) => {
      e.preventDefault();
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

        console.log("Submitting with token:", user.token);
        console.log("Form data:", dataToSend);
        console.log("Request URL:", url);
        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`, // Add the token here
          },
          body: JSON.stringify(dataToSend),
        });

        if (response.ok) {
          console.log(`Property ${mode}ed successfully`);
          alert(`Property ${mode}ed -ed successfully!`);
          onSuccess();
          onCancel();
        } else {
          const errorData = await response.json();
          console.error(`Failed to ${mode} property:`, errorData);
          setError(
            `Failed to ${mode} property:\n${
              errorData.error || "An error occurred."
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
    [mode, urlPropertyID, user.token, onCancel, onSuccess] // Add user.token as a dependency
  );

  const handleDelete = useCallback(
    async (idToDelete) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete property ${idToDelete}?`
      );
      if (confirmed) {
        try {
          console.log("Deleting with token:", user.token);
          const response = await fetch(`${API_BASE_URL}/${idToDelete}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${user.token}`, // Add the token here
            },
          });

          if (response.ok) {
            console.log("Property deleted successfully");
            onDelete(idToDelete);
            onCancel();
          } else {
            const errorData = await response.json();
            console.error("Failed to delete property:", errorData);
            alert(
              `Failed to delete property:\n${
                errorData.error || "An error occurred."
              }`
            );
          }
        } catch (error) {
          console.error("Network error during property deletion:", error);
          alert(
            "Failed to connect to the server. Please check your network or try again later."
          );
        }
      }
    },
    [user.token, onCancel, onDelete] // Add user.token as a dependency
  );

  return useMemo(
    () => ({
      isLoading,
      error,
      setError,
      fetchProperty,
      handleSubmit,
      handleDelete,
    }),
    [isLoading, error, fetchProperty, handleSubmit, handleDelete]
  );
};

export default usePropertyApi;
