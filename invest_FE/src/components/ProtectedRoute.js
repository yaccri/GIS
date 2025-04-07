// src/components/ProtectedRoute.js
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const ProtectedRoute = () => {
  const { user } = useContext(UserContext); // Get the user object

  return user.isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
