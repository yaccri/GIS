const express = require('express');
const router = express.Router();
const { findNeighborhoodByPoint } = require('./find-neighborhood');

router.post('/find-neighborhood', async (req, res) => {
  try {
    const { coordinates } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ error: 'Invalid coordinates format' });
    }

    const neighborhood = await findNeighborhoodByPoint(coordinates);
    
    if (!neighborhood) {
      return res.status(404).json({ error: 'No neighborhood found for these coordinates' });
    }
    
    res.json(neighborhood);
  } catch (error) {
    console.error('Error in /find-neighborhood endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 