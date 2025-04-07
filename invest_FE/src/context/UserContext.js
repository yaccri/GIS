// src/context/UserContext.js
import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const initialUser = {
    fullName: "",
    isLoggedIn: false,
    isAdmin: false,
    token: null,
    itemsPerPage: 12,
  };

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : initialUser;
  });

  useEffect(() => {
    if (user.token) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const updateUser = (updates) => {
    setUser((prevUser) => ({ ...prevUser, ...updates }));
  };

  const updateToken = (newToken) => {
    updateUser({ token: newToken });
  };

  const value = {
    user,
    updateUser,
    updateToken,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
