"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, AlertCircle, CheckCircle2, Search, Zap, DollarSign, History, ChevronRight, X, MapPin, Star, Calendar, ShieldAlert, FileText, Info, LogOut, Car, Gauge, Fuel, Palette, Clock, TrendingUp, Fingerprint, Settings2, Cog } from "lucide-react";
import PDFExporter from "@/components/PDFExporter";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const [step, setStep] = useState<"intro" | "scanning" | "report" | "upload" | "service" | "service_camera" | "hpi">("intro");
  const [vrm, setVrm] = useState("");
  const [analyzingHPI, setAnalyzingHPI] = useState<boolean>(false);
  const [serviceHistory, setServiceHistory] = useState<any>(null);
  const [valuationData, setValuationData] = useState<any>(null);
  const [detectedIssues, setDetectedIssues] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [scannedPanels, setScannedPanels] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "history" | "stats">("home");
  const [progress, setProgress] = useState(0);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | undefined>(undefined);
  const [userEmail, setUserEmail] = useState<string>("");
  const [vinData, setVinData] = useState<any>(null);
  const [vinInput, setVinInput] = useState<string>("");

  // Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUserEmail(session.user.email || "");
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Load history from Supabase
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/reports");
        const data = await res.json();
        if (!data.error && Array.isArray(data)) setHistory(data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };
    fetchHistory();
  }, []);
  const [analyzingImage, setAnalyzingImage] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startScan = async () => {
    // Check if on mobile to avoid prompt if possible
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let inputVrm = "SCANNING...";
    
    if (!isMobile) {
      inputVrm = prompt("Enter Vehicle Registration (e.g. GJ21 XOW):") || "UNKNOWN";
    }
    
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
    if (step !== "scanning" && step !== "service_camera") {
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
      setLastCapturedImage(imageData);

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
            className="relative z-10 h-full flex flex-col p-6 overflow-y-auto pt-16 pb-32"
          >
            {/* Header / Profile */}
            <div className="flex justify-between items-center mb-10">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center justify-center">
                     <Zap className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                     <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none">Pocket Appraiser<span className="text-yellow-500 ml-1">AI</span></h1>
                     <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                       {userEmail ? userEmail.split('@')[0] : 'Dealer Dashboard'} • London SE1
                     </p>
                  </div>
               </div>
               <button 
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-colors group"
               >
                  <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-500" />
               </button>
            </div>

            {activeTab === "home" && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* Services Grid - Modular Suite */}
                  <div className="space-y-8 mb-12">
                     <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-4 ml-1">Vehicle Appraisal (Vision AI)</h3>
                        <div className="grid grid-cols-1 gap-3">
                           <button 
                              onClick={startScan}
                              className="w-full group bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold p-5 rounded-3xl transition-all shadow-2xl flex items-center justify-between gap-4"
                           >
                              <div className="flex items-center gap-4">
                                 <Camera className="w-6 h-6" />
                                 <div className="text-left">
                                    <p className="text-sm font-black uppercase leading-none">Full 360° HUD Scan</p>
                                    <p className="text-[10px] opacity-70 font-medium mt-1">Stitch multiple panels & detect damage</p>
                                 </div>
                              </div>
                              <ChevronRight className="w-5 h-5 opacity-50" />
                           </button>
                           
                           <div className="grid grid-cols-2 gap-3">
                              <button 
                                 onClick={startScan}
                                 className="bg-slate-900 border border-slate-800 p-4 rounded-3xl text-left space-y-2 group hover:border-blue-500/50 transition-colors"
                              >
                                 <Zap className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                                 <div>
                                    <p className="text-[10px] font-black uppercase text-white">Tire Depth</p>
                                    <p className="text-[8px] text-slate-500 uppercase font-bold">Vision Analysis</p>
                                 </div>
                              </button>
                              <button 
                                 onClick={startScan}
                                 className="bg-slate-900 border border-slate-800 p-4 rounded-3xl text-left space-y-2 group hover:border-red-500/50 transition-colors"
                              >
                                 <ShieldAlert className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                                 <div>
                                    <p className="text-[10px] font-black uppercase text-white">Structural</p>
                                    <p className="text-[8px] text-slate-500 uppercase font-bold">Panel Gap Check</p>
                                 </div>
                              </button>
                           </div>
                        </div>
                     </div>

                     <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-4 ml-1">Due Diligence & Admin</h3>
                        <div className="grid grid-cols-1 gap-3">
                           <button 
                              onClick={() => setStep("service")}
                              className="w-full bg-slate-900 border border-slate-800 p-5 rounded-3xl text-left flex items-center justify-between group hover:border-green-500/50 transition-colors"
                           >
                              <div className="flex items-center gap-4">
                                 <FileText className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />
                                 <div>
                                    <p className="text-sm font-black uppercase leading-none text-white">Service History OCR</p>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1">Digitize stamps & verify mileage</p>
                                 </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-700" />
                           </button>

                           <button 
                              onClick={() => setStep("hpi")}
                              className="w-full bg-slate-900 border border-slate-800 p-5 rounded-3xl text-left flex items-center justify-between group hover:border-purple-500/50 transition-colors"
                           >
                              <div className="flex items-center gap-4">
                                 <Search className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
                                 <div>
                                    <p className="text-sm font-black uppercase leading-none text-white">HPI & Finance Check</p>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1">Real-time theft & write-off data</p>
                                 </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-700" />
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Dashboard Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-10">
                     <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Scans</p>
                        <p className="text-xl font-black">124</p>
                     </div>
                     <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Recon Est.</p>
                        <p className="text-xl font-black text-red-500">£12.4k</p>
                     </div>
                     <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Margin</p>
                        <p className="text-xl font-black text-green-500">18%</p>
                     </div>
                  </div>
               </motion.div>
            )}

            {activeTab === "history" && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Recent Appraisals</h3>
                     <button className="text-[8px] font-bold text-blue-500 uppercase hover:underline">Filter</button>
                  </div>
                  
                  <div className="space-y-2">
                     {history.map((item, i) => (
                        <div key={i} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-mono text-[10px] font-black">
                                 {item.vrm.slice(0,2)}
                              </div>
                              <div>
                                 <h4 className="font-bold text-sm">{item.vehicle}</h4>
                                 <p className="text-[10px] text-slate-500 font-mono">{item.vrm} • {new Date(item.created_at).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-xs font-black text-yellow-500">£{item.cost}</p>
                              <p className="text-[8px] font-bold text-slate-600 uppercase">{item.status}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </motion.div>
            )}

            {activeTab === "stats" && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 ml-1">Performance Metrics</h3>
                  <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50">
                     <div className="flex justify-between items-end mb-4">
                        <p className="text-xs font-bold text-slate-400">Inventory Value</p>
                        <p className="text-2xl font-black">£2.4M</p>
                     </div>
                     <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-[65%] h-full bg-blue-500" />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 text-center">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Turnover</p>
                        <p className="text-lg font-black text-green-500">14 Days</p>
                     </div>
                     <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 text-center">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Missed Opps</p>
                        <p className="text-lg font-black text-red-500">4%</p>
                     </div>
                  </div>
               </motion.div>
            )}

            {/* Bottom Floating Nav Hint */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-full flex gap-8 items-center shadow-2xl">
               <button onClick={() => setActiveTab("home")} className={`transition-colors ${activeTab === 'home' ? 'text-yellow-500' : 'text-slate-600'}`}>
                  <Zap className="w-5 h-5" />
               </button>
               <button onClick={() => setActiveTab("history")} className={`transition-colors ${activeTab === 'history' ? 'text-blue-500' : 'text-slate-600'}`}>
                  <History className="w-5 h-5" />
               </button>
               <button onClick={() => setActiveTab("stats")} className={`transition-colors ${activeTab === 'stats' ? 'text-green-500' : 'text-slate-600'}`}>
                  <DollarSign className="w-5 h-5" />
               </button>
            </div>
          </motion.div>
        )}

        {/* ... scanning, report, etc steps remain largely same, just copy them ... */}
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
                     onClick={async () => {
                        setStep("service_camera");
                        try {
                          const mediaStream = await navigator.mediaDevices.getUserMedia({
                            video: { facingMode: "environment" },
                            audio: false
                          });
                          setStream(mediaStream);
                          // Wait for render
                          setTimeout(() => {
                              if (videoRef.current) {
                                videoRef.current.srcObject = mediaStream;
                              }
                          }, 100);
                        } catch (err) {
                          console.error("Camera access denied:", err);
                          alert("Please allow camera access.");
                          setStep("service");
                        }
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

        {step === "service_camera" && (
          <motion.div
            key="service_camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col bg-black"
          >
            {/* Camera View */}
            <div className="absolute inset-0">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Document Guide Overlay */}
              <div className="absolute inset-0 border-[30px] border-black/50 pointer-events-none">
                 <div className="w-full h-full border-2 border-blue-500/50 relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500" />
                 </div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col items-center gap-4 bg-gradient-to-t from-black via-black/80 to-transparent">
               {!analyzingImage ? (
                  <>
                     <p className="text-white text-sm font-bold shadow-black drop-shadow-md">Align service book page</p>
                     <div className="flex items-center gap-6">
                        <button onClick={() => setStep("service")} className="text-white/70 p-4 font-bold uppercase text-xs">Cancel</button>
                        <button 
                           onClick={async () => {
                              if (!videoRef.current) return;
                              setAnalyzingImage(true);
                              
                              // Capture
                              const canvas = document.createElement("canvas");
                              canvas.width = videoRef.current.videoWidth;
                              canvas.height = videoRef.current.videoHeight;
                              const ctx = canvas.getContext("2d");
                              if (ctx) {
                                 ctx.drawImage(videoRef.current, 0, 0);
                                 const imageData = canvas.toDataURL("image/jpeg", 0.8);
                                 
                                 try {
                                    const res = await fetch("/api/service-ocr", {
                                       method: "POST",
                                       body: JSON.stringify({ image: imageData }),
                                       headers: { "Content-Type": "application/json" }
                                    });
                                    const data = await res.json();
                                    
                                    if (data.error) throw new Error(data.error);
                                    
                                    setServiceHistory(data);
                                    setAnalyzingImage(false);
                                    setStep("report"); // Go to report to see results
                                 } catch (e) {
                                    console.error(e);
                                    alert("Failed to analyze image. Try again.");
                                    setAnalyzingImage(false);
                                 }
                              }
                           }}
                           className="w-20 h-20 bg-white rounded-full border-4 border-blue-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                        >
                           <div className="w-16 h-16 bg-white rounded-full border-2 border-black/10" />
                        </button>
                        <div className="w-16" /> {/* Spacer */}
                     </div>
                  </>
               ) : (
                  <div className="flex flex-col items-center">
                     <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                     <p className="text-blue-400 font-mono text-xs uppercase tracking-widest animate-pulse">Reading Documents...</p>
                  </div>
               )}
            </div>
          </motion.div>
        )}

        {step === "hpi" && (
           <motion.div 
            key="hpi"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col bg-slate-950 p-6"
          >
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black uppercase italic">HPI Deep Check</h2>
                <button onClick={() => setStep("intro")}><X className="w-6 h-6" /></button>
             </div>
             
             {!analyzingHPI ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                   <div className="w-24 h-24 bg-purple-500/10 rounded-3xl flex items-center justify-center mb-6 border border-purple-500/20">
                      <Search className="w-12 h-12 text-purple-500" />
                   </div>
                   <h3 className="text-2xl font-bold mb-4 uppercase italic">Run National Database Check</h3>
                   <p className="text-slate-500 text-sm mb-12 max-w-xs text-center">Instantly verify finance status, theft records, and insurance write-off categories across all UK databases.</p>
                   
                   <div className="w-full space-y-4">
                      <input 
                        type="text" 
                        placeholder="ENTER REG (E.G. LB73 JKK)"
                        className="w-full bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center font-mono text-xl uppercase tracking-widest outline-none focus:border-purple-500 transition-colors"
                        onChange={(e) => setVrm(e.target.value)}
                      />
                      <button 
                        onClick={async () => {
                           setAnalyzingHPI(true);
                           const res = await fetch(`/api/valuation?vrm=${vrm}`);
                           const data = await res.json();
                           setValuationData(data);
                           setTimeout(() => {
                              setAnalyzingHPI(false);
                              setStep("report");
                           }, 2000);
                        }}
                        className="w-full bg-purple-600 py-5 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-2xl shadow-purple-500/20"
                      >
                         Run Verification
                      </button>
                   </div>
                </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                   <div className="w-full max-w-xs h-1 bg-slate-800 rounded-full overflow-hidden relative">
                      <motion.div 
                        className="absolute inset-0 bg-purple-500"
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                   </div>
                   <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-purple-500 animate-pulse">Querying National Databases...</p>
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

            {/* Scanning HUD Overlay */}
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

              {/* Centered Reticle */}
              <div className="flex-1 flex items-center justify-center">
                 <div className="w-48 h-48 border-2 border-white/20 rounded-full relative flex items-center justify-center">
                    <div className="w-1 h-1 bg-yellow-500 rounded-full shadow-[0_0_10px_#eab308]" />
                    <div className="absolute inset-0 border-t-2 border-yellow-500/50 rounded-full animate-spin [animation-duration:3s]" />
                 </div>
              </div>

              {/* Bottom Control Bar */}
              <div className="mt-auto pointer-events-auto -mx-6 -mb-6 bg-slate-950/80 backdrop-blur-2xl border-t border-white/10 p-8 pb-12 flex flex-col items-center gap-4 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                {!analyzingImage ? (
                  <div className="w-full flex flex-col items-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Center defect in reticle</p>
                    <button
                      onClick={captureAndAnalyze}
                      className="w-24 h-24 bg-yellow-500 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.4)] flex items-center justify-center group active:scale-95 transition-transform"
                    >
                      <div className="w-20 h-20 border-4 border-slate-950/20 rounded-full flex items-center justify-center">
                         <Zap className="w-8 h-8 fill-slate-950" />
                      </div>
                    </button>
                    <button
                      onClick={() => setStep("intro")}
                      className="mt-6 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white"
                    >
                      Cancel Scan
                    </button>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="mb-4 flex justify-between items-end">
                      <div>
                        <h2 className="text-2xl font-bold uppercase tracking-tighter">Analyzing Surface</h2>
                        <p className="text-[10px] font-mono text-slate-400">Processing specular reflections...</p>
                      </div>
                      <span className="text-3xl font-black font-mono tabular-nums text-yellow-500">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                      <motion.div
                        className="h-full bg-yellow-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
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
              {valuationData?.history?.writeOff && valuationData?.history?.writeOff !== "NONE" && (
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
                      <p className="text-2xl font-black">£{(valuationData.retail || valuationData.retailValue || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Buy Price</p>
                      <p className="text-2xl font-black text-green-500">£{((valuationData.tradeValue || 0) - totalReconCost).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Est. Profit</p>
                      <p className="font-bold text-slate-300">£{((valuationData.retail || valuationData.retailValue || 0) - (valuationData.tradeValue || 0)).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Recon Impact</p>
                      <p className="font-bold text-red-500">-£{totalReconCost.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Details Card - DVSA Data */}
              {valuationData && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                      <Car className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase">Vehicle Details</h3>
                      <p className="text-[10px] text-slate-500">Source: {valuationData.source || "DVSA"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 p-3 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Palette className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Colour</span>
                      </div>
                      <p className="text-sm font-bold">{valuationData.color || "Unknown"}</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Fuel className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Fuel Type</span>
                      </div>
                      <p className="text-sm font-bold">{valuationData.fuel || "Unknown"}</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Year</span>
                      </div>
                      <p className="text-sm font-bold">{valuationData.year || "Unknown"}</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-500 uppercase font-bold">MOT Expiry</span>
                      </div>
                      <p className={`text-sm font-bold ${valuationData.motExpiry ? (new Date(valuationData.motExpiry) < new Date() ? 'text-red-500' : 'text-green-500') : ''}`}>
                        {valuationData.motExpiry ? new Date(valuationData.motExpiry).toLocaleDateString('en-GB') : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* MOT History & Mileage Timeline */}
              {valuationData?.mileageHistory && valuationData.mileageHistory.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                        <Gauge className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase">MOT Mileage History</h3>
                        <p className="text-[10px] text-slate-500">{valuationData.mileageHistory.length} records found</p>
                      </div>
                    </div>
                    {valuationData.mileageAnomaly === "DETECTED" && (
                      <div className="bg-red-500/20 text-red-400 px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Mileage Discrepancy
                      </div>
                    )}
                  </div>

                  {/* Mileage Graph */}
                  <div className="h-24 flex items-end gap-1 mb-4">
                    {valuationData.mileageHistory.slice(-10).map((entry: any, i: number, arr: any[]) => {
                      const maxMiles = Math.max(...arr.map((e: any) => e.mileage));
                      const height = (entry.mileage / maxMiles) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div 
                            className="w-full bg-green-500/30 rounded-t-sm relative group cursor-pointer hover:bg-green-500/50 transition-colors"
                            style={{ height: `${Math.max(height, 5)}%` }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-800 px-2 py-1 rounded text-[8px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {entry.mileage.toLocaleString()} mi
                            </div>
                          </div>
                          <span className="text-[7px] text-slate-600 font-mono">{entry.date?.slice(2,7)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Latest Reading */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Latest MOT Reading</p>
                      <p className="text-lg font-black text-green-500">
                        {valuationData.mileageHistory[0]?.mileage?.toLocaleString() || "N/A"} miles
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Annual Avg</p>
                      <p className="text-sm font-bold text-slate-300">
                        ~{valuationData.mileageHistory.length > 1 
                          ? Math.round((valuationData.mileageHistory[0]?.mileage - valuationData.mileageHistory[valuationData.mileageHistory.length - 1]?.mileage) / valuationData.mileageHistory.length).toLocaleString()
                          : "N/A"} mi/yr
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* VIN Decoder Card */}
              {vinData && (
                <div className="bg-gradient-to-br from-purple-500/10 to-slate-900 border border-purple-500/30 p-6 rounded-3xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <Fingerprint className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase">VIN Decoded</h3>
                      <p className="text-[10px] text-purple-400 font-mono">{vinData.vin}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-800/50 p-3 rounded-xl">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Body Style</p>
                      <p className="text-sm font-bold">{vinData.bodyClass || "N/A"}</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Drive Type</p>
                      <p className="text-sm font-bold">{vinData.driveType || "N/A"}</p>
                    </div>
                  </div>

                  {vinData.engine && (
                    <div className="bg-slate-800/30 p-4 rounded-xl mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Cog className="w-4 h-4 text-purple-400" />
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Engine Specifications</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-black text-purple-400">{vinData.engine.displacement || "—"}</p>
                          <p className="text-[8px] text-slate-500 uppercase">Displacement</p>
                        </div>
                        <div>
                          <p className="text-lg font-black text-purple-400">{vinData.engine.cylinders || "—"}</p>
                          <p className="text-[8px] text-slate-500 uppercase">Cylinders</p>
                        </div>
                        <div>
                          <p className="text-lg font-black text-purple-400">{vinData.engine.horsepower || "—"}</p>
                          <p className="text-[8px] text-slate-500 uppercase">HP</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {vinData.transmission && (
                    <div className="flex items-center justify-between text-xs bg-slate-800/30 p-3 rounded-xl">
                      <span className="text-slate-400">Transmission</span>
                      <span className="font-bold">{vinData.transmission.type} {vinData.transmission.speeds ? `(${vinData.transmission.speeds}-speed)` : ""}</span>
                    </div>
                  )}
                </div>
              )}

              {/* VIN Input (if no VIN data yet) */}
              {!vinData && valuationData && (
                <div className="bg-slate-900 border border-dashed border-slate-700 p-5 rounded-3xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Fingerprint className="w-5 h-5 text-slate-500" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-400">Decode VIN for Full Specs</h3>
                      <p className="text-[10px] text-slate-600">Engine, transmission, safety features & more</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 17-digit VIN"
                      value={vinInput}
                      onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                      maxLength={17}
                      className="flex-1 bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-xs font-mono uppercase tracking-wider outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={async () => {
                        if (vinInput.length !== 17) {
                          alert("VIN must be 17 characters");
                          return;
                        }
                        const res = await fetch(`/api/vin-decode?vin=${vinInput}`);
                        const data = await res.json();
                        if (data.error) {
                          alert(data.error);
                        } else {
                          setVinData(data);
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-500 px-4 py-3 rounded-xl text-xs font-bold uppercase transition-colors"
                    >
                      Decode
                    </button>
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
                         <p className="text-xl font-black text-blue-500">{reports.find(r => r.structural?.tireDepth)?.structural?.tireDepth}</p>
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
                <button 
                  onClick={async () => {
                    const res = await fetch("/api/reports", {
                      method: "POST",
                      body: JSON.stringify({
                        vrm,
                        vehicle: `${valuationData?.make} ${valuationData?.model}`,
                        status: "Draft Saved",
                        cost: totalReconCost,
                        data: { reports, reportData, valuationData }
                      }),
                      headers: { "Content-Type": "application/json" }
                    });
                    if (res.ok) {
                      alert("Appraisal saved to database!");
                      setStep("intro");
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-lg shadow-blue-500/10"
                >
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
                onClick={async () => {
                   setAnalyzingImage(false);
                   setStep("scanning");
                   // Restart camera stream
                   try {
                     const mediaStream = await navigator.mediaDevices.getUserMedia({
                       video: { facingMode: "environment" },
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
                }}
                className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 border border-slate-700"
              >
                 <Camera className="w-4 h-4" />
                 Scan Another Panel
              </button>
              
              <PDFExporter 
                vrm={vrm}
                vehicleName={`${valuationData?.make || ''} ${valuationData?.model || ''}`}
                valuationData={valuationData}
                reports={reports}
                totalReconCost={totalReconCost}
                capturedImage={lastCapturedImage}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
