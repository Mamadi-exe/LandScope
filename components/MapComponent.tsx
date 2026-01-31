
import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { GAZA_CENTER, MAP_ZOOM, TOXICITY_COLORS, TACTICAL_ZONES, ZONE_STYLES } from '../constants';
import { FarmAlert, GISPlume, VisualizationMode } from '../types';

interface MapComponentProps {
  alerts: FarmAlert[];
  plumes: GISPlume[];
  mode: VisualizationMode;
  currentYear: number;
  onMapClick: (lat: number, lng: number) => void;
  onAlertClick: (alert: FarmAlert) => void;
  highlightedSectorId?: string | null;
  layerVisibility: {
    militarized: boolean;
    evacuation: boolean;
    corridors: boolean;
    ghf: boolean;
    grid: boolean;
    water: boolean;
    satellite: boolean;
  };
  onToggleLayer: (key: string) => void;
}

const blendColors = (color1: string, color2: string, percentage: number): string => {
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);
  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * percentage);
  const g = Math.round(g1 + (g2 - g1) * percentage);
  const b = Math.round(b1 + (b2 - b1) * percentage);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const MapComponent: React.FC<MapComponentProps> = ({ 
  alerts, mode, currentYear, onMapClick, onAlertClick, highlightedSectorId, layerVisibility, onToggleLayer 
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const gridLayerRef = useRef<L.LayerGroup | null>(null);
  const tacticalLayerRef = useRef<L.LayerGroup | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const voyagerLayerRef = useRef<L.TileLayer | null>(null);
  const legendRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(GAZA_CENTER, MAP_ZOOM);

    mapRef.current = map;

    voyagerLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      opacity: 0.8
    }).addTo(map);

    satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      opacity: 1,
      attribution: 'Tiles &copy; Esri'
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    tacticalLayerRef.current = L.layerGroup().addTo(map);
    gridLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !voyagerLayerRef.current || !satelliteLayerRef.current) return;
    if (layerVisibility.satellite) {
      if (mapRef.current.hasLayer(voyagerLayerRef.current)) mapRef.current.removeLayer(voyagerLayerRef.current);
      satelliteLayerRef.current.addTo(mapRef.current);
    } else {
      if (mapRef.current.hasLayer(satelliteLayerRef.current)) mapRef.current.removeLayer(satelliteLayerRef.current);
      voyagerLayerRef.current.addTo(mapRef.current);
    }
  }, [layerVisibility.satellite]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (legendRef.current) mapRef.current.removeControl(legendRef.current);

    const isFuture = currentYear >= 2027;

    const Legend = L.Control.extend({
      onAdd: function() {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.background = '#0f172aee';
        div.style.padding = '12px';
        div.style.border = '1px solid #334155';
        div.style.borderRadius = '16px';
        div.style.color = '#f1f5f9';
        div.style.fontFamily = 'Inter, sans-serif';
        div.style.fontSize = '10px';
        div.style.width = '210px';
        div.style.backdropFilter = 'blur(12px)';
        div.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';

        div.innerHTML = `
          <div style="font-weight: 800; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #334155; padding-bottom: 6px; color: #94a3b8; letter-spacing: 0.1em;">
            GZ Mesh Config (${currentYear})
          </div>
          
          <label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer; background: #3b82f622; padding: 6px 8px; border-radius: 8px; border: 1px solid #3b82f644;">
            <input type="checkbox" id="toggle-sat" ${layerVisibility.satellite ? 'checked' : ''} style="margin-right: 10px; width: 14px; height: 14px;">
            <span style="font-weight: 800; color: #60a5fa; text-transform: uppercase; letter-spacing: 0.05em;">SATELLITE VIEW</span>
          </label>

          ${!isFuture ? `
            <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
              <input type="checkbox" id="toggle-mil" ${layerVisibility.militarized ? 'checked' : ''} style="margin-right: 8px;">
              <i style="width: 14px; height: 14px; background: ${ZONE_STYLES.MILITARIZED.fillColor}; opacity: 0.5; display: inline-block; margin-right: 8px; border: 1px solid ${ZONE_STYLES.MILITARIZED.color};"></i>
              Militarized Zones
            </label>
            <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
              <input type="checkbox" id="toggle-evac" ${layerVisibility.evacuation ? 'checked' : ''} style="margin-right: 8px;">
              <i style="width: 14px; height: 14px; background: ${ZONE_STYLES.EVACUATION.fillColor}; opacity: 0.5; display: inline-block; margin-right: 8px;"></i>
              Evacuation Orders
            </label>
            <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
              <input type="checkbox" id="toggle-corr" ${layerVisibility.corridors ? 'checked' : ''} style="margin-right: 8px;">
              <i style="width: 20px; height: 3px; background: ${ZONE_STYLES.CORRIDOR.color}; display: inline-block; margin-right: 8px;"></i>
              Strategic Corridors
            </label>
          ` : `<div style="padding: 4px 0 8px 0; color: #10b981; font-weight: bold; font-size: 9px; display: flex; align-items: center; gap: 6px;"><span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span> HAZARDS DECOMMISSIONED</div>`}
          
          <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
            <input type="checkbox" id="toggle-ghf" ${layerVisibility.ghf ? 'checked' : ''} style="margin-right: 8px;">
            <i style="width: 14px; height: 14px; background: white; border-radius: 50%; display: inline-block; margin-right: 8px; border: 2px solid black;"></i>
            GHF Dist. Hubs
          </label>

          <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
            <input type="checkbox" id="toggle-water" ${layerVisibility.water ? 'checked' : ''} style="margin-right: 8px;">
            <i style="width: 14px; height: 14px; background: ${ZONE_STYLES.WATER_SOURCE.fillColor}; border-radius: 50%; display: inline-block; margin-right: 8px; border: 1px solid ${ZONE_STYLES.WATER_SOURCE.color}"></i>
            Water Sources
          </label>

          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #334155;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="toggle-grid" ${layerVisibility.grid ? 'checked' : ''} style="margin-right: 8px;">
              <i style="width: 14px; height: 14px; background: #10b981; opacity: 0.3; display: inline-block; margin-right: 8px; border: 1px solid #000;"></i>
              Soil Analysis Grid
            </label>
          </div>
        `;

        L.DomEvent.disableClickPropagation(div);
        return div;
      }
    });

    legendRef.current = new (Legend as any)({ position: 'topleft' }).addTo(mapRef.current);

    document.getElementById('toggle-sat')?.addEventListener('change', () => onToggleLayer('satellite'));
    document.getElementById('toggle-mil')?.addEventListener('change', () => onToggleLayer('militarized'));
    document.getElementById('toggle-evac')?.addEventListener('change', () => onToggleLayer('evacuation'));
    document.getElementById('toggle-corr')?.addEventListener('change', () => onToggleLayer('corridors'));
    document.getElementById('toggle-ghf')?.addEventListener('change', () => onToggleLayer('ghf'));
    document.getElementById('toggle-water')?.addEventListener('change', () => onToggleLayer('water'));
    document.getElementById('toggle-grid')?.addEventListener('change', () => onToggleLayer('grid'));

  }, [currentYear, layerVisibility]);

  useEffect(() => {
    if (!tacticalLayerRef.current) return;
    tacticalLayerRef.current.clearLayers();

    const isFuture = currentYear >= 2027;

    if (!isFuture && layerVisibility.militarized) {
      TACTICAL_ZONES.MILITARIZED.forEach(poly => {
        L.polygon(poly as L.LatLngExpression[], { ...ZONE_STYLES.MILITARIZED, interactive: false }).addTo(tacticalLayerRef.current!);
      });
    }

    if (!isFuture && layerVisibility.evacuation) {
      TACTICAL_ZONES.EVACUATION.forEach(poly => {
        L.polygon(poly as L.LatLngExpression[], { ...ZONE_STYLES.EVACUATION, interactive: false }).addTo(tacticalLayerRef.current!);
      });
    }

    if (!isFuture && layerVisibility.corridors) {
      TACTICAL_ZONES.CORRIDORS.forEach(corridor => {
        const line = L.polyline(corridor.coords as L.LatLngExpression[], { ...ZONE_STYLES.CORRIDOR }).addTo(tacticalLayerRef.current!);
        line.bindTooltip(corridor.name, { permanent: true, direction: 'center', className: 'tactical-label' });
      });
    }

    if (layerVisibility.ghf) {
      TACTICAL_ZONES.GHF_SITES.forEach(site => {
        L.circleMarker(site.coords as L.LatLngExpression, { ...ZONE_STYLES.DISTRIBUTION, interactive: true })
          .addTo(tacticalLayerRef.current!)
          .bindTooltip(site.name, { direction: 'top' });
      });
    }

    if (layerVisibility.water) {
      TACTICAL_ZONES.WATER_SOURCES.forEach(source => {
        L.circleMarker(source.coords as L.LatLngExpression, { ...ZONE_STYLES.WATER_SOURCE, interactive: true })
          .addTo(tacticalLayerRef.current!)
          .bindTooltip(`${source.name} (${source.type})`, { direction: 'top' });
      });
    }
  }, [currentYear, layerVisibility]);

  useEffect(() => {
    if (!gridLayerRef.current) return;
    gridLayerRef.current.clearLayers();

    if (!layerVisibility.grid) return;

    alerts.forEach(alert => {
      const isHighlighted = highlightedSectorId === alert.sectorId;
      const isTreated = alert.progress === 100;
      const baseColor = TOXICITY_COLORS[alert.toxicity];
      const progressColor = '#10b981';
      const blendedColor = alert.progress > 0 ? blendColors(baseColor, progressColor, alert.progress / 100) : baseColor;
      
      const size = 0.0065; 
      const bounds: L.LatLngExpression[] = [
        [alert.lat - size/2, alert.lng - size/2], [alert.lat - size/2, alert.lng + size/2],
        [alert.lat + size/2, alert.lng + size/2], [alert.lat + size/2, alert.lng - size/2]
      ];

      const className = `
        ${isHighlighted ? 'active-cell' : 'idle-cell'} 
        ${isTreated ? 'treated-cell' : ''}
      `.trim();

      L.polygon(bounds, {
        color: isHighlighted ? '#ffffff' : (isTreated ? '#22d3ee' : (layerVisibility.satellite ? '#ffffff' : '#000')),
        weight: isHighlighted ? 3 : (isTreated ? 2 : (layerVisibility.satellite ? 0.3 : 0.1)),
        opacity: isHighlighted ? 1 : (isTreated ? 1 : (layerVisibility.satellite ? 0.2 : 0.15)),
        fillColor: blendedColor,
        fillOpacity: isHighlighted ? 0.7 : (isTreated ? 0.8 : (mode === 'HISTORY' ? 0.15 : 0.35)),
        className
      }).addTo(gridLayerRef.current!).on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onAlertClick(alert);
      });
    });
  }, [alerts, mode, highlightedSectorId, layerVisibility.grid, layerVisibility.satellite]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <style>{`
        .active-cell { filter: drop-shadow(0 0 10px white); z-index: 1000 !important; }
        .idle-cell:hover { fill-opacity: 0.6; cursor: pointer; }
        
        @keyframes treatedPulse {
          0% { filter: drop-shadow(0 0 2px rgba(34, 211, 238, 0.4)); }
          50% { filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.9)); }
          100% { filter: drop-shadow(0 0 2px rgba(34, 211, 238, 0.4)); }
        }
        
        .treated-cell {
          animation: treatedPulse 2.5s infinite ease-in-out;
          stroke-dasharray: 4, 2;
        }

        .tactical-label {
          background: transparent !important; color: #ef4444 !important; border: none !important;
          font-weight: 900 !important; font-size: 8px !important; text-transform: uppercase;
          text-shadow: 0 0 3px white, 0 0 6px white; box-shadow: none !important; pointer-events: none;
        }
        .tactical-label:before { display: none; }
      `}</style>
    </div>
  );
};

export default MapComponent;
