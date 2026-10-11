"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, FileText, Activity, ArrowRight, CheckCircle2, ShieldCheck, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { authClient } from "@/lib/auth/client"
import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth/token"

export default function StudentDashboardOverview() {
  const { data: session } = authClient.useSession();
  const userName = session?.user?.name?.split(' ')[0] || "Student";
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await authFetch(`${backendUrl}/api/me`);
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  const completionPercentage = profileData ? Math.round((Object.values({
    name: profileData.name || "",
    email: profileData.email || "",
    university: profileData.university || "",
    degree: profileData.degree || "",
    gradYear: profileData.gradYear || "",
    phone: profileData.phone || "",
    skills: profileData.skills || "",
    linkedin: profileData.linkedin || "",
    github: profileData.github || "",
    bio: profileData.bio || ""
  }).filter(v => v !== "").length / 10) * 100) : 0;

  const hasResumeData = completionPercentage > 50;
  const verificationStatus = profileData?.verificationStatus || "pending";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-5xl font-bold tracking-tight font-kalam">Welcome back, {userName}! 👋</h1>
            {verificationStatus === "verified" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                🛡️ Verified by Royal College Placement Cell
              </span>
            )}
            {verificationStatus === "pending" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#fcec6a] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Clock className="size-3.5 text-black" />
                ⏳ Pending Placement Cell Verification
              </span>
            )}
            {verificationStatus === "rejected" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-red-100 text-red-700 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <AlertTriangle className="size-3.5 text-red-600" />
                ⚠️ Changes Requested by Placement Cell
              </span>
            )}
          </div>
          <p className="text-gray-600 font-mono">Royal College of Engineering — Placement & Practice Overview</p>
        </div>
      </div>

      {/* Drive clearance notification strip */}
      {verificationStatus === "pending" && (
        <div className="bg-[#fff9d2] border-2 border-black p-4 rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#fcec6a] border-2 border-black rounded-full shrink-0">
              <Clock className="size-4 text-black" />
            </div>
            <p className="text-sm font-sans text-gray-800">
              <strong>Drive Clearance Model:</strong> Your skills are awaiting Royal College Placement Cell review. AI Mock Interviews are <span className="underline decoration-2">open for unlimited practice</span>, while recruiter matching will activate upon approval.
            </p>
          </div>
          <Link href="/dashboard/student/profile">
            <Button size="sm" variant="outline" className="border-2 border-black bg-white font-kalam text-xs font-bold">
              Check Profile Status →
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Strength</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{profileData ? `${completionPercentage}%` : "..."}</div>
            <p className="text-xs text-muted-foreground">
              {profileData ? (hasResumeData ? "Resume data saved" : "Upload resume to boost matches") : "Loading..."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matched Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 new matches today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Interviews</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Pending AI Voice Screenings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-8">
        <Card className="bg-[#fcec6a]/20 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle>Ready for your next interview?</CardTitle>
            <CardDescription className="text-black/70">You have a pending technical screen for TechCorp Inc.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/student/interview/3">
              <Button className="w-full sm:w-auto border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-kalam">
                Join AI Interview Room <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle>{hasResumeData ? "Review your Profile" : "Update your Resume"}</CardTitle>
            <CardDescription className="text-black/70">
              {hasResumeData ? "Your profile looks great! Keep your skills updated." : "Ensure your skills are up to date for better matches."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/student/profile">
              <Button variant="outline" className="w-full sm:w-auto border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-kalam">
                {hasResumeData ? <><CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> View Profile</> : "Go to Profile"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
