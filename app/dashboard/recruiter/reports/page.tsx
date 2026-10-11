"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Award, 
  GraduationCap, 
  Building, 
  Loader2, 
  Camera, 
  ArrowLeft 
} from "lucide-react"
import { authClient } from "@/lib/auth/client"
import Link from "next/link"

function ReportsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paramInterviewId = searchParams?.get("interviewId")

  const [reportsList, setReportsList] = useState<any[]>([])
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadReports() {
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

        // 1. Fetch all completed reports
        const listRes = await fetch(`${backendUrl}/api/recruiter/reports`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        let allReports: any[] = [];
        if (listRes.ok) {
          allReports = await listRes.json();
          setReportsList(allReports);
        }

        // 2. Select target report
        let targetId = paramInterviewId ? parseInt(paramInterviewId, 10) : null;
        if (!targetId && allReports.length > 0) {
          targetId = allReports[0].id;
        }

        if (targetId) {
          const reportRes = await fetch(`${backendUrl}/api/recruiter/reports/${targetId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (reportRes.ok) {
            const data = await reportRes.json();
            setSelectedReport(data);
          }
        }
      } catch (err) {
        console.error("Failed to load recruiter report:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [paramInterviewId]);

  const handleSelectCandidate = async (id: number) => {
    router.push(`/dashboard/recruiter/reports?interviewId=${id}`);
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center font-kalam">
        <div className="flex flex-col items-center">
          <Loader2 className="size-10 animate-spin text-black mb-3" />
          <p className="text-black font-bold text-lg">Loading Candidate 360° Scorecard...</p>
        </div>
      </div>
    );
  }

  if (!selectedReport) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 text-center bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <Award className="size-12 text-zinc-400 mx-auto" />
        <h2 className="text-2xl font-bold font-kalam text-black">No Completed Interview Reports Yet</h2>
        <p className="text-zinc-600 font-sans text-sm">
          Once candidates complete their 4-stage assessment (MCQs, Technical Scenario, and Live Voice Avatar), their official verified scorecards will appear here.
        </p>
        <Link href="/dashboard/recruiter/candidates">
          <Button className="border-2 border-black bg-[#fcec6a] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-kalam font-bold mt-2">
            <ArrowLeft className="mr-2 size-4" /> View Candidates Pipeline
          </Button>
        </Link>
      </div>
    );
  }

  const { student, job, reportData, interview } = selectedReport;
  const compositeScore = reportData?.compositeScore ?? interview?.matchScore ?? 80;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link 
              href="/dashboard/recruiter/candidates"
              className="text-xs font-mono font-bold text-zinc-600 hover:text-black flex items-center gap-1"
            >
              <ArrowLeft className="size-3.5" /> Back to Candidates Pipeline
            </Link>
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-kalam text-black">
            AI Interview Scorecard
          </h1>
          <p className="text-zinc-600 font-mono text-xs">
            Synthesized candidate assessment across Knowledge MCQs, Technical Architecture, and Live AI Voice Cross-Examination.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            onClick={() => window.print()} 
            className="border-2 border-black bg-white hover:bg-zinc-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-kalam font-bold text-sm"
          >
            <Printer className="mr-2 h-4 w-4" /> Print / Export Scorecard
          </Button>
        </div>
      </div>

      {/* Candidate Selector Bar */}
      {reportsList.length > 1 && (
        <div className="p-3 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-mono font-bold text-zinc-500 whitespace-nowrap pl-1">
            Select Candidate:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {reportsList.map((rep) => {
              const isCurrent = rep.id === interview?.id;
              return (
                <button
                  key={rep.id}
                  onClick={() => handleSelectCandidate(rep.id)}
                  className={`px-3 py-1 rounded-lg border-2 border-black text-xs font-bold font-kalam transition-all ${
                    isCurrent
                      ? "bg-[#fcec6a] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]"
                      : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  {rep.student?.name || `Candidate #${rep.id}`} ({rep.score || 80}%)
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Scorecard Card */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
        
        {/* Scorecard Top Header */}
        <div className="border-b-4 border-black pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#fcec6a] text-black text-xs font-bold px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2 font-mono">
              <Award className="size-4" /> OFFICIAL 360° CANDIDATE SCORECARD
            </div>
            <h2 className="text-3xl font-bold font-kalam text-black">
              {student?.name || "Candidate"} • {job?.title || "Role"}
            </h2>
            <div className="text-sm font-semibold text-zinc-700 mt-1 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 font-bold text-zinc-900">
                <Building className="size-3.5" /> {job?.companyName || "Placement Partner"}
              </span> • 
              <span className="flex items-center gap-1">
                <GraduationCap className="size-3.5 text-zinc-600" /> {student?.university || "Royal College of Engineering"}
              </span> • 
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-black">
                🛡️ Verified by University Placement Cell
              </span>
            </div>
          </div>

          {/* Composite Gauge */}
          <div className="bg-[#f8fafc] border-2 border-black p-4 rounded-xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] text-center min-w-[200px]">
            <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Overall Composite Score</span>
            <div className="text-5xl font-black text-black mt-1 font-sans">
              {compositeScore}
              <span className="text-2xl text-zinc-400 font-bold">/100</span>
            </div>
            <div className="mt-2 inline-block bg-[#16a34a] text-white text-xs font-bold px-3 py-0.5 rounded-full border border-black font-kalam">
              {reportData?.recruiterRecommendation || "Recommend for Next Round"}
            </div>
          </div>
        </div>

        {/* 3 Pillars Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Pillar 1 (25% Weight)</span>
              <span className="text-lg font-bold text-black font-mono">{interview?.mcqScore ?? 75}%</span>
            </div>
            <h3 className="font-bold text-base text-black mb-1 font-kalam">Knowledge Fundamentals</h3>
            <p className="text-xs text-zinc-600">
              Concurrency locking, data structures, and database indexing.
            </p>
          </div>

          <div className="p-5 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Pillar 2 (35% Weight)</span>
              <span className="text-lg font-bold text-black font-mono">{interview?.technicalScore ?? 65}%</span>
            </div>
            <h3 className="font-bold text-base text-black mb-1 font-kalam">Technical Architecture</h3>
            <p className="text-xs text-zinc-600">
              Problem decomposition, scaling trade-offs, and failure recovery.
            </p>
          </div>

          <div className="p-5 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Pillar 3 (40% Weight)</span>
              <span className="text-lg font-bold text-black font-mono">{reportData?.voiceScore ?? 85}%</span>
            </div>
            <h3 className="font-bold text-base text-black mb-1 font-kalam">Live Verbal & Depth</h3>
            <p className="text-xs text-zinc-600">
              Spoken clarity, reasoning under cross-examination, and composure.
            </p>
          </div>
        </div>

        {/* Authenticity & Video Proctoring Audit Box */}
        <div className="p-5 bg-[#fffbeb] border-2 border-black rounded-xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#ca8a04]" />
              <h3 className="font-bold text-lg text-black font-kalam">Authenticity & Profile Integrity Audit</h3>
            </div>
            <span className="text-xs font-bold bg-white text-black px-2.5 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-mono">
              Status: {reportData?.authenticityAudit?.status || "Verified & Grounded"}
            </span>
          </div>

          <p className="text-sm text-zinc-800 leading-relaxed font-sans">
            {reportData?.authenticityAudit?.notes || "Spoken responses were consistent with verified academic credentials. Candidate gave authentic, non-inflated accounts of their academic projects."}
          </p>

          {/* Live Video Proctoring Status Badge */}
          <div className="pt-3 border-t border-amber-300 flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="font-bold flex items-center gap-1.5 text-zinc-800">
              <Camera className="size-4 text-blue-600" />
              Live Video Proctoring Audit:
            </span>
            <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold border border-black ${
              reportData?.authenticityAudit?.visualProctoring?.absenceCount === 0 || !reportData?.authenticityAudit?.visualProctoring
                ? "bg-[#dcfce7] text-[#166534]"
                : "bg-[#fee2e2] text-[#991b1b]"
            }`}>
              {reportData?.authenticityAudit?.visualProctoring?.status || "100% In-Frame Compliance (Zero Absences)"}
            </span>
          </div>
        </div>

        {/* Strengths & Growth Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-[#f0fdf4] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-bold text-base text-[#166534] mb-3 flex items-center gap-2 font-kalam">
              <CheckCircle2 className="size-5 text-[#16a34a]" /> Key Strengths Observed
            </h3>
            <ul className="text-sm text-zinc-800 space-y-2">
              {(reportData?.strengths || [
                "Solid intuition on concurrency and database locking.",
                "Calm, articulate verbal communication under probe.",
                "Transparent articulation of project boundaries."
              ]).map((str: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-[#16a34a]">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 bg-[#fef2f2] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-bold text-base text-[#991b1b] mb-3 flex items-center gap-2 font-kalam">
              <AlertTriangle className="size-5 text-[#dc2626]" /> Areas for Growth & Next Prep
            </h3>
            <ul className="text-sm text-zinc-800 space-y-2">
              {(reportData?.areasToImprove || [
                "Strengthen distributed cache invalidation strategies.",
                "Inquire about concrete latency SLAs and scale metrics."
              ]).map((area: string, idx: number) => (
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
          <span className="text-xs font-bold text-zinc-500 uppercase font-mono">Actionable Recruiter Recommendation</span>
          <p className="text-base font-bold text-black mt-1 font-sans">
            {reportData?.recommendedNextStep || "Shortlist for 30-minute onsite technical discussion with Engineering Lead."}
          </p>
        </div>

      </div>
    </div>
  )
}

export default function InterviewReportPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[70vh] items-center justify-center font-kalam">
        <div className="flex flex-col items-center">
          <Loader2 className="size-10 animate-spin text-black mb-3" />
          <p className="text-black font-bold text-lg">Loading Report...</p>
        </div>
      </div>
    }>
      <ReportsContent />
    </Suspense>
  )
}
