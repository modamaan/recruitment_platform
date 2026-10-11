import { Router } from "express";
import { db } from "../db";
import { jobs, interviews, users } from "../db/schema";
import { eq, inArray, desc } from "drizzle-orm";

const router = Router();

router.get("/dashboard", async (req: any, res: any) => {
  try {
    const userId = req.user.id; // neonUserId from verifyToken middleware

    const user = await db.query.users.findFirst({
      where: eq(users.neonUserId, userId)
    });

    if (user?.role === 'recruiter' && user.verificationStatus !== 'verified') {
      return res.status(403).json({
        error: "Recruiter account pending Placement Cell approval",
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason,
      });
    }

    // Fetch recruiter's jobs (fallback to all active jobs if none posted yet)
    let recruiterJobs = await db.select().from(jobs).where(eq(jobs.recruiterId, userId));
    if (recruiterJobs.length === 0) {
      recruiterJobs = await db.select().from(jobs);
    }
    const activeJobsCount = recruiterJobs.length;

    const jobIds = recruiterJobs.map(job => job.id);

    // Fetch all interviews for the recruiter's jobs
    const allInterviews = await db.select().from(interviews).where(inArray(interviews.jobId, jobIds));
    
    const uniqueStudentIds = new Set(allInterviews.map(i => i.studentId));
    const totalCandidatesCount = uniqueStudentIds.size;
    
    const pendingInterviewsCount = allInterviews.filter(i => i.status === 'pending').length;
    const completedInterviewsCount = allInterviews.filter(i => i.status === 'completed').length;

    // Fetch student details to enrich the activity feed
    const studentIds = Array.from(uniqueStudentIds);
    let studentsInfo: any[] = [];
    if (studentIds.length > 0) {
      studentsInfo = await db.select({ id: users.neonUserId, name: users.name, email: users.email }).from(users).where(inArray(users.neonUserId, studentIds));
    }
    const studentMap = new Map(studentsInfo.map(s => [s.id, s]));

    // Generate Recent Activity Feed
    const activities = [];

    // 1. Job Posted events
    for (const job of recruiterJobs) {
      activities.push({
        id: `job-${job.id}`,
        type: "job_posted",
        title: "Job posted",
        subtitle: job.title,
        timestamp: new Date(job.createdAt).getTime(),
        createdAt: job.createdAt
      });
    }

    // 2. Interview events
    for (const interview of allInterviews) {
      const student = studentMap.get(interview.studentId);
      const job = recruiterJobs.find(j => j.id === interview.jobId);
      const studentName = student ? student.name : "A candidate";
      const studentEmail = student ? student.email : "Unknown email";
      const jobTitle = job ? job.title : "Unknown job";

      if (interview.status === 'completed') {
        activities.push({
          id: `int-comp-${interview.id}`,
          type: "interview_completed",
          title: "AI interview completed",
          subtitle: `${studentName} — ${jobTitle}`,
          timestamp: new Date(interview.createdAt).getTime(), // In reality, we'd use an updated_at column
          createdAt: interview.createdAt
        });
      } else {
        activities.push({
          id: `int-sent-${interview.id}`,
          type: "interview_sent",
          title: "Interview invite sent",
          subtitle: `${studentEmail} for ${jobTitle}`,
          timestamp: new Date(interview.createdAt).getTime(),
          createdAt: interview.createdAt
        });
      }
    }

    // Sort by timestamp DESC and take the top 5
    activities.sort((a, b) => b.timestamp - a.timestamp);
    const recentActivity = activities.slice(0, 5);

    res.json({
      activeJobs: activeJobsCount,
      totalCandidates: totalCandidatesCount,
      interviewsSent: pendingInterviewsCount,
      completedInterviews: completedInterviewsCount,
      recentActivity
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. GET /api/recruiter/candidates - Real dynamic candidate pipeline
router.get("/candidates", async (req: any, res: any) => {
  try {
    const userId = req.user?.id;

    const user = await db.query.users.findFirst({
      where: eq(users.neonUserId, userId)
    });

    if (user?.role === 'recruiter' && user.verificationStatus !== 'verified') {
      return res.status(403).json({
        error: "Recruiter account pending Placement Cell approval",
        verificationStatus: user.verificationStatus,
        rejectionReason: user.rejectionReason,
      });
    }

    // Fetch recruiter's jobs
    const recruiterJobs = await db.select().from(jobs).where(eq(jobs.recruiterId, userId));
    const jobIds = recruiterJobs.map(j => j.id);

    // If recruiter has jobs, fetch interviews for those jobs; if none, fetch all interviews so demo/hackathon recruiter accounts can see candidate submissions
    let candidateInterviews;
    if (jobIds.length > 0) {
      candidateInterviews = await db.select().from(interviews).where(inArray(interviews.jobId, jobIds)).orderBy(desc(interviews.id));
    } else {
      candidateInterviews = await db.select().from(interviews).orderBy(desc(interviews.id));
    }

    const allJobs = await db.select().from(jobs);
    const jobsMap = new Map(allJobs.map(j => [j.id, j]));

    const allUsers = await db.select().from(users);
    const usersMap = new Map(allUsers.map(u => [u.neonUserId, u]));

    const candidateList = candidateInterviews.map((inv) => {
      const student = usersMap.get(inv.studentId);
      const job = jobsMap.get(inv.jobId);
      const isCompleted = inv.status === 'completed' || inv.stage === 'completed';

      return {
        id: inv.id,
        interviewId: inv.id,
        candidateName: student?.name || "Student Candidate",
        candidateEmail: student?.email || "candidate@college.edu",
        university: student?.university || "Royal College of Engineering",
        degree: student?.degree || "B.E. Computer Science",
        gradYear: student?.gradYear || "2026",
        role: job?.title || "Software Engineer",
        companyName: job?.companyName || "Placement Partner",
        jobId: inv.jobId,
        score: inv.matchScore || inv.voiceScore || (isCompleted ? 75 : 60),
        status: isCompleted ? "Interview Completed" : inv.stage === 'briefing' ? "Pending Interview" : `In Progress (${inv.stage})`,
        stage: inv.stage,
        isCompleted,
        hasReport: !!inv.reportData,
        reportData: inv.reportData,
        createdAt: inv.createdAt
      };
    });

    res.json(candidateList);
  } catch (error) {
    console.error("Error fetching candidates for recruiter:", error);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

// 3. GET /api/recruiter/reports - List of all completed reports
router.get("/reports", async (req: any, res: any) => {
  try {
    const completedList = await db.query.interviews.findMany({
      where: eq(interviews.status, "completed"),
      orderBy: (interviews, { desc }) => [desc(interviews.id)]
    });

    const allJobs = await db.select().from(jobs);
    const jobsMap = new Map(allJobs.map(j => [j.id, j]));

    const allUsers = await db.select().from(users);
    const usersMap = new Map(allUsers.map(u => [u.neonUserId, u]));

    const reports = completedList.map(inv => ({
      id: inv.id,
      interviewId: inv.id,
      student: usersMap.get(inv.studentId),
      job: jobsMap.get(inv.jobId),
      reportData: inv.reportData,
      score: inv.matchScore,
      createdAt: inv.createdAt
    }));

    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports list:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// 4. GET /api/recruiter/reports/:id - Individual dynamic 360° report
router.get("/reports/:id", async (req: any, res: any) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }

    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, reportId)
    });

    if (!interview) {
      return res.status(404).json({ error: "Interview report not found" });
    }

    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, interview.jobId)
    });

    const student = await db.query.users.findFirst({
      where: eq(users.neonUserId, interview.studentId)
    });

    res.json({
      interview,
      job,
      student,
      reportData: interview.reportData
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

export default router;
