
import { ToxicityLevel, FarmAlert, GISPlume, RestrictedZone } from '../types';
import { RESTRICTED_ZONES } from '../constants';

/**
 * Checks if a point [lat, lng] is inside a polygon defined by coordinates.
 * Simple ray-casting algorithm for the tactical demo.
 */
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

export const checkRestrictedDanger = (lat: number, lng: number): { danger: 'SAFE' | 'CAUTION' | 'RESTRICTED', zoneName?: string } => {
  for (const zone of RESTRICTED_ZONES) {
    if (isPointInPolygon(lat, lng, zone.coordinates)) {
      return { danger: 'RESTRICTED', zoneName: zone.name };
    }
  }
  // Check "Caution" if within 500m of a zone (simplified for demo)
  return { danger: 'SAFE' };
};

export const generateMockPlume = (craterLat: number, craterLng: number): GISPlume => {
  const coordinates: [number, number][] = [
    [craterLat, craterLng],
    [craterLat + 0.005, craterLng - 0.01],
    [craterLat + 0.002, craterLng - 0.015],
    [craterLat - 0.002, craterLng - 0.015],
    [craterLat - 0.005, craterLng - 0.01],
  ];
  return { id: `plume-${Date.now()}`, coordinates, intensity: Math.random() * 100 };
};
