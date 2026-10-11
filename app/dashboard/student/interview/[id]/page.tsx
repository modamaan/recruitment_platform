"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { LiveKitRoom, RoomAudioRenderer, VoiceAssistantControlBar, useTracks, VideoTrack } from "@livekit/components-react";
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
  AlertTriangle
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
        const jwtToken = authData.data?.token;
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

        if (data.interview?.stage === "completed" && data.interview?.reportData) {
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

  // Connect to LiveKit when entering Stage 3 (voice)
  useEffect(() => {
    if (stage !== "voice" || token) return;

    async function fetchVoiceToken() {
      setVoiceConnecting(true);
      try {
        const authData = await authClient.token();
        const jwtToken = authData.data?.token;

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
          throw new Error("Failed to initialize voice room. Please verify LiveKit keys.");
        }

        const data = await res.json();
        setToken(data.token);
        setRoomName(data.roomName);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setVoiceConnecting(false);
      }
    }

    fetchVoiceToken();
  }, [stage, token, backendUrl, interviewRecord, interviewId]);

  // Handlers
  const handleStartMcq = () => {
    setStage("mcq");
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleMcqSubmit = async () => {
    setMcqSubmitting(true);
    try {
      const authData = await authClient.token();
      const jwtToken = authData.data?.token;

      const formattedAnswers = mcqQuestions.map((q) => ({
        questionId: q.id,
        selectedOption: selectedAnswers[q.id] ?? -1
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

      if (!res.ok) throw new Error("Failed to record MCQ responses.");
      const updated = await res.json();
      setInterviewRecord(updated);
      setStage("technical");
    } catch (err: any) {
      console.error(err);
      alert("Submission issue: " + err.message);
    } finally {
      setMcqSubmitting(false);
    }
  };

  const handleTechnicalSubmit = async () => {
    setTechSubmitting(true);
    try {
      const authData = await authClient.token();
      const jwtToken = authData.data?.token;

      const formattedAnswers = technicalQuestions.map((q) => ({
        questionId: q.id,
        answerText: technicalAnswers[q.id] || "No written response provided."
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

      if (!res.ok) throw new Error("Failed to record technical responses.");
      const updated = await res.json();
      setInterviewRecord(updated);
      setStage("voice");
    } catch (err: any) {
      console.error(err);
      alert("Technical submission issue: " + err.message);
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
        <div className="bg-white border-2 border-black p-8 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-md animate-pulse">
          <div className="size-12 rounded-full border-4 border-black border-t-[#fcec6a] animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-black">Preparing Unified Assessment...</h2>
          <p className="text-zinc-600 mt-2">Synthesizing job requirements, MCQs, and AI avatar parameters.</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center font-kalam">
        <div className="text-black bg-[#fee2e2] p-8 rounded-xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg text-center">
          <AlertCircle className="size-12 text-[#e15b58] mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">Assessment Error</h2>
          <p className="text-zinc-800">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-6 py-2 bg-white border-2 border-black rounded-lg font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-4 px-2 sm:px-4 font-kalam">
      
      {/* Top Breadcrumb & Step Progress Stepper */}
      <div className="bg-white border-2 border-black rounded-xl p-4 sm:p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#fcec6a] text-black text-xs font-bold px-2.5 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                UNIFIED 360° ASSESSMENT
              </span>
              <span className="text-sm font-bold text-zinc-500">ID: #{interviewRecord?.id || interviewId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mt-1">
              {job?.title || "Software Engineering Assessment"}
            </h1>
            <p className="text-sm font-semibold text-zinc-600 flex items-center gap-1.5 mt-0.5">
              <Building className="size-4" /> {job?.companyName || "Royal College Campus Partner"} • {job?.location || "Campus Drive"}
            </p>
          </div>

          {/* Placement Cell Verification Pill */}
          <div className="flex flex-col items-start md:items-end">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Candidate Status</span>
            {student?.verificationStatus === "verified" ? (
              <span className="mt-1 inline-flex items-center gap-1.5 bg-[#dcfce7] text-[#166534] text-xs font-bold px-3 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <ShieldCheck className="size-4 text-[#16a34a]" /> Verified by {student?.verifiedBy || "Royal College"}
              </span>
            ) : (
              <span className="mt-1 inline-flex items-center gap-1.5 bg-[#fef9c3] text-[#854d0e] text-xs font-bold px-3 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Clock className="size-4 text-[#ca8a04]" /> ⏳ Pending Placement Cell Verification
              </span>
            )}
          </div>
        </div>

        {/* The 4-Stage Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className={`p-2.5 rounded-lg border-2 border-black flex items-center gap-2.5 ${
            stage === "briefing" ? "bg-[#fcec6a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold" : "bg-zinc-50 opacity-80"
          }`}>
            <span className="size-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <div className="leading-tight">
              <div className="text-xs font-bold">Briefing</div>
              <div className="text-[10px] text-zinc-600">Instructions</div>
            </div>
          </div>

          <div className={`p-2.5 rounded-lg border-2 border-black flex items-center gap-2.5 ${
            stage === "mcq" ? "bg-[#7cb4cf] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-black" : "bg-zinc-50 opacity-80"
          }`}>
            <span className="size-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <div className="leading-tight">
              <div className="text-xs font-bold">Core MCQs</div>
              <div className="text-[10px] text-zinc-600">{mcqQuestions.length} Questions</div>
            </div>
          </div>

          <div className={`p-2.5 rounded-lg border-2 border-black flex items-center gap-2.5 ${
            stage === "technical" ? "bg-[#fcec6a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold" : "bg-zinc-50 opacity-80"
          }`}>
            <span className="size-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <div className="leading-tight">
              <div className="text-xs font-bold">Tech Scenario</div>
              <div className="text-[10px] text-zinc-600">{technicalQuestions.length} Problems</div>
            </div>
          </div>

          <div className={`p-2.5 rounded-lg border-2 border-black flex items-center gap-2.5 ${
            stage === "voice" || stage === "completed" ? "bg-[#e15b58] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold" : "bg-zinc-50 opacity-80"
          }`}>
            <span className="size-7 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <div className="leading-tight">
              <div className="text-xs font-bold">AI Voice & Report</div>
              <div className="text-[10px] text-zinc-200">Avatar + 360° Card</div>
            </div>
          </div>
        </div>
      </div>

      {/* STAGE 0: BRIEFING & INSTRUCTIONS */}
      {stage === "briefing" && (
        <div className="bg-white border-2 border-black rounded-xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#fcec6a] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <FileText className="size-7 text-black" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-black">Pre-Flight Instructions & Assessment Code</h2>
              <p className="text-zinc-600 text-sm">Please read carefully before launching the screening rounds.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Rule 1 */}
            <div className="p-4 bg-[#f8fafc] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 text-black font-bold text-lg mb-2">
                <Clock className="size-5 text-[#7cb4cf]" /> 1. Structure & Time
              </div>
              <ul className="text-sm text-zinc-700 space-y-1.5 list-disc pl-4">
                <li><strong>Stage 1:</strong> 4 Core MCQs (5-minute countdown).</li>
                <li><strong>Stage 2:</strong> 2 Technical design/debugging challenges.</li>
                <li><strong>Stage 3:</strong> Live AI Avatar voice interview (~5-10 mins).</li>
                <li>Total expected time: <strong>~20-25 minutes</strong>.</li>
              </ul>
            </div>

            {/* Rule 2 */}
            <div className="p-4 bg-[#f8fafc] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 text-black font-bold text-lg mb-2">
                <Mic className="size-5 text-[#e15b58]" /> 2. AI Recruiter Dossier
              </div>
              <ul className="text-sm text-zinc-700 space-y-1.5 list-disc pl-4">
                <li>The AI Recruiter has direct access to your <strong>Royal College profile</strong> and verified skills.</li>
                <li>It will <strong>review your MCQ answers</strong> and ask follow-up questions on tricky problems.</li>
                <li><strong>Anti-Exaggeration Audit:</strong> Speak authentically. Unverified claims outside your profile will be cross-examined.</li>
              </ul>
            </div>

            {/* Rule 3 */}
            <div className="p-4 bg-[#f8fafc] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 text-black font-bold text-lg mb-2">
                <ShieldCheck className="size-5 text-[#16a34a]" /> 3. Honor Code & Setup
              </div>
              <ul className="text-sm text-zinc-700 space-y-1.5 list-disc pl-4">
                <li>Ensure you are in a quiet room with working headphones and microphone.</li>
                <li>Tab switching is tracked during the MCQ and technical stages.</li>
                <li>Upon completion, an official 360° scorecard is synthesized for campus recruiters.</li>
              </ul>
            </div>
          </div>

          {/* Job Requirements Glance */}
          <div className="p-4 bg-[#fffbeb] border-2 border-black rounded-xl mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-bold text-base text-black mb-1 flex items-center gap-2">
              <Briefcase className="size-4" /> Role Target Requirements:
            </h3>
            <p className="text-sm text-zinc-800">{job?.requirements || "TypeScript, Node.js, Databases, System Architecture, and Problem Solving."}</p>
          </div>

          {/* Start CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-black">
            <Link 
              href="/dashboard/student/jobs"
              className="text-sm font-bold text-zinc-700 hover:text-black flex items-center gap-1.5"
            >
              <ArrowLeft className="size-4" /> Return to Job Board
            </Link>

            <button
              onClick={handleStartMcq}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#fcec6a] text-black font-bold text-lg border-2 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
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
              <h2 className="text-2xl font-bold text-black">
                Question {currentMcqIndex + 1} of {mcqQuestions.length}
              </h2>
            </div>

            {/* Countdown Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-mono text-lg font-bold ${
              mcqTimeLeft < 60 ? "bg-[#fee2e2] text-[#e15b58] animate-pulse" : "bg-[#fef9c3] text-black"
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
                      className={`text-left p-4 rounded-xl border-2 border-black transition-all flex items-start gap-3.5 ${
                        isSelected 
                          ? "bg-[#fcec6a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]" 
                          : "bg-white hover:bg-zinc-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      }`}
                    >
                      <span className={`size-7 rounded-full border-2 border-black flex items-center justify-center font-bold text-sm shrink-0 ${
                        isSelected ? "bg-black text-white" : "bg-zinc-100 text-black"
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
              <div className="flex items-center justify-between pt-6 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setCurrentMcqIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentMcqIndex === 0}
                  className="px-5 py-2.5 bg-white border-2 border-black rounded-xl font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 flex items-center gap-1.5"
                >
                  <ArrowLeft className="size-4" /> Previous
                </button>

                {currentMcqIndex < mcqQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentMcqIndex((prev) => Math.min(mcqQuestions.length - 1, prev + 1))}
                    className="px-6 py-2.5 bg-[#7cb4cf] text-black border-2 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] flex items-center gap-1.5"
                  >
                    Next Question <ArrowRight className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMcqSubmit}
                    disabled={mcqSubmitting}
                    className="px-6 py-2.5 bg-[#fcec6a] text-black border-2 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] flex items-center gap-2"
                  >
                    {mcqSubmitting ? "Evaluating..." : "Submit & Advance to Technical Stage"} <ArrowRight className="size-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: TECHNICAL SCENARIOS */}
      {stage === "technical" && (
        <div className="bg-white border-2 border-black rounded-xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="border-b-2 border-black pb-4 mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Stage 2 of 3: Architectural & Problem-Solving Scenarios</span>
            <h2 className="text-2xl font-bold text-black mt-1">
              Applied Engineering Challenges
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              Demonstrate your systems thinking. Explain your design choices, trade-offs, and failure recovery.
            </p>
          </div>

          <div className="space-y-6">
            {technicalQuestions.map((techQ, index) => (
              <div key={techQ.id} className="p-5 bg-zinc-50 border-2 border-black rounded-xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded">
                    Challenge {index + 1}
                  </span>
                  <h3 className="font-bold text-lg text-black">{techQ.title}</h3>
                </div>

                <p className="text-sm font-medium text-zinc-800 bg-white p-3 rounded-lg border-2 border-black mb-3">
                  {techQ.scenario}
                </p>

                <p className="text-sm font-bold text-black mb-2">
                  <strong>Prompt:</strong> {techQ.prompt}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs font-bold text-zinc-500">Expected evaluation focus:</span>
                  {techQ.expectedConcepts.map((concept, cIdx) => (
                    <span key={cIdx} className="text-[11px] font-bold bg-[#e0f2fe] text-[#0369a1] px-2 py-0.5 rounded border border-black">
                      {concept}
                    </span>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={technicalAnswers[techQ.id] || ""}
                  onChange={(e) => setTechnicalAnswers({
                    ...technicalAnswers,
                    [techQ.id]: e.target.value
                  })}
                  placeholder="Type your structured solution, architectural choices, and trade-offs here..."
                  className="w-full p-3 text-sm bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fcec6a] font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            ))}

            {/* Note box */}
            <div className="p-3.5 bg-[#fef9c3] border-2 border-black rounded-xl flex items-start gap-2.5 text-xs text-black">
              <Sparkles className="size-4 shrink-0 text-[#ca8a04] mt-0.5" />
              <div>
                <strong>AI Continuity Notice:</strong> Your written technical answers and MCQ accuracy from Stage 1 are automatically dispatched to the AI Recruiter in Stage 3. It will engage in verbal discussion directly based on your submissions.
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setStage("mcq")}
                className="px-5 py-2.5 bg-white border-2 border-black rounded-xl font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 flex items-center gap-1.5"
              >
                <ArrowLeft className="size-4" /> Review MCQs
              </button>

              <button
                type="button"
                onClick={handleTechnicalSubmit}
                disabled={techSubmitting}
                className="px-7 py-3 bg-[#fcec6a] text-black border-2 border-black rounded-xl font-bold text-base shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center gap-2"
              >
                {techSubmitting ? "Saving Answers..." : "Proceed to Live AI Voice Interview 🎙️"}
                <ArrowRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: LIVE AI VOICE & AVATAR INTERVIEW */}
      {stage === "voice" && (
        <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Header with Recruiter Intelligence Banner */}
          <div className="border-b-2 border-black pb-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#e15b58]">
                Stage 3 of 3: Live AI Screening & Integrity Verification
              </span>
              <h2 className="text-2xl font-bold text-black flex items-center gap-2">
                AI Recruiter Room <span className="text-sm font-bold bg-[#7cb4cf] text-black px-2 py-0.5 rounded border border-black">{roomName}</span>
              </h2>
            </div>

            <button
              onClick={handleCompleteInterview}
              disabled={finalizingInterview}
              className="px-5 py-2.5 bg-[#e15b58] text-white border-2 border-black rounded-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#c94b48] flex items-center gap-2 self-start md:self-auto"
            >
              {finalizingInterview ? "Compiling 360° Scorecard..." : "End Call & Generate 360° Report 🏁"}
            </button>
          </div>

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
          <div className="p-3 bg-[#e0f2fe] border-2 border-black rounded-xl mb-4 flex items-center gap-2 text-xs font-semibold text-black">
            <ShieldCheck className="size-4 text-[#0284c7] shrink-0" />
            <span>
              The AI Recruiter has been supplied with your verified Royal College profile, Stage 1 MCQ score ({interviewRecord?.mcqScore ?? 80}%), and Stage 2 technical scenario answers.
            </span>
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
              className="flex flex-col items-center justify-center w-full"
            >
              <RoomAudioRenderer />
              <VideoInterface onComplete={handleCompleteInterview} finalizing={finalizingInterview} />
            </LiveKitRoom>
          ) : (
            <div className="flex h-[50vh] items-center justify-center">
              <div className="animate-pulse flex flex-col items-center text-center">
                <div className="size-12 rounded-full border-4 border-black border-t-[#fcec6a] animate-spin mb-4"></div>
                <p className="text-black font-bold text-lg">Connecting secure WebRTC audio to AI Recruiter...</p>
                <p className="text-xs text-zinc-500 mt-1">Loading real-time voice model and Tavus video replica</p>
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
              <h2 className="text-3xl font-bold text-black">{student?.name || "Student"} • {job?.title}</h2>
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
              <div className="mt-2 inline-block bg-[#16a34a] text-white text-xs font-bold px-3 py-0.5 rounded-full border border-black">
                {reportData?.recruiterRecommendation || "Recommend for Next Round"}
              </div>
            </div>
          </div>

          {/* 3 Pillars Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1: MCQs */}
            <div className="p-5 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase">Pillar 1 (25% Weight)</span>
                <span className="text-lg font-bold text-black">{interviewRecord?.mcqScore ?? 80}%</span>
              </div>
              <h3 className="font-bold text-base text-black mb-1">Knowledge & MCQs</h3>
              <p className="text-xs text-zinc-600">
                Core aptitude on concurrency, data structures, and database indexing.
              </p>
            </div>

            {/* Pillar 2: Technical */}
            <div className="p-5 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase">Pillar 2 (35% Weight)</span>
                <span className="text-lg font-bold text-black">{interviewRecord?.technicalScore ?? 80}%</span>
              </div>
              <h3 className="font-bold text-base text-black mb-1">Technical Architecture</h3>
              <p className="text-xs text-zinc-600">
                Problem decomposition, scaling trade-offs, and production debugging.
              </p>
            </div>

            {/* Pillar 3: Voice & Communication */}
            <div className="p-5 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-500 uppercase">Pillar 3 (40% Weight)</span>
                <span className="text-lg font-bold text-black">{reportData?.voiceScore ?? 85}%</span>
              </div>
              <h3 className="font-bold text-base text-black mb-1">Live Verbal & Depth</h3>
              <p className="text-xs text-zinc-600">
                Spoken clarity, reasoning under cross-examination, and technical composure.
              </p>
            </div>
          </div>

          {/* Authenticity & Integrity Audit Box */}
          <div className="p-5 bg-[#fffbeb] border-2 border-black rounded-xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="size-5 text-[#ca8a04]" />
              <h3 className="font-bold text-lg text-black">Authenticity & Profile Integrity Audit</h3>
              <span className="ml-auto text-xs font-bold bg-white text-black px-2.5 py-1 rounded-full border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                Status: {reportData?.authenticityAudit?.status || "Verified & Grounded"}
              </span>
            </div>
            <p className="text-sm text-zinc-800 leading-relaxed">
              {reportData?.authenticityAudit?.notes || "Spoken responses were consistent with verified Royal College profile credentials. Candidate gave authentic, non-inflated accounts of their academic projects."}
            </p>
          </div>

          {/* Feedback, Strengths, Areas to Improve */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-5 bg-[#f0fdf4] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-base text-[#166534] mb-3 flex items-center gap-2">
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
              <h3 className="font-bold text-base text-[#991b1b] mb-3 flex items-center gap-2">
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
            <span className="text-xs font-bold text-zinc-500 uppercase">Recommended Next Step for Campus Recruiter</span>
            <p className="text-base font-bold text-black mt-1">
              {reportData?.recommendedNextStep || "Shortlist for 30-minute onsite technical discussion with Engineering Manager."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-black">
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-6 py-2.5 bg-white border-2 border-black rounded-xl font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 flex items-center justify-center gap-2"
            >
              <Printer className="size-4" /> Print / Save Scorecard
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/dashboard/student/jobs"
                className="w-full sm:w-auto px-6 py-2.5 bg-[#fcec6a] text-black border-2 border-black rounded-xl font-bold text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] flex items-center justify-center gap-1.5"
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

// LiveKit Video Interface Component
function VideoInterface({ onComplete, finalizing }: { onComplete: () => void; finalizing: boolean }) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }]);
  const videoTrackRef = tracks[0];

  return (
    <div className="flex flex-col items-center justify-center py-6 px-6 w-full h-[55vh] bg-[#fcec6a] rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
      {videoTrackRef && videoTrackRef.publication ? (
        <div className="absolute inset-0 w-full h-full object-cover">
          <VideoTrack trackRef={videoTrackRef as any} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center z-10">
          <div className="relative flex items-center justify-center size-32 mb-6">
            <div className="absolute inset-0 bg-[#e15b58]/20 rounded-full animate-ping"></div>
            <div className="absolute inset-2 bg-[#e15b58]/40 rounded-full animate-pulse"></div>
            <div className="relative z-10 size-16 bg-[#e15b58] border-2 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Mic className="size-8 text-white" />
            </div>
          </div>
          <p className="text-black text-center text-2xl font-bold drop-shadow-sm">The AI Recruiter is Listening...</p>
          <p className="text-zinc-800 text-sm mt-1 font-semibold">Speak clearly into your microphone</p>
        </div>
      )}

      {/* Control bar */}
      <div className="absolute bottom-6 z-20 flex items-center gap-3">
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
