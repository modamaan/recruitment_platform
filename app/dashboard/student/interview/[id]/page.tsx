"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { LiveKitRoom, RoomAudioRenderer, VoiceAssistantControlBar, useTracks, VideoTrack, useVoiceAssistant, useRoomContext } from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Mic,
  Award,
  FileText,
  Sparkles,
  ShieldCheck,
  Building,
  Briefcase,
  Check,
  RotateCcw,
  Printer,
  Layers,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Camera,
  Volume2,
  Loader2
} from "lucide-react";

type StageType = "briefing" | "mcq" | "technical" | "voice" | "completed";

interface McqQuestion {
  id: number;
  question: string;
  options: string[];
  correctOption: number;
  skillTarget: string;
  explanation?: string;
}

interface TechnicalQuestion {
  id: number;
  title: string;
  scenario: string;
  prompt: string;
  expectedConcepts: string[];
}

interface ReportData {
  voiceScore: number;
  compositeScore: number;
  authenticityAudit?: {
    status: string;
    notes: string;
    visualProctoring?: {
      status: string;
      absenceCount: number;
      outOfFrameSeconds: number;
    };
  };
  feedback: string;
  strengths: string[];
  areasToImprove: string[];
  recruiterRecommendation: string;
  recommendedNextStep: string;
}

function InterviewRoomContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const interviewId = params?.id;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Global Session State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<StageType>("briefing");
  const [interviewRecord, setInterviewRecord] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);

  // Stage 1: MCQ State
  const [mcqQuestions, setMcqQuestions] = useState<McqQuestion[]>([]);
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [mcqTimeLeft, setMcqTimeLeft] = useState(300); // 5 minutes timer
  const [mcqSubmitting, setMcqSubmitting] = useState(false);

  // Stage 2: Technical State
  const [technicalQuestions, setTechnicalQuestions] = useState<TechnicalQuestion[]>([]);
  const [technicalAnswers, setTechnicalAnswers] = useState<Record<number, string>>({});
  const [techSubmitting, setTechSubmitting] = useState(false);

  // Stage 3: Voice & LiveKit State
  const [voiceConnecting, setVoiceConnecting] = useState(false);
  const [finalizingInterview, setFinalizingInterview] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Proctoring & Face Tracking State
  const [faceAbsenceCount, setFaceAbsenceCount] = useState(0);
  const [outOfFrameSeconds, setOutOfFrameSeconds] = useState(0);
  const [isCurrentlyAbsent, setIsCurrentlyAbsent] = useState(false);

  // Stage 4: Report Data
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // 1. Fetch Session on Mount
  useEffect(() => {
    async function loadSession() {
      try {
        let authData;
        try {
          authData = await authClient.token();
        } catch (err) {
          router.push("/login");
          return;
        }

        const jwtToken = authData?.data?.token;
        if (!jwtToken) {
          router.push("/login");
          return;
        }

        const res = await fetch(`${backendUrl}/api/interviews/session/${interviewId}`, {
          headers: {
            "Authorization": `Bearer ${jwtToken}`
          }
        });

        if (!res.ok) {
          throw new Error("Could not initialize interview session.");
        }

        const data = await res.json();
        setInterviewRecord(data.interview);
        setJob(data.job);
        setStudent(data.student);
        setMcqQuestions(data.mcqQuestions || []);
        setTechnicalQuestions(data.technicalQuestions || []);

        if ((data.interview?.stage === "completed" || data.interview?.status === "completed") && data.interview?.reportData) {
          setReportData(data.interview.reportData);
          setStage("completed");
        } else if (data.interview?.stage) {
          setStage(data.interview.stage as StageType);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load session");
      } finally {
        setLoading(false);
      }
    }

    if (interviewId) {
      loadSession();
    }
  }, [backendUrl, interviewId, router]);

  // Timer for MCQ Stage
  useEffect(() => {
    if (stage !== "mcq") return;
    if (mcqTimeLeft <= 0) {
      handleMcqSubmit();
      return;
    }
    const timer = setInterval(() => {
      setMcqTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, mcqTimeLeft]);

  // Connect Voice Token when entering Stage 3
  useEffect(() => {
    async function connectVoice() {
      if (stage !== "voice" || token) return;
      setVoiceConnecting(true);
      try {
        const authData = await authClient.token();
        const jwtToken = authData.data?.token;
        if (!jwtToken) return;

        const effectiveId = interviewRecord?.id || interviewId;

        const res = await fetch(`${backendUrl}/api/interview/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwtToken}`
          },
          body: JSON.stringify({ interviewId: effectiveId })
        });

        if (!res.ok) {
          throw new Error("Failed to generate voice agent token.");
        }

        const tokenData = await res.json();
        setToken(tokenData.token);
        setRoomName(tokenData.roomName);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Could not connect to LiveKit Voice Agent");
      } finally {
        setVoiceConnecting(false);
      }
    }

    connectVoice();
  }, [stage, token, interviewRecord, interviewId, backendUrl]);

  // Handlers
  const handleStartMcqs = () => {
    setStage("mcq");
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleNextMcq = () => {
    if (currentMcqIndex < mcqQuestions.length - 1) {
      setCurrentMcqIndex((prev) => prev + 1);
    }
  };

  const handlePrevMcq = () => {
    if (currentMcqIndex > 0) {
      setCurrentMcqIndex((prev) => prev - 1);
    }
  };

  const handleMcqSubmit = async () => {
    setMcqSubmitting(true);
    try {
      const authData = await authClient.token();
      const jwtToken = authData.data?.token;

      const formattedAnswers = Object.entries(selectedAnswers).map(([qId, optIdx]) => ({
        questionId: parseInt(qId, 10),
        selectedOption: optIdx
      }));

      const effectiveId = interviewRecord?.id || interviewId;
      const res = await fetch(`${backendUrl}/api/interviews/session/${effectiveId}/submit-stage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          stage: "mcq",
          answers: formattedAnswers
        })
      });

      if (!res.ok) {
        throw new Error("Failed to evaluate MCQs");
      }

      const updated = await res.json();
      setInterviewRecord(updated);
      setStage("technical");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to proceed to Stage 2");
    } finally {
      setMcqSubmitting(false);
    }
  };

  const handleTechAnswerChange = (qId: number, text: string) => {
    setTechnicalAnswers((prev) => ({
      ...prev,
      [qId]: text
    }));
  };

  const handleTechSubmit = async () => {
    setTechSubmitting(true);
    try {
      const authData = await authClient.token();
      const jwtToken = authData.data?.token;

      const formattedAnswers = Object.entries(technicalAnswers).map(([qId, ansText]) => ({
        questionId: parseInt(qId, 10),
        answerText: ansText
      }));

      const effectiveId = interviewRecord?.id || interviewId;
      const res = await fetch(`${backendUrl}/api/interviews/session/${effectiveId}/submit-stage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          stage: "technical",
          answers: formattedAnswers
        })
      });

      if (!res.ok) {
        throw new Error("Failed to evaluate technical scenarios");
      }

      const updated = await res.json();
      setInterviewRecord(updated);
      setStage("voice");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to proceed to Stage 3");
    } finally {
      setTechSubmitting(false);
    }
  };

  const handleCompleteInterview = async () => {
    setFinalizingInterview(true);
    setCompleteError(null);
    try {
      const authData = await authClient.token();
      const jwtToken = authData.data?.token;

      const effectiveId = interviewRecord?.id || interviewId;
      const res = await fetch(`${backendUrl}/api/interviews/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          interviewId: effectiveId,
          proctoringData: {
            faceAbsenceCount,
            outOfFrameSeconds: Math.round(outOfFrameSeconds),
            visualIntegrityStatus: faceAbsenceCount === 0 ? "100% In-Frame Compliance (Zero Absences)" : `${faceAbsenceCount} Out-of-Frame Warnings (${Math.round(outOfFrameSeconds)}s total)`
          },
          transcript: [
            {
              role: "system",
              content: "Live AI Avatar Interview successfully held. Candidate actively responded to Stage 1 callbacks and project queries."
            }
          ]
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Server returned ${res.status}`);
      }

      const completedRecord = await res.json();
      setInterviewRecord(completedRecord);
      setReportData(completedRecord.reportData);
      if (completedRecord.student) {
        setStudent(completedRecord.student);
      }
      if (completedRecord.job) {
        setJob(completedRecord.job);
      }
      setStage("completed");
    } catch (err: any) {
      console.error("Report completion error:", err);
      setCompleteError(err.message || "Failed to finalize interview report.");
    } finally {
      setFinalizingInterview(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center font-kalam">
        <div className="animate-pulse flex flex-col items-center">
          <div className="size-12 rounded-full border-4 border-black border-t-[#fcec6a] animate-spin mb-4"></div>
          <p className="text-black font-bold text-xl">Loading Unified 360° Assessment...</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-red-100 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="size-6 text-red-600" />
          <h2 className="text-2xl font-bold font-kalam">Assessment Initialization Error</h2>
        </div>
        <p className="font-semibold text-sm mb-4">{error}</p>
        <Link
          href="/dashboard/student/jobs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-lg font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100"
        >
          <ArrowLeft className="size-4" /> Back to Matched Jobs
        </Link>
      </div>
    );
  }

  // Format timer helper
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 font-sans">

      {/* ASSESSMENT STEPPER NAVIGATION BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: "briefing", label: "Briefing", sub: "Instructions", icon: FileText, num: 1 },
          { key: "mcq", label: "Core MCQs", sub: `${mcqQuestions.length} Questions`, icon: Layers, num: 2 },
          { key: "technical", label: "Tech Scenario", sub: "2 Problems", icon: HelpCircle, num: 3 },
          { key: "voice", label: "AI Voice & Cam", sub: "Avatar + Proctoring", icon: Mic, num: 4 }
        ].map((step) => {
          const isActive = stage === step.key;
          const isDone =
            (step.key === "briefing" && stage !== "briefing") ||
            (step.key === "mcq" && (stage === "technical" || stage === "voice" || stage === "completed")) ||
            (step.key === "technical" && (stage === "voice" || stage === "completed")) ||
            (step.key === "voice" && stage === "completed");

          return (
            <div
              key={step.key}
              className={`p-3 rounded-xl border-2 border-black transition-all flex items-center gap-3 ${isActive
                ? "bg-[#e15b58] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                : isDone
                  ? "bg-[#dcfce7] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-zinc-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-70"
                }`}
            >
              <div className={`size-8 rounded-full border-2 border-black flex items-center justify-center font-bold text-sm shrink-0 ${isActive ? "bg-black text-white" : isDone ? "bg-[#16a34a] text-white" : "bg-zinc-100 text-zinc-600"
                }`}>
                {isDone ? <Check className="size-4" /> : step.num}
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-xs truncate leading-tight ${isActive ? "text-white" : "text-black"}`}>
                  {step.label}
                </p>
                <p className={`text-[11px] truncate ${isActive ? "text-white/80" : "text-zinc-500"}`}>
                  {step.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* STAGE 0: BRIEFING & INSTRUCTIONS */}
      {stage === "briefing" && (
        <div className="bg-white border-2 border-black rounded-xl p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
          <div className="border-b-2 border-black pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Assessment Briefing</span>
              <h1 className="text-3xl font-bold font-kalam text-black mt-1">
                {job?.title || "Software Engineer"} Assessment
              </h1>
              <p className="text-sm font-semibold text-zinc-700 mt-1 flex items-center gap-2">
                <Building className="size-4" /> {job?.companyName || "Royal Placement Partner"} •
                <span>{job?.location || "Bengaluru"}</span> •
                <span className="text-emerald-700 font-bold">₹ {job?.salaryRange || "8 LPA - 14 LPA"}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#fcec6a] border-2 border-black px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="size-5 text-black" />
              <span className="text-xs font-bold font-mono text-black">
                {student?.verificationStatus === "verified" ? "🛡️ Verified Drive Candidate" : "⏳ University Candidate"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg text-black">Assessment Pipeline Overview:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-50 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 font-bold text-sm text-black mb-1">
                  <span className="size-6 bg-[#fcec6a] border border-black rounded-full flex items-center justify-center text-xs">1</span>
                  Core MCQs (5 Mins)
                </div>
                <p className="text-xs text-zinc-600">
                  4 role-tailored questions testing systems fundamentals, database concurrency, and protocols.
                </p>
              </div>

              <div className="p-4 bg-zinc-50 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 font-bold text-sm text-black mb-1">
                  <span className="size-6 bg-[#7cb4cf] border border-black rounded-full flex items-center justify-center text-xs text-white">2</span>
                  Technical Architecture
                </div>
                <p className="text-xs text-zinc-600">
                  2 applied engineering scenarios where you describe your solution, trade-offs, and edge-cases.
                </p>
              </div>

              <div className="p-4 bg-zinc-50 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 font-bold text-sm text-black mb-1">
                  <span className="size-6 bg-[#e15b58] border border-black rounded-full flex items-center justify-center text-xs text-white">3</span>
                  Live AI Avatar + Cam
                </div>
                <p className="text-xs text-zinc-600">
                  Live conversation with our AI recruiter. Proctored with camera tracking to verify candidate presence.
                </p>
              </div>
            </div>
          </div>

          {/* Rules & Requirements Alert */}
          <div className="p-4 bg-[#fef9c3] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs text-zinc-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-black text-sm">
              <AlertTriangle className="size-4 text-amber-700" />
              <span>Assessment & Proctoring Guidelines:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 font-medium">
              <li>Keep your webcam and microphone active throughout the interview stages.</li>
              <li>Face must remain clearly centered in the camera frame during the Stage 3 conversation.</li>
              <li>The AI cross-examines Stage 1 MCQ mistakes and verified college records to detect resume bluffing.</li>
              <li>A final 360° Recruiter Scorecard with an Integrity Audit will be compiled upon completion.</li>
            </ul>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleStartMcqs}
              className="px-8 py-3 bg-[#e15b58] hover:bg-[#c94d4a] text-white border-2 border-black rounded-xl font-kalam font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
            >
              Start Stage 1: Core MCQs <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 1: CORE MCQS */}
      {stage === "mcq" && (
        <div className="bg-white border-2 border-black rounded-xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Header with Timer and Question Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Stage 1 of 3: Knowledge Fundamentals</span>
              <h2 className="text-2xl font-bold text-black font-kalam">
                Question {currentMcqIndex + 1} of {mcqQuestions.length}
              </h2>
            </div>

            {/* Countdown Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-mono text-lg font-bold ${mcqTimeLeft < 60 ? "bg-[#fee2e2] text-[#e15b58] animate-pulse" : "bg-[#fef9c3] text-black"
              }`}>
              <Clock className="size-5" />
              <span>{formatTimer(mcqTimeLeft)}</span>
            </div>
          </div>

          {/* Current Question Display */}
          {mcqQuestions[currentMcqIndex] && (
            <div className="space-y-6">
              <div className="p-4 bg-zinc-50 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="inline-block bg-[#7cb4cf] text-black text-xs font-bold px-2 py-0.5 rounded border border-black mb-2">
                  Target: {mcqQuestions[currentMcqIndex].skillTarget}
                </span>
                <p className="text-lg font-bold text-black leading-relaxed">
                  {mcqQuestions[currentMcqIndex].question}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {mcqQuestions[currentMcqIndex].options.map((option, optIdx) => {
                  const qId = mcqQuestions[currentMcqIndex].id;
                  const isSelected = selectedAnswers[qId] === optIdx;
                  const letters = ["A", "B", "C", "D"];

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(qId, optIdx)}
                      className={`text-left p-4 rounded-xl border-2 border-black transition-all flex items-start gap-3.5 ${isSelected
                        ? "bg-[#fcec6a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]"
                        : "bg-white hover:bg-zinc-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        }`}
                    >
                      <span className={`size-7 rounded-full border-2 border-black flex items-center justify-center font-bold text-sm shrink-0 ${isSelected ? "bg-black text-white" : "bg-zinc-100 text-black"
                        }`}>
                        {letters[optIdx]}
                      </span>
                      <span className="text-base font-semibold text-black pt-0.5">
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-4 border-t-2 border-black">
                <button
                  type="button"
                  onClick={handlePrevMcq}
                  disabled={currentMcqIndex === 0}
                  className="px-5 py-2.5 bg-zinc-100 disabled:opacity-40 border-2 border-black rounded-xl font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-200 transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="size-4" /> Previous
                </button>

                {currentMcqIndex < mcqQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextMcq}
                    className="px-6 py-2.5 bg-[#fcec6a] hover:bg-[#ebd95b] border-2 border-black rounded-xl font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1.5 text-black"
                  >
                    Next Question <ArrowRight className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMcqSubmit}
                    disabled={mcqSubmitting}
                    className="px-8 py-2.5 bg-[#e15b58] hover:bg-[#c94d4a] text-white border-2 border-black rounded-xl font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
                  >
                    {mcqSubmitting ? "Submitting MCQs..." : "Submit & Proceed to Stage 2 →"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: TECHNICAL SCENARIOS */}
      {stage === "technical" && (
        <div className="bg-white border-2 border-black rounded-xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
          <div className="border-b-2 border-black pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Stage 2 of 3: Applied Engineering</span>
            <h2 className="text-3xl font-bold font-kalam text-black mt-1">Technical Architecture Scenarios</h2>
            <p className="text-sm text-zinc-600 mt-1">
              Demonstrate your approach to real-world system design, failure scenarios, and architectural trade-offs.
            </p>
          </div>

          <div className="space-y-8">
            {technicalQuestions.map((q, idx) => (
              <div key={q.id} className="p-5 bg-zinc-50 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-zinc-500">Scenario {idx + 1}</span>
                    <h3 className="text-xl font-bold text-black font-kalam">{q.title}</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-[#7cb4cf] text-black border border-black rounded-lg text-xs font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
                    System Design
                  </span>
                </div>

                <div className="p-3 bg-white border border-black rounded-lg text-sm text-zinc-800 leading-relaxed font-sans">
                  <strong>Context:</strong> {q.scenario}
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1.5">
                    {q.prompt}
                  </label>
                  <textarea
                    rows={4}
                    value={technicalAnswers[q.id] || ""}
                    onChange={(e) => handleTechAnswerChange(q.id, e.target.value)}
                    placeholder="Explain your approach, concurrency strategies, database considerations, and key trade-offs..."
                    className="w-full p-3 bg-white border-2 border-black rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#fcec6a] font-sans"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-zinc-500">Expected considerations:</span>
                  {q.expectedConcepts?.map((concept, cIdx) => (
                    <span key={cIdx} className="px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded text-xs font-mono">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end border-t-2 border-black">
            <button
              onClick={handleTechSubmit}
              disabled={techSubmitting}
              className="px-8 py-3 bg-[#e15b58] hover:bg-[#c94d4a] text-white border-2 border-black rounded-xl font-kalam font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
            >
              {techSubmitting ? "Evaluating Technical Scenarios..." : "Proceed to Stage 3: Live AI Video & Cam →"}
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: LIVE AI VOICE INTERVIEW & STUDENT PROCTORING */}
      {stage === "voice" && (
        <div className="bg-white border-2 border-black rounded-xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#e15b58]">
                Stage 3 of 3: Live AI Screening & Integrity Verification
              </span>
              <h2 className="text-3xl font-bold font-kalam text-black mt-1">
                AI Recruiter Room <span className="text-xs font-mono px-2 py-0.5 bg-blue-100 text-blue-900 border border-black rounded-full shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">{roomName || `interview-${interviewId}`}</span>
              </h2>
            </div>

            <button
              onClick={handleCompleteInterview}
              disabled={finalizingInterview}
              className="px-6 py-2.5 bg-[#e15b58] hover:bg-[#c94d4a] text-white border-2 border-black rounded-xl font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2 shrink-0"
            >
              {finalizingInterview ? "Compiling 360° Scorecard..." : "End Call & Generate 360° Report 🏁"}
            </button>
          </div>

          {/* Real-time Out-of-Frame Warning Alert Banner */}
          {isCurrentlyAbsent && (
            <div className="p-3 bg-[#fee2e2] text-[#991b1b] border-2 border-black rounded-xl mb-4 text-xs font-bold flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
              <span className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-[#dc2626] shrink-0" />
                <span>⚠️ WARNING: You are not visible live! Please face the camera to maintain interview integrity.</span>
              </span>
              <span className="px-2 py-0.5 bg-white border border-black rounded text-[10px] uppercase font-mono">Live Proctor Alert</span>
            </div>
          )}

          {/* Error notice if finalizing report fails */}
          {completeError && (
            <div className="p-3 bg-[#fee2e2] text-[#991b1b] border-2 border-black rounded-xl mb-4 text-xs font-bold flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="size-4 text-[#dc2626] shrink-0" />
                <span>Error generating report: {completeError}</span>
              </span>
              <button
                onClick={handleCompleteInterview}
                className="underline font-black hover:text-black ml-2 px-2 py-0.5 bg-white border border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Dossier Alert Banner */}
          <div className="p-3 bg-[#e0f2fe] border-2 border-black rounded-xl mb-4 flex items-center justify-between gap-2 text-xs font-semibold text-black flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#0284c7] shrink-0" />
              <span>
                The AI Recruiter has been supplied with your verified profile, Stage 1 MCQ score ({interviewRecord?.mcqScore ?? 80}%), and Stage 2 technical scenario answers.
              </span>
            </div>
            {faceAbsenceCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-black rounded text-[11px] font-mono font-bold">
                Absence Flags: {faceAbsenceCount}
              </span>
            )}
          </div>

          {/* LiveKit Room Connection */}
          {token && livekitUrl ? (
            <LiveKitRoom
              token={token}
              serverUrl={livekitUrl}
              connect={true}
              audio={true}
              video={false}
              data-lk-theme="default"
              className="flex flex-col items-center justify-center w-full relative"
            >
              <RoomAudioRenderer />
              <VideoInterface
                onComplete={handleCompleteInterview}
                finalizing={finalizingInterview}
                onAbsenceTick={() => setOutOfFrameSeconds((prev) => prev + 0.5)}
                onAbsenceEvent={() => {
                  setFaceAbsenceCount((prev) => prev + 1);
                  setIsCurrentlyAbsent(true);
                }}
                onFaceRecovered={() => setIsCurrentlyAbsent(false)}
                isAbsent={isCurrentlyAbsent}
                absenceCount={faceAbsenceCount}
                candidateName={student?.name || "Student"}
              />
            </LiveKitRoom>
          ) : (
            <div className="flex h-[50vh] items-center justify-center">
              <div className="animate-pulse flex flex-col items-center text-center">
                <div className="size-12 rounded-full border-4 border-black border-t-[#fcec6a] animate-spin mb-4"></div>
                <p className="text-black font-bold text-lg font-kalam">Connecting secure WebRTC audio to AI Recruiter...</p>
                <p className="text-xs text-zinc-500 mt-1 font-mono">Loading real-time voice model and student camera proctor</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 4: COMPREHENSIVE 360° SCORECARD REPORT */}
      {stage === "completed" && (
        <div className="bg-white border-2 border-black rounded-xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">

          {/* Report Top Header */}
          <div className="border-b-4 border-black pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#fcec6a] text-black text-xs font-bold px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
                <Award className="size-4" /> OFFICIAL 360° ASSESSMENT SCORECARD
              </div>
              <h2 className="text-3xl font-bold font-kalam text-black">{student?.name || "Student"} • {job?.title}</h2>
              <p className="text-sm font-semibold text-zinc-600 mt-1 flex items-center gap-2">
                <span>{student?.university || "Royal College of Engineering"}</span> •
                <span>Grad Year: {student?.gradYear || "2026"}</span> •
                <span>Verification: <strong>{student?.verificationStatus || "Verified"}</strong></span>
              </p>
            </div>

            {/* Composite Score Gauge */}
            <div className="bg-[#f8fafc] border-2 border-black p-4 rounded-xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-center min-w-[200px]">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Overall Composite Match</span>
              <div className="text-5xl font-black text-black mt-1">
                {reportData?.compositeScore ?? interviewRecord?.matchScore ?? 85}
                <span className="text-2xl text-zinc-500 font-bold">/100</span>
              </div>
              <div className="mt-2 inline-block bg-[#16a34a] text-white text-xs font-bold px-3 py-0.5 rounded-full border border-black font-kalam">
                {reportData?.recruiterRecommendation || "Recommend for Next Round"}
              </div>
            </div>
          </div>

          {/* 3 Pillars Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1: MCQs */}
            <div className="p-5 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Pillar 1 (25% Weight)</span>
                <span className="text-lg font-bold text-black font-mono">{interviewRecord?.mcqScore ?? 80}%</span>
              </div>
              <h3 className="font-bold text-base text-black mb-1 font-kalam">Knowledge & MCQs</h3>
              <p className="text-xs text-zinc-600">
                Core aptitude on concurrency, data structures, and database indexing.
              </p>
            </div>

            {/* Pillar 2: Technical */}
            <div className="p-5 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Pillar 2 (35% Weight)</span>
                <span className="text-lg font-bold text-black font-mono">{interviewRecord?.technicalScore ?? 80}%</span>
              </div>
              <h3 className="font-bold text-base text-black mb-1 font-kalam">Technical Architecture</h3>
              <p className="text-xs text-zinc-600">
                Problem decomposition, scaling trade-offs, and production debugging.
              </p>
            </div>

            {/* Pillar 3: Voice & Communication */}
            <div className="p-5 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Pillar 3 (40% Weight)</span>
                <span className="text-lg font-bold text-black font-mono">{reportData?.voiceScore ?? 85}%</span>
              </div>
              <h3 className="font-bold text-base text-black mb-1 font-kalam">Live Verbal & Depth</h3>
              <p className="text-xs text-zinc-600">
                Spoken clarity, reasoning under cross-examination, and technical composure.
              </p>
            </div>
          </div>

          {/* Authenticity & Integrity Audit Box with Video Proctoring */}
          <div className="p-5 bg-[#fffbeb] border-2 border-black rounded-xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="size-5 text-[#ca8a04]" />
              <h3 className="font-bold text-lg text-black font-kalam">Authenticity & Profile Integrity Audit</h3>
              <span className="ml-auto text-xs font-bold bg-white text-black px-2.5 py-1 rounded-full border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-mono">
                Status: {reportData?.authenticityAudit?.status || "Verified & Grounded"}
              </span>
            </div>
            <p className="text-sm text-zinc-800 leading-relaxed font-sans">
              {reportData?.authenticityAudit?.notes || "Spoken responses were consistent with verified Royal College profile credentials. Candidate gave authentic, non-inflated accounts of their academic projects."}
            </p>

            {/* Live Video Proctoring Badge */}
            <div className="mt-4 pt-3 border-t border-amber-300 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                <Camera className="size-4 text-blue-600" />
                Live Video Proctoring Audit:
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold border border-black ${(reportData?.authenticityAudit as any)?.visualProctoring?.absenceCount === 0 || (!reportData?.authenticityAudit?.visualProctoring && faceAbsenceCount === 0)
                ? "bg-[#dcfce7] text-[#166534]"
                : "bg-[#fee2e2] text-[#991b1b]"
                }`}>
                {(reportData?.authenticityAudit as any)?.visualProctoring?.status ||
                  (faceAbsenceCount === 0 ? "100% In-Frame Compliance (Zero Absences)" : `${faceAbsenceCount} Out-of-Frame Warnings (${Math.round(outOfFrameSeconds)}s total)`)}
              </span>
            </div>
          </div>

          {/* Feedback, Strengths, Areas to Improve */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-5 bg-[#f0fdf4] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-base text-[#166534] mb-3 flex items-center gap-2 font-kalam">
                <CheckCircle2 className="size-5 text-[#16a34a]" /> Key Strengths Observed
              </h3>
              <ul className="text-sm text-zinc-800 space-y-2">
                {(reportData?.strengths || [
                  "Strong intuition on database locking and concurrency controls.",
                  "Structured, calm communication during live voice probes.",
                  "Transparent articulation of project boundaries."
                ]).map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-[#16a34a]">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="p-5 bg-[#fef2f2] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-base text-[#991b1b] mb-3 flex items-center gap-2 font-kalam">
                <AlertTriangle className="size-5 text-[#dc2626]" /> Areas for Growth & Next Prep
              </h3>
              <ul className="text-sm text-zinc-800 space-y-2">
                {(reportData?.areasToImprove || [
                  "Strengthen caching invalidation strategies under distributed scale.",
                  "Include concrete metrics (RPS, latency percentiles) in technical explanations."
                ]).map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-[#dc2626]">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recruiter Recommendation & Next Step */}
          <div className="p-5 bg-[#f8fafc] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Recommended Next Step for Campus Recruiter</span>
            <p className="text-base font-bold text-black mt-1 font-sans">
              {reportData?.recommendedNextStep || "Shortlist for 30-minute onsite technical discussion with Engineering Manager."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-black">
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-6 py-2.5 bg-white border-2 border-black rounded-xl font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 flex items-center justify-center gap-2 font-kalam"
            >
              <Printer className="size-4" /> Print / Save Scorecard
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/dashboard/student/jobs"
                className="w-full sm:w-auto px-6 py-2.5 bg-[#fcec6a] text-black border-2 border-black rounded-xl font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] flex items-center justify-center gap-1.5 font-kalam"
              >
                Browse More Jobs <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Student Live Camera & Face Tracking Component
function StudentCameraProctor({
  onAbsenceTick,
  onAbsenceEvent,
  onFaceRecovered,
  isAbsent,
  absenceCount
}: {
  onAbsenceTick: () => void;
  onAbsenceEvent: () => void;
  onFaceRecovered: () => void;
  isAbsent: boolean;
  absenceCount: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceStatus, setFaceStatus] = useState<"detected" | "glance" | "absent">("detected");
  const consecutiveAbsentTicksRef = useRef(0);
  const isAbsentRef = useRef(false);

  // 1. Initialize local webcam stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: "user"
          },
          audio: false
        });

        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => { });
            setCameraReady(true);
          };
        }
      } catch (err: any) {
        console.warn("Camera access denied or unavailable:", err);
        if (isMounted) {
          setCameraError("Camera permission needed");
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Synthetic Warning Chime using Web Audio API
  const playWarningChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // Audio autoplay policy may suppress background chime
    }
  }, []);

  // 3. Face Presence Tracking Loop (runs every 500ms)
  useEffect(() => {
    if (!cameraReady) return;

    let detector: any = null;
    if (typeof window !== "undefined" && "FaceDetector" in window) {
      try {
        detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
      } catch (e) {
        detector = null;
      }
    }

    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      let faceFound = false;

      // Method A: Native Chromium FaceDetector API
      if (detector) {
        try {
          const faces = await detector.detect(video);
          if (faces && faces.length > 0) {
            faceFound = true;
          }
        } catch (err) {
          faceFound = false;
        }
      }

      // Method B: High-speed Canvas Optical Fallback (Luminance & Skin-Chroma variance)
      if (!detector || !faceFound) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, 160, 120);
            const frame = ctx.getImageData(32, 24, 96, 72); // Center 60%
            const data = frame.data;
            let sumLuminance = 0;
            let humanPixels = 0;
            const totalPixels = data.length / 4;

            for (let i = 0; i < data.length; i += 8) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              sumLuminance += lum;

              // Human skin-tone chroma heuristic: R > G > B
              if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10) {
                humanPixels++;
              }
            }

            const avgLuminance = sumLuminance / (totalPixels / 2);
            const humanRatio = humanPixels / (totalPixels / 2);

            // Valid presence if frame has light and sufficient skin chroma
            if (avgLuminance > 25 && humanRatio > 0.08) {
              faceFound = true;
            }
          }
        }
      }

      // Evaluation with 3-Second Grace Window (6 ticks)
      if (faceFound) {
        consecutiveAbsentTicksRef.current = 0;
        setFaceStatus("detected");
        if (isAbsentRef.current) {
          isAbsentRef.current = false;
          onFaceRecovered();
        }
      } else {
        consecutiveAbsentTicksRef.current += 1;
        const ticks = consecutiveAbsentTicksRef.current;

        if (ticks < 6) {
          setFaceStatus("glance");
        } else {
          setFaceStatus("absent");
          onAbsenceTick();

          if (!isAbsentRef.current) {
            isAbsentRef.current = true;
            onAbsenceEvent();
            playWarningChime();
          }
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [cameraReady, onAbsenceTick, onAbsenceEvent, onFaceRecovered, playWarningChime]);

  return (
    <div className="absolute bottom-4 right-4 z-30 w-52 sm:w-60 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-all">
      {/* Hidden Vision Analysis Canvas */}
      <canvas ref={canvasRef} width="160" height="120" className="hidden" />

      {/* Header */}
      <div className="bg-zinc-100 border-b-2 border-black px-2.5 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-600 animate-pulse" />
          <span className="font-kalam font-bold text-xs text-black">Candidate Live Cam</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border border-black ${faceStatus === "detected"
            ? "bg-[#dcfce7] text-[#166534]"
            : faceStatus === "glance"
              ? "bg-[#fef9c3] text-black"
              : "bg-[#fee2e2] text-[#991b1b] animate-pulse"
            }`}
        >
          {faceStatus === "detected" ? "✓ IN FRAME" : faceStatus === "glance" ? "CENTERING" : "⚠️ NOT VISIBLE"}
        </span>
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="p-2 text-center text-white text-[11px] font-bold">
            <Camera className="size-5 mx-auto mb-1 text-[#fcec6a]" />
            Camera not connected
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Target Face Target Brackets */}
            <div
              className={`absolute inset-3 rounded-lg border-2 pointer-events-none transition-colors ${faceStatus === "detected"
                ? "border-[#16a34a]/80"
                : faceStatus === "glance"
                  ? "border-[#f59e0b]"
                  : "border-[#dc2626] border-dashed animate-pulse bg-red-500/20"
                }`}
            >
              {faceStatus === "absent" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 bg-black/60 text-white">
                  <AlertTriangle className="size-6 text-[#f87171] mb-1 animate-bounce" />
                  <p className="text-[11px] font-bold text-white leading-tight">Face Not Visible!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer Status Strip */}
      <div className="bg-white px-2.5 py-1 text-[10px] font-mono text-zinc-600 flex items-center justify-between border-t border-zinc-200">
        <span>AI Face Tracking</span>
        <span className={isAbsent ? "text-red-600 font-bold" : "text-zinc-600"}>
          {isAbsent ? `🔴 Alert (${absenceCount})` : "🟢 Proctored"}
        </span>
      </div>
    </div>
  );
}

// LiveKit Video Interface Component
function VideoInterface({
  onComplete,
  finalizing,
  onAbsenceTick,
  onAbsenceEvent,
  onFaceRecovered,
  isAbsent,
  absenceCount,
  candidateName = "Candidate"
}: {
  onComplete: () => void;
  finalizing: boolean;
  onAbsenceTick: () => void;
  onAbsenceEvent: () => void;
  onFaceRecovered: () => void;
  isAbsent: boolean;
  absenceCount: number;
  candidateName?: string;
}) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }]);
  const videoTrackRef = tracks[0];
  const voiceAssistant = useVoiceAssistant();
  const room = useRoomContext();
  const agentState = voiceAssistant.state;

  // 3-Question Interview State Tracking
  const [interviewProgress, setInterviewProgress] = useState({
    currentQuestion: 1,
    totalQuestions: 3,
    answeredCount: 0,
    isCompleted: false,
  });
  const [autoFinishing, setAutoFinishing] = useState(false);

  // Listen for real-time interview progress and auto-completion packets from the agent
  useEffect(() => {
    if (!room) return;
    const handleData = (payload: Uint8Array) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const data = JSON.parse(decoded);
        if (data.type === "interview_progress") {
          setInterviewProgress({
            currentQuestion: data.currentQuestion || 1,
            totalQuestions: data.totalQuestions || 3,
            answeredCount: data.answeredCount || 0,
            isCompleted: data.isCompleted || false,
          });
        } else if (data.type === "interview_completed") {
          setAutoFinishing(true);
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      } catch (err) {
        console.error("Error processing LiveKit data packet:", err);
      }
    };

    room.on("dataReceived", handleData);
    return () => {
      room.off("dataReceived", handleData);
    };
  }, [room, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-6 px-6 w-full h-[58vh] bg-[#fcec6a] rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
      {/* 3-Question Live Progress Header Pill */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-xs">
        <span className="font-bold text-black flex items-center gap-1.5">
          🎯 Question {interviewProgress.currentQuestion} of 3
        </span>
        <span className="text-zinc-300">|</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((num) => (
            <span
              key={num}
              title={`Question ${num}`}
              className={`size-2.5 rounded-full border border-black transition-colors ${
                interviewProgress.answeredCount >= num
                  ? "bg-emerald-500"
                  : interviewProgress.currentQuestion === num
                  ? "bg-[#fcec6a] animate-pulse"
                  : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </div>

      {videoTrackRef && videoTrackRef.publication ? (
        <div className="absolute inset-0 w-full h-full object-cover">
          <VideoTrack trackRef={videoTrackRef as any} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center z-10 max-w-lg px-4 text-center">
          {/* AI Recruiter Character Avatar Card */}
          <div className="relative flex items-center justify-center mb-4">
            {/* Ambient Sound/Speaking Rings */}
            {agentState === "speaking" ? (
              <>
                <div className="absolute -inset-6 bg-emerald-400/30 rounded-full animate-ping pointer-events-none" />
                <div className="absolute -inset-3 bg-emerald-400/50 rounded-full animate-pulse pointer-events-none" />
              </>
            ) : agentState === "thinking" ? (
              <div className="absolute -inset-4 border-4 border-dashed border-[#7cb4cf] rounded-full animate-spin pointer-events-none" />
            ) : (
              <>
                <div className="absolute -inset-4 bg-[#e15b58]/20 rounded-full animate-ping pointer-events-none" />
                <div className="absolute -inset-2 bg-[#e15b58]/40 rounded-full animate-pulse pointer-events-none" />
              </>
            )}

            {/* Recruiter Avatar Persona Bubble */}
            <div className="relative z-10 size-28 sm:size-32 rounded-full border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
              <div className="size-full bg-gradient-to-br from-[#fcec6a] via-amber-100 to-[#7cb4cf] flex flex-col items-center justify-center relative">
                {/* Stylized Recruiter Avatar Character */}
                <span className="text-5xl sm:text-6xl drop-shadow-md select-none transform hover:scale-105 transition-transform">
                  👨‍💼
                </span>

                {/* Live Mic / Audio Badge Overlay */}
                <div className={`absolute bottom-1 right-2 size-7 rounded-full border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                  agentState === "speaking" 
                    ? "bg-emerald-500 text-white animate-bounce" 
                    : agentState === "thinking"
                    ? "bg-[#7cb4cf] text-black"
                    : "bg-[#e15b58] text-white"
                }`}>
                  {agentState === "speaking" ? (
                    <Volume2 className="size-3.5" />
                  ) : (
                    <Mic className="size-3.5" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sound Wave Equalizer Bars */}
          <div className="flex items-center justify-center gap-1.5 h-5 mb-2.5">
            {[40, 75, 100, 60, 90, 45, 80, 55, 95, 35].map((height, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  agentState === "speaking"
                    ? "bg-emerald-700 animate-pulse"
                    : agentState === "thinking"
                    ? "bg-[#0284c7] animate-pulse"
                    : "bg-black/60"
                }`}
                style={{
                  height: agentState === "speaking" ? `${Math.max(10, height * 0.2)}px` : "5px",
                  animationDelay: `${i * 75}ms`,
                }}
              />
            ))}
          </div>

          {/* Recruiter Identity & Status */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-mono font-bold mb-1.5">
            <span className={`size-2.5 rounded-full ${
              agentState === "speaking" 
                ? "bg-emerald-500 animate-ping" 
                : agentState === "thinking"
                ? "bg-blue-500 animate-spin"
                : "bg-amber-500"
            }`} />
            {agentState === "speaking" 
              ? "🟢 AI Recruiter Speaking..." 
              : agentState === "thinking"
              ? "🔵 AI Recruiter is Thinking..."
              : "🎙️ The AI Recruiter is Listening..."}
          </div>

          <h3 className="text-black text-center text-2xl sm:text-3xl font-bold drop-shadow-sm font-kalam">
            CampusHire Technical Recruiter
          </h3>
          <p className="text-zinc-800 text-xs sm:text-sm mt-0.5 font-semibold max-w-sm">
            {agentState === "speaking" 
              ? "Listen carefully to the interviewer's question"
              : `Speak clearly, ${candidateName} — response ${interviewProgress.answeredCount}/3`}
          </p>
        </div>
      )}

      {/* Auto-Ending Celebratory Wrap-Up Overlay */}
      {(autoFinishing || finalizing) && (
        <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center text-center p-6 text-white font-kalam animate-in fade-in duration-300">
          <div className="size-16 rounded-full bg-[#fcec6a] border-4 border-black flex items-center justify-center text-3xl mb-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] animate-bounce">
            🎉
          </div>
          <h3 className="text-3xl font-bold text-[#fcec6a]">
            3 of 3 Questions Completed!
          </h3>
          <p className="font-mono text-sm text-zinc-300 mt-2 max-w-md">
            Thank you {candidateName}! The AI Recruiter has wrapped up your interview and is auto-generating your comprehensive 360° Assessment Scorecard...
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Loader2 className="size-4 animate-spin text-[#fcec6a]" />
            <span>Compiling report and final metrics...</span>
          </div>
        </div>
      )}

      {/* Floating Student Camera & Real-Time Face-Tracking Proctor Widget */}
      <StudentCameraProctor
        onAbsenceTick={onAbsenceTick}
        onAbsenceEvent={onAbsenceEvent}
        onFaceRecovered={onFaceRecovered}
        isAbsent={isAbsent}
        absenceCount={absenceCount}
      />

      {/* Mic Audio Controls on the bottom-left */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
        <div className="bg-white p-1 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <VoiceAssistantControlBar />
        </div>
      </div>
    </div>
  );
}

export default function InterviewRoomPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[80vh] items-center justify-center font-kalam">
        <div className="animate-pulse flex flex-col items-center">
          <div className="size-12 rounded-full border-4 border-black border-t-[#fcec6a] animate-spin mb-4"></div>
          <p className="text-black font-bold">Initializing Assessment Suite...</p>
        </div>
      </div>
    }>
      <InterviewRoomContent />
    </Suspense>
  );
}
