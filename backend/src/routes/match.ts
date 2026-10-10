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

    // 2. Fetch all student profiles
    const students = await db.query.users.findMany({
      where: eq(users.role, 'student')
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

export default router;
