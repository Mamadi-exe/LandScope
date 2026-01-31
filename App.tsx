
import React, { useState, useCallback, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import { FarmAlert, VisualizationMode, AgriculturalInsight } from './types';
import { getAgriculturalInsights } from './services/geminiService';
import { INITIAL_ALERTS, TIMELINE_SNAPSHOTS } from './constants';

const App: React.FC = () => {
  const [vizMode, setVizMode] = useState<VisualizationMode>('GRID');
  const [timelineIndex, setTimelineIndex] = useState(2); // Start at 2026
  const [gridAlerts, setGridAlerts] = useState<FarmAlert[]>([]);
  const [activeAlert, setActiveAlert] = useState<FarmAlert | null>(null);
  const [currentInsight, setCurrentInsight] = useState<AgriculturalInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [outOfZone, setOutOfZone] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [highlightedSectorId, setHighlightedSectorId] = useState<string | null>(null);

  // Layer Visibility Management
  const [layerVisibility, setLayerVisibility] = useState({
    militarized: true,
    evacuation: true,
    corridors: true,
    ghf: true,
    grid: true,
    water: true,
    satellite: false // Satellite layer control
  });

  useEffect(() => {
    setGridAlerts(INITIAL_ALERTS);
  }, []);

  const handleUpdateAlert = (updatedAlert: FarmAlert) => {
    if (vizMode === 'GRID') {
      setGridAlerts(prev => prev.map(a => a.id === updatedAlert.id ? updatedAlert : a));
    }
    setActiveAlert(updatedAlert);
  };

  const handleAlertClick = useCallback(async (alert: FarmAlert) => {
    setActiveAlert(alert);
    setHighlightedSectorId(alert.sectorId);
    setOutOfZone(false);
    setIsSidebarOpen(true);
    setCurrentInsight(null);

    setLoadingInsight(true);
    try {
      const insight = await getAgriculturalInsights(alert.lat, alert.lng);
      if (insight) {
        // Carry over pre-calculated disease/water if AI doesn't overwrite
        insight.waterSource = insight.waterSource || alert.waterSource;
        insight.potentialDiseases = insight.potentialDiseases || alert.healthRisks;
        setCurrentInsight(insight);
      }
    } catch (err) {
      console.error("AI Insight Error:", err);
    } finally {
      setLoadingInsight(false);
    }
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    const step = 0.0075;
    const clickedSector = getVisibleAlerts().find(a => 
      Math.abs(a.lat - lat) < step/2 && Math.abs(a.lng - lng) < step/2
    );

    if (clickedSector) {
      handleAlertClick(clickedSector);
    } else {
      setActiveAlert(null);
      setCurrentInsight(null);
      setHighlightedSectorId(null);
      setIsSidebarOpen(true);
      
      const isWithinGazaScope = lat > 31.1 && lat < 31.7 && lng > 34.1 && lng < 34.7;
      if (!isWithinGazaScope) {
        setOutOfZone(true);
        return;
      }

      setLoadingInsight(true);
      try {
        const insight = await getAgriculturalInsights(lat, lng);
        if (insight) setCurrentInsight(insight);
        else setOutOfZone(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInsight(false);
      }
    }
  }, [handleAlertClick, vizMode, timelineIndex, gridAlerts]);

  const closePanel = () => {
    setActiveAlert(null);
    setCurrentInsight(null);
    setOutOfZone(false);
    setHighlightedSectorId(null);
    setIsSidebarOpen(false);
  };

  const getVisibleAlerts = () => {
    if (vizMode === 'GRID') return gridAlerts;
    if (vizMode === 'HISTORY') return TIMELINE_SNAPSHOTS[timelineIndex].alerts;
    return gridAlerts;
  };

  const currentYear = vizMode === 'HISTORY' ? TIMELINE_SNAPSHOTS[timelineIndex].year : 2026;

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      <main className="flex-1 relative overflow-hidden h-full">
        {/* Mode Switcher */}
        <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-[2000] flex bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 p-1.5 rounded-3xl shadow-2xl">
          <button onClick={() => { setVizMode('GRID'); closePanel(); }}
            className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${vizMode === 'GRID' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            Tactical
          </button>
          <button onClick={() => { setVizMode('HISTORY'); closePanel(); }}
            className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${vizMode === 'HISTORY' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            Archives
          </button>
        </div>

        {/* Timeline Slider for Archives */}
        {vizMode === 'HISTORY' && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-xl bg-slate-900/95 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-800 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between mb-6">
              {TIMELINE_SNAPSHOTS.map((snap, i) => (
                <button 
                  key={i} 
                  onClick={() => { setTimelineIndex(i); closePanel(); }}
                  className={`text-[10px] font-black uppercase tracking-widest transition-colors ${timelineIndex === i ? 'text-blue-400' : 'text-slate-600'}`}
                >
                  {snap.year}
                </button>
              ))}
            </div>
            <input 
              type="range" min="0" max={TIMELINE_SNAPSHOTS.length - 1} value={timelineIndex} 
              onChange={(e) => { setTimelineIndex(parseInt(e.target.value)); closePanel(); }}
              className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        )}

        <MapComponent 
          alerts={getVisibleAlerts()} 
          plumes={[]} 
          mode={vizMode}
          currentYear={currentYear}
          onMapClick={handleMapClick} 
          onAlertClick={handleAlertClick} 
          highlightedSectorId={highlightedSectorId}
          layerVisibility={layerVisibility}
          onToggleLayer={(key) => setLayerVisibility(v => ({ ...v, [key]: !v[key as keyof typeof v] }))}
        />
        
        {/* Status Badge */}
        <div className="absolute bottom-6 left-6 z-[1000] hidden md:flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl px-6 py-3 rounded-full border border-slate-700/50 shadow-xl">
           <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${currentYear >= 2027 ? 'bg-emerald-400' : 'bg-red-500'} animate-pulse`}></span>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-200">
                {currentYear >= 2027 ? 'POST-CONFLICT SYNC' : 'ACTIVE GRID SYNC'} {currentYear}
              </span>
           </div>
        </div>
      </main>

      {/* Sidebar Overlay/Container */}
      <div className={`fixed inset-0 z-[2500] md:relative md:inset-auto md:z-50 transition-transform duration-500 ${isSidebarOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'} ${!isSidebarOpen && 'pointer-events-none md:pointer-events-auto'}`}>
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md md:hidden" onClick={closePanel}></div>
        <div className="relative h-full w-full pointer-events-auto bg-slate-950 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
          <Sidebar 
            activeAlert={activeAlert}
            insight={currentInsight}
            loadingInsight={loadingInsight}
            onClosePanel={closePanel}
            alerts={getVisibleAlerts()}
            outOfZone={outOfZone}
            onUpdateAlert={handleUpdateAlert}
          />
        </div>
      </div>

      {showIntro && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-6 animate-in fade-in duration-700">
           <div className="max-w-md w-full bg-slate-900 border border-slate-700/50 p-12 rounded-[4rem] shadow-2xl text-center">
              <div className="w-24 h-24 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center mb-10 border border-blue-500/20 mx-auto">
                 <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h2 className="text-4xl font-black mb-6 tracking-tighter uppercase leading-none">LandScope <br/> <span className="text-blue-500">Recovery Grid</span></h2>
              <p className="text-slate-400 text-base leading-relaxed mb-12 font-medium">
                High-precision GIS mapping for Gaza's agricultural restoration. Forecast 2027-2028 soil health and navigate 2026 tactical hazards.
              </p>
              <button onClick={() => setShowIntro(false)}
                className="w-full bg-white text-slate-950 py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all hover:bg-blue-50">
                Access Mesh Terminal
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
