const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle';

function parseTLE(rawText) {
  const lines = rawText.trim().split('\n').map(line => line.trim());
  const satellites = [];

  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      satellites.push({
        name: lines[i],
        line1: lines[i + 1],
        line2: lines[i + 2]
      });
    }
  }

  return satellites;
}

app.get('/api/satellites', async (req, res) => {
  try {
    const response = await axios.get(TLE_URL, { timeout: 10000 });
    const satellites = parseTLE(response.data);
    res.json(satellites);
  } catch (error) {
    console.error('Error fetching TLE data:', error.message);
    res.status(500).json({ error: 'Failed to fetch satellite data', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
