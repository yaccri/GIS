// controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const HttpStatus = require("http-status-codes");
const Gender = require("../models/enums");
const mongoose = require("mongoose");

// --- Controller Functions ---

// POST /register
const registerUser = async (req, res) => {
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
  } = req.body;

  // Basic input validation
  if (
    !firstName ||
    !lastName ||
    !username ||
    !password ||
    !email ||
    !dateOfBirth
  ) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: "Missing required registration fields." });
  }

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
    firstName,
    lastName,
    username,
    password: hashedPassword,
    email,
    gender: genderValue,
    dateOfBirth,
    preferences,
  });

  await user.save(); // errorHandler handles validation/duplicate errors
  res
    .status(HttpStatus.StatusCodes.CREATED)
    .json({ message: "User registered successfully" });
  console.log("end register");
};

// POST /login
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: "Username and password are required." });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res
      .status(HttpStatus.StatusCodes.UNAUTHORIZED)
      .json({ error: "Authentication failed - User not found" });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res
      .status(HttpStatus.StatusCodes.UNAUTHORIZED)
      .json({ error: "Authentication failed - Incorrect password" });
  }

  const token = jwt.sign(
    { userId: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.status(HttpStatus.StatusCodes.OK).json({
    token,
    isAdmin: user.isAdmin,
    fullName: `${user.firstName} ${user.lastName}`,
    itemsPerPage: user.preferences.itemsPerPage,
    subscribe: user.preferences.subscribe,
  });
};

// GET /preferences
const getUserPreferences = async (req, res) => {
  // req.user.id comes from verifyToken middleware
  const user = await User.findById(req.user.id);

  if (!user) {
    return res
      .status(HttpStatus.StatusCodes.NOT_FOUND)
      .json({ error: "User associated with token not found" });
  }

  const preferences = {
    email: user.email,
    itemsPerPage: user.preferences.itemsPerPage,
    subscribe: user.preferences.subscribe,
  };
  res.status(HttpStatus.StatusCodes.OK).json(preferences);
};

// PUT /preferences
const updateUserPreferences = async (req, res) => {
  const { itemsPerPage, subscribe, email } = req.body;

  if (
    itemsPerPage === undefined ||
    subscribe === undefined ||
    email === undefined
  ) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({
        error:
          "Missing required preference fields (email, itemsPerPage, subscribe)",
      });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res
      .status(HttpStatus.StatusCodes.NOT_FOUND)
      .json({ error: "User associated with token not found" });
  }

  user.preferences.itemsPerPage = itemsPerPage;
  user.preferences.subscribe = subscribe;
  user.email = email;

  await user.save(); // errorHandler handles validation/duplicate key errors
  res
    .status(HttpStatus.StatusCodes.OK)
    .json({ message: "Preferences updated successfully" });
};

// GET /users (Admin)
const getAllUsers = async (req, res) => {
  const users = await User.find({})
    .select("_id username firstName lastName email isAdmin")
    .lean();
  console.log("Fetched users:", users);
  res.status(HttpStatus.StatusCodes.OK).json(users);
};

// GET /users/:id (Admin)
const getUserById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid user ID format" });
  }

  const user = await User.findById(id).select("-password").lean();
  if (!user) {
    return res
      .status(HttpStatus.StatusCodes.NOT_FOUND)
      .json({ error: "User not found" });
  }
  res.status(HttpStatus.StatusCodes.OK).json(user);
};

// PUT /users/:id (Admin)
const updateUserById = async (req, res) => {
  console.log("Updating user with body:", req.body);  // Debug log
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid user ID format" });
  }

  const { firstName, lastName, email, gender, dateOfBirth, preferences, isAdmin } =
    req.body;

  const updateData = {};
  // Build updateData object carefully, excluding sensitive fields
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (email !== undefined) updateData.email = email;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
  if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
  
  console.log("Update data before processing:", updateData);  // Debug log

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
        genderValue = Gender.Unknown;
    }
    updateData.gender = genderValue;
  }

  if (preferences !== undefined) {
    if (preferences.itemsPerPage !== undefined)
      updateData["preferences.itemsPerPage"] = preferences.itemsPerPage;
    if (preferences.subscribe !== undefined)
      updateData["preferences.subscribe"] = preferences.subscribe;
  }

  // הגנה על שדות רגישים - לא מאפשרים עדכון של סיסמה ושם משתמש
  delete updateData.password;
  delete updateData.username;

  if (Object.keys(updateData).length === 0) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: "No valid fields provided for update." });
  }

  // עדכון המשתמש במסד הנתונים
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true, context: "query" }
  )
    .select("-password")
    .lean();

  if (!updatedUser) {
    return res
      .status(HttpStatus.StatusCodes.NOT_FOUND)
      .json({ error: "User not found" });
  }
  res.status(HttpStatus.StatusCodes.OK).json(updatedUser);
  // Note: errorHandler handles validation/duplicate key errors from findByIdAndUpdate
};

// DELETE /users/:id (Admin)
const deleteUserById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(HttpStatus.StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid user ID format" });
  }

  // Prevent self-deletion
  if (req.user.id === id) {
    // req.user.id comes from verifyToken middleware
    return res
      .status(HttpStatus.StatusCodes.FORBIDDEN)
      .json({ error: "Administrators cannot delete their own account." });
  }

  const deletedUser = await User.findByIdAndDelete(id);
  if (!deletedUser) {
    return res
      .status(HttpStatus.StatusCodes.NOT_FOUND)
      .json({ error: "User not found" });
  }
  res
    .status(HttpStatus.StatusCodes.OK)
    .json({ message: "User deleted successfully" });
  // Note: errorHandler handles DB errors from findByIdAndDelete
};

module.exports = {
  registerUser,
  loginUser,
  getUserPreferences,
  updateUserPreferences,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
