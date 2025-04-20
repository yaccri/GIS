// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const HttpStatus = require("http-status-codes");

function verifyToken(req, res, next) {
  console.log("authMiddleware.js: authHeader:", req.headers.authorization);
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1]; // Extract token after "Bearer "
  console.log("middleware.js: token:", token);

  if (!token) {
    return res
      .status(HttpStatus.StatusCodes.UNAUTHORIZED)
      .json({ error: "Access denied. No token provided." }); // status 401
  }

  try {
    console.log("middleware.js trying to decode: token:", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("middleware.js decoded: :", decoded);
    // Set req.user as an object with id and isAdmin properties
    req.user = {
      id: decoded.userId,
      isAdmin: decoded.isAdmin,
    };
    next();
  } catch (error) {
    console.log("middleware.js: jwt.verify error:", error); // Fixed typo 'err' to 'error'
    return res
      .status(HttpStatus.StatusCodes.UNAUTHORIZED)
      .json({ error: "Invalid token" }); // status 401
  }
}

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    // Updated to check req.user.isAdmin
    next();
  } else {
    return res
      .status(HttpStatus.StatusCodes.FORBIDDEN)
      .json({ error: "Access denied. Admin privileges required." }); // status 403
  }
};

module.exports = { verifyToken, isAdmin };
