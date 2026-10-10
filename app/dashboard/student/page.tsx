import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, FileText, Activity, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function StudentDashboardOverview() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-5xl font-bold tracking-tight font-kalam mb-2">Welcome back, John! 👋</h1>
        <p className="text-gray-600 font-mono">Here is an overview of your recruitment journey.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Strength</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">85%</div>
            <p className="text-xs text-muted-foreground">Resume parsed successfully</p>
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
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Ready for your next interview?</CardTitle>
            <CardDescription>You have a pending technical screen for TechCorp Inc.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/student/interview">
              <Button className="w-full sm:w-auto">
                Join AI Interview Room <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update your Resume</CardTitle>
            <CardDescription>Ensure your skills are up to date for better matches.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/student/profile">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
