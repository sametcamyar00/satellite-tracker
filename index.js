const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const TLE_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle';
const CACHE_FILE = path.join(__dirname, 'tle_cache.json');

let tleCache = null;

app.use(express.static(path.join(__dirname)));

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

function loadCacheFromDisk() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      console.log(`Loaded ${data.length} satellites from disk cache`);
      return data;
    }
  } catch (err) {
    console.error('Failed to load disk cache:', err.message);
  }
  return null;
}

function saveCacheToDisk(data) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf8');
    console.log(`Saved ${data.length} satellites to disk cache`);
  } catch (err) {
    console.error('Failed to save disk cache:', err.message);
  }
}

tleCache = loadCacheFromDisk();

app.get('/api/satellites', async (req, res) => {
  try {
    const response = await axios.get(TLE_URL, {
      timeout: 10000,
      headers: { 'User-Agent': 'satellite-tracker/1.0' },
      validateStatus: status => status === 200 || status === 403
    });

    if (response.status === 200) {
      tleCache = parseTLE(response.data);
      saveCacheToDisk(tleCache);
      console.log(`TLE cache updated: ${tleCache.length} satellites`);
    } else if (response.status === 403) {
      console.log('CelesTrak: data unchanged since last download, using cache');
    }

    if (!tleCache) {
      return res.status(503).json({ error: 'No satellite data available yet, try again shortly' });
    }

    res.json(tleCache);
  } catch (error) {
    console.error('Error fetching TLE data:', error.message);
    if (tleCache) {
      console.log('Returning cached data after error');
      return res.json(tleCache);
    }
    res.status(500).json({ error: 'Failed to fetch satellite data', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
