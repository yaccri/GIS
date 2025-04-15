// src/components/map/utils/mapIconUtils.js
import L from "leaflet";
import { formatPriceForPin } from "../../../utils/currencyFormatter"; // Adjusted path

/**
 * Creates a custom Leaflet DivIcon to display a formatted property price.
 * @param {number|string} price - The property price.
 * @returns {L.DivIcon} - A Leaflet DivIcon instance.
 */
export const createPriceIcon = (price) => {
  const formattedPrice = formatPriceForPin(price);
  return L.divIcon({
    html: `<div class="price-marker-content">${formattedPrice}</div>`,
    className: "price-marker-icon", // CSS class for styling
    iconSize: null, // Let CSS control size
    iconAnchor: [0, 15], // Position the icon anchor relative to its top-left corner
    popupAnchor: [0, -15], // Position the popup anchor relative to the icon anchor
  });
};

/**
 * Creates a custom Leaflet DivIcon to display a neighborhood name label.
 * @param {string} name - The name of the neighborhood.
 * @returns {L.DivIcon} - A Leaflet DivIcon instance.
 */
export const createNeighborhoodLabelIcon = (name) => {
  return L.divIcon({
    html: `<div class="label-content">${name}</div>`,
    className: "neighborhood-label-icon", // CSS class for styling
    iconSize: null, // Let CSS control size
    iconAnchor: [30, 8], // Adjust anchor point as needed for label positioning
  });
};
