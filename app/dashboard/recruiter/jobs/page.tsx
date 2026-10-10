"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { authClient } from "@/lib/auth/client"
import { Loader2, Briefcase, Sparkles, Mail, Star, ExternalLink } from "lucide-react"

export default function PostJobPage() {
  const [title, setTitle] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [location, setLocation] = useState("")
  const [employmentType, setEmploymentType] = useState("Full-time")
  const [salaryRange, setSalaryRange] = useState("")
  const [description, setDescription] = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const [postedJobs, setPostedJobs] = useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = useState(true)

  // AI Matching States
  const [isMatching, setIsMatching] = useState(false)
  const [matchingJob, setMatchingJob] = useState<any>(null)
  const [matchedCandidates, setMatchedCandidates] = useState<any[]>([])
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([])
  const [isInviteSent, setIsInviteSent] = useState(false)

  const fetchJobs = async () => {
    setLoadingJobs(true);
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
      const res = await fetch(`${backendUrl}/api/jobs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setPostedJobs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJobs(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, [])

  const handleAddSkill = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()])
      setSkillInput("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !companyName || !location || !description || skills.length === 0) {
      setError("Please fill out all required fields and add at least one skill.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      let tokenData;
      try {
        const res = await authClient.token();
        tokenData = res.data;
      } catch (err) {
        throw new Error("Authentication failed. Please log in again.");
      }
      const token = tokenData?.token;

      if (!token) throw new Error("Authentication failed. Please log in again.");

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      const res = await fetch(`${backendUrl}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          companyName,
          location,
          employmentType,
          salaryRange,
          description,
          requirements: skills.join(", "),
        })
      });

      if (!res.ok) throw new Error("Failed to post job");

      setSuccess(true);
      setTitle("");
      setCompanyName("");
      setLocation("");
      setEmploymentType("Full-time");
      setSalaryRange("");
      setDescription("");
      setSkills([]);
      
      // Refresh the jobs list
      fetchJobs();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const runAiMatching = async (job: any) => {
    setMatchingJob(job);
    setIsMatching(true);
    setMatchedCandidates([]);
    setSelectedCandidates([]);
    setIsInviteSent(false);

    try {
      const token = localStorage.getItem("authToken");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/jobs/${job.id}/match`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const matches = await res.json();
        setMatchedCandidates(matches);
        // Auto-select all by default
        setSelectedCandidates(matches.map((m:any) => m.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsMatching(false);
    }
  }

  const toggleCandidateSelection = (id: number) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  }

  const toggleSelectAll = () => {
    if (selectedCandidates.length === matchedCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(matchedCandidates.map(c => c.id));
    }
  }

  const sendInvites = () => {
    if (selectedCandidates.length === 0) return;
    setIsInviteSent(true);
    setTimeout(() => {
      setMatchingJob(null);
      setIsInviteSent(false);
    }, 2000);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Management</h1>
        <p className="text-muted-foreground">Post new jobs and manage your active listings.</p>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">My Posted Jobs</TabsTrigger>
          <TabsTrigger value="post">Post a New Job</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Jobs</CardTitle>
              <CardDescription>View and manage the jobs you've posted.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingJobs ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : postedJobs.length === 0 ? (
                <div className="text-center p-12 border rounded-lg border-dashed">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No jobs posted yet</h3>
                  <p className="text-muted-foreground mt-2">Create your first job posting to start matching with candidates.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {postedJobs.map((job) => (
                    <div key={job.id} className="p-4 border rounded-lg hover:border-blue-500 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <p className="text-sm font-medium text-foreground">{job.companyName}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                            {job.location} • {job.employmentType}
                            {job.salaryRange && ` • 💰 ${job.salaryRange}`}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements.split(',').map((req: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{req.trim()}</Badge>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => runAiMatching(job)} className="gap-2 bg-[#7cb4cf]/10 text-blue-700 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-kalam font-bold">
                          <Sparkles className="h-4 w-4" />
                          Find Candidates
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="post" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Fill out the requirements for the AI matching algorithm.</CardDescription>
            </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 text-sm text-red-500 bg-red-100 rounded-md">{error}</div>}
            {success && <div className="p-3 text-sm text-green-600 bg-green-100 rounded-md">Job successfully posted!</div>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="e.g. TechCorp Inc."
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g. Remote, NY"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <select 
                  id="employmentType"
                  value={employmentType}
                  onChange={e => setEmploymentType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryRange">Salary Range</Label>
                <Input
                  id="salaryRange"
                  placeholder="e.g. $100k - $130k"
                  value={salaryRange}
                  onChange={e => setSalaryRange(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the responsibilities..."
                className="min-h-[120px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a skill and press enter or click Add..."
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddSkill(e);
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddSkill}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map(skill => (
                  <Badge key={skill} variant="outline" className="px-3 py-1 flex gap-1 items-center">
                    {skill}
                    <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-muted-foreground hover:text-foreground ml-1">
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Publish Job
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* AI Candidates Match Modal */}
      <Dialog open={matchingJob !== null} onOpenChange={(open) => !open && setMatchingJob(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <div className="p-6 pb-4 border-b-2 border-black flex items-center justify-between bg-gray-50">
            <div>
              <DialogTitle className="text-2xl font-kalam font-bold flex items-center gap-2">
                Matched Candidates
                {matchedCandidates.length > 0 && !isMatching && (
                  <Badge variant="outline" className="border-2 border-black ml-2 font-sans bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {matchedCandidates.length} matches
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                AI-ranked candidates for {matchingJob?.title}
              </DialogDescription>
            </div>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
            {isMatching ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="animate-spin mb-4">
                  <Sparkles className="size-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-kalam font-bold mb-2">AI is analyzing profiles...</h3>
                <p className="text-muted-foreground max-w-sm">Comparing your job requirements against our talent pool to find the perfect fit.</p>
              </div>
            ) : matchedCandidates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl font-kalam font-bold text-gray-400">No matches found yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4 bg-white p-3 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={selectedCandidates.length === matchedCandidates.length} 
                      onCheckedChange={toggleSelectAll} 
                      className="border-2 border-black data-[state=checked]:bg-[#fcec6a] data-[state=checked]:text-black size-5 rounded-sm"
                    />
                    <span className="font-bold font-kalam">Select All</span>
                    <span className="text-muted-foreground text-sm">({selectedCandidates.length} selected)</span>
                  </div>
                  <Button 
                    onClick={sendInvites} 
                    disabled={selectedCandidates.length === 0 || isInviteSent}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform"
                  >
                    {isInviteSent ? (
                      <>Invites Sent! 🚀</>
                    ) : (
                      <>
                        <Mail className="size-4 mr-2" />
                        Send Invite ({selectedCandidates.length})
                      </>
                    )}
                  </Button>
                </div>

                {matchedCandidates.map((candidate, idx) => (
                  <div key={candidate.id} className="flex gap-4 p-4 bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative transition-all">
                    <div className="pt-1">
                      <Checkbox 
                        checked={selectedCandidates.includes(candidate.id)} 
                        onCheckedChange={() => toggleCandidateSelection(candidate.id)} 
                        className="border-2 border-black data-[state=checked]:bg-[#fcec6a] data-[state=checked]:text-black size-5 rounded-sm"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-[#fcec6a] border-2 border-black flex items-center justify-center font-bold text-xl font-kalam shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {candidate.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg font-kalam leading-tight">{candidate.name}</h4>
                              {candidate.isTopMatch && (
                                <Badge className="bg-[#fcec6a] text-black border-2 border-black hover:bg-[#fcec6a] px-2 py-0.5 text-[10px] uppercase font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                  Top Match
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {candidate.degree || "Software Developer"} - {candidate.university || "University"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-xl text-green-600 block leading-tight">{candidate.matchScore}%</span>
                          <div className="w-16 h-2 bg-gray-200 border border-black rounded-full mt-1 overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: `${candidate.matchScore}%` }} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm italic text-gray-700 bg-gray-50 border-l-4 border-blue-400 p-2 rounded-r flex gap-2">
                        <span className="text-gray-400">"</span>
                        {candidate.matchSummary}
                        <span className="text-gray-400">"</span>
                        <ExternalLink className="size-3 mt-0.5 ml-auto text-blue-500 cursor-pointer shrink-0" />
                      </div>
                      
                      {candidate.skills && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {candidate.skills.split(',').slice(0, 5).map((skill: string, i: number) => (
                            <Badge key={i} variant="outline" className="border-black/30 text-xs py-0 bg-white">
                              {skill.trim()}
                            </Badge>
                          ))}
                          {candidate.skills.split(',').length > 5 && (
                            <span className="text-xs text-muted-foreground pt-0.5 pl-1">+{candidate.skills.split(',').length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t-2 border-black flex justify-center bg-gray-50">
            <Button variant="ghost" onClick={() => runAiMatching(matchingJob)} disabled={isMatching} className="font-kalam text-muted-foreground hover:text-black">
              <Sparkles className="size-4 mr-2" />
              Re-run AI Matching
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
