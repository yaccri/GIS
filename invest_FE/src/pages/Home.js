// src/pages/Home.js
import React, { useContext } from "react";
import "./Home.css"; // Import the CSS file
import { UserContext } from "../context/UserContext";
import { Link } from "react-router-dom";

const Home = () => {
  const { user } = useContext(UserContext);

  return (
    <div className="home-container">
      <div className="home-content">
        {user.isLoggedIn ? (
          <>
            <h1>Welcome to Top Investments!</h1>
            <p>Explore our properties and manage your preferences.</p>
          </>
        ) : (
          <>
            <h1>Welcome to Top Investments!</h1>
            <p>
              To continue browsing our site and explore investment
              opportunities, please{" "}
              <Link to="/login" className="home-link">
                log in
              </Link>{" "}
              or{" "}
              <Link to="/subscribe" className="home-link">
                register
              </Link>{" "}
              for a new account.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
