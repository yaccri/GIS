// routes/authUser.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const HttpStatus = require("http-status-codes");
const Gender = require("../models/enums");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// User registration
router.post("/register", async (req, res) => {
  try {
    console.log("start register");
    const {
      firstName,
      lastName,
      username,
      password,
      email,
      gender,
      dateOfBirth,
      preferences,
    } = req.body; // Extract all fields
    const hashedPassword = await bcrypt.hash(password, 10);

    let genderValue;
    switch (gender) {
      case "Male":
        genderValue = Gender.Male;
        break;
      case "Female":
        genderValue = Gender.Female;
        break;
      case "Other":
        genderValue = Gender.Other;
        break;
      default:
        genderValue = Gender.Unknown;
    }

    const user = new User({
      // Create user with all fields
      firstName,
      lastName,
      username,
      password: hashedPassword,
      email,
      gender: genderValue,
      dateOfBirth,
      preferences,
    });

    console.log(`user: ${user} created`);
    await user.save();
    res
      .status(HttpStatus.StatusCodes.CREATED)
      .json({ message: "User registered successfully" }); // status 201
  } catch (error) {
    console.error("Registration error:", error); // Log the error for debugging

    if (error.name === "ValidationError") {
      // Mongoose validation error
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res
        .status(HttpStatus.StatusCodes.BAD_REQUEST)
        .json({ error: "Validation failed", details: validationErrors }); // status 400
    } else if (error.code === 11000) {
      // MongoDB duplicate key error
      return res
        .status(HttpStatus.StatusCodes.BAD_REQUEST)
        .json({ error: "Username or email already exists" }); // status 400
    } else {
      // Other errors
      return res
        .status(HttpStatus.StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: "Registration failed" }); // status 500
    }
  }
  console.log("end register");
});

// User login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(HttpStatus.StatusCodes.UNAUTHORIZED)
        .json({ error: "Authentication failed" }); // status 401
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res
        .status(HttpStatus.StatusCodes.UNAUTHORIZED)
        .json({ error: "Authentication failed" }); // status 401
    }
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.status(HttpStatus.StatusCodes.OK).json({
      token,
      isAdmin: user.isAdmin,
      fullName: `${user.firstName} ${user.lastName}`,
      itemsPerPage: user.preferences.itemsPerPage,
      subscribe: user.preferences.subscribe,
    }); // status 200
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(HttpStatus.StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Login failed" }); // status 500
  }
});

// GET /authUser/preferences (Protected route)
router.get("/preferences", verifyToken, async (req, res) => {
  //router.get("/preferences", async (req, res) => {
  console.log(req.headers.authorization);
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1]; // Extract token after "Bearer "
  console.log("middleware.js: token:", token);
  try {
    // Find the user by ID (assuming the token contains the user ID)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract preferences from the user object
    const preferences = {
      email: user.email,
      itemsPerPage: user.preferences.itemsPerPage,
      subscribe: user.preferences.subscribe,
    };

    console.log("preferences:", preferences);
    res.status(200).json(preferences);
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /authUser/preferences (Protected route)
router.put("/preferences", verifyToken, async (req, res) => {
  try {
    // Find the user by ID (assuming the token contains the user ID)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log("user found:", user);
    console.log("req.body:", req.body);
    // Update preferences from the request body
    user.preferences.itemsPerPage = req.body.itemsPerPage;
    user.preferences.subscribe = req.body.subscribe;
    user.email = req.body.email;

    // Save the updated user
    await user.save();

    res.status(200).json({ message: "Preferences updated successfully" });
  } catch (err) {
    console.error("Error updating preferences:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /authUser/users - Fetch basic details for all users (Admin only)
router.get("/users", verifyToken, isAdmin, async (req, res) => {
  try {
    // Fetch users and select only the specified fields
    // .lean() returns plain JS objects instead of Mongoose documents for better performance
    const users = await User.find({})
      .select("_id username firstName lastName email")
      .lean();

    // Send the list of users
    res.status(HttpStatus.StatusCodes.OK).json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res
      .status(HttpStatus.StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to fetch users" });
  }
});

// GET /authUser/users/:id - Fetch details for a specific user (Admin only)
router.get("/users/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(HttpStatus.StatusCodes.BAD_REQUEST)
        .json({ error: "Invalid user ID format" });
    }

    // Fetch the user by ID and exclude the password field
    const user = await User.findById(id).select("-password").lean(); // Exclude password, use lean

    if (!user) {
      return res
        .status(HttpStatus.StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }

    // Send the user details
    res.status(HttpStatus.StatusCodes.OK).json(user);
  } catch (error) {
    console.error(`Error fetching user with ID ${req.params.id}:`, error);
    res
      .status(HttpStatus.StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to fetch user details" });
  }
});

// PUT /authUser/users/:id - Edit User Details (Admin only) ---
router.put("/users/:id", verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  // 1. Validate ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid user ID format" });
  }

  // 2. Extract allowed fields from request body
  const { firstName, lastName, email, gender, dateOfBirth, preferences } =
    req.body;

  // 3. Construct the update object with only allowed fields
  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (email !== undefined) updateData.email = email; // Unique index check handled by DB/errorHandler
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

  // Handle gender conversion if provided
  if (gender !== undefined) {
    let genderValue;
    switch (gender) {
      case "Male":
        genderValue = Gender.Male;
        break;
      case "Female":
        genderValue = Gender.Female;
        break;
      case "Other":
        genderValue = Gender.Other;
        break;
      default:
        genderValue = Gender.Unknown; // Or handle as error if specific values required
    }
    updateData.gender = genderValue;
  }

  // Handle nested preferences update if provided
  if (preferences !== undefined) {
    if (preferences.itemsPerPage !== undefined) {
      updateData["preferences.itemsPerPage"] = preferences.itemsPerPage; // Use dot notation for nested fields
    }
    if (preferences.subscribe !== undefined) {
      updateData["preferences.subscribe"] = preferences.subscribe;
    }
  }

  // Prevent updating sensitive fields directly via this route
  delete updateData.password;
  delete updateData.isAdmin;
  delete updateData.username; // Usually username is immutable

  // Check if there's anything to update
  if (Object.keys(updateData).length === 0) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: "No valid fields provided for update." });
  }

  // 4. Perform the update using findByIdAndUpdate
  // - { new: true } returns the updated document
  // - { runValidators: true } ensures schema validation rules are applied
  // - { context: 'query' } might be needed for certain complex validators with findOneAndUpdate
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { $set: updateData }, // Use $set to apply the changes
    { new: true, runValidators: true, context: "query" }
  )
    .select("-password")
    .lean(); // Exclude password from the returned object

  // 5. Handle User Not Found during update
  if (!updatedUser) {
    return res
      .status(HttpStatus.StatusCodes.NOT_FOUND)
      .json({ error: "User not found" });
  }

  // 6. Send Success Response with updated user data (excluding password)
  res.status(HttpStatus.StatusCodes.OK).json(updatedUser);

  // Note: Potential validation errors (including duplicate email) during update
  // will be caught by express-async-errors and handled by the central errorHandler.
});

module.exports = router;
