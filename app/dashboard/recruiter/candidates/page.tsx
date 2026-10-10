"use client"

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
import { FileTextIcon } from "lucide-react"

const MOCK_CANDIDATES = [
  { id: 1, name: "Alice Smith", role: "Frontend Engineer", score: 95, status: "Interview Completed" },
  { id: 2, name: "Bob Johnson", role: "Fullstack Developer", score: 88, status: "Pending Interview" },
  { id: 3, name: "Charlie Davis", role: "Frontend Engineer", score: 82, status: "Rejected" },
  { id: 4, name: "Diana Prince", role: "UI/UX Developer", score: 98, status: "Offer Extended" },
]

export default function RecruiterCandidatesPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
        <p className="text-muted-foreground">Manage and review applicants based on AI matchmaking.</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate Name</TableHead>
              <TableHead>Applied Role</TableHead>
              <TableHead>AI Match Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CANDIDATES.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell className="font-medium">{candidate.name}</TableCell>
                <TableCell>{candidate.role}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden max-w-[100px]">
                      <div 
                        className="bg-primary h-full" 
                        style={{ width: `${candidate.score}%` }} 
                      />
                    </div>
                    <span className="text-sm font-medium">{candidate.score}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    candidate.status.includes("Offer") ? "default" :
                    candidate.status.includes("Rejected") ? "destructive" : "secondary"
                  }>
                    {candidate.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    <FileTextIcon className="mr-2 size-4" /> View Report
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
