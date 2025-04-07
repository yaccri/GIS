// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import About from "./pages/About";
import Subscription from "./pages/Subscription";
// import PropertyForm from "./pages/PropertyForm";
import Login from "./pages/Login";
import TopBar from "./components/TopBar";
import { UserContext } from "./context/UserContext";
import Properties from "./pages/Properties";
import ProtectedRoute from "./components/ProtectedRoute";
// import AdminRoute from "./components/AdminRoute";
import NoPage from "./pages/NoPage";
import Preferences from "./pages/Preferences";

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <TopBar />
        <div className="main-layout">
          {/* Left Sidebar (conditionally rendered) */}
          <nav className="left-bar">
            <UserContext.Consumer>
              {(
                { user } // Get the user object
              ) =>
                user.isLoggedIn && (
                  <ul>
                    <li>
                      <Link to="/">Home</Link>
                    </li>
                    <li>
                      <Link to="/about">About</Link>
                    </li>
                    {/* {user.isAdmin && (
                        <li>
                          <Link to="/property">Property</Link>
                        </li>
                      )} */}
                    <li>
                      <Link to="/properties">US Real Estate</Link>
                    </li>
                  </ul>
                )
              }
            </UserContext.Consumer>
          </nav>

          {/* Main Content Area */}
          <main className="working-area">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/subscribe" element={<Subscription />} />
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/properties" element={<Properties />} />
                <Route path="/preferences" element={<Preferences />} />{" "}
                {/* Admin Routes */}
                {/* <Route element={<AdminRoute />}>
                    <Route
                      path="/property"
                      element={<PropertyForm mode="add" />}
                    />{" "}
                    <Route
                      path="/edit-property/:propertyID"
                      element={<PropertyForm mode="edit" />}
                    />
                  </Route> */}
              </Route>
              <Route path="*" element={<NoPage />} />
            </Routes>
          </main>
        </div>
        <footer className="bottom-bar">
          <p>Top Investments Inc. © 2025</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
