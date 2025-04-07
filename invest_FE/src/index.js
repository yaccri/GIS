// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { UserProvider } from "./context/UserContext"; // Import UserProvider

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {/* UserProvider is responsible for holding and managing the user state. user data is persistant in tge local storage! */}
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);
