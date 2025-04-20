// app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const authUserRoutes = require("./routes/authUser");
const authPropertyRoutes = require("./routes/authProperty");
const neighborhoodRoutes = require("./routes/neighborhood");
const protectedRoute = require("./routes/protectedRoute");

app.use(express.json());
app.use(cors());

app.use("/authUser", authUserRoutes);
app.use("/api/properties", authPropertyRoutes);
app.use("/api/neighborhoods", neighborhoodRoutes);
app.use("/protected", protectedRoute);

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error("FATAL ERROR: MONGODB_URI environment variable is not set.");
  process.exit(1);
}

// MongoDB Connection
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
