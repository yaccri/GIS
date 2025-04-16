import React, { useState, useEffect, useRef, useContext } from "react";
import ReactDOM from "react-dom";
import "./HoveringPropertyForm.css";
import { UserContext } from "../context/UserContext";



const initialFormState = {
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
};

const HoveringPropertyForm = ({ isOpen, onClose, property, isAdmin, onEdit, onDelete }) => {
  const modalRef = useRef(null);
  const [formData, setFormData] = useState(initialFormState);

  const { user } = useContext(UserContext);

console.log("isAdmin in HoveringPropertyForm:", user.isAdmin); // Debugging log

  // Drag logic
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
      setFormData({ ...initialFormState, ...property });
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

  return ReactDOM.createPortal(
    <div className="hovering-property-form-overlay">
      <div
        className="hovering-property-form"
        ref={modalRef}
        style={{ position: "absolute", top: "100px", left: "100px" }}
        onMouseDown={handleDragStart}
      >
        <div className="hovering-property-form-header">
          <h2>{isAdmin ? "Edit Property" : "View Property"}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form>
          <div className="form-grid">
            {/* Left Column: Dry Facts */}
            <div className="form-column">
              <div><label>Property ID</label>
                <input name="propertyID" value={formData.propertyID || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>Address</label>
                <input name="address" value={formData.address || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>City</label>
                <input name="city" value={formData.city || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>State</label>
                <input name="state" value={formData.state || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>Zip Code</label>
                <input name="zip" value={formData.zip || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>Type</label>
                <select name="type" value={formData.type || ""} onChange={handleChange} disabled={!isAdmin}>
                  <option value="">Select Type</option>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Condominium">Condominium</option>
                </select>
              </div>
              <div><label>Beds</label>
                <input name="beds" type="number" value={formData.beds || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>Baths</label>
                <input name="baths" type="number" value={formData.baths || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
            </div>
            {/* Center Column: Financials */}
            <div className="form-column">
              <div><label>Price</label>
                <input name="price" type="number" value={formData.price || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>HOA</label>
                <input name="hoa" value={formData.hoa || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>Property Tax</label>
                <input name="propertyTax" value={formData.propertyTax || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>Insurance</label>
                <input name="insurance" value={formData.insurance || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>Size (sq ft)</label>
                <input name="size" type="number" value={formData.size || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>Lot Size (sq ft)</label>
                <input name="lotSize" type="number" value={formData.lotSize || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>Year Built</label>
                <input name="yearBuilt" type="number" value={formData.yearBuilt || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>Tenants in Place</label>
                <input name="tenantsInPlace" value={formData.tenantsInPlace || ""} onChange={handleChange} disabled={!isAdmin} />
              </div>
              <div><label>Created On</label>
                <input name="createdOn" value={formData.createdOn || ""} onChange={handleChange} disabled />
              </div>
            </div>
            {/* Right Column: Description */}
            <div className="form-column">
              <div>
                <label>Description</label>
                <textarea name="description" value={formData.description || ""} onChange={handleChange} disabled={!isAdmin} rows={10} />
              </div>
            </div>
          </div>
          {user.isAdmin && (
            <div className="form-actions">
              <button type="button" onClick={handleSave}>Save</button>
              <button type="button" onClick={handleDelete}>Delete</button>
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
};



export default HoveringPropertyForm;