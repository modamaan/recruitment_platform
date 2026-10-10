"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Download, CheckCircle, XCircle } from "lucide-react"

export default function InterviewReportPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Interview Report</h1>
          <p className="text-muted-foreground">Candidate: Alice Smith | Role: Frontend Engineer</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>AI Recommendation</CardTitle>
            <CardDescription>Based on the technical screen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="mx-auto w-32 h-32 rounded-full border-8 border-primary flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">95%</span>
            </div>
            <div>
              <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 px-4 py-1 text-sm font-semibold rounded-full border-0">
                Strong Hire
              </Badge>
            </div>
            
            <div className="space-y-4 pt-4 text-left border-t">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Technical Skills</span>
                  <span className="font-medium">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Communication</span>
                  <span className="font-medium">98%</span>
                </div>
                <Progress value={98} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Problem Solving</span>
                  <span className="font-medium">95%</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detailed Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Strengths
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Alice demonstrated an exceptional understanding of React fundamentals, including hooks, lifecycle management, and context. She was able to clearly articulate the difference between Server and Client components in Next.js.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-amber-500" /> Areas for Improvement
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Slight hesitation when discussing advanced state management libraries (like Redux or Zustand), though she is highly proficient in context API.
              </p>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-4">Transcript Snippet</h3>
              <div className="bg-muted/50 p-4 rounded-lg space-y-4 text-sm font-mono">
                <p><span className="font-semibold text-primary">AI:</span> Can you explain how you would optimize a slow-rendering list in React?</p>
                <p><span className="font-semibold">Alice:</span> I would first use the React Profiler to identify the bottleneck. Then, I'd likely implement virtual scrolling using a library like react-window if the list is massive. I'd also ensure child components are memoized using React.memo to prevent unnecessary re-renders.</p>
                <p><span className="font-semibold text-primary">AI:</span> Excellent approach. What about key management in that list?</p>
                <p><span className="font-semibold">Alice:</span> Yes, using unique, stable IDs for the key prop is crucial...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
