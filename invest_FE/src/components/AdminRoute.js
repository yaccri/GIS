// src/components/AdminRoute.js
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const AdminRoute = () => {
  const { user } = useContext(UserContext); // Get the user object

  return user.isLoggedIn && user.isAdmin ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoute;
