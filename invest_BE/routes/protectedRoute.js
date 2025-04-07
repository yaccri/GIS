// routes/protectedRoute.js
const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleware"); // Corrected import
// Protected route
router.get("/", verifyToken, isAdmin, (req, res) => {
  res.status(200).json({ message: "Protected route accessed" });
});

module.exports = router;
