const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const TLE_URL    = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle';
const SATCAT_URL = 'https://celestrak.org/pub/satcat.csv';

const TLE_CACHE_FILE    = path.join(__dirname, 'tle_cache.json');
const SATCAT_CACHE_FILE = path.join(__dirname, 'satcat_cache.json');

let tleCache    = null;   // array of { name, line1, line2 }
let satcatCache = null;   // plain object: noradId(string) -> countryCode(string)

app.use(express.static(path.join(__dirname)));

// ── TLE helpers ─────────────────────────────────────────────────────────────

function parseTLE(rawText) {
  const lines = rawText.trim().split('\n').map(l => l.trim());
  const sats = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    sats.push({ name: lines[i], line1: lines[i + 1], line2: lines[i + 2] });
  }
  return sats;
}

function loadTLEFromDisk() {
  try {
    if (fs.existsSync(TLE_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(TLE_CACHE_FILE, 'utf8'));
      console.log(`TLE cache loaded: ${data.length} satellites`);
      return data;
    }
  } catch (e) { console.error('TLE cache load error:', e.message); }
  return null;
}

function saveTLEToDisk(data) {
  try {
    fs.writeFileSync(TLE_CACHE_FILE, JSON.stringify(data), 'utf8');
    console.log(`TLE cache saved: ${data.length} satellites`);
  } catch (e) { console.error('TLE cache save error:', e.message); }
}

// ── SATCAT helpers ───────────────────────────────────────────────────────────

function parseSATCAT(csvText) {
  // CSV columns: OBJECT_NAME, OBJECT_ID, NORAD_CAT_ID, OBJECT_TYPE,
  //              OPS_STATUS_CODE, OWNER, LAUNCH_DATE, ...
  const lines = csvText.trim().split('\n');
  const map = {};
  for (let i = 1; i < lines.length; i++) {   // skip header
    const parts = lines[i].split(',');
    if (parts.length < 6) continue;
    const norad   = parts[2].trim();
    const country = parts[5].trim();
    if (norad && country) map[norad] = country;
  }
  return map;
}

function loadSATCATFromDisk() {
  try {
    if (fs.existsSync(SATCAT_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(SATCAT_CACHE_FILE, 'utf8'));
      const count = Object.keys(data).length;
      console.log(`SATCAT cache loaded: ${count} entries`);
      return data;
    }
  } catch (e) { console.error('SATCAT cache load error:', e.message); }
  return null;
}

function saveSATCATToDisk(data) {
  try {
    fs.writeFileSync(SATCAT_CACHE_FILE, JSON.stringify(data), 'utf8');
    console.log(`SATCAT cache saved: ${Object.keys(data).length} entries`);
  } catch (e) { console.error('SATCAT cache save error:', e.message); }
}

async function fetchSATCAT() {
  try {
    const res = await axios.get(SATCAT_URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'satellite-tracker/1.0' },
      validateStatus: s => s === 200 || s === 403
    });
    if (res.status === 200) {
      const map = parseSATCAT(res.data);
      satcatCache = map;
      saveSATCATToDisk(map);
      console.log(`SATCAT updated: ${Object.keys(map).length} entries`);
    } else {
      console.log('SATCAT: rate limited, using cache');
    }
  } catch (e) {
    console.error('SATCAT fetch error:', e.message);
  }
}

// ── Merge TLE + SATCAT ───────────────────────────────────────────────────────

function enrichWithCountry(tleSats, countryMap) {
  if (!countryMap) return tleSats.map(s => ({ ...s, country: '' }));
  return tleSats.map(s => {
    const norad = s.line1 ? s.line1.substring(2, 7).trim().replace(/\D/g, '') : '';
    return { ...s, country: countryMap[norad] || '' };
  });
}

// ── Boot ─────────────────────────────────────────────────────────────────────

tleCache    = loadTLEFromDisk();
satcatCache = loadSATCATFromDisk();

// Kick off a SATCAT fetch in the background on startup if no cache
if (!satcatCache) {
  fetchSATCAT().catch(() => {});
}

// ── API ──────────────────────────────────────────────────────────────────────

app.get('/api/satellites', async (req, res) => {
  // 1. Fetch / refresh TLE
  try {
    const tleRes = await axios.get(TLE_URL, {
      timeout: 10000,
      headers: { 'User-Agent': 'satellite-tracker/1.0' },
      validateStatus: s => s === 200 || s === 403
    });
    if (tleRes.status === 200) {
      tleCache = parseTLE(tleRes.data);
      saveTLEToDisk(tleCache);
      console.log(`TLE updated: ${tleCache.length} satellites`);
    } else {
      console.log('CelesTrak TLE: rate limited, using cache');
    }
  } catch (e) {
    console.error('TLE fetch error:', e.message);
  }

  if (!tleCache) {
    return res.status(503).json({ error: 'No satellite data available, try again shortly' });
  }

  // 2. Refresh SATCAT in background if we have TLE (non-blocking)
  if (!satcatCache) {
    fetchSATCAT().catch(() => {});
  } else {
    // re-fetch SATCAT in background to keep it fresh (fire-and-forget)
    fetchSATCAT().catch(() => {});
  }

  // 3. Merge and respond
  res.json(enrichWithCountry(tleCache, satcatCache));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
