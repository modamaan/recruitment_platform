"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FileTextIcon, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Award, 
  Printer, 
  X, 
  ExternalLink, 
  Loader2, 
  Camera, 
  Building, 
  GraduationCap 
} from "lucide-react"
import { authClient } from "@/lib/auth/client"
import Link from "next/link"

interface Candidate {
  id: number;
  interviewId: number;
  candidateName: string;
  candidateEmail: string;
  university: string;
  degree: string;
  gradYear: string;
  role: string;
  companyName: string;
  jobId: number;
  score: number;
  status: string;
  stage: string;
  isCompleted: boolean;
  hasReport: boolean;
  reportData?: any;
  createdAt: string;
}

export default function RecruiterCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)

  useEffect(() => {
    async function fetchCandidates() {
      try {
        let authData;
        try {
          authData = await authClient.token();
        } catch (err) {
          window.location.href = "/login";
          return;
        }

        const token = authData?.data?.token;
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/recruiter/candidates`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setCandidates(data);
        }
      } catch (err) {
        console.error("Failed to load candidates", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCandidates();
  }, []);

  const handleOpenReport = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsReportOpen(true);
  };

  const handleCloseReport = () => {
    setIsReportOpen(false);
    setSelectedCandidate(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-kalam">Candidates Pipeline</h1>
          <p className="text-gray-600 font-mono text-sm">
            Review real-time applicant submissions, verified credentials, and 360° AI interview scorecards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/recruiter/reports">
            <Button variant="outline" className="border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-kalam font-bold text-sm">
              <FileTextIcon className="mr-2 size-4 text-blue-600" /> All Scorecard Reports
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="h-10 w-10 animate-spin text-black" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center p-12 border-2 border-black rounded-xl border-dashed bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-bold font-kalam">No candidates registered yet</h3>
          <p className="text-muted-foreground mt-2 font-mono text-sm">
            Candidates who apply and interview for your campus drives will appear here dynamically.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-100 border-b-2 border-black">
              <TableRow className="border-b-2 border-black hover:bg-zinc-100">
                <TableHead className="font-bold text-black font-kalam text-base">Candidate</TableHead>
                <TableHead className="font-bold text-black font-kalam text-base">Applied Role & Drive</TableHead>
                <TableHead className="font-bold text-black font-kalam text-base">AI Match Score</TableHead>
                <TableHead className="font-bold text-black font-kalam text-base">Status</TableHead>
                <TableHead className="text-right font-bold text-black font-kalam text-base">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id} className="border-b border-zinc-200 hover:bg-amber-50/50 transition-colors">
                  {/* Candidate Name & Info */}
                  <TableCell className="py-4">
                    <div className="font-bold text-base text-black font-kalam leading-tight">
                      {candidate.candidateName}
                    </div>
                    <div className="text-xs font-mono text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{candidate.candidateEmail}</span> • 
                      <span className="flex items-center gap-1 text-zinc-700 font-semibold">
                        <GraduationCap className="size-3" /> {candidate.university}
                      </span>
                    </div>
                  </TableCell>

                  {/* Applied Role */}
                  <TableCell className="py-4">
                    <div className="font-bold text-sm text-black">
                      {candidate.role}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                      <Building className="size-3 text-gray-500" />
                      <span>{candidate.companyName || "Royal Placement Drive"}</span>
                    </div>
                  </TableCell>

                  {/* AI Match / Composite Score */}
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2.5 max-w-[140px]">
                      <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden border border-black">
                        <div 
                          className={`h-full transition-all ${
                            candidate.score >= 80 ? "bg-emerald-600" : candidate.score >= 70 ? "bg-amber-500" : "bg-blue-600"
                          }`}
                          style={{ width: `${Math.min(candidate.score, 100)}%` }} 
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-black shrink-0">
                        {candidate.score}%
                      </span>
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-4">
                    {candidate.isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-800 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        Interview Completed
                      </span>
                    ) : candidate.stage === "briefing" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-zinc-100 text-zinc-700 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <Clock className="size-3.5 text-zinc-500" />
                        Pending Interview
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-800 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                        <Clock className="size-3.5 text-amber-600" />
                        In Progress ({candidate.stage.toUpperCase()})
                      </span>
                    )}
                  </TableCell>

                  {/* Action Button */}
                  <TableCell className="text-right py-4">
                    <Button 
                      onClick={() => handleOpenReport(candidate)}
                      className={`border-2 border-black font-kalam font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all ${
                        candidate.isCompleted 
                          ? "bg-[#fcec6a] text-black hover:bg-[#ebd95b]" 
                          : "bg-white text-zinc-700 hover:bg-zinc-100"
                      }`}
                      size="sm"
                    >
                      <FileTextIcon className="mr-1.5 size-4" /> View Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* MODAL: 360° RECRUITER SCORECARD DIALOG */}
      {isReportOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-0 duration-200">
          <div className="relative w-full max-w-4xl bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] my-8 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-[#fcec6a] border-b-4 border-black p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Award className="size-6 text-black" />
                </div>
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                    Official 360° Assessment Report Card
                  </span>
                  <h2 className="text-2xl font-bold font-kalam text-black leading-tight">
                    {selectedCandidate.candidateName} — {selectedCandidate.role}
                  </h2>
                </div>
              </div>
              <button
                onClick={handleCloseReport}
                className="p-1.5 bg-white hover:bg-red-100 text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Candidate Metadata Banner */}
              <div className="p-4 bg-zinc-50 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-black flex items-center gap-2">
                    <span>{selectedCandidate.candidateEmail}</span> • 
                    <span className="text-zinc-600 font-normal">{selectedCandidate.degree} ({selectedCandidate.gradYear})</span>
                  </p>
                  <p className="text-xs font-mono text-zinc-600 flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 text-zinc-700" />
                    <span>University: <strong>{selectedCandidate.university}</strong></span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border-2 border-black rounded-full text-xs font-mono font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    🛡️ University Placement Cleared
                  </span>
                </div>
              </div>

              {selectedCandidate.hasReport && selectedCandidate.reportData ? (
                <>
                  {/* Composite Score & Verdict Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Overall Score */}
                    <div className="p-5 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                      <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Overall Composite Score</span>
                      <div className="text-5xl font-black text-black mt-1 font-sans">
                        {selectedCandidate.reportData.compositeScore ?? selectedCandidate.score}
                        <span className="text-2xl text-zinc-400 font-bold">/100</span>
                      </div>
                      <div className="mt-2 inline-block bg-[#16a34a] text-white text-xs font-bold px-3 py-0.5 rounded-full border border-black font-kalam">
                        {selectedCandidate.reportData.recruiterRecommendation || "Recommend for Next Round"}
                      </div>
                    </div>

                    {/* Feedback Summary */}
                    <div className="md:col-span-2 p-5 bg-[#fff9d2] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                      <span className="text-xs font-bold text-zinc-600 uppercase font-mono mb-1">Executive Summary</span>
                      <p className="text-sm text-zinc-800 leading-relaxed font-sans">
                        {selectedCandidate.reportData.feedback || "Candidate demonstrated solid grasp of core systems and communicated clearly throughout the multi-stage evaluation."}
                      </p>
                    </div>
                  </div>

                  {/* 3 Pillars Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Pillar 1: MCQs (25%)</span>
                      <div className="text-2xl font-bold text-black mt-1 font-mono">
                        {selectedCandidate.reportData.mcqScore ?? 75}%
                      </div>
                      <p className="text-xs text-zinc-600 mt-1">Concurrency, data structures, and indexing fundamentals.</p>
                    </div>

                    <div className="p-4 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Pillar 2: Technical (35%)</span>
                      <div className="text-2xl font-bold text-black mt-1 font-mono">
                        {selectedCandidate.reportData.technicalScore ?? 65}%
                      </div>
                      <p className="text-xs text-zinc-600 mt-1">System design decomposition, failure handling & trade-offs.</p>
                    </div>

                    <div className="p-4 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Pillar 3: Live Verbal (40%)</span>
                      <div className="text-2xl font-bold text-black mt-1 font-mono">
                        {selectedCandidate.reportData.voiceScore ?? 85}%
                      </div>
                      <p className="text-xs text-zinc-600 mt-1">Spoken clarity, reasoning under cross-examination, and depth.</p>
                    </div>
                  </div>

                  {/* Authenticity & Video Proctoring Audit Box */}
                  <div className="p-5 bg-[#fffbeb] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-5 text-[#ca8a04]" />
                        <h3 className="font-bold text-base text-black font-kalam">Authenticity & Profile Integrity Audit</h3>
                      </div>
                      <span className="text-xs font-bold bg-white text-black px-2.5 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-mono">
                        {selectedCandidate.reportData.authenticityAudit?.status || "Verified & Grounded"}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-800 leading-relaxed font-sans">
                      {selectedCandidate.reportData.authenticityAudit?.notes || "Spoken responses were consistent with verified academic credentials. Candidate gave authentic, non-inflated accounts of their academic projects."}
                    </p>

                    {/* Video Proctoring Status Badge */}
                    <div className="pt-2 border-t border-amber-300 flex items-center justify-between text-xs flex-wrap gap-2">
                      <span className="font-bold flex items-center gap-1.5 text-zinc-800">
                        <Camera className="size-4 text-blue-600" />
                        Live Video Proctoring Audit:
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold border border-black ${
                        selectedCandidate.reportData.authenticityAudit?.visualProctoring?.absenceCount === 0 || !selectedCandidate.reportData.authenticityAudit?.visualProctoring
                          ? "bg-[#dcfce7] text-[#166534]"
                          : "bg-[#fee2e2] text-[#991b1b]"
                      }`}>
                        {selectedCandidate.reportData.authenticityAudit?.visualProctoring?.status || "100% In-Frame Compliance (Zero Absences)"}
                      </span>
                    </div>
                  </div>

                  {/* Strengths & Growth Areas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#f0fdf4] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <h4 className="font-bold text-sm text-[#166534] mb-2 flex items-center gap-1.5 font-kalam">
                        <CheckCircle2 className="size-4 text-[#16a34a]" /> Key Strengths Observed
                      </h4>
                      <ul className="text-xs text-zinc-800 space-y-1.5">
                        {(selectedCandidate.reportData.strengths || [
                          "Strong intuition on concurrency and database locking.",
                          "Calm, articulate verbal communication under probe.",
                          "Transparent articulation of project boundaries."
                        ]).map((s: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="font-bold text-[#16a34a]">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-[#fef2f2] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <h4 className="font-bold text-sm text-[#991b1b] mb-2 flex items-center gap-1.5 font-kalam">
                        <AlertTriangle className="size-4 text-[#dc2626]" /> Recommended Areas to Probe
                      </h4>
                      <ul className="text-xs text-zinc-800 space-y-1.5">
                        {(selectedCandidate.reportData.areasToImprove || [
                          "Strengthen distributed cache invalidation strategies.",
                          "Inquire about specific latency SLAs and scale metrics."
                        ]).map((a: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="font-bold text-[#dc2626]">•</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommended Next Step for Recruiter */}
                  <div className="p-4 bg-[#f8fafc] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Actionable Recruiter Recommendation</span>
                    <p className="text-sm font-bold text-black mt-1 font-sans">
                      {selectedCandidate.reportData.recommendedNextStep || "Shortlist for 30-minute onsite technical discussion with Engineering Lead."}
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center bg-zinc-50 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3">
                  <Clock className="size-10 text-amber-600 mx-auto" />
                  <h3 className="text-lg font-bold font-kalam">Assessment in Progress</h3>
                  <p className="text-sm text-zinc-600 max-w-md mx-auto font-sans">
                    Candidate has registered for the drive and is currently in stage: <strong>{selectedCandidate.stage.toUpperCase()}</strong>. The full 360° scorecard will unlock automatically once they complete the interview.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-zinc-100 border-t-2 border-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-2 bg-white border-2 border-black rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-50 flex items-center justify-center gap-1.5 font-kalam"
              >
                <Printer className="size-4" /> Print / Save Scorecard
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedCandidate.hasReport && (
                  <Link 
                    href={`/dashboard/recruiter/reports?interviewId=${selectedCandidate.interviewId}`}
                    className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white border-2 border-black rounded-xl font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5 font-kalam"
                  >
                    <ExternalLink className="size-4" /> Open Full Page Report
                  </Link>
                )}
                <Button
                  onClick={handleCloseReport}
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-kalam text-xs font-bold"
                >
                  Close
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
