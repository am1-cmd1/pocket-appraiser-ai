"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, AlertCircle, CheckCircle2, Search, Zap, DollarSign, History, ChevronRight, X, MapPin, Star, Calendar, ShieldAlert, FileText, Info } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState<"intro" | "scanning" | "report" | "upload" | "service">("intro");
  const [vrm, setVrm] = useState("");
  const [serviceHistory, setServiceHistory] = useState<any>(null);
  const [valuationData, setValuationData] = useState<any>(null);
  const [detectedIssues, setDetectedIssues] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [scannedPanels, setScannedPanels] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [analyzingImage, setAnalyzingImage] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startScan = async () => {
    const inputVrm = prompt("Enter Vehicle Registration (e.g. GJ21 XOW):") || "UNKNOWN";
    setVrm(inputVrm);
    
    // Fetch valuation in background
    fetch(`/api/valuation?vrm=${inputVrm}`).then(res => res.json()).then(data => setValuationData(data));

    setStep("scanning");
    setDetectedIssues([]);
    setProgress(0);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, // Use back camera on mobile
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Please allow camera access to use the live scanner.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (step !== "scanning") {
      stopCamera();
    }
  }, [step]);

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
    if (step === "scanning" && analyzingImage) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep("report"), 500);
            return 100;
          }
          return prev + 5;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step, analyzingImage]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;
    setAnalyzingImage(true);
    setProgress(0);
    
    // 1. Capture frame from Video to Canvas
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);

      // 2. Send to our "Brain" API
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          body: JSON.stringify({ image: imageData }),
          headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        
        if (data.error) {
            alert(data.error);
            setAnalyzingImage(false);
            return;
        }

        setReportData(data);
        setReports(prev => [...prev, data]);
        if (data.defects?.[0]?.part) {
           setScannedPanels(prev => [...prev, data.defects[0].part]);
        }
      } catch (e) {
        console.error(e);
        setAnalyzingImage(false);
      }
    }
  };

  const totalReconCost = reports.reduce((acc, r) => acc + r.totalCost, 0);

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
            
            <button 
              onClick={() => setStep("service")}
              className="w-full max-w-xs group bg-slate-800 hover:bg-slate-700 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm mt-4 border border-slate-700"
            >
              <FileText className="w-5 h-5 group-hover:scale-110 transition-transform text-blue-500" />
              Scan Service Book
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

        {step === "service" && (
           <motion.div 
            key="service"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col bg-slate-950 p-6"
          >
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black uppercase italic">Document Scanner</h2>
                <button onClick={() => setStep("intro")}><X className="w-6 h-6" /></button>
             </div>
             
             {!analyzingImage ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                   <div className="w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6">
                      <FileText className="w-12 h-12 text-blue-500" />
                   </div>
                   <h3 className="text-2xl font-bold mb-2">Scan Service Book</h3>
                   <p className="text-slate-500 text-sm mb-12">Point the camera at the dealer stamps and mileage entries. I'll digitize the history for you.</p>
                   
                   <button 
                     onClick={() => {
                        setAnalyzingImage(true);
                        setTimeout(() => {
                           setServiceHistory({
                              score: "4.5/5",
                              status: "FULL SERVICE HISTORY",
                              records: [
                                 { date: "Oct 2024", miles: "32,102", type: "Major", dealer: "BMW London" },
                                 { date: "Oct 2023", miles: "21,050", type: "Minor", dealer: "BMW London" },
                                 { date: "Oct 2022", miles: "10,005", type: "Oil", dealer: "Independent" }
                              ]
                           });
                           setAnalyzingImage(false);
                           setStep("report");
                        }, 2500);
                     }}
                     className="w-full bg-blue-600 py-5 rounded-2xl font-bold uppercase tracking-widest text-sm"
                   >
                      Capture Documents
                   </button>
                </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                   <div className="w-full h-1 bg-blue-500 animate-[scan_2s_linear_infinite]" />
                   <p className="mt-8 font-mono text-xs uppercase tracking-widest text-blue-500 animate-pulse">Digitizing Service Records...</p>
                </div>
             )}
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
            {/* Real Camera View */}
            <div className="absolute inset-0 bg-black">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover opacity-80 grayscale contrast-125"
              />
              <div className="scanner-bar" />
              {/* HUD Vignette */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(2,6,23,0.4)_100%)] pointer-events-none" />
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

              <div className="mt-auto pointer-events-auto">
                {!analyzingImage ? (
                  <button 
                    onClick={captureAndAnalyze}
                    className="w-full bg-yellow-500 text-slate-950 font-black py-6 rounded-2xl uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 mb-4"
                  >
                    <Zap className="w-5 h-5 fill-slate-950" />
                    Analyze Panel
                  </button>
                ) : (
                  <>
                    <div className="mb-4 flex justify-between items-end">
                      <div>
                        <h2 className="text-2xl font-bold uppercase tracking-tighter">Analyzing Surface</h2>
                        <p className="text-[10px] font-mono text-slate-400">Processing specular reflections...</p>
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
                  </>
                )}
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
              {valuationData?.history?.finance === "OUTSTANDING" && (
                <div className="bg-red-500 text-white p-3 rounded-2xl mb-4 flex items-center gap-3 animate-pulse">
                   <ShieldAlert className="w-5 h-5" />
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Finance Alert</p>
                      <p className="text-xs font-bold leading-tight">This vehicle has outstanding finance. Proceed with caution.</p>
                   </div>
                </div>
              )}
              {valuationData?.history?.writeOff !== "NONE" && (
                <div className="bg-orange-500 text-white p-3 rounded-2xl mb-4 flex items-center gap-3">
                   <ShieldAlert className="w-5 h-5" />
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Insurance Write-Off</p>
                      <p className="text-xs font-bold leading-tight">Recorded as {valuationData.history.writeOff}. Structural check highly recommended.</p>
                   </div>
                </div>
              )}
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
              <div className="flex items-center gap-2 mt-1">
                 <p className="text-slate-400 text-sm">{valuationData?.make} {valuationData?.model} ({valuationData?.year})</p>
                 <span className="text-slate-700">•</span>
                 <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">{vrm.toUpperCase()}</p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
              
              {/* Stitching Visualization (Vehicle Map) */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl overflow-hidden relative">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">360° Walkaround Progress</h3>
                    <span className="text-[10px] font-bold text-blue-500 uppercase">{scannedPanels.length} / 8 Panels Scanned</span>
                 </div>
                 
                 <div className="flex justify-center gap-2 relative h-16">
                    {/* Visual representation of panels */}
                    {['Front', 'Front Left', 'Left Side', 'Rear Left', 'Rear', 'Rear Right', 'Right Side', 'Front Right'].map((panel) => {
                       const isScanned = scannedPanels.some(p => p.includes(panel));
                       return (
                          <div key={panel} className="flex flex-col items-center flex-1 gap-2">
                             <div className={`w-full h-1 rounded-full transition-all duration-500 ${isScanned ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800'}`} />
                             <span className={`text-[8px] font-bold uppercase truncate w-full text-center ${isScanned ? 'text-blue-400' : 'text-slate-600'}`}>{panel}</span>
                          </div>
                       )
                    })}
                 </div>
                 
                 <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-slate-500 italic">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Scanned</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-800" /> Remaining</div>
                 </div>
              </div>

              {/* Profit/Margin Card */}
              {valuationData && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Retail Value</p>
                      <p className="text-2xl font-black">£{valuationData.retailValue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Buy Price</p>
                      <p className="text-2xl font-black text-green-500">£{(valuationData.tradeValue - totalReconCost).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Est. Profit</p>
                      <p className="font-bold text-slate-300">£{(valuationData.retailValue - valuationData.tradeValue).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Recon Impact</p>
                      <p className="font-bold text-red-500">-£{totalReconCost.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cost Summary Card */}
              <div className="bg-yellow-500 p-6 rounded-3xl text-slate-950 shadow-2xl shadow-yellow-500/20 relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1 block">Total Recon Cost</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tighter flex items-center leading-none">
                       £{totalReconCost.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs mt-2 font-medium opacity-70 italic">{reports.length} panels analyzed.</p>
                </div>
                <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-slate-950 opacity-10" />
              </div>

              {/* Damage Breakdown */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 ml-1">Cumulative Defects</h3>
                {reports.flatMap(r => r.defects).map((issue: any, i: number) => (
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

              {/* Tire Tread Detection (Dynamic) */}
              {reports.some(r => r.structural?.tireDepth) && (
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Tire Condition Report</h3>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                            <Info className="w-5 h-5 text-blue-400" />
                         </div>
                         <div>
                            <p className="text-xs font-bold">Estimated Tread Depth</p>
                            <p className="text-[10px] text-slate-500">Vision Analysis (±0.5mm)</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xl font-black text-blue-500">{reports.find(r => r.structural?.tireDepth)?.structural.tireDepth}</p>
                         <p className="text-[8px] font-bold text-green-500 uppercase tracking-tighter">Legal</p>
                      </div>
                   </div>
                </div>
              )}

              {/* Service History Summary */}
              {serviceHistory && (
                <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-2xl shadow-blue-500/20">
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Service Score</p>
                         <p className="text-3xl font-black italic">{serviceHistory.score}</p>
                      </div>
                      <div className="bg-white/20 px-3 py-1 rounded-full">
                         <p className="text-[10px] font-black uppercase tracking-widest">{serviceHistory.status}</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      {serviceHistory.records.map((rec: any, i: number) => (
                         <div key={i} className="flex justify-between items-center text-[10px] font-bold border-t border-white/10 pt-2">
                            <span className="opacity-70">{rec.date} • {rec.miles}m</span>
                            <span>{rec.type} @ {rec.dealer}</span>
                         </div>
                      ))}
                   </div>
                </div>
              )}

              {/* Recommendation Card */}
              <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl">
                <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2 italic">
                   Expert Recommendation
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {reportData?.recommendation || "Damage is primarily cosmetic. Expected time-to-recon: 3 working days. Proceed with trade-in but adjust offer by -15% for reconditioning buffer."}
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-lg shadow-blue-500/10">
                  Save to Inventory
                </button>
              </div>

              {/* Accident & History Detection (Pro Feature) */}
              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-3xl space-y-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <h3 className="text-red-400 font-bold text-xs uppercase tracking-widest">Structural Integrity Check</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl">
                       <span className="text-xs text-slate-400 font-medium">Panel Gap Alignment</span>
                       <span className={reportData?.structural?.gaps === 'OK' ? "text-green-500 text-[10px] font-black" : "text-yellow-500 text-[10px] font-black"}>
                          {reportData?.structural?.gaps || "PENDING"}
                       </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl">
                       <span className="text-xs text-slate-400 font-medium">Paint Depth Match</span>
                       <span className={reportData?.structural?.paint === 'MATCH' ? "text-green-500 text-[10px] font-black" : "text-red-500 text-[10px] font-black"}>
                          {reportData?.structural?.paint || "ANALYZING"}
                       </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl">
                       <span className="text-xs text-slate-400 font-medium">Prior Poor Repair</span>
                       <span className={reportData?.structural?.priorRepair === 'NONE' ? "text-green-500 text-[10px] font-black" : "text-red-500 text-[10px] font-black"}>
                          {reportData?.structural?.priorRepair || "READY"}
                       </span>
                    </div>
                 </div>
                 
                 {reportData?.structural?.warning && (
                    <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 mt-2">
                       <p className="text-[10px] text-red-400 font-bold leading-tight uppercase">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          {reportData.structural.warning}
                       </p>
                    </div>
                 )}
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
            <div className="absolute bottom-0 left-0 w-full p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/50 flex flex-col gap-3">
              <button 
                onClick={() => {
                   setAnalyzingImage(false);
                   setStep("scanning");
                }}
                className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 border border-slate-700"
              >
                 <Camera className="w-4 h-4" />
                 Scan Another Panel
              </button>
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
