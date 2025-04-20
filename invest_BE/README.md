# Top Investments Inc. - Investment Platform (Backend)

This is the backend API for Top Investments Inc., a platform designed for managing and exploring investment opportunities. It provides the data and services that power the frontend application.

## Features

- **User Authentication:**
  - Registration and login using username/password.
  - Secure password hashing using `bcrypt`.
  - Token-based authentication using JWT (JSON Web Tokens) for securing endpoints.
- **Real Estate Data Management:**
  - API endpoints for retrieving real estate listings with filtering and pagination.
  - Endpoints for adding, updating, and deleting properties (Admin only).
  - Storage of property locations using GeoJSON `Point` data.
- **Geospatial Queries:**
  - Leverages MongoDB's geospatial capabilities using GeoJSON.
  - Find properties within a specified radius of a coordinate point (`$nearSphere`).
  - Find properties located within defined neighborhood boundaries (`$geoWithin` using Polygon/MultiPolygon).
  - Find properties within a custom user-drawn polygon (`$geoWithin`).
  - Identify the neighborhood containing specific coordinates (`$geoIntersects`).
- **User Preferences:**
  - API endpoints for retrieving and updating user preferences (e.g., email, items per page, subscription status).
- **Data Persistence:**
  - MongoDB database to store user data, property listings (including location), and neighborhood boundaries.
- **Subscription:**
  - API endpoints for managing user subscriptions (integrated with user preferences).

## Setup and Configuration

1.  **Navigate to Backend Directory:**
    ```bash
    cd path/to/invest/invest_BE
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    - This project uses environment variables for configuration to keep sensitive data like database credentials and secret keys secure and separate from the codebase.
    - Create a `.env` file in the root of the `invest_BE` directory (i.e., alongside `app.js`). You can copy the provided `.env.example` file as a template:
      ```bash
      cp .env.example .env
      ```
    - Edit the `.env` file and provide the necessary values:
      - `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb+srv://<username>:<password>@<your_cluster_address>/<database_name>`). The database should contain collections for `users`, `properties` (with a `2dsphere` index on the `location` field), and `neighborhoods` (with a `2dsphere` index on the `geometry` field).
      - `JWT_SECRET`: A strong, unique secret key used for signing and verifying JSON Web Tokens. Generate a secure random string for this.
      - `PORT`: The port the server will listen on (e.g., `4000`). Defaults to 4000 if not set.
    - **Important:** Ensure your `.env` file is added to your `.gitignore` file to prevent accidentally committing sensitive credentials to version control.

## Running the Server

Once dependencies are installed and the `.env` file is configured, you can start the server:

```bash
node app.js
```
