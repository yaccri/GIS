import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./PropertyDisplay.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { calcROI } from "../../utils/calcROI";

// Utility for formatting numbers with commas
const formatNumber = (num) =>
  num !== undefined && num !== null && num !== "" && !isNaN(num)
    ? Number(num).toLocaleString()
    : "N/A";

const formatCurrency = (num) =>
  num !== undefined && num !== null && num !== "" && !isNaN(num)
    ? `$${Number(num).toLocaleString()}`
    : "N/A";

const formatCurrencyNoDollar = (num) =>
  num !== undefined && num !== null && num !== "" && !isNaN(num)
    ? Number(num).toLocaleString()
    : "N/A";

// Utility for formatting date
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date)) return "N/A";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const m = months[date.getMonth()];
  const d = String(date.getDate()).padStart(2, "0");
  const y = date.getFullYear();
  return `${m}-${d}-${y}`;
};

const PropertyDisplay = ({ isOpen, onClose, property }) => {
  const modalRef = useRef(null);

  const initialFormData = {
    propertyID: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    type: "",
    description: "",
    price: "",
    hoa: "",
    propertyTax: "",
    insurance: "",
    beds: "",
    baths: "",
    size: "",
    lotSize: "",
    yearBuilt: "",
    tenantsInPlace: "",
    createdOn: "",
    Rent: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (property) {
      setFormData({
        ...initialFormData,
        ...Object.fromEntries(
          Object.entries(property).map(([key, value]) => [
            key,
            value ?? initialFormData[key] ?? "",
          ])
        ),
      });
    } else {
      setFormData(initialFormData);
    }
  }, [property]);

  if (!isOpen) return null;

  const roiValue = calcROI({
    price: formData.price,
    rent: formData.Rent,
    hoa: formData.hoa,
    propertyTax: formData.propertyTax,
    insurance: formData.insurance,
  });

  return ReactDOM.createPortal(
    <div className="property-display-overlay">
      <div className="property-display" ref={modalRef}>
        <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
          <span className="close-btn-fallback">×</span>
        </button>
        <div className="zillow-main">
          <div className="zillow-main-row">
            <div className="zillow-price-roi-group">
              <span className="zillow-price">
                {formatCurrency(formData.price)}
              </span>
              {roiValue !== "" && (
                <span className="zillow-roi-inline">
                  <i className="fas fa-percentage"></i>
                  <span className="zillow-roi-label">ROI </span>
                  <span className="zillow-roi-value">{roiValue}</span>
                </span>
              )}
            </div>
          </div>
          <div className="zillow-address-row">
            <span className="zillow-address">
              {formData.address}, {formData.city}, {formData.state}{" "}
              {formData.zip}
            </span>
            <span className="zillow-address-details">
              <span>
                <i className="fas fa-bed"></i>{" "}
                {formatNumber(formData.beds) || "N/A"} Beds
              </span>
              <span>
                <i className="fas fa-bath"></i>{" "}
                {formatNumber(formData.baths) || "N/A"} Baths
              </span>
              <span>
                <i className="fas fa-ruler-combined"></i>{" "}
                {formatNumber(formData.size) || "N/A"} sqft
              </span>
            </span>
          </div>
        </div>
        <div className="zillow-fields-bg">
          <div className="zillow-grid zillow-grid-2rows">
            <div className="grid-item">
              <i className="fas fa-home"></i>{" "}
              <span className="zillow-detail-label">Type</span>{" "}
              <span className="zillow-detail-value">
                {formData.type || "N/A"}
              </span>
            </div>
            <div className="grid-item">
              <i className="fas fa-calendar-alt"></i>{" "}
              <span className="zillow-detail-label">Built</span>{" "}
              <span className="zillow-detail-value">
                {formData.yearBuilt || "N/A"}
              </span>
            </div>
            <div className="grid-item">
              <i className="fas fa-expand"></i>{" "}
              <span className="zillow-detail-label">Sqft Lot</span>{" "}
              <span className="zillow-detail-value">
                {formatNumber(formData.lotSize)}
              </span>
            </div>
            <div className="grid-item">
              <i className="fas fa-shield-alt"></i>{" "}
              <span className="zillow-detail-label">Insurance</span>{" "}
              <span className="zillow-detail-value">
                {formData.insurance
                  ? `${formatCurrency(formData.insurance)}/mo`
                  : "N/A"}
              </span>
            </div>
            <div className="grid-item">
              <i className="fas fa-dollar-sign"></i>{" "}
              <span className="zillow-detail-label">$/sqft</span>{" "}
              <span className="zillow-detail-value">
                {formData.price && formData.size
                  ? `$${Math.round(
                      Number(formData.price) / Number(formData.size)
                    ).toLocaleString()}`
                  : "N/A"}
              </span>
            </div>
            <div className="grid-item">
              <i className="fas fa-coins"></i>{" "}
              <span className="zillow-detail-label">HOA</span>{" "}
              <span className="zillow-detail-value">
                {formData.hoa
                  ? `$${formatCurrencyNoDollar(formData.hoa)}/mo`
                  : "N/A"}
              </span>
            </div>
            <div className="grid-item">
              <i className="fas fa-file-invoice-dollar"></i>{" "}
              <span className="zillow-detail-label">Property Tax</span>{" "}
              <span className="zillow-detail-value">
                {formData.propertyTax
                  ? `${formatCurrency(formData.propertyTax)}/yr`
                  : "N/A"}
              </span>
            </div>
            <div className="grid-item">
              <i className="fas fa-user-friends"></i>{" "}
              <span className="zillow-detail-label">Tenant</span>{" "}
              <span className="zillow-detail-value">
                {formData.tenantsInPlace ? "Yes" : "No"}
              </span>
            </div>
            <div className="grid-item">
              <i className="fas fa-id-badge"></i>{" "}
              <span className="zillow-detail-label">Property ID</span>{" "}
              <span className="zillow-detail-value">
                {formData.propertyID || "N/A"}
              </span>
            </div>
            <div className="grid-item">
              <i className="fas fa-calendar-plus"></i>{" "}
              <span className="zillow-detail-label">Created On</span>{" "}
              <span className="zillow-detail-value">
                {formatDate(formData.createdOn)}
              </span>
            </div>
            <div className="grid-item">
              <i className="fas fa-money-bill-wave"></i>{" "}
              <span className="zillow-detail-label">Rent</span>{" "}
              <span className="zillow-detail-value zillow-rent-value">
                {formData.Rent ? `${formatCurrency(formData.Rent)}/mo` : "N/A"}
              </span>
            </div>
          </div>
        </div>
        <div className="zillow-description">
          <h3>Description</h3>
          <textarea
            name="description"
            value={formData.description || ""}
            readOnly={true}
            rows={5}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PropertyDisplay;
