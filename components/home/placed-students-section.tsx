"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  GraduationCap,
  Award,
  Search,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  ShieldCheck,
  Star,
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PlacedStudent {
  id: string;
  name: string;
  imageUrl: string;
  college: string;
  department: string;
  degree: string;
  gradYear: number;
  company: string;
  companyLogoUrl: string;
  role: string;
  package: string;
  aiScore: number;
  grade: string;
  skills: string[];
  quote: string;
  offerDate: string;
  certificateId: string;
  metrics: {
    technicalSkills: number;
    problemSolving: number;
    systemDesign: number;
    communication: number;
  };
}

export function getCompanyLogoUrl(company: string): string {
  const domainMap: Record<string, string> = {
    Google: "google.com",
    Microsoft: "microsoft.com",
    Stripe: "stripe.com",
    Amazon: "amazon.com",
    "Goldman Sachs": "goldmansachs.com",
    Uber: "uber.com",
    Salesforce: "salesforce.com",
    Databricks: "databricks.com",
    Oracle: "oracle.com",
  };
  const domain = domainMap[company] || `${company.toLowerCase().replace(/\s+/g, "")}.com`;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

const DUMMY_PLACED_STUDENTS: PlacedStudent[] = [
  {
    id: "std-001",
    name: "Aarav Patel",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
    college: "Royal College of Engineering",
    department: "Computer Science (CSE)",
    degree: "B.Tech Computer Science & Engineering",
    gradYear: 2026,
    company: "Google",
    companyLogoUrl: "https://www.google.com/s2/favicons?domain=google.com&sz=128",
    role: "Software Engineer - Core Systems",
    package: "₹45.5 LPA",
    aiScore: 98,
    grade: "A+",
    skills: ["Go", "Distributed Systems", "Kubernetes", "Algorithms"],
    quote: "The AI interviewer probed deep into cache consistency and concurrency protocols. When Google interviewed me, the exact same concepts were tested!",
    offerDate: "28 Sep 2026",
    certificateId: "RCET-CSE-2026-081",
    metrics: {
      technicalSkills: 99,
      problemSolving: 98,
      systemDesign: 97,
      communication: 96,
    },
  },
  {
    id: "std-002",
    name: "Ananya Deshmukh",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    college: "Royal College of Engineering",
    department: "AI & Data Science (AI & DS)",
    degree: "B.Tech Artificial Intelligence & Data Science",
    gradYear: 2026,
    company: "Microsoft",
    companyLogoUrl: "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128",
    role: "AI Research Engineer",
    package: "₹42.0 LPA",
    aiScore: 96,
    grade: "A+",
    skills: ["PyTorch", "LLM Fine-tuning", "Python", "Vector Databases"],
    quote: "Practicing the real-time AI voice interview gave me massive confidence. Instant feedback pinpointed where my explanations lacked clarity.",
    offerDate: "02 Oct 2026",
    certificateId: "RCET-AIDS-2026-114",
    metrics: {
      technicalSkills: 97,
      problemSolving: 96,
      systemDesign: 95,
      communication: 98,
    },
  },
  {
    id: "std-003",
    name: "Rohan Venkatesh",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    college: "Royal College of Engineering",
    department: "Computer Science (CSE)",
    degree: "B.Tech Computer Science & Engineering",
    gradYear: 2026,
    company: "Stripe",
    companyLogoUrl: "https://www.google.com/s2/favicons?domain=stripe.com&sz=128",
    role: "Infrastructure Engineer",
    package: "$145,000 / yr",
    aiScore: 97,
    grade: "A+",
    skills: ["TypeScript", "Ruby", "PostgreSQL", "API Security"],
    quote: "Zero bias, instant feedback, no waiting weeks for invites. Got matched directly through my profile score and landed my dream global offer.",
    offerDate: "15 Sep 2026",
    certificateId: "RCET-CSE-2026-042",
    metrics: {
      technicalSkills: 98,
      problemSolving: 96,
      systemDesign: 98,
      communication: 95,
    },
  },
  {
    id: "std-004",
    name: "Sneha Mukherjee",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    college: "Royal College of Engineering",
    department: "Information Tech (IT)",
    degree: "B.Tech Information Technology",
    gradYear: 2026,
    company: "Amazon",
    companyLogoUrl: "https://www.google.com/s2/favicons?domain=amazon.com&sz=128",
    role: "SDE-1 (AWS Cloud Platform)",
    package: "₹34.0 LPA",
    aiScore: 94,
    grade: "A",
    skills: ["Java", "AWS", "Microservices", "Data Structures"],
    quote: "Our campus placements with AI screening let my verified coding and system design skills speak directly to top recruiters without delays.",
    offerDate: "20 Sep 2026",
    certificateId: "RCET-IT-2026-309",
    metrics: {
      technicalSkills: 95,
      problemSolving: 93,
      systemDesign: 92,
      communication: 96,
    },
  },
  {
    id: "std-005",
    name: "Vikramaditya Rao",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    college: "Royal College of Engineering",
    department: "Electronics & Comm (ECE)",
    degree: "B.Tech Electronics & Communication",
    gradYear: 2026,
    company: "Goldman Sachs",
    companyLogoUrl: "https://www.google.com/s2/favicons?domain=goldmansachs.com&sz=128",
    role: "Quantitative Systems Developer",
    package: "₹38.0 LPA",
    aiScore: 95,
    grade: "A+",
    skills: ["C++", "Low Latency", "Algorithms", "Linear Algebra"],
    quote: "The algorithmic depth of the voice screener tested edge cases in memory management that traditional resume filters completely miss.",
    offerDate: "25 Sep 2026",
    certificateId: "RCET-ECE-2026-173",
    metrics: {
      technicalSkills: 98,
      problemSolving: 96,
      systemDesign: 92,
      communication: 94,
    },
  },
  {
    id: "std-006",
    name: "Meera Krishnan",
    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    college: "Royal College of Engineering",
    department: "Computer Science (CSE)",
    degree: "B.Tech Computer Science & Engineering",
    gradYear: 2026,
    company: "Uber",
    companyLogoUrl: "https://www.google.com/s2/favicons?domain=uber.com&sz=128",
    role: "Frontend Platform Engineer",
    package: "₹36.0 LPA",
    aiScore: 93,
    grade: "A",
    skills: ["Next.js", "React 19", "WebRTC", "Web Performance"],
    quote: "Automated profile matchmaking matched my exact project experiences with Uber's open campus requisition within 24 hours.",
    offerDate: "05 Oct 2026",
    certificateId: "RCET-CSE-2026-210",
    metrics: {
      technicalSkills: 94,
      problemSolving: 92,
      systemDesign: 93,
      communication: 95,
    },
  },
  {
    id: "std-007",
    name: "Karthik Sundaram",
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
    college: "Royal College of Engineering",
    department: "AI & Data Science (AI & DS)",
    degree: "B.Tech AI & Data Science",
    gradYear: 2026,
    company: "Salesforce",
    companyLogoUrl: "https://www.google.com/s2/favicons?domain=salesforce.com&sz=128",
    role: "Platform Software Engineer",
    package: "₹32.5 LPA",
    aiScore: 92,
    grade: "A",
    skills: ["Java", "Kafka", "Postgres", "Redis"],
    quote: "The post-interview AI report gave me a transparent breakdown of strengths and gap areas. Two weeks later I aced the final recruiter discussion!",
    offerDate: "18 Sep 2026",
    certificateId: "RCET-AIDS-2026-088",
    metrics: {
      technicalSkills: 93,
      problemSolving: 91,
      systemDesign: 90,
      communication: 94,
    },
  },
  {
    id: "std-008",
    name: "Rhea Sen",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80",
    college: "Royal College of Engineering",
    department: "Information Tech (IT)",
    degree: "B.Tech Information Technology",
    gradYear: 2026,
    company: "Databricks",
    companyLogoUrl: "https://www.google.com/s2/favicons?domain=databricks.com&sz=128",
    role: "Data Engine Engineer",
    package: "$138,000 / yr",
    aiScore: 96,
    grade: "A+",
    skills: ["Apache Spark", "Scala", "Lakehouse", "Python"],
    quote: "The transparent verification certificate was linked right on my profile. The hiring manager reviewed the voice interview score and made the offer.",
    offerDate: "01 Oct 2026",
    certificateId: "RCET-IT-2026-095",
    metrics: {
      technicalSkills: 97,
      problemSolving: 95,
      systemDesign: 96,
      communication: 97,
    },
  },
  {
    id: "std-009",
    name: "Aditya Nair",
    imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
    college: "Royal College of Engineering",
    department: "Mechanical & Robotics",
    degree: "B.Tech Robotics & Automation",
    gradYear: 2026,
    company: "Oracle",
    companyLogoUrl: "https://www.google.com/s2/favicons?domain=oracle.com&sz=128",
    role: "Cloud Systems Automation Engineer",
    package: "₹31.0 LPA",
    aiScore: 94,
    grade: "A",
    skills: ["Python", "Docker", "ROS", "Cloud Infrastructure"],
    quote: "The platform's structured problem-solving interview prepared me for every single technical round Oracle presented.",
    offerDate: "22 Sep 2026",
    certificateId: "RCET-ROB-2026-155",
    metrics: {
      technicalSkills: 95,
      problemSolving: 93,
      systemDesign: 94,
      communication: 93,
    },
  },
];

const DEPARTMENTS = [
  "All Departments",
  "Computer Science (CSE)",
  "AI & Data Science (AI & DS)",
  "Information Tech (IT)",
  "Electronics & Comm (ECE)",
  "Mechanical & Robotics"
];

export function PlacedStudentsSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [selectedStudent, setSelectedStudent] = useState<PlacedStudent | null>(null);

  const filteredStudents = useMemo(() => {
    return DUMMY_PLACED_STUDENTS.filter((student) => {
      const matchesDepartment =
        selectedDepartment === "All Departments" || student.department === selectedDepartment;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.company.toLowerCase().includes(q) ||
        student.role.toLowerCase().includes(q) ||
        student.department.toLowerCase().includes(q) ||
        student.degree.toLowerCase().includes(q) ||
        student.skills.some((s) => s.toLowerCase().includes(q));

      return matchesDepartment && matchesSearch;
    });
  }, [searchQuery, selectedDepartment]);

  return (
    <section id="placements" className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
      {/* Notebook Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-red-500 tracking-widest uppercase font-mono bg-white/70 px-2 py-0.5 border border-red-300">
              ROYAL COLLEGE OF ENGINEERING · PLACEMENT ACHIEVEMENTS
            </span>
            <span className="bg-[#c7f9cc] text-black text-xs font-mono font-bold px-2 py-0.5 border border-black rounded-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              LIVE VERIFIED
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-kalam font-bold leading-[1.05] tracking-tight">
            See Where Royal College of Engineering <br />
            <span className="relative inline-block mt-1">
              <span className="absolute inset-0 bg-[#fcec6a] transform -rotate-1 rounded-sm scale-105 -z-10 shadow-sm"></span>
              <span className="relative z-10">Students Got Placed.</span>
            </span>
          </h2>
          <p className="text-lg md:text-xl font-medium text-gray-700 mt-4 max-w-xl font-kalam">
            Transparent campus recruitment records for <strong>Royal College of Engineering</strong>. Real student profiles, real AI interviews, and verified job offers across top global engineering teams.
          </p>
        </div>

        {/* Live Placement Stats Tape */}
        <div className="bg-[#fffef7] border-2 border-black p-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-1 max-w-sm">
          <div className="flex items-center justify-between border-b-2 border-dashed border-gray-300 pb-2 mb-3 font-mono text-xs font-bold">
            <span className="text-gray-500 font-bold">ROYAL COLLEGE METRICS '26</span>
            <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 border border-emerald-400">94.8% PLACED</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center font-mono">
            <div className="bg-[#faf9f0] p-2 border border-black/10">
              <span className="text-xs text-gray-500">OFFERS ISSUED</span>
              <p className="text-2xl font-bold font-kalam text-black">850+</p>
            </div>
            <div className="bg-[#faf9f0] p-2 border border-black/10">
              <span className="text-xs text-gray-500">HIGHEST CTC</span>
              <p className="text-2xl font-bold font-kalam text-[#e15b58]">₹45.5 LPA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-2 border-black p-5 rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-10 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search student name, company (e.g. Google), role, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 font-mono text-sm border-2 border-black focus-visible:ring-0 focus-visible:border-black rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#fffef7]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400 hover:text-black"
                aria-label="Clear search"
              >
                ✕ Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-500 whitespace-nowrap">
            <Filter className="w-4 h-4" />
            <span>FILTER BY BRANCH:</span>
          </div>
        </div>

        {/* Department Filter Pills */}
        <div className="flex gap-2 flex-wrap pt-1">
          {DEPARTMENTS.map((dept) => {
            const isSelected = selectedDepartment === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`font-mono text-xs px-3 py-1.5 rounded-sm border-2 transition-all transform ${isSelected
                  ? "bg-black text-white border-black shadow-[2px_2px_0px_0px_#fcec6a] -translate-y-0.5 font-bold"
                  : "bg-[#f6f5ef] text-black border-black/60 hover:border-black hover:bg-yellow-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  }`}
              >
                {dept}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between mb-6 font-mono text-xs text-gray-600">
        <p>
          Showing <span className="font-bold text-black">{filteredStudents.length}</span> placed students from{" "}
          <strong className="text-black">Royal College of Engineering</strong>
          {selectedDepartment !== "All Departments" && (
            <span> ({selectedDepartment})</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Verified AI Scorecard Attached</span>
        </div>
      </div>

      {/* Placed Students Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white border-2 border-black border-dashed p-12 text-center rounded-sm">
          <GraduationCap className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-2xl font-kalam font-bold mb-1">No placement records matched your filter</h3>
          <p className="text-gray-500 font-mono text-sm mb-4">Try clearing the search query or selecting "All Departments".</p>
          <Button
            onClick={() => {
              setSearchQuery("");
              setSelectedDepartment("All Departments");
            }}
            className="border-2 border-black bg-[#fcec6a] text-black hover:bg-yellow-300 font-kalam text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student, idx) => {
            // Give slight playful rotational variations for hand-drawn notebook feel
            const rotationClass = idx % 3 === 0 ? "hover:-rotate-1" : idx % 3 === 1 ? "hover:rotate-1" : "hover:-rotate-0.5";

            return (
              <div
                key={student.id}
                className={`bg-[#fffef7] border-2 border-black rounded-sm p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between relative group ${rotationClass}`}
              >
                {/* Visual Top Tape effect */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#bde0fe]/80 border-x border-b border-black/20 shadow-sm transform -rotate-1 pointer-events-none"></div>

                <div>
                  {/* Card Header: Student Real Photo & Info */}
                  <div className="flex items-start justify-between mb-4 pt-1">
                    <div className="flex items-center gap-3">
                      {/* Real Student Image from web instead of icon */}
                      <div className="w-14 h-14 rounded-sm border-2 border-black bg-yellow-100 overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0 relative group-hover:scale-105 transition-transform">
                        <img
                          src={student.imageUrl}
                          alt={student.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <h3 className="font-kalam text-2xl font-bold leading-tight group-hover:text-blue-700 transition-colors">
                          {student.name}
                        </h3>
                        <p className="text-xs font-mono text-gray-500 font-medium">
                          {student.degree}
                        </p>
                      </div>
                    </div>

                    {/* AI Score Badge */}
                    <div className="text-right flex-shrink-0">
                      <div className="bg-[#fcec6a] border-2 border-black px-2 py-0.5 rounded-sm font-kalam font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block">
                        {student.grade} · {student.aiScore}%
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">AI Interview</p>
                    </div>
                  </div>

                  {/* College Tag: Royal College of Engineering */}
                  <div className="flex items-center gap-1.5 text-xs font-mono text-gray-800 mb-3 bg-[#faf9f0] p-1.5 border border-black/15 rounded-sm">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span className="font-bold truncate text-black">{student.college}</span>
                    <span className="ml-auto text-gray-500 font-medium">Class of '{student.gradYear.toString().slice(-2)}</span>
                  </div>

                  {/* Placement Offer Box */}
                  <div className="bg-white border-2 border-black p-3.5 rounded-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {/* Company Logo fetched via Google Favicon API */}
                        <div className="w-6 h-6 rounded-sm border border-black/20 bg-white p-0.5 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex-shrink-0 overflow-hidden">
                          <img
                            src={student.companyLogoUrl || getCompanyLogoUrl(student.company)}
                            alt={student.company}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <strong className="font-kalam text-xl leading-none text-black">
                          {student.company}
                        </strong>
                      </div>
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 text-xs font-mono font-bold px-2 py-0.5 rounded-sm">
                        {student.package}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-gray-700 font-medium">
                      {student.role}
                    </p>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {student.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] font-mono bg-gray-100 border border-black/30 px-2 py-0.5 rounded-sm text-gray-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Student Testimonial Quote */}
                  <p className="text-xs font-mono italic text-gray-600 bg-[#faf9f0] p-2.5 border-l-2 border-yellow-500 rounded-sm mb-4 leading-relaxed">
                    "{student.quote}"
                  </p>
                </div>

                {/* Card Footer Action */}
                <div className="border-t-2 border-dashed border-gray-200 pt-3 mt-1 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Offer Verified
                  </span>

                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="font-kalam text-base font-bold text-black hover:text-blue-700 flex items-center gap-1 group/btn underline decoration-2 underline-offset-2"
                  >
                    View Placement Certificate &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Call to Action Bar */}
      <div className="mt-14 bg-[#fcec6a] border-2 border-black p-6 md:p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-6 transform -rotate-0.5">
        <div>
          <h3 className="font-kalam text-3xl md:text-4xl font-bold leading-tight">
            Aspiring to join Royal College of Engineering? 🎓
          </h3>
          <p className="font-mono text-sm text-gray-800 mt-1">
            Explore our curriculum, auto-parse your resume, and practice the AI voice interview to prepare for top campus drives.
          </p>
        </div>

        <div className="flex gap-3 flex-shrink-0">
          <a href="/register">
            <button className="bg-black text-white px-6 py-2.5 font-kalam text-xl rounded-sm border-2 border-black hover:bg-white hover:text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5">
              Start Free AI Practice &rarr;
            </button>
          </a>
        </div>
      </div>

      {/* Verification Certificate Modal */}
      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="w-[94vw] sm:max-w-2xl max-h-[88vh] overflow-y-auto bg-[#fffef7] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5 md:p-6 rounded-sm">
          {selectedStudent && (
            <div className="space-y-4">
              <DialogHeader className="border-b-2 border-dashed border-gray-300 pb-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    {/* Student Photo in Modal */}
                    <div className="w-14 h-14 rounded-sm border-2 border-black bg-yellow-100 overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                      <img
                        src={selectedStudent.imageUrl}
                        alt={selectedStudent.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-gray-500 uppercase">
                        ROYAL COLLEGE OF ENGINEERING · PLACEMENT DOSSIER
                      </span>
                      <DialogTitle className="font-kalam text-2xl md:text-3xl font-bold mt-0.5 text-black">
                        {selectedStudent.name}
                      </DialogTitle>
                      <DialogDescription className="font-mono text-xs text-gray-600">
                        {selectedStudent.college} · {selectedStudent.degree}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="bg-[#fcec6a] border-2 border-black px-2.5 py-1 font-kalam font-bold text-base md:text-lg rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
                    GRADE {selectedStudent.grade}
                  </div>
                </div>
              </DialogHeader>

              {/* Certificate Inner Frame */}
              <div className="border-2 border-black p-4 md:p-5 bg-white relative rounded-sm space-y-4">
                {/* Official seal */}
                <div className="absolute top-2.5 right-2.5 opacity-90">
                  <div className="w-14 h-14 rounded-full border-2 border-emerald-600 bg-emerald-50 flex flex-col items-center justify-center font-mono text-[8px] text-emerald-800 font-bold transform rotate-6">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>VERIFIED</span>
                  </div>
                </div>

                {/* Company & Role Details */}
                <div className="pr-16">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">OFFER ISSUED BY</span>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    {/* Company Logo fetched via Google Favicon API */}
                    <div className="w-8 h-8 rounded-sm border border-black/20 bg-white p-1 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex-shrink-0 overflow-hidden">
                      <img
                        src={selectedStudent.companyLogoUrl || getCompanyLogoUrl(selectedStudent.company)}
                        alt={selectedStudent.company}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h4 className="font-kalam text-xl md:text-2xl font-bold leading-none">{selectedStudent.company}</h4>
                      <p className="font-mono text-xs text-gray-600 mt-0.5">{selectedStudent.role}</p>
                    </div>
                  </div>
                </div>

                {/* Offer Metrics Table */}
                <div className="grid grid-cols-3 gap-2 bg-[#faf9f0] p-2.5 border border-black/10 font-mono text-xs rounded-sm">
                  <div>
                    <span className="text-gray-400 block text-[9px]">PACKAGE (CTC)</span>
                    <strong className="text-xs md:text-sm text-black">{selectedStudent.package}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px]">OFFER DATE</span>
                    <strong className="text-xs md:text-sm text-black">{selectedStudent.offerDate}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px]">DOSSIER REF</span>
                    <strong className="text-xs md:text-sm text-black truncate block">{selectedStudent.certificateId}</strong>
                  </div>
                </div>

                {/* AI Interview Breakdown */}
                <div>
                  <h5 className="font-mono text-xs font-bold uppercase text-gray-500 mb-2">
                    AI Voice Screening Scorecard ({selectedStudent.aiScore}/100 Overall)
                  </h5>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[11px]">Technical Acumen & Core Concepts</span>
                        <strong className="text-[11px]">{selectedStudent.metrics.technicalSkills}%</strong>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-sm border border-black/20">
                        <div
                          className="bg-black h-full rounded-sm"
                          style={{ width: `${selectedStudent.metrics.technicalSkills}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[11px]">Live Problem Solving & Coding</span>
                        <strong className="text-[11px]">{selectedStudent.metrics.problemSolving}%</strong>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-sm border border-black/20">
                        <div
                          className="bg-black h-full rounded-sm"
                          style={{ width: `${selectedStudent.metrics.problemSolving}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[11px]">Architecture & System Design</span>
                        <strong className="text-[11px]">{selectedStudent.metrics.systemDesign}%</strong>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-sm border border-black/20">
                        <div
                          className="bg-black h-full rounded-sm"
                          style={{ width: `${selectedStudent.metrics.systemDesign}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[11px]">Communication Clarity & Articulation</span>
                        <strong className="text-[11px]">{selectedStudent.metrics.communication}%</strong>
                      </div>
                      <div className="w-full bg-gray-200 h-1.5 rounded-sm border border-black/20">
                        <div
                          className="bg-black h-full rounded-sm"
                          style={{ width: `${selectedStudent.metrics.communication}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Feedback */}
                <div className="bg-[#fffef7] border border-dashed border-gray-300 p-2.5 rounded-sm font-mono text-xs text-gray-700">
                  <p className="font-bold text-gray-900 mb-0.5 text-[11px]">Candidate Testimonial:</p>
                  <p className="italic text-[11px] leading-relaxed">"{selectedStudent.quote}"</p>
                </div>
              </div>

              {/* Modal footer actions */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-200">
                <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Tamper-proof AI Verification
                </span>
                <Button
                  onClick={() => setSelectedStudent(null)}
                  className="bg-black text-white hover:bg-yellow-300 hover:text-black font-kalam text-lg px-5 py-1.5 border-2 border-black rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors"
                >
                  Close Dossier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
