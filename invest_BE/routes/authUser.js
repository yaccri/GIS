// routes/authUser.js
const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

// --- Route Definitions ---

// Authentication & Registration
// POST /authUser/register
router.post("/register", userController.registerUser);

// POST /authUser/login
router.post("/login", userController.loginUser);

// User Preferences
// GET /authUser/preferences
router.get("/preferences", verifyToken, userController.getUserPreferences);

// PUT /authUser/preferences
router.put("/preferences", verifyToken, userController.updateUserPreferences);

// Admin User Management
// GET /authUser/users
router.get("/users", verifyToken, isAdmin, userController.getAllUsers);

// GET /authUser/users/:id
router.get("/users/:id", verifyToken, isAdmin, userController.getUserById);

// PUT /authUser/users/:id
router.put("/users/:id", verifyToken, isAdmin, userController.updateUserById);

// DELETE /authUser/users/:id
router.delete(
  "/users/:id",
  verifyToken,
  isAdmin,
  userController.deleteUserById
);

module.exports = router;
