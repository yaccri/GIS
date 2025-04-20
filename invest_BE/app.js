// app.js
require("dotenv").config();
require("express-async-errors"); // Handles async errors automatically, calls next(err)

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const authUserRoutes = require("./routes/authUser");
const authPropertyRoutes = require("./routes/authProperty");
const neighborhoodRoutes = require("./routes/neighborhood");
const protectedRoute = require("./routes/protectedRoute");
const errorHandler = require("./middleware/errorHandler"); // Import the central error handler

app.use(express.json());
app.use(cors());

// --- Routes ---
app.use("/authUser", authUserRoutes);
app.use("/api/properties", authPropertyRoutes);
app.use("/api/neighborhoods", neighborhoodRoutes);
app.use("/protected", protectedRoute);

// --- MongoDB Connection ---
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error("FATAL ERROR: MONGODB_URI environment variable is not set.");
  process.exit(1);
}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Initial MongoDB connection error:", err);
  });

// --- Central Error Handler ---
// MUST be defined AFTER all other app.use() and routes calls
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
