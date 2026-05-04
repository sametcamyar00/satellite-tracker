# 🌍 Live 3D Satellite Tracker

> A highly optimized, real-time 3D web application that visualizes over 15,000 active satellites and space debris orbiting Earth. 

![Project Preview](https://via.placeholder.com/1000x500.png?text=Live+3D+Satellite+Tracker+Preview) <!-- Buraya kendi projenin ekran görüntüsünün linkini eklemeyi unutma! -->

This project fetches real-time Two-Line Element (TLE) and Satellite Catalog (SATCAT) data to calculate and render the exact positions of thousands of objects in Earth's orbit using the SGP4 mathematical model. It is designed with a focus on high performance and an intuitive, modern Glassmorphism UI.

## ✨ Key Features

*   **Massive Scale Rendering:** Smoothly tracks and renders 15,000+ active satellites simultaneously at 60 FPS without freezing the browser, achieved through `THREE.InstancedMesh` architecture.
*   **Real-Time Orbital Physics:** Uses the `satellite.js` library to propagate TLE data into Cartesian (ECI) coordinates in real-time.
*   **Dynamic Filtering Engine:** 
    *   **Country Filter:** Merges TLE and SATCAT databases to dynamically filter satellites by their country of origin (complete with flag emojis 🇹🇷 🇺🇸 🇨🇳).
    *   **Function/Type Filter:** Isolates specific satellite networks (e.g., Navigation, Communication, Observation, Space Stations).
    *   **Starlink Megaconstellation Toggle:** A dedicated switch to visualize the massive Starlink network isolating it from the rest.
*   **Interactive Raycasting:** Hover over any satellite in the 3D space to instantly view its Name, Altitude, and Country of Origin via a responsive tooltip.
*   **Live Search:** Instantly locate and highlight any satellite by name (e.g., "TURKSAT", "ISS") locking the HUD to display its live telemetry.
*   **Immersive 3D Environment:** Features a high-resolution 4K/8K Earth texture, ambient star field, and orbital trails.

## 🛠️ Tech Stack

**Frontend:**
*   **Three.js:** Core 3D WebGL rendering engine.
*   **satellite.js:** SGP4/SDP4 propagation for orbital mechanics and ECI coordinate calculation.
*   **Vanilla JS, HTML5, CSS3:** Pure, lightweight frontend logic with custom Glassmorphism UI.

**Backend:**
*   **Node.js & Express.js:** Lightweight server bridging the client and external data sources.
*   **Axios:** For handling asynchronous HTTP requests.
*   **File-based Caching:** Intelligent caching of massive datasets (TLE/SATCAT) to bypass rate limits and optimize server load.

## 🚀 Installation & Setup

If you want to run this project locally:

1. Clone the repository:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git)
