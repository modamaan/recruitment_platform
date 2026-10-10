"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BriefcaseIcon, BuildingIcon, MapPinIcon, Loader2, MicIcon } from "lucide-react"
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
          // Token fetch failed (e.g., unauthorized), redirect to login
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
        <h1 className="text-3xl font-bold tracking-tight">Matched Jobs</h1>
        <p className="text-muted-foreground">Opportunities tailored to your resume and skills.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center p-12 border rounded-lg border-dashed">
          <BriefcaseIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No jobs available right now</h3>
          <p className="text-muted-foreground mt-2">Check back later for new opportunities!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge variant="secondary">
                    {/* Mock Match Score for now */}
                    {Math.floor(Math.random() * 20) + 80}% Match
                  </Badge>
                </div>
                <CardTitle className="mt-4">{job.title}</CardTitle>
                <div className="flex flex-col gap-1 mt-2">
                  <CardDescription className="flex items-center gap-1 text-foreground font-medium">
                    <BuildingIcon className="size-3.5" /> {job.companyName}
                  </CardDescription>
                  <CardDescription className="flex items-center gap-1">
                    <MapPinIcon className="size-3.5" /> {job.location} • {job.employmentType}
                  </CardDescription>
                  {job.salaryRange && (
                    <CardDescription className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      ₹ {job.salaryRange}
                    </CardDescription>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.requirements.split(',').map((req: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{req.trim()}</Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/dashboard/student/interview/${job.id}`} className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <MicIcon className="mr-2 size-4" /> Start AI Interview
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
