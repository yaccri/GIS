const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  // ... other webpack configurations
  resolve: {
    fallback: {
      "fs": false,
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "net": false,
      "tls": false,
      "crypto": false
    }
  },
  plugins: [
    new Dotenv()
  ]
}; 