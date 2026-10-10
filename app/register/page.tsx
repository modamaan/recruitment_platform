"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "recruiter">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (authError) {
        setError(authError.message || "Failed to create account");
        setLoading(false);
        return;
      }

      const { data: tokenData } = await authClient.token();
      const token = tokenData?.token;
      
      if (!token) throw new Error("Failed to retrieve authentication token");
      localStorage.setItem("authToken", token); // Save token for future API requests

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, role }),
      });

      if (!res.ok) throw new Error("Failed to save profile to database");

      router.refresh();
      router.push(`/dashboard/${role}`); 
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f5ef] text-[#1a1a1a] font-sans selection:bg-yellow-300 relative flex items-center justify-center p-6 py-12">
      {/* Background Lined Paper Effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50 z-0" 
        style={{
          backgroundImage: 'linear-gradient(#e5e4dc 1px, transparent 1px), linear-gradient(90deg, #e5e4dc 1px, transparent 1px)',
          backgroundSize: '100% 2rem, 4rem 100%',
        }}
      />
      <div className="absolute left-8 md:left-16 top-0 bottom-0 w-[2px] bg-red-400/30 z-0 hidden sm:block"></div>
      
      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-block mb-8">
          <div className="bg-[#fcec6a] text-black font-kalam font-bold text-xl px-4 py-1 border-2 border-black rounded-sm transform -rotate-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
            &larr; Back to start
          </div>
        </Link>
        
        <div className="bg-[#fffef7] border-2 border-black p-8 rounded-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
          <h2 className="text-5xl font-kalam font-bold mb-2">
            Create account
          </h2>
          <p className="font-mono text-sm text-gray-500 mb-8 uppercase tracking-widest border-b-2 border-dashed border-gray-200 pb-4">
            Join the AI platform today
          </p>

          {error && (
            <div className="bg-red-50 border-2 border-[#e15b58] p-3 mb-6 font-mono text-xs text-[#e15b58] transform rotate-1 shadow-sm font-bold">
              &gt; ERROR: {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="mb-6">
              <label className="block font-kalam text-2xl mb-3">I am a...</label>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setRole("student")}
                  className={`flex-1 py-3 text-lg font-kalam font-bold rounded-sm border-2 border-black transition-all transform ${role === 'student' ? 'bg-[#fcec6a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1 rotate-1' : 'bg-white hover:bg-gray-50'}`}
                >
                  Student
                </button>
                <button 
                  type="button" 
                  onClick={() => setRole("recruiter")}
                  className={`flex-1 py-3 text-lg font-kalam font-bold rounded-sm border-2 border-black transition-all transform ${role === 'recruiter' ? 'bg-[#fcec6a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1 -rotate-1' : 'bg-white hover:bg-gray-50'}`}
                >
                  Recruiter
                </button>
              </div>
            </div>

            <div>
              <label className="block font-kalam text-2xl mb-1" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="w-full border-2 border-black p-3 bg-white font-mono text-sm focus:outline-none shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.05)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform focus:-translate-y-1"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-kalam text-2xl mb-1" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="w-full border-2 border-black p-3 bg-white font-mono text-sm focus:outline-none shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.05)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform focus:-translate-y-1"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-kalam text-2xl mb-1" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="w-full border-2 border-black p-3 bg-white font-mono text-sm focus:outline-none shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.05)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all transform focus:-translate-y-1"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white font-kalam text-2xl py-3 border-2 border-black rounded-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#fcec6a] transition-all flex items-center justify-center mt-8 transform -rotate-1"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : "Sign Up →"}
            </button>
          </form>

          <div className="mt-8 text-center font-mono text-xs bg-gray-50 p-3 border border-dashed border-gray-300">
            <span className="text-gray-500">Already have an account? </span>
            <Link href="/login" className="font-bold underline decoration-2 decoration-[#fcec6a] hover:bg-[#fcec6a] transition-colors px-1">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
