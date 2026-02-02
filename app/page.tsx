"use client";

import Link from 'next/link';
import { Camera, ShieldCheck, FileText, Zap, ChevronRight, Star } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-yellow-500/30">
        {/* Navbar */}
        <nav className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span className="font-black italic uppercase tracking-tighter text-lg">Pocket Appraiser<span className="text-yellow-500">AI</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Log In</Link>
                    <Link href="/signup" className="bg-white text-slate-950 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-yellow-500 transition-colors">
                        Get Started
                    </Link>
                </div>
            </div>
        </nav>

        {/* Hero */}
        <header className="relative pt-20 pb-32 px-6 overflow-hidden">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
             <div className="max-w-4xl mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-6">
                    <Star className="w-3 h-3 fill-blue-400" />
                    Trusted by 500+ UK Dealers
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
                    Stop Guessing. <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Start Appraising.</span>
                </h1>
                <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                    The AI-powered pocket scanner that detects damage, checks history, and estimates reconditioning costs in seconds.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/signup" className="w-full sm:w-auto bg-yellow-500 text-slate-950 px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2">
                        Start Free Trial <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link href="#demo" className="w-full sm:w-auto bg-slate-900 border border-slate-800 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors">
                        Watch Demo
                    </Link>
                </div>
             </div>
        </header>

        {/* Features */}
        <section className="py-24 bg-slate-900/30 border-y border-slate-800/50">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Camera className="w-6 h-6 text-blue-500" />,
                            title: "AI Vision Scanner",
                            desc: "Detects scratches, dents, and panel misalignment instantly using your phone camera."
                        },
                        {
                            icon: <FileText className="w-6 h-6 text-green-500" />,
                            title: "Instant Deal Sheets",
                            desc: "Generate professional PDF appraisals with cost breakdowns to justify your offer price."
                        },
                        {
                            icon: <ShieldCheck className="w-6 h-6 text-purple-500" />,
                            title: "HPI & Finance Check",
                            desc: "Integrated background checks for outstanding finance, theft, and insurance write-offs."
                        }
                    ].map((f, i) => (
                        <div key={i} className="bg-slate-950 p-8 rounded-3xl border border-slate-800 hover:border-slate-700 transition-colors group">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* How it works */}
        <section className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">Streamline Your Forecourt</h2>
                    <p className="text-slate-400">From trade-in to retail ready in 3 simple steps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 relative">
                    <div className="absolute top-12 left-0 w-full h-0.5 bg-slate-800 hidden md:block" />
                    
                    {[
                        { step: "01", title: "Scan Vehicle", desc: "Walk around the car with our 360° AI camera." },
                        { step: "02", title: "Analyze Data", desc: "Get instant repair costs and market valuation." },
                        { step: "03", title: "Close Deal", desc: "Export professional PDF and secure the trade-in." }
                    ].map((s, i) => (
                        <div key={i} className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-slate-950 border-4 border-slate-800 rounded-full flex items-center justify-center text-2xl font-black text-slate-700 mb-6">
                                {s.step}
                            </div>
                            <h3 className="text-lg font-bold uppercase tracking-widest mb-2">{s.title}</h3>
                            <p className="text-slate-400 text-sm max-w-xs">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6">
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-yellow-500 to-orange-600 rounded-[2.5rem] p-12 text-center shadow-2xl shadow-orange-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tighter mb-6">Ready to upgrade your appraisal process?</h2>
                    <p className="text-slate-900/70 font-medium text-lg mb-8 max-w-xl mx-auto">Join the dealers saving an average of £450 per trade-in with accurate recon estimates.</p>
                    <Link href="/signup" className="inline-block bg-slate-950 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform">
                        Get Started for Free
                    </Link>
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 py-12 px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-slate-600" />
                <span className="font-black italic uppercase tracking-tighter text-lg text-slate-600">Pocket Appraiser</span>
            </div>
            <p className="text-slate-600 text-xs uppercase tracking-widest">© 2024 Pocket Appraiser AI. All rights reserved.</p>
        </footer>
    </div>
  );
}
