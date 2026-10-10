import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f6f5ef] text-[#1a1a1a] font-sans selection:bg-yellow-300 relative overflow-x-hidden">
      {/* Background Lined Paper Effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50 z-0" 
        style={{
          backgroundImage: 'linear-gradient(#e5e4dc 1px, transparent 1px), linear-gradient(90deg, #e5e4dc 1px, transparent 1px)',
          backgroundSize: '100% 2rem, 4rem 100%',
        }}
      />
      {/* Red vertical margin line - classic notebook style */}
      <div className="absolute left-8 md:left-16 top-0 bottom-0 w-[2px] bg-red-400/30 z-0 hidden sm:block"></div>
      <div className="absolute left-9 md:left-[4.25rem] top-0 bottom-0 w-[2px] bg-red-400/30 z-0 hidden sm:block"></div>

      {/* Navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b-2 border-black/10">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-300 text-black font-kalam font-bold text-2xl px-4 py-1 border-2 border-black rounded-sm transform -rotate-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            n.
          </div>
        </div>
        <nav className="flex items-center gap-8 font-kalam text-xl">
          <Link href="#problem" className="hover:underline decoration-2 underline-offset-4 hidden sm:block">The Problem</Link>
          <Link href="#product" className="hover:underline decoration-2 underline-offset-4 hidden sm:block">The Product</Link>
          <Link href="/login" className="bg-black text-white px-5 py-1.5 rounded-sm border-2 border-black hover:bg-yellow-300 hover:text-black transition-colors transform rotate-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Log in
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <p className="text-xs font-bold text-red-500 tracking-widest uppercase mb-6 font-mono bg-white/50 inline-block px-2">
              PLATFORM #001 · AI RECRUITMENT
            </p>
            <h1 className="text-6xl md:text-8xl font-kalam font-bold leading-[0.95] tracking-tight mb-8">
              AI-Powered <br/>
              <span className="relative inline-block mt-2">
                <span className="absolute inset-0 bg-[#fcec6a] transform -rotate-2 rounded-sm scale-110 -z-10 shadow-sm"></span>
                <span className="relative z-10">College Placement.</span>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl mb-10 max-w-md font-medium text-gray-800 leading-relaxed bg-white/40 p-2 rounded">
              Modernizing the campus recruitment lifecycle with intelligent resume parsing, automated matchmaking, and real-time AI voice screening. No hidden biases.
            </p>

            <div className="flex flex-wrap gap-5 items-center">
              <Link href="/dashboard/student/profile">
                <button className="bg-black text-white px-8 py-3.5 font-kalam text-2xl rounded-sm border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#fcec6a] transition-all flex items-center gap-2 transform -rotate-1">
                  Enter as Student &rarr;
                </button>
              </Link>
              <Link href="/dashboard/recruiter/candidates">
                <button className="bg-pink-200 text-black px-8 py-3.5 font-kalam text-2xl rounded-sm border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 transform rotate-2">
                  Enter as Recruiter 🏢
                </button>
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-8 font-kalam text-xl">
              Stuck for a career? Give them an AI interview and a real-time evaluation. See who already got one.
            </p>

            {/* Checkmarks */}
            <div className="flex gap-4 mt-8 text-xs font-bold text-[#b4a925] font-mono flex-wrap bg-white/60 p-2 border border-dashed border-[#b4a925]/30">
              <span>✓ 0 BIAS</span>
              <span>✓ REAL-TIME</span>
              <span>✓ FITS EVERYONE</span>
              <span>✓ NO GHOSTING</span>
            </div>
            
            <div className="mt-16 flex items-center gap-2 text-gray-600 font-kalam text-2xl animate-bounce">
              <svg className="w-8 h-8 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              <span>Scroll. It gets better.</span>
            </div>
          </div>

          {/* Right: Graphic */}
          <div className="relative mt-12 lg:mt-0">
            <div className="bg-[#fffef7] border-2 border-black p-6 md:p-8 rounded-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] transform rotate-2 max-w-lg mx-auto">
              <div className="border-2 border-dashed border-gray-300 p-4 md:p-6 relative bg-white">
                
                {/* Yellow seal */}
                <div className="absolute -top-8 -right-8 bg-[#fcec6a] w-20 h-20 rounded-full border-2 border-black flex items-center justify-center font-bold text-3xl font-kalam shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-12 z-10">
                  A+
                </div>

                <div className="flex justify-between items-start mb-8">
                  <p className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-gray-500">PLACEDONPURPOSE.COM</p>
                  <p className="text-[10px] md:text-xs font-mono font-bold bg-yellow-200 px-1">NP-00001</p>
                </div>

                <div className="flex gap-4 md:gap-6 items-center mb-8">
                  <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-black rounded-sm flex items-center justify-center bg-gray-50 transform -rotate-3">
                    <span className="text-4xl md:text-5xl">🤖</span>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-wide">Certificate of Placement</p>
                    <h3 className="font-kalam text-4xl md:text-5xl font-bold mt-1">Your Name Here</h3>
                    <p className="text-sm font-medium text-gray-600 font-kalam text-xl">Certified Top Candidate</p>
                  </div>
                </div>

                <div className="flex gap-8 text-[10px] md:text-xs font-mono mb-8 border-y-2 border-dashed border-gray-200 py-3 bg-[#faf9f0]">
                  <div>
                    <span className="text-gray-400">PAID</span><br/>
                    <strong className="text-sm">$0</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">ISSUED</span><br/>
                    <strong className="text-sm">10 OCT 2026</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">EXPIRES</span><br/>
                    <strong className="text-sm">NEVER</strong>
                  </div>
                </div>

                <p className="text-xs font-mono text-gray-600 mb-6 leading-relaxed bg-white">
                  Received, as promised, a fair and unbiased AI interview. No ghosting, no hidden bias, absolute transparency.
                </p>

                <div className="font-mono text-[9px] md:text-[10px] text-gray-400 break-all bg-gray-50 p-2 border border-gray-100">
                  &gt; NP-00001&gt;YOUR-NAME-HERE&gt;<br/>
                  &gt; PAID&gt;0&gt;ISSUED&gt;10OCT26&gt;RECEIVED&gt;PLACEMENT&gt;&lt;&lt;&lt;
                </div>

                <div className="absolute -bottom-5 left-6 bg-[#bde0fe] border-2 border-black px-4 py-1 font-kalam text-lg transform -rotate-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  skills matter
                </div>

              </div>
            </div>
            <p className="text-center mt-10 font-kalam text-gray-600 text-xl">
              Yours comes with your name on it. Shown at actual size.
            </p>
          </div>
        </div>
      </main>

      {/* Banner */}
      <div className="border-y-2 border-black bg-[#f6f5ef] relative z-10 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap justify-between items-center font-mono text-sm font-bold bg-[#f6f5ef]">
          <div className="flex items-center gap-3">
            <span className="bg-[#a2d2ff] px-2 py-1 border border-black rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">1,234</span>
            <span className="tracking-wide">certificates of placement issued</span>
          </div>
          <div className="text-yellow-600 mt-2 sm:mt-0 tracking-wide">
            <span className="bg-[#fcec6a] text-black px-3 py-1 border border-black rounded-sm mr-3 transform -rotate-2 inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-base">JOB-00001B</span>
            is still available
          </div>
        </div>
      </div>

      {/* The Problem */}
      <section id="problem" className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32">
        <p className="text-xs font-bold text-red-500 tracking-widest uppercase mb-6 font-mono inline-block bg-white/50 px-2">
          The Problem
        </p>
        <h2 className="text-5xl md:text-7xl font-kalam font-bold mb-16 leading-[1.1]">
          You already have <span className="relative inline-block"><span className="absolute inset-0 bg-[#fcec6a] transform rotate-1 rounded-sm -z-10 scale-105 shadow-sm"></span><span className="relative z-10">enough stress.</span></span>
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white border-2 border-black p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 hover:rotate-0 transition-transform">
            <h3 className="text-6xl font-kalam mb-6">:)</h3>
            <p className="font-bold text-lg mb-2 font-mono">Interviews arrive.</p>
            <p className="text-gray-600 font-mono">Exciting!</p>
          </div>
          <div className="bg-white border-2 border-black p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform rotate-1 hover:rotate-0 transition-transform">
            <h3 className="text-6xl font-kalam mb-6">:/</h3>
            <p className="font-bold text-lg mb-2 font-mono">Scheduling conflicts.</p>
            <p className="text-gray-600 font-mono">Less exciting.</p>
          </div>
          <div className="bg-white border-2 border-black p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 hover:rotate-0 transition-transform">
            <h3 className="text-6xl font-kalam mb-6">:(</h3>
            <p className="font-bold text-lg mb-2 font-mono">Ghosted by recruiters.</p>
            <p className="text-gray-600 font-mono">Predictable.</p>
          </div>
        </div>

        <div className="text-center relative max-w-2xl mx-auto">
          <h3 className="text-5xl md:text-6xl font-kalam font-bold leading-tight">
            So we removed the bias.
          </h3>
          <div className="absolute -right-4 md:-right-24 top-16 md:top-0 bg-pink-200 border-2 border-black p-4 font-kalam text-xl transform rotate-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-[220px]">
            and kept the fair evaluation, which is the fun part!
          </div>
        </div>
      </section>

      {/* The Product */}
      <section id="product" className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32">
        <p className="text-xs font-bold text-red-500 tracking-widest uppercase mb-6 font-mono inline-block bg-white/50 px-2">
          The Product
        </p>
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div>
            <h2 className="text-5xl md:text-7xl font-kalam font-bold mb-10 leading-[1.1]">
              Introducing <br/>
              <span className="relative inline-block mt-2"><span className="absolute inset-0 bg-[#fcec6a] transform -rotate-2 rounded-sm -z-10 scale-105 shadow-sm"></span><span className="relative z-10">AI Voice Screen.</span></span>
            </h2>
            <p className="text-xl font-medium text-gray-800 leading-relaxed mb-12 bg-white/40 p-2 rounded">
              Designed without human bias. Built by experts. Compatible with everything you already know, because it's just a conversation.
            </p>
            
            <div className="border-2 border-dashed border-black p-8 relative bg-white/80 backdrop-blur-sm transform rotate-1">
              <h4 className="font-kalam text-3xl font-bold mb-4 flex items-center gap-3">
                <span className="text-gray-400 font-mono">\O/</span> What's in the box?
              </h4>
              <p className="font-mono text-sm text-gray-600 ml-12 leading-relaxed">
                No scheduling. No wait times. No ghosting. There is also no box.
              </p>
            </div>
          </div>
          
          <div className="relative mt-12 md:mt-0">
            <div className="absolute -top-8 -right-8 bg-[#e15b58] text-white font-bold p-5 rounded-full font-kalam text-xl transform rotate-12 z-20 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] leading-none text-center">
              certified<br/>fair
            </div>
            <div className="bg-[#fffef7] border-2 border-black p-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] transform -rotate-1">
              <div className="border border-[#e15b58]/30 p-8 bg-white">
                <h4 className="text-[#e15b58] font-mono text-xs font-bold tracking-widest mb-8 border-b border-[#e15b58]/20 pb-2">TECHNICAL SPECIFICATION</h4>
                <div className="space-y-5 font-mono text-sm">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">LATENCY</span>
                    <strong>&lt; 500ms</strong>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">VOICE</span>
                    <strong>Ultra-realistic</strong>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">BIAS</span>
                    <strong>0%</strong>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">AVAILABILITY</span>
                    <strong>24/7*</strong>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">FEEDBACK</span>
                    <strong>Instant</strong>
                  </div>
                  <div className="flex justify-between pb-2 mt-4">
                    <span className="text-gray-500">WARRANTY</span>
                    <span className="font-kalam text-2xl font-bold">AI never sleeps</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-6">*Technically.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t-2 border-black bg-[#f6f5ef] py-16 text-center mt-12">
        <div className="font-mono text-xs text-gray-500 flex flex-col items-center gap-6">
          <p className="text-sm">
            O ♥<br/>
            /|\<br/>
            /\
          </p>
          <p className="text-3xl font-kalam text-black mt-6 font-bold">
            You came here for <span className="bg-[#fcec6a] px-3 py-1 rounded-sm transform rotate-1 inline-block shadow-sm">placements.</span>
          </p>
          <p className="text-base mb-8 max-w-md mx-auto">For once, the internet can deliver exactly what it promised.</p>
          
          <Link href="/register">
            <button className="bg-black text-white px-8 py-3 font-kalam text-2xl rounded-sm border-2 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#fcec6a] transition-all transform -rotate-1">
              Join the platform &rarr;
            </button>
          </Link>
          
          <div className="flex gap-8 mt-16 justify-center border-t border-gray-300 w-full max-w-4xl pt-8 mx-auto flex-wrap text-sm">
            <span>© 2026. All rights reserved.</span>
            <span className="text-[#e15b58] underline decoration-dashed hover:text-black transition-colors cursor-pointer">airecruitment.com</span>
            <span>Created with care by Amaan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
