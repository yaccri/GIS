import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./HoveringPropertyForm.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

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
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = months[date.getMonth()];
  const d = String(date.getDate()).padStart(2, "0");
  const y = date.getFullYear();
  return `${m}-${d}-${y}`;
};

// ROI calculation utility
const calcROI = (income, expenses, price) => {
  if (!price || isNaN(price)) return "N/A";
  const roi = ((income - expenses) / price) * 100;
  return isFinite(roi) ? `${roi.toFixed(1)}%` : "N/A";
};

const HoveringPropertyForm = ({ isOpen, onClose, property, isAdmin, onEdit, onDelete }) => {
  const modalRef = useRef(null);

  const [formData, setFormData] = useState({
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
    annualIncome: "",
    annualExpenses: "",
  });

  // Dragging logic
  let offsetX = 0;
  let offsetY = 0;

  const handleDragStart = (e) => {
    if (!modalRef.current) return;
    offsetX = e.clientX - modalRef.current.getBoundingClientRect().left;
    offsetY = e.clientY - modalRef.current.getBoundingClientRect().top;
    document.addEventListener("mousemove", handleDragging);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleDragging = (e) => {
    if (!modalRef.current) return;
    modalRef.current.style.left = `${e.clientX - offsetX}px`;
    modalRef.current.style.top = `${e.clientY - offsetY}px`;
  };

  const handleDragEnd = () => {
    document.removeEventListener("mousemove", handleDragging);
    document.removeEventListener("mouseup", handleDragEnd);
  };

  useEffect(() => {
    if (property) {
      setFormData({ ...formData, ...property });
    }
  }, [property]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (window.confirm("Are you sure you want to save changes?")) {
      if (onEdit) onEdit(formData);
      onClose();
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      if (onDelete) onDelete(formData.propertyID || formData.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  const annualIncome = Number(formData.annualIncome) || 0;
  const annualExpenses = Number(formData.annualExpenses) || 0;
  const price = Number(formData.price) || 0;

  return ReactDOM.createPortal(
    <div className="hovering-property-form-overlay">
      <div
        className="hovering-property-form"
        ref={modalRef}
        onMouseDown={handleDragStart}
        style={{ position: "absolute", top: "100px", left: "100px" }}
      >
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="zillow-main">
          <div className="zillow-main-row">
            <div className="zillow-price-roi-group">
              <span className="zillow-price">{formatCurrency(formData.price)}</span>
              <span className="zillow-roi-inline">
                <i className="fas fa-percentage"></i>
                <span className="zillow-roi-label">ROI</span>
                <span className="zillow-roi-value">{calcROI(annualIncome, annualExpenses, price)}</span>
              </span>
            </div>
          </div>
          <div className="zillow-address-row">
            <span className="zillow-address">
              {formData.address}, {formData.city}, {formData.state} {formData.zip}
            </span>
            <span className="zillow-address-details">
              <span>
                <i className="fas fa-bed"></i> {formatNumber(formData.beds) || "N/A"} Beds
              </span>
              <span>
                <i className="fas fa-bath"></i> {formatNumber(formData.baths) || "N/A"} Baths
              </span>
              <span>
                <i className="fas fa-ruler-combined"></i> {formatNumber(formData.size) || "N/A"} sqft
              </span>
            </span>
          </div>
        </div>
        <div className="zillow-fields-bg">
          <div className="zillow-grid zillow-grid-2rows">
            <div className="grid-item"><i className="fas fa-home"></i> <span className="zillow-detail-label">Type</span> <span className="zillow-detail-value">{formData.type || "N/A"}</span></div>
            <div className="grid-item"><i className="fas fa-calendar-alt"></i> <span className="zillow-detail-label">Built</span> <span className="zillow-detail-value">{formData.yearBuilt || "N/A"}</span></div>
            <div className="grid-item"><i className="fas fa-expand"></i> <span className="zillow-detail-label">Sqft Lot</span> <span className="zillow-detail-value">{formatNumber(formData.lotSize)}</span></div>
            <div className="grid-item"><i className="fas fa-shield-alt"></i> <span className="zillow-detail-label">Insurance</span> <span className="zillow-detail-value">{formatCurrency(formData.insurance)}</span></div>
            <div className="grid-item"><i className="fas fa-dollar-sign"></i> <span className="zillow-detail-label">$/sqft</span> <span className="zillow-detail-value">{formData.price && formData.size ? `$${Math.round(Number(formData.price) / Number(formData.size)).toLocaleString()}` : "N/A"}</span></div>
            <div className="grid-item"><i className="fas fa-coins"></i> <span className="zillow-detail-label">HOA</span> <span className="zillow-detail-value">{formData.hoa ? `$${formatCurrencyNoDollar(formData.hoa)}/mo` : "N/A"}</span></div>
            <div className="grid-item"><i className="fas fa-file-invoice-dollar"></i> <span className="zillow-detail-label">Property Tax</span> <span className="zillow-detail-value">{formatCurrency(formData.propertyTax)}</span></div>
            <div className="grid-item"><i className="fas fa-user-friends"></i> <span className="zillow-detail-label">Tenant</span> <span className="zillow-detail-value">{formData.tenantsInPlace ? "Yes" : "No"}</span></div>
            <div className="grid-item"><i className="fas fa-id-badge"></i> <span className="zillow-detail-label">Property ID</span> <span className="zillow-detail-value">{formData.propertyID || "N/A"}</span></div>
            <div className="grid-item"><i className="fas fa-calendar-plus"></i> <span className="zillow-detail-label">Created On</span> <span className="zillow-detail-value">{formatDate(formData.createdOn)}</span></div>
          </div>
        </div>
        <div className="zillow-description">
          <h3>Description</h3>
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            disabled={!isAdmin}
            rows={5}
          />
        </div>
        {isAdmin && (
          <div className="form-actions">
            <button type="button" onClick={handleSave}>Save</button>
            <button type="button" onClick={handleDelete}>Delete</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default HoveringPropertyForm;