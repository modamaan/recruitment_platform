"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Code2,
  Mic,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Cpu,
  Video,
  ArrowRight,
  Eye,
  Scale,
  Award,
  Terminal,
  ChevronRight,
  UserCheck,
  Camera,
  Layers,
  HelpCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StageInfo {
  id: number;
  stageNumber: string;
  tag: string;
  title: string;
  shortDesc: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  icon: any;
  duration: string;
  weight: string;
  highlights: string[];
  simulationData: {
    badge: string;
    headline: string;
    subtext: string;
    interactiveSnippet: React.ReactNode;
  };
}

export function InterviewWorkflowSection() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [selectedMcqOption, setSelectedMcqOption] = useState<number | null>(1);
  const [cameraProctorState, setCameraProctorState] = useState<"ok" | "warning">("ok");

  const stages: StageInfo[] = [
    {
      id: 0,
      stageNumber: "STAGE 00",
      tag: "PRE-FLIGHT & PROCTORING",
      title: "Clearance & Hardware Check",
      shortDesc: "Placement cell clearance validation, webcam face tracking, and honor code agreement.",
      color: "bg-[#7cb4cf]",
      badgeBg: "bg-blue-100 text-blue-900",
      borderColor: "border-[#7cb4cf]",
      icon: ShieldCheck,
      duration: "1 - 2 mins",
      weight: "Prerequisite Gate",
      highlights: [
        "University Placement Cell 'Drive Clearance' badge verification",
        "Live WebRTC Camera & Mic diagnostic with real-time waveform",
        "AI Face Tracking Proctor (flags if candidate leaves camera frame)",
        "Single-device academic honor code and identity confirmation"
      ],
      simulationData: {
        badge: "HARDWARE & IDENTITY GATE",
        headline: "Face Tracking & Integrity Pre-Flight",
        subtext: "Before starting questions, our client-side vision monitor verifies the student's identity and checks camera alignment.",
        interactiveSnippet: (
          <div className="space-y-4">
            <div className="bg-black text-white p-3.5 rounded-sm border-2 border-black font-mono text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`size-3 rounded-full ${cameraProctorState === "ok" ? "bg-emerald-400 animate-pulse" : "bg-red-500 animate-ping"}`} />
                <span className="font-bold">
                  {cameraProctorState === "ok" ? "PROCTOR STATUS: CANDIDATE IN FRAME" : "WARNING: CANDIDATE NOT VISIBLE"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCameraProctorState(prev => prev === "ok" ? "warning" : "ok")}
                className="text-[10px] underline hover:text-yellow-300 font-sans"
              >
                Toggle Demo Flag
              </button>
            </div>

            <div className="relative bg-gray-900 border-2 border-black rounded-sm h-48 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {cameraProctorState === "ok" ? (
                <div className="text-center text-white z-10">
                  <div className="size-20 mx-auto rounded-full border-2 border-emerald-400 border-dashed flex items-center justify-center bg-emerald-950/40 mb-2">
                    <UserCheck className="size-10 text-emerald-400" />
                  </div>
                  <p className="font-mono text-xs text-emerald-400 font-bold">Face Mesh Locked (98.4% Confidence)</p>
                  <p className="text-[11px] text-gray-400">Audio input detected at 48kHz / -18 dB</p>
                </div>
              ) : (
                <div className="text-center text-white z-10 bg-red-950/80 p-4 border border-red-500 rounded">
                  <AlertTriangle className="size-10 text-red-400 mx-auto mb-2 animate-bounce" />
                  <p className="font-mono text-sm text-red-300 font-bold">You are not visible in the frame!</p>
                  <p className="text-[11px] text-red-200 mt-1">Please re-center yourself immediately. Grace period: 4s remaining.</p>
                </div>
              )}

              <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-gray-300 border border-gray-700">
                CAM_01 · 1080p 30fps
              </div>
              <div className="absolute bottom-2 right-2 bg-emerald-900/90 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-600">
                🛡️ Verified by Royal College
              </div>
            </div>

            <div className="bg-white border-2 border-dashed border-gray-400 p-3 rounded font-mono text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>Placement Cell Drive Clearance: <strong>OFFICIALLY VERIFIED</strong></span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>Microphone Noise Suppression: <strong>ACTIVE</strong></span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span>Honor Code Accepted: <strong>Single Monitor / No AI Aids</strong></span>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      id: 1,
      stageNumber: "STAGE 01",
      tag: "CORE TECHNICAL MCQs",
      title: "Foundational Engineering Blitz",
      shortDesc: "4 dynamic algorithmic and architectural questions with strict 5-minute timed countdown.",
      color: "bg-[#fcec6a]",
      badgeBg: "bg-yellow-100 text-yellow-900",
      borderColor: "border-[#fcec6a]",
      icon: Clock,
      duration: "5 mins strictly",
      weight: "25% of Final Grade",
      highlights: [
        "Dynamically generated from the recruiter's exact job requirements",
        "Tests concurrency, database indexing, caching strategies, and idempotency",
        "Mistakes are recorded in dossier for adaptive voice follow-ups in Stage 3",
        "Live countdown timer with anti-cheat tab-switching detection"
      ],
      simulationData: {
        badge: "TIMED KNOWLEDGE BENCHMARK",
        headline: "Real-Time Role MCQs",
        subtext: "Every question evaluates production-grade knowledge, not trivial trivia. Click options below to see how it works:",
        interactiveSnippet: (
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center bg-[#fcec6a] border-2 border-black p-2.5 rounded-sm">
              <span className="font-bold text-black flex items-center gap-1.5">
                <HelpCircle className="size-4" /> Question 2 of 4 · Database Scalability
              </span>
              <span className="bg-black text-white px-2 py-0.5 rounded text-[11px] font-bold">
                ⏱️ 03:42 LEFT
              </span>
            </div>

            <div className="bg-white border-2 border-black p-4 rounded-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="font-sans text-sm font-semibold text-gray-900 mb-3">
                In a high-throughput financial ledger, two concurrent transactions attempt to debit the same account balance simultaneously. Which approach best prevents double-spending while maximizing throughput?
              </p>

              <div className="space-y-2">
                {[
                  { id: 0, text: "A) Wrap both transactions in READ UNCOMMITTED isolation to minimize database lock contention." },
                  { id: 1, text: "B) Use SELECT ... FOR UPDATE (pessimistic lock) or conditional atomic updates with optimistic version checking." },
                  { id: 2, text: "C) Schedule transactions via setTimeout with random jitter in node process memory." },
                  { id: 3, text: "D) Rely on database read replicas to distribute concurrent balances." },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedMcqOption(opt.id)}
                    className={`w-full text-left p-2.5 rounded border-2 transition-all flex items-start gap-2 ${
                      selectedMcqOption === opt.id
                        ? "border-black bg-yellow-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-black"
                        : "border-gray-200 bg-white hover:border-black text-gray-700"
                    }`}
                  >
                    <span className={`size-4 rounded-full border border-black flex items-center justify-center shrink-0 mt-0.5 ${selectedMcqOption === opt.id ? "bg-black" : "bg-white"}`}>
                      {selectedMcqOption === opt.id && <span className="size-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-[11px] font-mono leading-relaxed">{opt.text}</span>
                  </button>
                ))}
              </div>

              {selectedMcqOption === 1 && (
                <div className="mt-3 p-2 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Correct Answer Selected!</strong> Ensures ACID consistency across distributed ledger writes.</span>
                </div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      id: 2,
      stageNumber: "STAGE 02",
      tag: "TECHNICAL ARCHITECTURE",
      title: "System Design Scenarios",
      shortDesc: "Applied problem-solving scenarios testing real-world scalability, trade-offs, and edge cases.",
      color: "bg-[#bde0fe]",
      badgeBg: "bg-sky-100 text-sky-900",
      borderColor: "border-[#bde0fe]",
      icon: Code2,
      duration: "10 mins",
      weight: "35% of Final Grade",
      highlights: [
        "2 applied production engineering challenges tailored to company tech stack",
        "Evaluates resilience: network partition, rate limiting, and cache stampede",
        "Auto-graded by sovereign LLM against senior engineer architectural rubric",
        "Trade-off analysis: latency vs consistency, cost vs redundancy"
      ],
      simulationData: {
        badge: "APPLIED SYSTEM DESIGN",
        headline: "Scenario Trade-off Analysis",
        subtext: "Tests whether candidates understand how real systems fail in production under 100k requests/sec.",
        interactiveSnippet: (
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-[#bde0fe] border-2 border-black p-2.5 rounded-sm flex items-center justify-between">
              <span className="font-bold text-black flex items-center gap-1.5">
                <Terminal className="size-4" /> Scenario 1: Cache Invalidation & Stampede
              </span>
              <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold">
                SYSTEM ARCHITECTURE
              </span>
            </div>

            <div className="bg-white border-2 border-black p-4 rounded-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="bg-gray-50 border-l-4 border-black p-2.5 font-sans text-xs text-gray-800 leading-relaxed">
                <strong>Challenge:</strong> During a college flash sale, the Redis cached homepage key expires. 50,000 concurrent requests immediately bypass cache and strike the primary Postgres database simultaneously. How would you redesign this?
              </div>

              <div className="bg-[#faf9f0] border border-gray-300 p-3 rounded space-y-2">
                <p className="font-mono text-[11px] text-gray-500 font-bold uppercase">Candidate Written Response (Sample):</p>
                <p className="font-sans text-xs text-gray-800 italic leading-relaxed">
                  &ldquo;I would introduce a distributed mutex lock using Redis (e.g., Redlock) so only one worker queries Postgres to rebuild the cache, while others wait or serve stale data with an SWR (Stale-While-Revalidate) header. Additionally, I’d add random TTL jitter (e.g. 300s ± 30s) to prevent coordinated key expirations.&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-gray-200">
                <div className="bg-emerald-50 border border-emerald-200 p-1.5 rounded">
                  <p className="text-[10px] text-emerald-700 font-bold">Scalability</p>
                  <p className="font-mono text-sm font-extrabold text-emerald-900">9.5 / 10</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-1.5 rounded">
                  <p className="text-[10px] text-blue-700 font-bold">Resilience</p>
                  <p className="font-mono text-sm font-extrabold text-blue-900">9.0 / 10</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 p-1.5 rounded">
                  <p className="text-[10px] text-purple-700 font-bold">Edge Cases</p>
                  <p className="font-mono text-sm font-extrabold text-purple-900">9.2 / 10</p>
                </div>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      id: 3,
      stageNumber: "STAGE 03",
      tag: "REAL-TIME AI AVATAR",
      title: "Live WebRTC Cross-Examination",
      shortDesc: "Sub-200ms ultra-realistic voice AI agent that cross-examines resume claims and Stage 1/2 mistakes.",
      color: "bg-[#e15b58]",
      badgeBg: "bg-red-100 text-red-900",
      borderColor: "border-[#e15b58]",
      icon: Mic,
      duration: "5 - 8 mins",
      weight: "40% of Final Grade",
      highlights: [
        "Sub-200ms WebRTC voice conversation with interactive avatar animations",
        "Adaptive follow-ups: probes specific mistakes made in Stages 1 & 2",
        "Anti-Exaggeration Inspector: cross-checks resume projects against college claims",
        "Evaluates communication clarity, architectural depth, and problem reasoning"
      ],
      simulationData: {
        badge: "ADAPTIVE CROSS-EXAMINER",
        headline: "Live Voice AI Cross-Examination",
        subtext: "Unlike passive AI mock interviews, our agent fact-checks claims and dives deep into previous assessment mistakes.",
        interactiveSnippet: (
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-[#e15b58] text-white border-2 border-black p-2.5 rounded-sm flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Mic className="size-4 animate-pulse" /> LiveKit Room #interview-102 · WebRTC Active
              </span>
              <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold">
                SUB-200MS LATENCY
              </span>
            </div>

            <div className="bg-white border-2 border-black p-4 rounded-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
              {/* Dialogue Bubble 1: AI Recruiter */}
              <div className="flex gap-3 items-start bg-red-50 p-3 rounded border border-red-200">
                <div className="size-8 rounded-full bg-red-500 text-white font-bold flex items-center justify-center shrink-0 border border-black text-xs">
                  AI
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide">CampusHire AI Avatar · Technical Recruiter</p>
                  <p className="font-sans text-xs text-gray-900 leading-relaxed">
                    &ldquo;Welcome Mohamed! In Stage 1, you answered question 4 by suggesting HTTP polling instead of WebSockets. Can you explain why you selected that, and how it impacts server connection pooling under peak loads?&rdquo;
                  </p>
                </div>
              </div>

              {/* Dialogue Bubble 2: Candidate */}
              <div className="flex gap-3 items-start bg-gray-50 p-3 rounded border border-gray-300 ml-4">
                <div className="size-8 rounded-full bg-black text-white font-bold flex items-center justify-center shrink-0 border border-black text-xs">
                  ME
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Candidate Audio Transcript (Live WebRTC)</p>
                  <p className="font-sans text-xs text-gray-900 leading-relaxed">
                    &ldquo;Under retrospective analysis, polling was sub-optimal because each poll establishes a new TLS handshake. For live dashboards, bidirectional WebSockets or SSE reduce payload overhead by over 80%.&rdquo;
                  </p>
                </div>
              </div>

              {/* Audio Waveform Simulator */}
              <div className="flex items-center justify-between bg-black text-white px-3 py-2 rounded">
                <span className="text-[10px] text-gray-400">VOICE ENGINE: QWEN 2.5 + LIVEKIT PIPELINE</span>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-red-400 animate-pulse rounded-full" />
                  <span className="w-1 h-5 bg-red-400 animate-pulse delay-75 rounded-full" />
                  <span className="w-1 h-2 bg-red-400 animate-pulse delay-150 rounded-full" />
                  <span className="w-1 h-6 bg-red-400 animate-pulse delay-100 rounded-full" />
                  <span className="w-1 h-4 bg-red-400 animate-pulse delay-200 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      id: 4,
      stageNumber: "STAGE 04",
      tag: "THE 360° SCORECARD",
      title: "Recruiter Hiring Dossier",
      shortDesc: "Automated composite scorecard synthesizing MCQ accuracy, technical reasoning, and voice articulation.",
      color: "bg-[#d1fae5]",
      badgeBg: "bg-emerald-100 text-emerald-900",
      borderColor: "border-[#d1fae5]",
      icon: Award,
      duration: "Instant generation",
      weight: "Final Decision",
      highlights: [
        "Weighted composite formula: 25% MCQ + 35% System Design + 40% Voice AI",
        "Authenticity & Integrity Audit: Highlights unverified resume exaggerations",
        "Instant recruiter hiring recommendation ('Strong Hire', 'Recommend Onsite', 'Reject')",
        "Exportable PDF candidate report card for campus placement drives"
      ],
      simulationData: {
        badge: "VERIFIED HIRING REPORT",
        headline: "Instant Recruiter Evaluation Dossier",
        subtext: "Visually transparent scorecard eliminating weeks of manual resume screening and phone tags.",
        interactiveSnippet: (
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-[#a7f3d0] border-2 border-black p-2.5 rounded-sm flex items-center justify-between">
              <span className="font-bold text-black flex items-center gap-1.5">
                <Award className="size-4" /> 360° Candidate Assessment Report #REC-00891
              </span>
              <span className="bg-emerald-800 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                STRONG HIRE ★★★★★
              </span>
            </div>

            <div className="bg-white border-2 border-black p-4 rounded-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <div>
                  <h4 className="font-sans font-bold text-sm text-gray-900">Mohamed Amaan</h4>
                  <p className="text-[11px] text-gray-500">Royal College of Engineering · B.E. Computer Science &apos;26</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400">COMPOSITE SCORE</span>
                  <p className="text-2xl font-kalam font-bold text-emerald-700 leading-none">89.4 / 100</p>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Stage 1: Core Technical MCQs (Weight 25%)</span>
                    <strong className="text-emerald-700">85% (3/4 Correct)</strong>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded border border-black/20 overflow-hidden">
                    <div className="bg-yellow-400 h-full rounded" style={{ width: "85%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Stage 2: Technical Architecture (Weight 35%)</span>
                    <strong className="text-emerald-700">92% (High Resilience)</strong>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded border border-black/20 overflow-hidden">
                    <div className="bg-blue-400 h-full rounded" style={{ width: "92%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Stage 3: AI Voice Cross-Examination (Weight 40%)</span>
                    <strong className="text-emerald-700">90% (Articulate & Clear)</strong>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded border border-black/20 overflow-hidden">
                    <div className="bg-red-400 h-full rounded" style={{ width: "90%" }} />
                  </div>
                </div>
              </div>

              {/* Recommendation badge */}
              <div className="bg-[#f0fdf4] border border-emerald-300 p-2.5 rounded text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-sans">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Verified by Placement Cell · <strong>Cleared for Corporate Drive</strong></span>
                </div>
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                  READY FOR ONSITE
                </span>
              </div>
            </div>
          </div>
        )
      }
    }
  ];

  const currentStage = stages[activeStage];

  return (
    <section id="workflow" className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32">
      {/* Section Header */}
      <div className="mb-14">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-red-500 tracking-widest uppercase font-mono bg-white/70 border border-red-200 px-2.5 py-1 rounded">
            PIPELINE ARCHITECTURE · 360° VERIFICATION ENGINE
          </span>
          <span className="bg-[#fcec6a] text-black border border-black px-2 py-0.5 text-[11px] font-mono font-bold rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            4-STAGE JOURNEY
          </span>
        </div>

        <h2 className="text-5xl md:text-7xl font-kalam font-bold leading-[1.05] tracking-tight text-gray-950">
          How CampusHire AI <br />
          <span className="relative inline-block mt-1">
            <span className="absolute inset-0 bg-[#fcec6a] transform -rotate-1 rounded-sm scale-105 -z-10 shadow-sm"></span>
            <span className="relative z-10">Evaluates Every Candidate.</span>
          </span>
        </h2>

        <p className="text-lg md:text-xl font-medium text-gray-700 mt-6 max-w-3xl leading-relaxed bg-white/40 p-2 rounded">
          From university placement cell clearance to real-time AI voice cross-examination. A structured, tamper-proof evaluation pipeline combining automated proctoring, foundational MCQs, architecture scenarios, and a 360° recruiter scorecard.
        </p>
      </div>

      {/* Stage Navigation Stepper (Tab buttons) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStage(stage.id)}
              className={`text-left p-3.5 rounded-sm border-2 border-black transition-all transform flex flex-col justify-between ${
                isActive
                  ? `${stage.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1 font-bold`
                  : "bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-gray-700">
                    {stage.stageNumber}
                  </span>
                  <Icon className={`size-4 ${isActive ? "text-black" : "text-gray-500"}`} />
                </div>
                <h4 className="font-kalam text-lg font-bold leading-tight text-black line-clamp-1">
                  {stage.title}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-black/20 flex items-center justify-between text-[11px] font-mono text-gray-700">
                <span>{stage.duration}</span>
                {isActive && <span className="font-bold">ACTIVE →</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage Display Container */}
      <div className="bg-[#fffef7] border-2 border-black rounded-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 md:p-10 relative">
        {/* Notebook Top Stamp */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b-2 border-dashed border-gray-300">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 border-2 border-black rounded text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${currentStage.color}`}>
              {currentStage.stageNumber}
            </span>
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase">
                {currentStage.tag}
              </span>
              <h3 className="font-kalam text-3xl md:text-4xl font-bold text-gray-900 leading-none mt-0.5">
                {currentStage.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="bg-[#faf9f0] border border-gray-400 px-2.5 py-1 rounded">
              ⏱️ <strong>Duration:</strong> {currentStage.duration}
            </span>
            <span className="bg-[#faf9f0] border border-gray-400 px-2.5 py-1 rounded">
              ⚖️ <strong>Weight:</strong> {currentStage.weight}
            </span>
          </div>
        </div>

        {/* 2-Column Layout: Left Details + Right Live Simulation */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Stage Architecture & Rubric (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border-2 border-black p-5 rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
              <h4 className="font-kalam text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="size-5 text-[#b4a925]" />
                What happens in this stage?
              </h4>
              <p className="font-sans text-sm text-gray-700 leading-relaxed mb-4">
                {currentStage.shortDesc}
              </p>

              <h5 className="font-mono text-xs font-bold text-gray-500 tracking-wider uppercase mb-3">
                Key Technical Capabilities:
              </h5>
              <ul className="space-y-2.5 font-sans text-xs text-gray-800">
                {currentStage.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="size-4 rounded-full bg-emerald-100 border border-emerald-500 text-emerald-800 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 font-kalam text-lg">
              <Link href="/dashboard/student/jobs" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-black text-white px-5 py-2.5 rounded-sm border-2 border-black hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#fcec6a] transition-all flex items-center justify-center gap-2">
                  <span>Take Practice Interview</span>
                  <ArrowRight className="size-4" />
                </button>
              </Link>

              <Link href="/dashboard/recruiter/candidates" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-[#faf9f0] text-black px-4 py-2.5 rounded-sm border-2 border-black hover:bg-yellow-100 transition-all flex items-center justify-center gap-2">
                  <span>Recruiter Reports</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Right Column: Live Interactive Simulation Snippet (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-[#faf9f0] border-2 border-black p-5 md:p-6 rounded-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)]">
              <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-red-600 tracking-widest uppercase">
                    {currentStage.simulationData.badge}
                  </span>
                  <h4 className="font-kalam text-2xl font-bold text-gray-900 leading-tight">
                    {currentStage.simulationData.headline}
                  </h4>
                </div>
                <span className="font-mono text-[11px] bg-white border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  LIVE DEMO
                </span>
              </div>

              <p className="text-xs text-gray-600 font-sans mb-4 leading-relaxed">
                {currentStage.simulationData.subtext}
              </p>

              {/* Render the stage's interactive preview */}
              {currentStage.simulationData.interactiveSnippet}
            </div>
          </div>
        </div>

        {/* Footer Pipeline Summary Strip */}
        <div className="mt-10 pt-6 border-t-2 border-dashed border-gray-300 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            <span>CampusHire Assessment Protocol v2.4 · <strong>Zero-Bias Certified</strong></span>
          </div>
          <div className="flex items-center gap-4">
            <span>🛡️ FERPA & Student PII Compliant</span>
            <span>⚡ Sub-200ms WebRTC Voice Latency</span>
          </div>
        </div>
      </div>
    </section>
  );
}
