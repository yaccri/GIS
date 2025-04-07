// models/User.js
const Gender = require("./enums");

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    match: /^[A-Za-zא-ת\s-]+$/,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    match: /^[A-Za-zא-ת\s-]+$/,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_-]+$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  gender: {
    type: String,
    enum: Object.values(Gender),
//    set: (value) => Gender[value],
    default: Gender.Unknown,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  subscriptionTime: {
    type: Date,
    default: Date.now,
  },
  preferences: {
     itemsPerPage: {
      type: Number,
      default: 12,
    },
    subscribe: {
      type: Boolean,
      default: true,
    },
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
