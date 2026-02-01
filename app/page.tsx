"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, AlertCircle, CheckCircle2, Search, Zap, DollarSign, History, ChevronRight, X, MapPin, Star, Calendar } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState<"intro" | "scanning" | "report" | "upload">("intro");
  const [detectedIssues, setDetectedIssues] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [analyzingImage, setAnalyzingImage] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);

  const startScan = () => {
    setStep("scanning");
    setDetectedIssues([]);
    setProgress(0);
  };

  const startUpload = async () => {
    setStep("upload");
    setAnalyzingImage(true);
    
    try {
      const res = await fetch("/api/analyze");
      const data = await res.json();
      setReportData(data);
      setAnalyzingImage(false);
      setStep("report");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (step === "scanning") {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep("report"), 500);
            return 100;
          }
          
          // Simulate detections at certain points
          if (prev === 20 && detectedIssues.length === 0) {
            setDetectedIssues([{ id: 1, part: "Front Bumper", type: "Scratch", severity: "Minor", cost: 120, pos: { top: '65%', left: '45%' } }]);
          }
          if (prev === 55 && detectedIssues.length === 1) {
            setDetectedIssues(curr => [...curr, { id: 2, part: "Passenger Door", type: "Dent", severity: "Moderate", cost: 250, pos: { top: '55%', left: '75%' } }]);
          }
          if (prev === 85 && detectedIssues.length === 2) {
             setDetectedIssues(curr => [...curr, { id: 3, part: "Rear Wheel", type: "Scuff", severity: "Minor", cost: 85, pos: { top: '70%', left: '85%' } }]);
          }

          return prev + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step, detectedIssues]);

  return (
    <div className="relative h-screen w-full bg-slate-950 overflow-hidden text-slate-100 select-none">
      {/* HUD Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
        <div className="grid grid-cols-12 h-full w-full border-slate-800/20 divide-x divide-slate-800/20">
          {[...Array(12)].map((_, i) => <div key={i} />)}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/30 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-yellow-500/20">
              <Zap className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-2 italic uppercase">Pocket Appraiser<span className="text-yellow-500 text-base align-top ml-1">AI</span></h1>
            <p className="text-slate-400 mb-12 max-w-sm">Instantly detect damage and calculate reconditioning costs via computer vision.</p>
            
            <button 
              onClick={startScan}
              className="w-full max-w-xs group bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-5 rounded-2xl transition-all shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
            >
              <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Live HUD Scan
            </button>

            <button 
              onClick={startUpload}
              className="w-full max-w-xs group bg-slate-800 hover:bg-slate-700 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm mt-4 border border-slate-700"
            >
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Analyze Photo
            </button>
            
            <div className="mt-8 flex gap-6 text-slate-500">
              <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest">
                <History className="w-4 h-4" />
                History
              </div>
              <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-widest">
                <Search className="w-4 h-4" />
                Settings
              </div>
            </div>
          </motion.div>
        )}

        {step === "upload" && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-50 h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950"
          >
             <div className="w-full max-w-sm p-8 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold mb-2 uppercase italic">Snap & Appraise</h2>
                <p className="text-slate-500 text-sm mb-6">Send a photo of car damage to Jeeves in Telegram. I will analyze it using Gemini Vision and display the results here.</p>
                
                <div className="flex items-center gap-2 text-yellow-500 animate-pulse font-mono text-xs uppercase tracking-[0.2em]">
                  <Zap className="w-4 h-4" />
                  Waiting for Image...
                </div>
             </div>
             <button onClick={() => setStep("intro")} className="mt-8 text-slate-500 text-xs uppercase tracking-widest font-bold">Cancel</button>
          </motion.div>
        )}

        {step === "scanning" && (
          <motion.div 
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col"
          >
            {/* Mock Camera View */}
            <div className="absolute inset-0 bg-slate-900">
              <img 
                src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=2070" 
                className="w-full h-full object-cover opacity-60 mix-blend-overlay grayscale"
                alt="Car being scanned"
              />
              <div className="scanner-bar" />
            </div>

            {/* Scanning HUD */}
            <div className="relative z-30 h-full flex flex-col p-6 pointer-events-none">
              <div className="flex justify-between items-start">
                <div className="hud-border bg-slate-950/80 backdrop-blur-md p-3 rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-widest uppercase">Live Scan Mode</span>
                </div>
                <div className="hud-border bg-slate-950/80 backdrop-blur-md p-3 rounded-xl">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-yellow-500">Confidence: 94%</span>
                </div>
              </div>

              {/* Detections Overlay */}
              <div className="absolute inset-0">
                {detectedIssues.map((issue) => (
                  <motion.div
                    key={issue.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute p-2"
                    style={{ top: issue.pos.top, left: issue.pos.left }}
                  >
                    <div className="w-12 h-12 border-2 border-yellow-500 rounded-lg animate-pulse" />
                    <div className="absolute top-0 left-14 whitespace-nowrap bg-yellow-500 text-slate-950 px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter shadow-xl">
                      {issue.type} Detected
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto">
                <div className="mb-4 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tighter">Analyzing Panels</h2>
                    <p className="text-[10px] font-mono text-slate-400">Current segment: Rear Quarter / OS</p>
                  </div>
                  <span className="text-3xl font-black font-mono tabular-nums text-yellow-500">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-8 border border-slate-700/50">
                  <motion.div 
                    className="h-full bg-yellow-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === "report" && (
          <motion.div 
            key="report"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-40 h-full flex flex-col bg-slate-950"
          >
            {/* Report Header */}
            <div className="p-6 pt-12 bg-slate-900 border-b border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  Analysis Complete
                </div>
                <button onClick={() => setStep("intro")} className="text-slate-500 hover:text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Appraisal Report</h2>
              <p className="text-slate-400 text-sm">Ref: #AP-44029 • BMW 320i M Sport</p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
              {/* Cost Summary Card */}
              <div className="bg-yellow-500 p-6 rounded-3xl text-slate-950 shadow-2xl shadow-yellow-500/20 relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1 block">Est. Recon Cost</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tighter flex items-center leading-none">
                       £{reportData ? reportData.totalCost : detectedIssues.reduce((acc, curr) => acc + curr.cost, 0)}
                    </span>
                  </div>
                  <p className="text-xs mt-2 font-medium opacity-70 italic">Calculated using average regional labor rates.</p>
                </div>
                <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-950 opacity-10" />
              </div>

              {/* Damage Breakdown */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 ml-1">Detected Defects</h3>
                {(reportData ? reportData.defects : detectedIssues).map((issue: any) => (
                  <div key={issue.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                        <AlertCircle className={`w-5 h-5 ${issue.severity === 'Moderate' ? 'text-orange-500' : 'text-yellow-500'}`} />
                      </div>
                      <div className="max-w-[180px]">
                        <h4 className="font-bold text-sm truncate">{issue.part}</h4>
                        <p className="text-xs text-slate-500">{issue.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">£{issue.cost}</p>
                      <p className="text-[10px] text-slate-500 font-mono italic">ESTIMATED</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation Card */}
              <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl">
                <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2 italic">
                   Expert Recommendation
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  Damage is primarily cosmetic. Expected time-to-recon: <span className="text-slate-100 font-medium">3 working days</span>. Proceed with trade-in but adjust offer by -15% for reconditioning buffer.
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-lg shadow-blue-500/10">
                  Save to Inventory
                </button>
              </div>

              {/* Local Body Shops */}
              {reportData?.localShops && (
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Repair Options Near London</h3>
                   {reportData.localShops.map((shop: any, i: number) => (
                     <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl group hover:border-blue-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-base group-hover:text-blue-400 transition-colors">{shop.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="flex items-center text-yellow-500 text-[10px] font-bold">
                                 <Star className="w-3 h-3 fill-yellow-500 mr-1" />
                                 {shop.rating}
                               </div>
                               <span className="text-slate-600 text-xs">•</span>
                               <span className="text-slate-400 text-xs flex items-center gap-1">
                                 <MapPin className="w-3 h-3" />
                                 {shop.distance}
                               </span>
                            </div>
                          </div>
                          <div className="bg-slate-800 px-3 py-1 rounded-lg">
                             <span className="text-xs font-bold text-white">{shop.priceMatch}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
                           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                             <Calendar className="w-3 h-3 text-blue-500" />
                             Earliest: {shop.availability}
                           </div>
                           <button className="text-blue-500 text-[10px] font-black uppercase tracking-widest hover:underline">Book Repair</button>
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 w-full p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/50">
              <button className="w-full bg-white text-slate-950 font-black py-5 rounded-2xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-2xl">
                 Generate Official Valuation
                 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
