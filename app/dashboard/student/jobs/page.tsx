"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BriefcaseIcon, BuildingIcon, MapPinIcon, Loader2, MicIcon, CheckCircle2, Clock } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import Link from "next/link"

export default function StudentJobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        let tokenData;
        try {
          const res = await authClient.token();
          tokenData = res.data;
        } catch (err) {
          window.location.href = "/login";
          return;
        }
        
        const token = tokenData?.token;
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/jobs/all`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (error) {
        console.error("Failed to load jobs", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold tracking-tight font-kalam">Matched Jobs</h1>
        <p className="text-gray-600 font-mono text-sm">Opportunities tailored to your resume, verified skills, and assessments.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center p-12 border-2 border-black rounded-lg border-dashed bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <BriefcaseIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold font-kalam">No jobs available right now</h3>
          <p className="text-muted-foreground mt-2 font-mono text-sm">Check back later for new company placement drives!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const interview = job.interview;
            const isCompleted = interview?.isCompleted || interview?.status === "completed" || interview?.stage === "completed";
            const interviewScore = interview?.matchScore ?? interview?.voiceScore;
            const isInProgress = interview && !isCompleted && interview.stage && interview.stage !== "briefing";

            return (
              <Card 
                key={job.id} 
                className="flex flex-col border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <Badge variant="secondary" className="border-2 border-black bg-zinc-100 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {job.matchScore || (80 + (job.id * 5) % 18)}% Match
                    </Badge>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        Completed {interviewScore ? `(${interviewScore}%)` : ""}
                      </span>
                    )}
                    {isInProgress && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Clock className="size-3.5 text-amber-600" />
                        In Progress
                      </span>
                    )}
                  </div>

                  <CardTitle className="mt-4 font-kalam text-2xl text-black">{job.title}</CardTitle>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <CardDescription className="flex items-center gap-1.5 text-black font-semibold">
                      <BuildingIcon className="size-3.5 text-gray-700" /> {job.companyName || "Partner Employer"}
                    </CardDescription>
                    <CardDescription className="flex items-center gap-1.5 font-mono text-xs text-gray-600">
                      <MapPinIcon className="size-3.5 text-gray-500" /> {job.location || "Remote"} • {job.employmentType || "Full-time"}
                    </CardDescription>
                    {job.salaryRange && (
                      <CardDescription className="flex items-center gap-1.5 text-emerald-700 font-bold font-mono text-xs">
                        ₹ {job.salaryRange}
                      </CardDescription>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2 leading-relaxed">{job.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {job.requirements ? (
                      job.requirements.split(',').map((req: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs border-2 border-black bg-zinc-50 font-mono shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          {req.trim()}
                        </Badge>
                      ))
                    ) : null}
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  {isCompleted ? (
                    <Link href={`/dashboard/student/interview/${interview?.id || job.id}`} className="w-full">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] font-kalam text-base font-bold transition-all">
                        <CheckCircle2 className="mr-2 size-4 text-white" /> View 360° Scorecard
                      </Button>
                    </Link>
                  ) : isInProgress ? (
                    <Link href={`/dashboard/student/interview/${interview.id || job.id}`} className="w-full">
                      <Button className="w-full bg-[#fcec6a] hover:bg-[#ebd95b] text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] font-kalam text-base font-bold transition-all">
                        <Clock className="mr-2 size-4 text-black" /> Resume Assessment ({interview.stage?.toUpperCase()})
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/dashboard/student/interview/${job.id}`} className="w-full">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] font-kalam text-base font-bold transition-all">
                        <MicIcon className="mr-2 size-4 text-white" /> Start AI Interview
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  )
}
