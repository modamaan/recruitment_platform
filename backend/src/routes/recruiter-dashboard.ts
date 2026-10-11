import { Router } from "express";
import { db } from "../db";
import { jobs, interviews, users } from "../db/schema";
import { eq, inArray, desc } from "drizzle-orm";

const router = Router();

router.get("/dashboard", async (req: any, res: any) => {
  try {
    const userId = req.user.id; // neonUserId from verifyToken middleware

    // Fetch recruiter's jobs
    const recruiterJobs = await db.select().from(jobs).where(eq(jobs.recruiterId, userId));
    const activeJobsCount = recruiterJobs.length;

    if (activeJobsCount === 0) {
      return res.json({
        activeJobs: 0,
        totalCandidates: 0,
        interviewsSent: 0,
        completedInterviews: 0,
        recentActivity: []
      });
    }

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

export default router;
