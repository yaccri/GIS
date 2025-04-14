// src/utils/currencyFormatter.js

export const formatCurrency = (amount) => {
  if (amount === "" || amount === undefined || amount === null) {
    return "";
  }
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    return amount;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

export const formatCurrencyForDisplay = (value) => {
  if (value === "" || value === null || isNaN(value)) return "";
  return formatCurrency(value); // e.g., 4222 -> "$4,222"
};

export const parseCurrency = (value) => {
  if (!value) return "";
  // Remove any non-numeric characters except for the decimal point
  const numericValue = value.replace(/[^0-9.]/g, "");
  return numericValue === "" ? "" : parseFloat(numericValue);
};

export const formatPriceForPin = (value) => {
  const num =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]+/g, ""))
      : value;

  if (num == null || isNaN(num)) {
    return "N/A";
  }

  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `$${Math.round(num / 1000)}k`;
  }
  return `$${num}`; // For values less than 1000
};
