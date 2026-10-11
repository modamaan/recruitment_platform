"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, FileCheck, CheckCircle2, Mail, Activity, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { useEffect, useState } from "react"
import { authFetch } from "@/lib/auth/token"

export default function RecruiterDashboardOverview() {
  const { data: session } = authClient.useSession();
  const userName = session?.user?.name?.split(' ')[0] || "Recruiter";
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await authFetch(`${backendUrl}/api/recruiter/dashboard`);
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatTimeAgo = (timestamp: number) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
    const hoursDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60));
    const minutesDifference = Math.round((timestamp - Date.now()) / (1000 * 60));
    
    if (Math.abs(daysDifference) > 0) return rtf.format(daysDifference, 'day');
    if (Math.abs(hoursDifference) > 0) return rtf.format(hoursDifference, 'hour');
    return rtf.format(minutesDifference, 'minute');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="font-mono text-slate-500">Loading your recruiter dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-blue-600 text-white rounded-xl p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <h1 className="text-4xl font-bold tracking-tight font-kalam mb-2 relative z-10">Welcome back, {userName}! 👋</h1>
        <p className="text-blue-100 font-medium relative z-10">Your AI voice agent is active and screening candidates 24/7. Here's your overview.</p>
        {/* Decorative background element */}
        <div className="absolute -right-10 -top-10 size-64 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Active Jobs</CardTitle>
            <div className="p-2 bg-blue-100 rounded-md border border-black"><Briefcase className="h-4 w-4 text-blue-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-kalam">{dashboardData?.activeJobs || 0}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Total jobs posted</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Total Candidates</CardTitle>
            <div className="p-2 bg-purple-100 rounded-md border border-black"><Users className="h-4 w-4 text-purple-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-kalam">{dashboardData?.totalCandidates || 0}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Sourced automatically</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Interviews Sent</CardTitle>
            <div className="p-2 bg-green-100 rounded-md border border-black"><FileCheck className="h-4 w-4 text-green-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-kalam">{dashboardData?.interviewsSent || 0}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Pending AI screens</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-[#fcec6a]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Completed Screens</CardTitle>
            <div className="p-2 bg-orange-100 rounded-md border border-black"><Activity className="h-4 w-4 text-orange-600" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-kalam text-orange-600">{dashboardData?.completedInterviews || 0}</div>
            <p className="text-xs text-muted-foreground font-medium mt-1">Ready for review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr] mt-4">
        {/* Recent Activity Feed */}
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-bold">Recent Activity</CardTitle>
            <button className="text-sm font-bold text-blue-600 hover:underline">View all →</button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 border-black shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2
                      ${activity.type === 'interview_completed' ? 'bg-green-200 text-green-600' : ''}
                      ${activity.type === 'interview_sent' ? 'bg-blue-200 text-blue-600' : ''}
                      ${activity.type === 'job_posted' ? 'bg-orange-200 text-orange-600' : ''}
                    `}>
                      {activity.type === 'interview_completed' && <CheckCircle2 className="w-3 h-3" />}
                      {activity.type === 'interview_sent' && <Mail className="w-3 h-3" />}
                      {activity.type === 'job_posted' && <Briefcase className="w-3 h-3" />}
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <p className="font-bold text-sm text-slate-800">{activity.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.subtitle}</p>
                      <time className="text-[10px] text-slate-400 font-mono mt-2 block">
                        {formatTimeAgo(activity.timestamp)}
                      </time>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-sm font-mono text-slate-500 relative z-10 bg-white border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded p-4 mx-4">
                  No activity found. Post a job to get started!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-fit">
          <CardHeader>
            <CardTitle className="font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full flex items-center p-3 rounded-xl border-2 border-black bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none text-left">
                <div className="p-2 bg-blue-100 rounded-lg border border-black mr-3">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">Post a Job</p>
                  <p className="text-xs text-muted-foreground">Create a new job listing</p>
                </div>
              </button>

              <button className="w-full flex items-center p-3 rounded-xl border-2 border-black bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none text-left">
                <div className="p-2 bg-purple-100 rounded-lg border border-black mr-3">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">Add Candidate</p>
                  <p className="text-xs text-muted-foreground">Add to your talent pool</p>
                </div>
              </button>

              <button className="w-full flex items-center p-3 rounded-xl border-2 border-black bg-white hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none text-left">
                <div className="p-2 bg-green-100 rounded-lg border border-black mr-3">
                  <FileCheck className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">View Interviews</p>
                  <p className="text-xs text-muted-foreground">Track AI interview results</p>
                </div>
              </button>

              <button className="w-full flex items-center p-3 rounded-xl border-2 border-black bg-[#fcec6a]/40 hover:bg-[#fcec6a]/60 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none text-left">
                <div className="p-2 bg-orange-100 rounded-lg border border-black mr-3">
                  <Activity className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">Configure AI Agent</p>
                  <p className="text-xs text-muted-foreground">Customize interview settings</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
