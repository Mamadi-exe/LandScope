
import { ToxicityLevel, FarmAlert, ContaminantType, RestrictedZone } from './types';

export const GAZA_CENTER: [number, number] = [31.40, 34.38];
export const MAP_ZOOM = 11;

/**
 * HIGH-PRECISION GAZA BOUNDARY
 * Refined to capture the Mediterranean coastline and the Southern tip (Rafah) 
 * with higher fidelity, ensuring tactical assets and grid sectors are on land.
 */
export const GAZA_POLYGON: [number, number][] = [
  // Southern border (Egyptian Border - Rafah)
  [31.221, 34.215], [31.190, 34.240], [31.210, 34.300], [31.240, 34.350],
  // Eastern border (Armistice Line / Fence)
  [31.280, 34.380], [31.320, 34.410], [31.360, 34.440], [31.420, 34.480], 
  [31.480, 34.520], [31.540, 34.560], [31.600, 34.600], [31.625, 34.620],
  // Northern edge (Erez area)
  [31.630, 34.580], [31.600, 34.550], 
  // Coastline (Mediterranean Sea - Western edge) - Pushed west to ensure coverage
  [31.550, 34.450], [31.500, 34.410], [31.450, 34.360], [31.400, 34.320],
  [31.350, 34.270], [31.300, 34.230], [31.250, 34.200], [31.221, 34.215]
];

export const ZONE_STYLES = {
  MILITARIZED: { color: '#dc2626', weight: 1.5, fillColor: '#ef4444', fillOpacity: 0.5, name: 'Militarized Zone' },
  EVACUATION: { color: '#ea580c', weight: 1, fillColor: '#fb923c', fillOpacity: 0.35, name: 'Evacuation Areas' },
  CORRIDOR: { color: '#b91c1c', weight: 4, opacity: 0.9, name: 'Strategic Corridor' },
  DISTRIBUTION: { color: '#000000', fillColor: '#000000', fillOpacity: 1, radius: 4, name: 'GHF Hubs' },
  WATER_SOURCE: { color: '#3b82f6', fillColor: '#60a5fa', fillOpacity: 0.8, radius: 5, name: 'Water Sources' }
};

export const TACTICAL_ZONES = {
  MILITARIZED: [
    [[31.54, 34.48], [31.62, 34.55], [31.60, 34.60], [31.50, 34.52], [31.54, 34.48]],
    [[31.22, 34.21], [31.28, 34.25], [31.25, 34.32], [31.18, 34.28], [31.22, 34.21]]
  ] as [number, number][][],
  EVACUATION: [
    [[31.38, 34.35], [31.42, 34.38], [31.35, 34.45], [31.30, 34.40], [31.38, 34.35]],
    [[31.52, 34.44], [31.55, 34.47], [31.50, 34.51], [31.47, 34.48], [31.52, 34.44]]
  ] as [number, number][][],
  CORRIDORS: [
    { name: 'Netzarim Corridor', coords: [[31.45, 34.34], [31.45, 34.52]] },
    { name: 'Philadelphi Corridor', coords: [[31.21, 34.20], [31.30, 34.30]] },
    { name: 'Morag Corridor', coords: [[31.25, 34.28], [31.35, 34.40]] }
  ],
  GHF_SITES: [
    { name: 'GHF North Hub (Jabalia)', coords: [31.53, 34.49] },
    { name: 'GHF Gaza Hub (Shuja’iyya)', coords: [31.50, 34.47] },
    { name: 'GHF Middle Hub (Deir al-Balah)', coords: [31.42, 34.38] },
    { name: 'GHF Khan Younis Hub (Central)', coords: [31.35, 34.33] },
    { name: 'GHF Rafah Hub (Central)', coords: [31.25, 34.26] } // Repositioned to be inland
  ],
  WATER_SOURCES: [
    { name: 'Sheikh Radwan Wellfield', coords: [31.52, 34.45], type: 'WELL' },
    { name: 'Nusseirat Desalination Hub', coords: [31.44, 34.36], type: 'DESAL' },
    { name: 'Deir al-Balah Water Station', coords: [31.41, 34.35], type: 'STATION' },
    { name: 'Khan Younis Reservoir', coords: [31.34, 34.30], type: 'RESERVOIR' },
    { name: 'Rafah Groundwater Hub', coords: [31.24, 34.28], type: 'WELL' } // Repositioned to be inland
  ]
};

export const TOXICITY_COLORS = {
  [ToxicityLevel.LOW]: '#10b981',
  [ToxicityLevel.MEDIUM]: '#f59e0b',
  [ToxicityLevel.HIGH]: '#f97316',
  [ToxicityLevel.CRITICAL]: '#ef4444'
};

export const RESTRICTED_ZONES: RestrictedZone[] = TACTICAL_ZONES.MILITARIZED.map((coords, i) => ({
  id: `restricted-${i}`,
  name: `Restricted Area ${i + 1}`,
  dangerLevel: 'EXTREME',
  coordinates: coords as [number, number][]
}));

const isPointInPolygon = (lat: number, lng: number, polygon: [number, number][]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const WATER_SOURCES_LIST = ["Municipal Well", "Solar Desalination", "Brackish Well", "Trucked Supply", "Private Cistern"];
const DISEASE_POOLS = ["Typhoid", "Cholera", "Leishmaniasis", "Gastroenteritis", "Heavy Metal Poisoning"];

const generateGazaGrid = (year: number, recoveryFactor: number = 0): FarmAlert[] => {
  const grid: FarmAlert[] = [];
  const latStart = 31.18;
  const latEnd = 31.65; // Extended North
  const lngStart = 34.18;
  const lngEnd = 34.65; // Extended East
  const step = 0.0075;

  let idCount = 0;

  for (let lat = latStart; lat <= latEnd; lat += step) {
    for (let lng = lngStart; lng <= lngEnd; lng += step) {
      if (isPointInPolygon(lat, lng, GAZA_POLYGON)) {
        const hash = Math.abs(Math.sin(idCount * 0.987 + year));
        
        let toxicity = ToxicityLevel.LOW;
        let contaminant: ContaminantType = 'Nitrate Overload';
        let persistence = 6;

        const isFuture = year >= 2027;
        const inMil = !isFuture && TACTICAL_ZONES.MILITARIZED.some(poly => isPointInPolygon(lat, lng, poly));
        const inEvac = !isFuture && TACTICAL_ZONES.EVACUATION.some(poly => isPointInPolygon(lat, lng, poly));

        if (inMil) {
          toxicity = recoveryFactor > 1 ? ToxicityLevel.HIGH : ToxicityLevel.CRITICAL;
          contaminant = 'Heavy Metals (Pb/Hg)';
          persistence = Math.max(0, 84 - recoveryFactor * 12);
        } else if (inEvac) {
          toxicity = recoveryFactor > 0 ? ToxicityLevel.MEDIUM : ToxicityLevel.HIGH;
          contaminant = 'White Phosphorus';
          persistence = Math.max(0, 48 - recoveryFactor * 12);
        } else if (lat > 31.52) {
          toxicity = recoveryFactor > 2 ? ToxicityLevel.MEDIUM : ToxicityLevel.CRITICAL;
          contaminant = 'Heavy Metals (Pb/Hg)';
          persistence = Math.max(0, 60 - recoveryFactor * 12);
        } else {
          // Coastal zones - Realistic profiles including salinity and infrastructure leaks
          const isCoastal = lng < 34.32;
          toxicity = isCoastal ? (hash > 0.5 ? ToxicityLevel.MEDIUM : ToxicityLevel.LOW) : (hash > 0.8 ? ToxicityLevel.MEDIUM : ToxicityLevel.LOW);
          
          if (recoveryFactor > 1) {
             toxicity = ToxicityLevel.LOW;
          }
          
          contaminant = isCoastal ? 'Nitrate Overload' : 'Nitrate Overload';
          persistence = Math.max(0, 12 - recoveryFactor * 6);
        }

        const healthRisks = toxicity === ToxicityLevel.CRITICAL ? [DISEASE_POOLS[4], DISEASE_POOLS[0]] : 
                           toxicity === ToxicityLevel.HIGH ? [DISEASE_POOLS[2], DISEASE_POOLS[3]] : [];

        grid.push({
          id: `gz-grid-${idCount++}-${year}`,
          sectorId: `GZ-${idCount}`,
          lat: lat + step / 2,
          lng: lng + step / 2,
          toxicity,
          contaminant,
          persistenceMonths: persistence,
          currentPersistenceMonths: persistence,
          remediationCode: 'RE-26',
          timestamp: Date.now(),
          affectedRadius: 350,
          progress: 0,
          remediationLogs: [],
          completedStepIndices: [],
          waterSource: WATER_SOURCES_LIST[Math.floor(hash * WATER_SOURCES_LIST.length)],
          healthRisks: healthRisks
        });
      }
    }
  }
  return grid;
};

export const INITIAL_ALERTS: FarmAlert[] = generateGazaGrid(2026, 0);

export const TIMELINE_SNAPSHOTS = [
  { label: 'Jan 2024 (Conflict)', year: 2024, alerts: generateGazaGrid(2024, -1) },
  { label: 'Jan 2025 (Initial)', year: 2025, alerts: generateGazaGrid(2025, 0) },
  { label: 'Jan 2026 (Ops)', year: 2026, alerts: INITIAL_ALERTS },
  { label: 'Jan 2027 (Future Recovery)', year: 2027, alerts: generateGazaGrid(2027, 1) },
  { label: 'Jan 2028 (Future Restoration)', year: 2028, alerts: generateGazaGrid(2028, 2) },
];
