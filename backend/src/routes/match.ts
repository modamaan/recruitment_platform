import express from 'express';
import { db } from '../db';
import { users, jobs } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/:jobId/match', async (req, res) => {
  const neonUserId = (req as any).user?.id;
  const { jobId } = req.params;

  try {
    // 1. Fetch the Job
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, parseInt(jobId)), eq(jobs.recruiterId, neonUserId))
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found or unauthorized" });
    }

    // 2. Fetch all student profiles who have been verified by Royal College Placement Cell
    // Students whose status is 'pending' or 'rejected' are withheld until drive clearance is granted
    const students = await db.query.users.findMany({
      where: and(eq(users.role, 'student'), eq(users.verificationStatus, 'verified'))
    });

    if (students.length === 0) {
      return res.json([]);
    }

    // Prepare data for OpenAI
    const studentDataForPrompt = students.map(s => ({
      id: s.id,
      name: s.name,
      university: s.university,
      degree: s.degree,
      skills: s.skills,
      bio: s.bio
    }));

    const systemPrompt = `You are an expert AI technical recruiter. Analyze the given job description and requirements against the provided list of student candidates.
Score each candidate from 0 to 100 on how well they match the job.
Return a JSON object with a single key "matches" containing an array of objects, where each object has:
- studentId (number)
- score (number, 0-100)
- summary (string, 1-2 sentence explanation of why they are a match based on their skills/bio, highlighting specific strengths)
- topMatch (boolean, true if score >= 85)

Format the output strictly as valid JSON.`;

    const userPrompt = `
Job Title: ${job.title}
Job Requirements: ${job.requirements}
Job Description: ${job.description}

Candidates:
${JSON.stringify(studentDataForPrompt, null, 2)}
`;

    // 3. Call OpenAI for Matching
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
    });

    const aiResponseText = completion.choices[0].message.content || '{"matches": []}';
    console.log("AI Response:", aiResponseText);

    let aiMatches: any[] = [];
    try {
      const parsed = JSON.parse(aiResponseText);
      aiMatches = parsed.matches || parsed;
      if (!Array.isArray(aiMatches)) aiMatches = [];
    } catch (e) {
      console.error("Failed to parse AI matching response:", e);
      aiMatches = [];
    }

    // 4. Merge AI scores back with full student profiles
    const matchedCandidates = aiMatches.map((match: any) => {
      // Handle potential string IDs from OpenAI
      const sId = typeof match.studentId === 'string' ? parseInt(match.studentId) : match.studentId;
      const studentProfile = students.find(s => s.id === sId);
      if (!studentProfile) return null;

      return {
        ...studentProfile,
        matchScore: match.score || 0,
        matchSummary: match.summary || "Good fit based on profile.",
        isTopMatch: match.topMatch || false
      };
    }).filter(c => c !== null).sort((a: any, b: any) => b.matchScore - a.matchScore);

    res.json(matchedCandidates);

  } catch (error) {
    console.error("Error running AI matching:", error);
    res.status(500).json({ error: "Failed to run AI matching" });
  }
});

import { Resend } from 'resend';
import { interviews } from '../db/schema';
import { inArray } from 'drizzle-orm';

const resend = new Resend(process.env.RESEND_API_KEY || '');

router.post('/:jobId/invite', async (req, res) => {
  const neonUserId = (req as any).user?.id;
  const { jobId } = req.params;
  const { studentIds, interviewType } = req.body;

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ error: "No candidates selected" });
  }

  try {
    // 1. Fetch the Job
    const job = await db.query.jobs.findFirst({
      where: and(eq(jobs.id, parseInt(jobId)), eq(jobs.recruiterId, neonUserId))
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found or unauthorized" });
    }

    // 2. Fetch the actual student users based on their numerical IDs
    const selectedStudents = await db.query.users.findMany({
      where: inArray(users.id, studentIds)
    });

    if (selectedStudents.length === 0) {
      return res.status(404).json({ error: "No valid students found" });
    }

    // 3. Create interview records & send emails
    for (const student of selectedStudents) {
      // Create the interview record
      const [newInterview] = await db.insert(interviews).values({
        jobId: job.id,
        studentId: student.neonUserId,
        interviewType: interviewType || "Technical Interview",
        status: 'pending'
      }).returning();

      // Generate the Magic Link (Assuming Next.js runs on localhost:3000 for now, or use an env var)
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
      const interviewLink = `${frontendUrl}/dashboard/student/interview/${newInterview.id}`;

      // Send the email via Resend
      if (process.env.RESEND_API_KEY) {
        // Skip dummy emails to prevent Resend from throwing 422 errors
        if (student.email.endsWith('@example.com')) {
          console.log(`Skipped sending real email to dummy address: ${student.email}`);
          continue;
        }

        try {
          const { data, error } = await resend.emails.send({
            from: 'AI Recruitment Platform <onboarding@devblog.blog>',
            to: student.email,
            subject: `Interview Invitation: ${job.title}`,
            html: `
              <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
                <h2>Hi ${student.name},</h2>
                <p>We'd like to invite you to a <strong>${interviewType}</strong> for the <strong>${job.title}</strong> position at ${job.companyName}.</p>
                <p>Your AI-powered interview is ready whenever you are.</p>
                <div style="margin: 30px 0;">
                  <a href="${interviewLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Start AI Interview Now
                  </a>
                </div>
                <p>Best regards,<br>The Recruitment Team</p>
              </div>
            `
          });

          if (error) {
            console.error(`Resend API Error for ${student.email}:`, error);
          } else {
            console.log(`Sent invite email to ${student.email} (ID: ${data?.id})`);
          }
        } catch (emailErr) {
          console.error(`Exception while sending email to ${student.email}:`, emailErr);
        }
      } else {
        console.warn("RESEND_API_KEY is not set. Skipped sending real email.");
        console.log(`Simulated email to ${student.email} with link: ${interviewLink}`);
      }
    }

    res.json({ success: true, message: `Invites sent to ${selectedStudents.length} candidates.` });
  } catch (error) {
    console.error("Error sending invites:", error);
    res.status(500).json({ error: "Failed to send invites" });
  }
});

export default router;
