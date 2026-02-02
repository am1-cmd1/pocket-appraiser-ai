"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Optional: Auto login if email confirm is off, but safer to assume verify flow or just redirect
      setTimeout(() => {
          router.push('/login');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
      <Link href="/" className="mb-8 flex items-center gap-2">
         <Zap className="w-6 h-6 text-yellow-500" />
         <span className="font-black italic uppercase tracking-tighter text-xl">Pocket Appraiser<span className="text-yellow-500">AI</span></span>
      </Link>
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl">
        <h2 className="text-2xl font-black uppercase italic mb-6">Create Account</h2>
        
        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-bold">
                <AlertCircle className="w-5 h-5" />
                {error}
            </div>
        )}

        {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5" />
                Account created! Redirecting to login...
            </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-medium outline-none focus:border-yellow-500 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Password</label>
            <input 
              type="password" 
              required
              minLength={6}
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-medium outline-none focus:border-yellow-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-500 text-slate-950 font-black uppercase tracking-widest py-4 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-500 text-sm">
            Already have an account? <Link href="/login" className="text-yellow-500 font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
