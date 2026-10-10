"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UploadCloud, CheckCircle2, FileText, Loader2, X, Sparkles } from "lucide-react"

export default function StudentProfilePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Controlled form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    university: "",
    degree: "",
    gradYear: "",
    phone: "",
    skills: "",
    linkedin: "",
    github: "",
    bio: ""
  });

  const [fillStatus, setFillStatus] = useState<string | null>(null);

  // Fetch initial profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/me`, {
          headers: { 
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || "",
            email: data.email || "",
            university: data.university || "",
            degree: data.degree || "",
            gradYear: data.gradYear || "",
            phone: data.phone || "",
            skills: data.skills || "",
            linkedin: data.linkedin || "",
            github: data.github || "",
            bio: data.bio || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setFillStatus(null);
    try {
      const token = localStorage.getItem("authToken");
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const response = await fetch(`${backendUrl}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFillStatus("Successfully saved profile!");
      } else {
        const errorData = await response.json();
        setFillStatus(`Error: ${errorData.error || "Failed to save changes"}`);
      }
    } catch (err) {
      setFillStatus("Error saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setFillStatus(null);

      const payload = new FormData();
      payload.append("resume", file);

      try {
        const token = localStorage.getItem("authToken");
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const response = await fetch(`${backendUrl}/api/resume/parse`, {
          method: "POST",
          body: payload,
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });

        if (response.ok) {
          const parsedData = await response.json();
          // Merge parsed data over existing form data, favoring new extracted values
          setFormData(prev => ({
            ...prev,
            name: parsedData.name || prev.name,
            email: parsedData.email || prev.email,
            university: parsedData.university || prev.university,
            degree: parsedData.degree || prev.degree,
            gradYear: parsedData.gradYear ? String(parsedData.gradYear) : prev.gradYear,
            phone: parsedData.phone || prev.phone,
            skills: parsedData.skills || prev.skills,
            linkedin: parsedData.linkedin || prev.linkedin,
            github: parsedData.github || prev.github,
            bio: parsedData.bio || prev.bio
          }));
          setUploadedFile(file);
          setFillStatus("Successfully auto-filled profile from resume! (Don't forget to save)");
        } else {
          try {
            const errorData = await response.json();
            setFillStatus(`Error: ${errorData.error}`);
          } catch {
            setFillStatus("Failed to parse resume.");
          }
        }
      } catch (error) {
        console.error("Upload error", error);
        setFillStatus("Error uploading resume.");
      } finally {
        setIsUploading(false);
        e.target.value = ""; // Reset input so the same file can be selected again if it failed
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFillStatus(null);
  };

  // Calculate a mock completion percentage based on filled fields
  const filledFields = Object.values(formData).filter(v => v !== "").length;
  const totalFields = Object.keys(formData).length;
  const completionPercentage = Math.round((filledFields / totalFields) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and resume.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        {/* Main Details Form */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Details</CardTitle>
            <CardDescription>Update your information to improve AI matchmaking.</CardDescription>
            {fillStatus && (
              <div className={`flex items-center gap-2 mt-2 p-2 border-2 border-black rounded text-sm font-bold font-kalam ${fillStatus.includes('Success') ? 'bg-[#fcec6a]/30 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                {fillStatus.includes('Success') ? <Sparkles className="size-4" /> : <X className="size-4" />}
                {fillStatus}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="university">University / College</Label>
                <Input id="university" placeholder="e.g. Stanford University" value={formData.university} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="degree">Degree & Major</Label>
                <Input id="degree" placeholder="e.g. B.S. Computer Science" value={formData.degree} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradYear">Graduation Year</Label>
                <Input id="gradYear" type="number" placeholder="e.g. 2025" value={formData.gradYear} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleInputChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Top Skills (comma separated)</Label>
              <Input id="skills" placeholder="React, Python, Machine Learning, UI/UX..." value={formData.skills} onChange={handleInputChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                <Input id="linkedin" type="url" placeholder="https://linkedin.com/in/username" value={formData.linkedin} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub / Portfolio URL</Label>
                <Input id="github" type="url" placeholder="https://github.com/username" value={formData.github} onChange={handleInputChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Professional Summary</Label>
              <Textarea id="bio" placeholder="Tell us about your career goals and what makes you unique..." className="min-h-[100px]" value={formData.bio} onChange={handleInputChange} />
            </div>

            <Button onClick={saveProfile} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resume Upload</CardTitle>
              <CardDescription>Upload your latest resume for AI parsing.</CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadedFile ? (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-black/20 bg-black/5 rounded-lg text-center hover:bg-black/10 hover:border-black/40 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />

                  {isUploading ? (
                    <>
                      <Loader2 className="size-8 text-black animate-spin mb-3" />
                      <p className="text-sm font-bold font-kalam">Parsing with AI...</p>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-white border-2 border-black rounded-full mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-3">
                        <UploadCloud className="size-6 text-black" />
                      </div>
                      <p className="text-sm font-bold font-kalam mb-1">Click or drag & drop</p>
                      <p className="text-xs text-muted-foreground">PDFs up to 10MB</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-4 border-2 border-black rounded-lg bg-[#fcec6a]/20 flex items-start gap-3">
                  <FileText className="size-8 text-blue-600 mt-1 shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-sm truncate" title={uploadedFile.name}>{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-green-600" />
                      Parsed successfully
                    </p>
                    <Button variant="outline" size="sm" onClick={removeFile} className="h-7 text-xs w-full bg-white">
                      <X className="size-3 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#fcec6a]/30 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Profile Strength</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-black/10 rounded-full h-3 mb-2 border border-black overflow-hidden">
                <div className={`${completionPercentage === 100 ? 'bg-green-500' : 'bg-[#e15b58]'} h-full transition-all duration-1000 ease-out`} style={{ width: `${completionPercentage}%` }}></div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {completionPercentage}% Complete - {completionPercentage === 100 ? "Looking great! You're ready to get matched." : "Upload a resume to automatically fill missing fields!"}
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
