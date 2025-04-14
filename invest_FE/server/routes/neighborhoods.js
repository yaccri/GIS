const express = require('express');
const router = express.Router();
const { findNeighborhoodByPoint } = require('../api/mongodb');

router.post('/find-neighborhood', async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    
    if (!longitude || !latitude) {
      return res.status(400).json({ error: 'Missing coordinates' });
    }

    const neighborhood = await findNeighborhoodByPoint(longitude, latitude);
    
    if (!neighborhood) {
      return res.status(404).json({ error: 'No neighborhood found at these coordinates' });
    }

    res.json(neighborhood);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 