"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  GraduationCap,
  Building2,
  Mail,
  Phone,
  Globe,
  Code2,
  Loader2,
  Filter,
  UserCheck,
  FileText,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { authFetch } from "@/lib/auth/token";
import { authClient } from "@/lib/auth/client";

interface Student {
  id: number;
  neonUserId: string;
  name: string;
  email: string;
  university?: string | null;
  degree?: string | null;
  gradYear?: string | null;
  phone?: string | null;
  skills?: string | null;
  linkedin?: string | null;
  github?: string | null;
  bio?: string | null;
  projects?: string | null;
  internships?: string | null;
  hackathons?: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

interface Stats {
  totalStudents: number;
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
}

export default function PlacementCellDashboard() {
  const { data: session } = authClient.useSession();
  const officerName = session?.user?.name || "Placement Officer";

  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    pendingCount: 0,
    verifiedCount: 0,
    rejectedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Review Dialog State
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Fetch stats and student directory
  const fetchData = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      const [statsRes, studentsRes] = await Promise.all([
        authFetch(`${backendUrl}/api/placement-cell/stats`),
        authFetch(`${backendUrl}/api/placement-cell/students`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }
    } catch (err) {
      console.error("Failed to fetch placement cell data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter students based on active tab and search query
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Tab filter
      if (activeTab !== "all" && s.verificationStatus !== activeTab) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.name?.toLowerCase().includes(q);
        const matchesEmail = s.email?.toLowerCase().includes(q);
        const matchesSkills = s.skills?.toLowerCase().includes(q);
        const matchesDegree = s.degree?.toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesSkills || matchesDegree;
      }
      return true;
    });
  }, [students, activeTab, searchQuery]);

  // Handle Verify Student
  const handleVerifyStudent = async (studentId: number) => {
    setIsSubmitting(true);
    setActionSuccessMessage(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await authFetch(`${backendUrl}/api/placement-cell/students/${studentId}/verify`, {
        method: "POST",
      });

      if (res.ok) {
        const result = await res.json();
        // Update local state
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? result.student : s))
        );
        if (selectedStudent && selectedStudent.id === studentId) {
          setSelectedStudent(result.student);
        }
        // Refresh stats
        setStats((prev) => ({
          ...prev,
          pendingCount: Math.max(0, prev.pendingCount - (selectedStudent?.verificationStatus === "pending" ? 1 : 0)),
          verifiedCount: prev.verifiedCount + (selectedStudent?.verificationStatus !== "verified" ? 1 : 0),
          rejectedCount: Math.max(0, prev.rejectedCount - (selectedStudent?.verificationStatus === "rejected" ? 1 : 0)),
        }));
        setActionSuccessMessage("🛡️ Campus Drive Clearance Granted successfully!");
        setTimeout(() => {
          setIsReviewOpen(false);
          setActionSuccessMessage(null);
        }, 1200);
      }
    } catch (err) {
      console.error("Error verifying student:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reject / Request Changes
  const handleRejectStudent = async (studentId: number) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason or specific instructions for the student.");
      return;
    }

    setIsSubmitting(true);
    setActionSuccessMessage(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await authFetch(`${backendUrl}/api/placement-cell/students/${studentId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (res.ok) {
        const result = await res.json();
        // Update local state
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? result.student : s))
        );
        if (selectedStudent && selectedStudent.id === studentId) {
          setSelectedStudent(result.student);
        }
        // Refresh stats
        setStats((prev) => ({
          ...prev,
          pendingCount: Math.max(0, prev.pendingCount - (selectedStudent?.verificationStatus === "pending" ? 1 : 0)),
          rejectedCount: prev.rejectedCount + (selectedStudent?.verificationStatus !== "rejected" ? 1 : 0),
          verifiedCount: Math.max(0, prev.verifiedCount - (selectedStudent?.verificationStatus === "verified" ? 1 : 0)),
        }));
        setActionSuccessMessage("⚠️ Profile flagged for revisions. Feedback sent to student.");
        setTimeout(() => {
          setIsReviewOpen(false);
          setActionSuccessMessage(null);
          setRejectionReason("");
        }, 1200);
      }
    } catch (err) {
      console.error("Error rejecting student:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open review modal
  const openReviewModal = (student: Student) => {
    setSelectedStudent(student);
    setRejectionReason(student.rejectionReason || "");
    setActionSuccessMessage(null);
    setIsReviewOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* College Official Placement Header */}
      <div className="bg-[#fffef7] border-2 border-black p-6 rounded-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="size-16 rounded-full bg-[#fcec6a] border-2 border-black flex items-center justify-center font-bold text-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="bg-black text-[#fcec6a] px-2 py-0.5 text-xs font-mono font-bold tracking-wider rounded-sm uppercase">
                  Royal College of Engineering
                </span>
                <span className="bg-[#e2f0d9] text-[#2d6a2d] border border-black px-2 py-0.5 text-xs font-mono font-bold rounded-sm">
                  Drive Clearance System
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-kalam text-black tracking-tight">
                Placement Cell Administrative Desk
              </h1>
              <p className="text-gray-600 font-mono text-xs md:text-sm mt-1">
                Review student credentials, verify project authenticity, and grant campus drive clearance.
              </p>
            </div>
          </div>

          <div className="bg-yellow-50/80 border-2 border-black p-3 rounded text-right shrink-0">
            <p className="text-xs font-mono text-gray-500 uppercase">Logged in Officer</p>
            <p className="font-kalam font-bold text-lg text-black">{officerName}</p>
            <p className="text-[11px] font-mono text-emerald-700 font-semibold">● Placement Admin Active</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Students */}
        <div 
          onClick={() => setActiveTab("all")}
          className={`cursor-pointer bg-white border-2 border-black p-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 ${
            activeTab === "all" ? "ring-2 ring-black bg-yellow-50/30" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-gray-500 uppercase">Total Enrolled</span>
            <GraduationCap className="size-4 text-black" />
          </div>
          <div className="text-3xl font-bold font-kalam">{stats.totalStudents}</div>
          <p className="text-[11px] text-gray-500 font-mono mt-1">Registered candidates</p>
        </div>

        {/* Pending Clearance */}
        <div 
          onClick={() => setActiveTab("pending")}
          className={`cursor-pointer bg-[#fff9d2] border-2 border-black p-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 ${
            activeTab === "pending" ? "ring-2 ring-black" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-amber-900 uppercase">⏳ Pending Review</span>
            <Clock className="size-4 text-amber-700" />
          </div>
          <div className="text-3xl font-bold font-kalam text-amber-900">{stats.pendingCount}</div>
          <p className="text-[11px] text-amber-800 font-mono mt-1">Awaiting verification</p>
        </div>

        {/* Cleared for Drives */}
        <div 
          onClick={() => setActiveTab("verified")}
          className={`cursor-pointer bg-emerald-50 border-2 border-black p-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 ${
            activeTab === "verified" ? "ring-2 ring-black" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-emerald-800 uppercase">🛡️ Drive Cleared</span>
            <ShieldCheck className="size-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-bold font-kalam text-emerald-900">{stats.verifiedCount}</div>
          <p className="text-[11px] text-emerald-700 font-mono mt-1">Live for recruiter matching</p>
        </div>

        {/* Changes Requested */}
        <div 
          onClick={() => setActiveTab("rejected")}
          className={`cursor-pointer bg-red-50 border-2 border-black p-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 ${
            activeTab === "rejected" ? "ring-2 ring-black" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-red-800 uppercase">⚠️ Revisions Needed</span>
            <AlertTriangle className="size-4 text-red-700" />
          </div>
          <div className="text-3xl font-bold font-kalam text-red-900">{stats.rejectedCount}</div>
          <p className="text-[11px] text-red-700 font-mono mt-1">Flagged / Returned profiles</p>
        </div>
      </div>

      {/* Main Review Section */}
      <Card className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-[#fffef7]">
        <CardHeader className="border-b-2 border-black pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-kalam font-bold">
                Student Drive Clearance Roster
              </CardTitle>
              <CardDescription className="font-mono text-xs text-gray-500">
                Inspect self-reported skills, projects, and portfolios before approving recruiter visibility.
              </CardDescription>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 border-2 border-black rounded flex-wrap">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                  activeTab === "all" ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({stats.totalStudents})
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                  activeTab === "pending" ? "bg-[#fcec6a] text-black border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                ⏳ Pending ({stats.pendingCount})
              </button>
              <button
                onClick={() => setActiveTab("verified")}
                className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                  activeTab === "verified" ? "bg-emerald-600 text-white" : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                🛡️ Cleared ({stats.verifiedCount})
              </button>
              <button
                onClick={() => setActiveTab("rejected")}
                className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                  activeTab === "rejected" ? "bg-red-600 text-white" : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                ⚠️ Revisions ({stats.rejectedCount})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="mt-4 relative">
            <Search className="size-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search by student name, roll/email, branch degree, or key skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-2 border-black font-mono text-sm bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="size-10 animate-spin text-black mb-3" />
              <p className="font-kalam font-bold text-lg">Loading candidate directory...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-black/20 rounded-lg">
              <div className="size-16 rounded-full bg-yellow-100 border-2 border-black mx-auto flex items-center justify-center text-2xl mb-3">
                📋
              </div>
              <h3 className="font-kalam font-bold text-2xl">No candidates found in this view</h3>
              <p className="font-mono text-xs text-gray-500 max-w-sm mx-auto mt-1">
                {searchQuery
                  ? `No students match "${searchQuery}". Try a different keyword.`
                  : activeTab === "pending"
                  ? "Great job! All submitted student profiles have been reviewed."
                  : "No students currently in this clearance category."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="bg-white border-2 border-black p-5 rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Student Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="size-12 rounded-full bg-[#fcec6a] border-2 border-black flex items-center justify-center font-bold text-xl font-kalam shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-xl font-kalam text-black truncate">{student.name}</h4>
                        {/* Status Badge */}
                        {student.verificationStatus === "verified" && (
                          <Badge className="bg-emerald-100 text-emerald-900 border border-black hover:bg-emerald-100 text-[10px] font-mono font-bold">
                            🛡️ Verified by Royal College Placement Cell
                          </Badge>
                        )}
                        {student.verificationStatus === "pending" && (
                          <Badge className="bg-[#fcec6a] text-black border border-black hover:bg-[#fcec6a] text-[10px] font-mono font-bold">
                            ⏳ Pending Placement Cell Verification
                          </Badge>
                        )}
                        {student.verificationStatus === "rejected" && (
                          <Badge className="bg-red-100 text-red-900 border border-black hover:bg-red-100 text-[10px] font-mono font-bold">
                            ⚠️ Changes Requested
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs font-mono text-gray-600 mb-2 truncate">
                        {student.degree || "Engineering Degree"} • {student.university || "Royal College of Engineering"} 
                        {student.gradYear ? ` • Class of ${student.gradYear}` : ""}
                      </p>

                      {/* Skills Tags */}
                      {student.skills ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-mono text-gray-500 font-semibold mr-1">Skills:</span>
                          {student.skills.split(",").slice(0, 5).map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] bg-gray-100 border border-black/40 px-2 py-0.5 rounded-sm font-mono text-gray-800"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                          {student.skills.split(",").length > 5 && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              +{student.skills.split(",").length - 5} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No skills listed yet</p>
                      )}

                      {/* Rejection Note Preview if Rejected */}
                      {student.verificationStatus === "rejected" && student.rejectionReason && (
                        <div className="mt-2 text-xs bg-red-50 border-l-2 border-red-500 p-2 font-mono text-red-900">
                          <strong>Note:</strong> {student.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button
                      onClick={() => openReviewModal(student)}
                      className="bg-white hover:bg-gray-50 text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-kalam font-bold text-sm"
                    >
                      <FileText className="size-4 mr-1.5" />
                      Review Profile
                    </Button>

                    {student.verificationStatus !== "verified" ? (
                      <Button
                        onClick={() => handleVerifyStudent(student.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-kalam font-bold text-sm"
                      >
                        <ShieldCheck className="size-4 mr-1.5" />
                        Grant Clearance
                      </Button>
                    ) : (
                      <Button
                        onClick={() => openReviewModal(student)}
                        variant="outline"
                        className="border-2 border-black font-kalam text-xs text-gray-700"
                      >
                        <RotateCcw className="size-3.5 mr-1" />
                        Manage Status
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification & Review Dialog Modal */}
      {selectedStudent && (
        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent className="w-[94vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#fffef7] p-6 font-sans">
            <DialogHeader className="border-b-2 border-black pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="size-14 rounded-full bg-[#fcec6a] border-2 border-black flex items-center justify-center font-bold text-2xl font-kalam shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-kalam font-bold text-black">
                      {selectedStudent.name}
                    </DialogTitle>
                    <DialogDescription className="font-mono text-xs text-gray-600">
                      {selectedStudent.email} • {selectedStudent.phone || "No phone provided"}
                    </DialogDescription>
                  </div>
                </div>

                {/* Status Indicator */}
                <div>
                  {selectedStudent.verificationStatus === "verified" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      🛡️ Verified by Royal College Placement Cell
                    </span>
                  )}
                  {selectedStudent.verificationStatus === "pending" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#fcec6a] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      ⏳ Pending Placement Cell Verification
                    </span>
                  )}
                  {selectedStudent.verificationStatus === "rejected" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-100 text-red-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      ⚠️ Changes Requested
                    </span>
                  )}
                </div>
              </div>
            </DialogHeader>

            {actionSuccessMessage && (
              <div className="p-3 bg-emerald-100 border-2 border-black rounded text-emerald-900 font-bold font-kalam text-sm flex items-center gap-2">
                <Sparkles className="size-4" />
                {actionSuccessMessage}
              </div>
            )}

            {/* Candidate Details Breakdown */}
            <div className="space-y-6 py-4">
              {/* Academic Credentials */}
              <div className="bg-white border-2 border-black p-4 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-kalam font-bold text-lg mb-2 flex items-center gap-2">
                  <GraduationCap className="size-5 text-black" /> Academic Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div>
                    <span className="text-gray-500 block">Institution:</span>
                    <strong className="text-gray-900">{selectedStudent.university || "Royal College of Engineering"}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Major & Degree:</span>
                    <strong className="text-gray-900">{selectedStudent.degree || "B.Tech Computer Science"}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Graduation Year:</span>
                    <strong className="text-gray-900">{selectedStudent.gradYear || "2025"}</strong>
                  </div>
                </div>

                {/* External Profiles */}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-dashed border-gray-300">
                  {selectedStudent.linkedin && (
                    <a
                      href={selectedStudent.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-700 bg-blue-50 border border-blue-400 px-2 py-1 rounded hover:bg-blue-100"
                    >
                      <Globe className="size-3.5" /> LinkedIn Profile <ExternalLink className="size-3" />
                    </a>
                  )}
                  {selectedStudent.github && (
                    <a
                      href={selectedStudent.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-black bg-gray-100 border border-black/40 px-2 py-1 rounded hover:bg-gray-200"
                    >
                      <Code2 className="size-3.5" /> GitHub Profile <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Self-Reported Skills Audit */}
              <div className="bg-white border-2 border-black p-4 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-kalam font-bold text-lg flex items-center gap-2">
                    ⚡ Self-Reported Skills (Audit Target)
                  </h4>
                  <span className="text-xs font-mono text-gray-500">Cross-reference with coursework & projects</span>
                </div>
                {selectedStudent.skills ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedStudent.skills.split(",").map((s, idx) => (
                      <span
                        key={idx}
                        className="bg-[#fcec6a]/40 border-2 border-black font-mono text-xs px-2.5 py-1 rounded-sm font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-gray-500 italic">No skills specified.</p>
                )}
              </div>

              {/* Projects Claims */}
              <div className="bg-white border-2 border-black p-4 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-kalam font-bold text-lg mb-2">🚀 Projects & Portfolio Claims</h4>
                {selectedStudent.projects ? (
                  <p className="font-mono text-xs text-gray-800 leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 border border-dashed border-gray-300 rounded">
                    {selectedStudent.projects}
                  </p>
                ) : (
                  <p className="text-xs font-mono text-gray-400 italic">No project details provided.</p>
                )}
              </div>

              {/* Internships & Hackathons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border-2 border-black p-4 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="font-kalam font-bold text-lg mb-2">💼 Internships & Experience</h4>
                  {selectedStudent.internships ? (
                    <p className="font-mono text-xs text-gray-800 leading-relaxed whitespace-pre-wrap bg-gray-50 p-2.5 border border-dashed border-gray-300 rounded">
                      {selectedStudent.internships}
                    </p>
                  ) : (
                    <p className="text-xs font-mono text-gray-400 italic">No internships listed.</p>
                  )}
                </div>

                <div className="bg-white border-2 border-black p-4 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <h4 className="font-kalam font-bold text-lg mb-2">🏆 Hackathons & Competitions</h4>
                  {selectedStudent.hackathons ? (
                    <p className="font-mono text-xs text-gray-800 leading-relaxed whitespace-pre-wrap bg-gray-50 p-2.5 border border-dashed border-gray-300 rounded">
                      {selectedStudent.hackathons}
                    </p>
                  ) : (
                    <p className="text-xs font-mono text-gray-400 italic">No hackathons listed.</p>
                  )}
                </div>
              </div>

              {/* Rejection / Modification Feedback Box */}
              <div className="bg-red-50/70 border-2 border-black p-4 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-kalam font-bold text-lg text-red-950 mb-1 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-red-600" />
                  Request Changes / Flag Inflated Skills
                </h4>
                <p className="text-xs font-mono text-gray-600 mb-2">
                  If the candidate has added skills without project proof or links, specify required corrections.
                </p>
                <Textarea
                  placeholder="e.g. Please provide live GitHub demo link for your Machine Learning project to verify code authorship before clearance can be granted."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="font-mono text-xs bg-white border-2 border-black"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="border-t-2 border-black pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setIsReviewOpen(false)}
                className="w-full sm:w-auto border-2 border-black font-kalam"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => handleRejectStudent(selectedStudent.id)}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none bg-red-100 hover:bg-red-200 text-red-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-kalam font-bold"
                >
                  <XCircle className="size-4 mr-1.5" />
                  Request Revisions
                </Button>

                <Button
                  onClick={() => handleVerifyStudent(selectedStudent.id)}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-kalam font-bold"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin mr-1.5" />
                  ) : (
                    <ShieldCheck className="size-4 mr-1.5" />
                  )}
                  🛡️ Grant Campus Drive Clearance
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
