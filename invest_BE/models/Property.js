// models/Property.js
const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  propertyID: { type: Number, required: true, unique: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  hoa: { type: Number },
  propertyTax: { type: Number },
  insurance: { type: Number },
  beds: { type: Number },
  baths: { type: Number },
  size: { type: Number },
  lotSize: { type: Number },
  tenantInPlace: { type: Boolean },
  yearBuilt: { type: Number },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
});

// Add 2dsphere index for geo queries
propertySchema.index({ location: "2dsphere" });

const Property = mongoose.model("Property", propertySchema);

module.exports = Property;
