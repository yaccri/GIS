const express = require('express');
const cors = require('cors');
const { findNeighborhoodByPoint } = require('./src/api/find-neighborhood');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API endpoint for finding neighborhood
app.post('/api/find-neighborhood', async (req, res) => {
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
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 