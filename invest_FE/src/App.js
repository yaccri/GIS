// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import About from "./pages/About";
import Subscription from "./pages/Subscription";
import Login from "./pages/Login";
import TopBar from "./components/TopBar";
//import { UserContext } from "./context/UserContext";
import { MapProvider } from "./context/MapContext";
import Properties from "./pages/Properties";
import ProtectedRoute from "./components/ProtectedRoute";
import NoPage from "./pages/NoPage";
import Preferences from "./pages/Preferences";
import MapComponent from "./pages/Map";
import TestGoogleAddressSearch from "./pages/TestGoogleAddressSearch";
import TestOpenStreetMapAddressSearch from "./pages/TestOpenStreetMapAddressSearch";

function App() {
  // selectedMapLocation and handleLocationSelectFromTopBar are removed from here

  return (
    <BrowserRouter>
      {/* Wrap the components that need map context */}
      <MapProvider>
        <div className="app-container">
          {/* TopBar will now use the context directly */}
          <TopBar />

          <div className="main-layout">
            {/* Main Content Area */}
            <main className="working-area">
              <Routes>
                {/* ... other routes ... */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/subscribe" element={<Subscription />} />
                <Route
                  path="/testGoogleAddress"
                  element={<TestGoogleAddressSearch />}
                />
                <Route
                  path="/testOpenStreetMapAddress"
                  element={<TestOpenStreetMapAddressSearch />}
                />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/properties" element={<Properties />} />
                  <Route path="/preferences" element={<Preferences />} />
                  <Route path="/map" element={<MapComponent />} />{" "}
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
      </MapProvider>{" "}
      {/* End MapProvider wrap */}
    </BrowserRouter>
  );
}

export default App;
