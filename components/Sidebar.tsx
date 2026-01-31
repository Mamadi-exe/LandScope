
import React, { useState, useEffect } from 'react';
import { FarmAlert, AgriculturalInsight, ContaminationGuide, RemediationLog, ToxicityLevel, CrisisAnalysis } from '../types';
import { getContaminationGuide, getCrisisAnalysis } from '../services/geminiService';
import { TOXICITY_COLORS } from '../constants';

interface SidebarProps {
  activeAlert: FarmAlert | null;
  insight: AgriculturalInsight | null;
  loadingInsight: boolean;
  onClosePanel: () => void;
  alerts: FarmAlert[];
  outOfZone: boolean;
  onUpdateAlert?: (updated: FarmAlert) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeAlert, insight, loadingInsight, onClosePanel, outOfZone, onUpdateAlert 
}) => {
  const [guide, setGuide] = useState<ContaminationGuide | null>(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasCapturedPhoto, setHasCapturedPhoto] = useState(false);
  const [crisisAnalysis, setCrisisAnalysis] = useState<CrisisAnalysis | null>(null);
  const [loadingCrisisAnalysis, setLoadingCrisisAnalysis] = useState(false);

  // Accordion state
  const [openSections, setOpenSections] = useState({
    sensors: true,
    remediation: true,
    ai: true,
    safety: true,
    crisis: false
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (activeAlert) fetchDetailedGuide();
    else { setGuide(null); setActiveStepIndex(null); setIsVerifying(false); }
  }, [activeAlert?.id]);

  useEffect(() => {
    if (activeAlert && guide && insight) {
      fetchCrisisAnalysis();
    } else {
      setCrisisAnalysis(null);
    }
  }, [activeAlert?.id, guide, insight]);

  const fetchDetailedGuide = async () => {
    if (!activeAlert) return;
    setLoadingGuide(true);
    try {
      const data = await getContaminationGuide(activeAlert);
      data.riskBadges = data.riskBadges || activeAlert.healthRisks || [];
      setGuide(data);
    } catch (e) { console.error(e); } 
    finally { setLoadingGuide(false); }
  };

  const fetchCrisisAnalysis = async () => {
    if (!activeAlert || !guide) return;
    setLoadingCrisisAnalysis(true);
    try {
      const data = await getCrisisAnalysis(activeAlert, guide, insight);
      setCrisisAnalysis(data);
    } catch (e) { console.error(e); }
    finally { setLoadingCrisisAnalysis(false); }
  };

  const startVerification = (index: number) => {
    setActiveStepIndex(index);
    setVerificationNote('');
    setHasCapturedPhoto(false);
    setIsVerifying(true);
  };

  const handleSimulatedPhoto = () => setHasCapturedPhoto(true);

  const handleVerifySubmit = () => {
    if (!activeAlert || !onUpdateAlert || activeStepIndex === null || !guide) return;
    
    const newLog: RemediationLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      action: guide.plantingSteps[activeStepIndex],
      notes: verificationNote,
      imageUrl: "FIELD_CAPTURE_ENCRYPTED_2026",
      stepIndex: activeStepIndex
    };

    const updatedCompleted = Array.from(new Set([...activeAlert.completedStepIndices, activeStepIndex]));
    const updatedProgress = (updatedCompleted.length / guide.plantingSteps.length) * 100;
    
    onUpdateAlert({
      ...activeAlert,
      progress: updatedProgress,
      completedStepIndices: updatedCompleted,
      remediationLogs: [newLog, ...activeAlert.remediationLogs]
    });

    setIsVerifying(false);
    setActiveStepIndex(null);
  };

  if (!activeAlert && !insight && !loadingInsight && !outOfZone) return null;

  const SectionHeader = ({ title, isOpen, onToggle, badge }: { title: string, isOpen: boolean, onToggle: () => void, badge?: React.ReactNode }) => (
    <button 
      onClick={onToggle}
      className="w-full flex justify-between items-center py-2 px-1 hover:bg-slate-900/40 rounded transition-colors group"
    >
      <div className="flex items-center gap-3">
        <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-300 transition-colors">{title}</h3>
        {badge}
      </div>
      <svg 
        className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <div className="w-full md:w-[420px] bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl transition-all duration-300 selection:bg-blue-500/30">
      
      <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${activeAlert?.toxicity === ToxicityLevel.CRITICAL ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200">
            {isVerifying ? 'Proof of Action' : activeAlert ? `Sector ${activeAlert.sectorId}` : 'Terrain Terminal'}
          </h2>
        </div>
        <button onClick={onClosePanel} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="flex-1 px-6 py-8 space-y-8">
        
        {isVerifying ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl">
                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1 block">Task Verification</span>
                <p className="text-base font-bold text-white leading-tight">{guide?.plantingSteps[activeStepIndex!]}</p>
             </div>
             <div className="space-y-4">
                <div 
                  onClick={handleSimulatedPhoto}
                  className={`w-full h-40 border border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${hasCapturedPhoto ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/30 border-slate-700 hover:border-blue-500/50'}`}
                >
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    {hasCapturedPhoto ? 'Photo Authenticated ✓' : 'Click to Upload Field Photo'}
                  </span>
                </div>
                <textarea 
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="Notes from the field..."
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm text-white outline-none focus:border-blue-500 h-28"
                />
             </div>
             <div className="flex gap-4">
                <button onClick={() => setIsVerifying(false)} className="flex-1 py-3 text-slate-500 text-[10px] font-bold uppercase">Cancel</button>
                <button 
                  onClick={handleVerifySubmit} 
                  disabled={!verificationNote.trim() || !hasCapturedPhoto}
                  className={`flex-[2] py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest ${verificationNote.trim() && hasCapturedPhoto ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-600'}`}
                >
                  Submit Evidence
                </button>
             </div>
          </div>
        ) : (
          <div className="space-y-8 pb-20 animate-in fade-in duration-500">
             
             {/* 1. Local Sensor Feed - IMMEDIATE DATA */}
             {activeAlert && (
               <section className="space-y-2">
                 <SectionHeader 
                    title="Local Mesh Sensor Data" 
                    isOpen={openSections.sensors} 
                    onToggle={() => toggleSection('sensors')}
                    badge={<span className="px-1.5 py-0.5 rounded bg-slate-800 text-[8px] font-black text-slate-400 uppercase tracking-widest">LIVE</span>}
                 />
                 {openSections.sensors && (
                   <div className="p-5 bg-slate-900/60 border border-slate-700 rounded-2xl space-y-4 shadow-xl border-l-4 animate-in fade-in slide-in-from-top-2 duration-300" style={{ borderLeftColor: TOXICITY_COLORS[activeAlert.toxicity] }}>
                     <div className="flex justify-between items-start">
                       <div className="space-y-1">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contaminant Profile</p>
                         <p className="text-xl font-black text-white leading-tight">{activeAlert.contaminant}</p>
                       </div>
                       <div className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: `${TOXICITY_COLORS[activeAlert.toxicity]}22`, color: TOXICITY_COLORS[activeAlert.toxicity], border: `1px solid ${TOXICITY_COLORS[activeAlert.toxicity]}44` }}>
                         {activeAlert.toxicity} RISK
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                       <div className="space-y-1">
                         <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Water Infrastructure</p>
                         <p className="text-[11px] font-bold text-blue-400 truncate">{activeAlert.waterSource || 'Scanning...'}</p>
                       </div>
                       <div className="space-y-1">
                         <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Soil Persist.</p>
                         <p className="text-[11px] font-bold text-white">{activeAlert.persistenceMonths}M Forecast</p>
                       </div>
                     </div>

                     {activeAlert.healthRisks && activeAlert.healthRisks.length > 0 && (
                       <div className="pt-2 flex flex-wrap gap-2">
                         {activeAlert.healthRisks.map((risk, i) => (
                           <span key={i} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md text-[8px] font-black uppercase text-red-400 tracking-wider">
                             {risk}
                           </span>
                         ))}
                       </div>
                     )}
                   </div>
                 )}
               </section>
             )}

             {/* 2. REMEDIATION PROCESS (Operation Log) */}
             <section className="space-y-2">
                <SectionHeader 
                  title="Operation Log" 
                  isOpen={openSections.remediation} 
                  onToggle={() => toggleSection('remediation')}
                  badge={activeAlert && (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${activeAlert.progress === 100 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-emerald-500'}`} style={{ width: `${activeAlert.progress}%` }}></div>
                      </div>
                      <span className={`text-[9px] font-bold ${activeAlert.progress === 100 ? 'text-cyan-400' : 'text-emerald-500'}`}>{Math.round(activeAlert.progress)}%</span>
                    </div>
                  )}
                />
                {openSections.remediation && (
                  <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    {guide?.plantingSteps.map((step, i) => (
                        <div 
                          key={i} 
                          className={`p-4 rounded-xl border transition-all duration-300 ${activeAlert?.completedStepIndices.includes(i) ? 'bg-emerald-500/10 border-emerald-500/40 opacity-70 shadow-sm' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`}
                        >
                          <div className="flex gap-4 items-start">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-black ${activeAlert?.completedStepIndices.includes(i) ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                {activeAlert?.completedStepIndices.includes(i) ? '✓' : i + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-[12px] font-bold text-slate-200 leading-snug">{step}</p>
                                {!activeAlert?.completedStepIndices.includes(i) && (
                                    <button onClick={() => startVerification(i)} className="mt-2.5 text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 tracking-wider flex items-center gap-1">
                                      Verify Task Execution <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </button>
                                )}
                              </div>
                          </div>
                        </div>
                    ))}
                    {!guide && !loadingGuide && (
                      <div className="p-4 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl text-center">
                        <p className="text-[10px] text-slate-600 font-bold uppercase">Waiting for Sector Calibration...</p>
                      </div>
                    )}
                  </div>
                )}
             </section>

             {/* 3. AI Intelligence Section (AI Analysis) */}
             <section className="space-y-2">
                <SectionHeader 
                  title="AI Crisis Synthesis" 
                  isOpen={openSections.ai} 
                  onToggle={() => toggleSection('ai')}
                  badge={loadingInsight ? <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> : null}
                />
                {openSections.ai && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    {loadingInsight ? (
                       <div className="py-12 bg-slate-900/30 border border-slate-800/50 rounded-2xl flex flex-col items-center justify-center gap-3">
                         <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                         <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Synthesizing Spectral Data...</p>
                       </div>
                    ) : insight ? (
                      <div className="space-y-4">
                        <div className="p-5 bg-slate-900/30 border border-slate-800 rounded-xl space-y-4 shadow-inner">
                          <div className="space-y-2">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Classification:</span>
                              <span className="text-white font-medium">{insight.soilType}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Seasonal Outlook:</span>
                              <span className="text-emerald-400 font-medium">{insight.climateOutlook}</span>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-slate-800/80">
                            <p className="text-[11px] text-slate-400 leading-relaxed italic mb-4">
                               "{insight.seasonalImpact}"
                            </p>
                            
                            <div className="space-y-2">
                              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Recommended Crisis Crops</p>
                              <div className="flex flex-wrap gap-2">
                                {insight.preferredStrategicCrops.map((crop, idx) => (
                                  <span key={idx} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-[9px] font-bold shadow-sm">
                                    🌱 {crop}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl text-right shadow-lg" dir="rtl">
                          <p className="text-sm text-slate-200 leading-relaxed font-bold">{insight.arabicSummary}</p>
                        </div>
                      </div>
                    ) : outOfZone ? (
                      <div className="p-8 text-center text-[10px] text-slate-600 font-bold uppercase border-2 border-dashed border-slate-800 rounded-2xl">Coordinate Outside Boundaries</div>
                    ) : (
                      <div className="p-6 text-center text-[10px] text-slate-600 font-bold uppercase">Select Sector for AI Insight</div>
                    )}
                  </div>
                )}
             </section>

             {/* 4. SAFETY & RESTORATION PROTOCOL */}
             <section className="space-y-2">
                <SectionHeader 
                  title="Safety & Restoration Protocol" 
                  isOpen={openSections.safety} 
                  onToggle={() => toggleSection('safety')}
                />
                {openSections.safety && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {loadingGuide ? (
                       <div className="py-6 flex items-center justify-center gap-2">
                         <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                         <p className="text-[9px] font-bold text-slate-600 uppercase">Synchronizing Action Plan...</p>
                       </div>
                    ) : guide ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl space-y-3">
                          <p className="text-[9px] font-black text-red-500 uppercase mb-2 tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                            Safety Hazard Alert
                          </p>
                          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{guide.safetyProtocol}</p>
                          
                          {/* DISEASES AS LITTLE BADGES RESTORED HERE */}
                          {(guide.riskBadges && guide.riskBadges.length > 0) && (
                            <div className="pt-2 flex flex-wrap gap-2 border-t border-red-500/10 pt-3">
                               {guide.riskBadges.map((badge, idx) => (
                                 <span key={idx} className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase rounded tracking-[0.1em] shadow-lg shadow-red-900/50">
                                   ☣ {badge}
                                 </span>
                               ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-xl">
                          <p className="text-[9px] font-black text-emerald-500 uppercase mb-2 tracking-widest">Bioremediation Strategy</p>
                          <p className="text-[11px] text-slate-300 leading-relaxed italic">"{guide.phytoStrategy}"</p>
                        </div>
                      </div>
                    ) : (
                       <div className="p-6 text-center text-[10px] text-slate-600 font-bold uppercase">Initialize Sector for Protocol</div>
                    )}
                  </div>
                )}
             </section>

             {/* 5. CRISIS ANALYSIS & COORDINATION */}
             <section className="space-y-2">
                <SectionHeader 
                  title="Crisis Analysis & Coordination" 
                  isOpen={openSections.crisis} 
                  onToggle={() => toggleSection('crisis')}
                  badge={loadingCrisisAnalysis ? <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div> : crisisAnalysis ? <span className="px-1.5 py-0.5 rounded bg-orange-600 text-[8px] font-black text-white uppercase tracking-widest">Synthesis</span> : null}
                />
                {openSections.crisis && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    {loadingCrisisAnalysis ? (
                       <div className="py-12 bg-slate-900/30 border border-slate-800/50 rounded-2xl flex flex-col items-center justify-center gap-3">
                         <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                         <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Analyzing Crisis Context...</p>
                       </div>
                    ) : crisisAnalysis ? (
                      <div className="space-y-4">
                        <div className="p-5 bg-orange-950/20 border border-orange-500/30 rounded-xl space-y-4 shadow-inner">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest flex-shrink-0 pt-0.5">⚠ Assessment</span>
                              <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{crisisAnalysis.overallAssessment}</p>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-orange-500/20">
                            <p className="text-[8px] font-black text-orange-500 uppercase mb-2 tracking-widest">Immediate Actions (72H)</p>
                            <div className="space-y-1.5">
                              {crisisAnalysis.immediateActions.map((action, idx) => (
                                <div key={idx} className="flex gap-2 items-start text-[10px]">
                                  <span className="text-orange-400 font-black flex-shrink-0">▸</span>
                                  <span className="text-slate-300">{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-orange-500/20">
                            <p className="text-[8px] font-black text-red-500 uppercase mb-2 tracking-widest">Risk Factors</p>
                            <div className="flex flex-wrap gap-2">
                              {crisisAnalysis.riskFactors.map((risk, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-md text-[8px] font-bold uppercase text-red-400 tracking-wider">
                                  {risk}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-orange-500/20 space-y-2">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Timeline:</span>
                              <span className="text-slate-300 font-medium">{crisisAnalysis.timelineForecast}</span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-orange-500/20">
                            <p className="text-[8px] font-black text-blue-500 uppercase mb-2 tracking-widest">Resource Requirements</p>
                            <div className="space-y-1.5">
                              {crisisAnalysis.resourceNeeds.map((need, idx) => (
                                <div key={idx} className="flex gap-2 items-start text-[10px]">
                                  <span className="text-blue-400 font-black flex-shrink-0">•</span>
                                  <span className="text-slate-300">{need}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-orange-500/20">
                            <p className="text-[8px] font-black text-cyan-500 uppercase mb-2 tracking-widest">Coordination Notes</p>
                            <p className="text-[10px] text-slate-300 leading-relaxed italic">"{crisisAnalysis.coordinationNotes}"</p>
                          </div>
                        </div>
                        
                        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl text-right shadow-lg" dir="rtl">
                          <p className="text-sm text-slate-200 leading-relaxed font-bold">{crisisAnalysis.arabicSummary}</p>
                        </div>
                      </div>
                    ) : (
                       <div className="p-6 text-center text-[10px] text-slate-600 font-bold uppercase">Select Sector to Generate Analysis</div>
                    )}
                  </div>
                )}
             </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
