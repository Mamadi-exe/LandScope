# LandScope: Gaza Agricultural Recovery Grid

This isn't just another dashboard. **LandScope** is a project born out of the necessity to protect and restore the agricultural heritage of Gaza. In regions where the land itself has become a casualty of conflict, data becomes the first step toward healing.

We built this to bridge the gap between satellite-level GIS data and the hands of a farmer. By combining terrain-aware flow modeling with advanced AI, we help identify soil toxicity and provide the exact steps needed to make the earth fertile again.

---

## 🌿 Core Features

### 🗺️ High-Precision GIS Mapping
- **Full Coastal Coverage:** Refined 2026 boundary polygons now cover 100% of Gaza's landmass, ensuring sectors along the Mediterranean coast are populated with actionable data.
- **Tactical Overlays:** Real-time visibility into Militarized Zones, Strategic Corridors (Netzarim, Philadelphi), and Evacuation Areas.
- **Critical Infrastructure Tracking:** Precision mapping of **GHF (Global Humanitarian Fund) Distribution Hubs** and **Water Sources** (Boreholes, Desalination plants, and Municipal Reservoirs), all verified to be within land boundaries.

### 🤖 Weather-Aware Gemini AI Intelligence
- **Seasonal Agronomy:** The system considers Mediterranean climate data. It recommends crops based on current soil toxicity *and* the specific seasonal outlook (Winter rainfall vs. Summer heat).
- **Phyto-Remediation:** Automated bio-strategies for soil cleaning, using plants like Sunflowers and Mustard seeds tailored to specific contaminants.
- **Health Risk Mesh:** Real-time identification of endemic risks (Cholera, Typhoid, Heavy Metal poisoning) displayed as English-language safety badges for field agents.

### ⏳ Recovery Forecasting (2024–2028)
- **Archive Mode:** Travel back to the 2024 conflict peaks to understand sediment layers.
- **Future Restoration:** Toggle 2027 and 2028 projections to see the "Post-Conflict Sync"—modeling a Gaza where tactical hazards are decommissioned and soil fertility returns.

### 📋 Verified Field Operations
- **Proof of Action:** A mobile-ready verification system where field agents upload photos of completed remediation tasks (e.g., soil tilling, seed planting).
- **Bilingual Protocol:** Comprehensive tactical instructions provided in both English and Arabic to ensure safety and clarity for all operators.

---

## 🚀 How to Run This Locally

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (we recommend version 18 or higher).

### 2. Get Your Gemini API Key
This app uses Google's Gemini AI to generate soil remediation strategies.
1. Go to the [Google AI Studio](https://aistudio.google.com/).
2. Create a free API Key.
3. Keep it safe—it is injected via environment variables.

### 3. Setup the Project
In your terminal, navigate to the project folder and run:
```bash
# Install the necessary libraries (Leaflet, GenAI, etc.)
npm install
```

### 4. Configure Environment Variables
The application expects an `API_KEY` for the Google GenAI SDK.
```env
API_KEY=your_gemini_api_key_here
```

### 5. Launch the Grid
Run the development server:
```bash
npm run dev
```
Open your browser to the local address provided (usually `http://localhost:5173`).

---

## 🛠 Technical Heart
- **GIS Engine:** Custom Leaflet implementation with high-fidelity coordinate polygons for the Gaza coastline and Southern tip.
- **AI Core:** Gemini 3 Pro & Flash for real-time toxicological analysis and seasonal crop forecasting.
- **UX/UI:** A minimalist, high-contrast tactical terminal designed for field visibility.
- **State Management:** React-based timeline syncing for historical and predictive modeling.

## 🤝 A Note to the User
We designed this system to be used in low-bandwidth environments. The "Archives" mode allows you to see how the land has changed over time, helping you predict which sectors are safe for planting next season.

**If you are in the field:** Use the "Tactical Grid" to tap on your specific plot. If your land is marked as High Risk, follow the checklist strictly. Your safety is as important as the harvest.

---
*Built with care for the farmers of Gaza.*