import * as dotenv from 'dotenv';
// Load environment variables from .env before anything else!
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AccessToken, AgentDispatchClient } from 'livekit-server-sdk';
import { db } from './db';
import { users, jobs, interviews } from './db/schema';
import { eq } from 'drizzle-orm';
const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

import resumeRouter from './routes/resume';
app.use('/api/resume', resumeRouter); 



// Set up the remote JWKS for Neon Auth
// This URL verifies that the JWT was signed by your Neon Auth server
const JWKS = createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL!));

// Middleware to verify the Neon Auth JWT securely
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const baseUrl = process.env.NEON_AUTH_BASE_URL || "";
    let expectedIssuer = baseUrl;
    try {
      expectedIssuer = new URL(baseUrl).origin;
    } catch (e) { }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: expectedIssuer,
    });
    // Attach the verified user ID to the request
    (req as any).user = { id: payload.sub };
    next();
  } catch (error) {
    console.error("JWT Verification failed:", error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// --- API Routes ---

import matchRouter from './routes/match';
app.use('/api/jobs', requireAuth, matchRouter);

// Public health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running securely!' });
});

// Protected route: Fetch current user profile from Postgres
app.get('/api/me', requireAuth, async (req, res) => {
  const neonUserId = (req as any).user.id;
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.neonUserId, neonUserId)
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found in database' });
    }

    res.json(user);
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Protected route: Save a newly registered user to the database
app.post('/api/users', requireAuth, async (req, res) => {
  const neonUserId = (req as any).user.id;
  const { name, email, role } = req.body;

  try {
    // Check if they already exist
    const existing = await db.query.users.findFirst({
      where: eq(users.neonUserId, neonUserId)
    });

    if (existing) {
      return res.json(existing);
    }

    const newUser = await db.insert(users).values({
      neonUserId,
      name,
      email,
      role
    }).returning();

    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error("Failed to save user profile:", error);
    res.status(500).json({ error: 'Failed to save user profile' });
  }
});

// Protected route: Update current user's profile details
app.put('/api/users/profile', requireAuth, async (req, res) => {
  const neonUserId = (req as any).user.id;
  const { name, email, university, degree, gradYear, phone, skills, linkedin, github, bio } = req.body;

  try {
    const updatedUser = await db.update(users)
      .set({
        name,
        email,
        university,
        degree,
        gradYear,
        phone,
        skills,
        linkedin,
        github,
        bio
      })
      .where(eq(users.neonUserId, neonUserId))
      .returning();

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser[0]);
  } catch (error) {
    console.error("Failed to update profile:", error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Protected route: Create a new job posting
app.post('/api/jobs', requireAuth, async (req, res) => {
  const neonUserId = (req as any).user.id;
  const { title, companyName, location, employmentType, salaryRange, description, requirements } = req.body;

  try {
    const newJob = await db.insert(jobs).values({
      recruiterId: neonUserId,
      title,
      companyName,
      location,
      employmentType,
      salaryRange,
      description,
      requirements
    }).returning();

    res.status(201).json(newJob[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Protected route: Get all jobs posted by the current recruiter
app.get('/api/jobs', requireAuth, async (req, res) => {
  const neonUserId = (req as any).user.id;

  try {
    const recruiterJobs = await db.query.jobs.findMany({
      where: eq(jobs.recruiterId, neonUserId),
      orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
    });

    res.json(recruiterJobs);
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Protected route: Get all available jobs for the student dashboard
app.get('/api/jobs/all', requireAuth, async (req, res) => {
  try {
    const allJobs = await db.query.jobs.findMany({
      orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
    });

    res.json(allJobs);
  } catch (error) {
    console.error("Failed to fetch all jobs:", error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Protected route: Generate LiveKit Token to join the AI Interview Room
app.post('/api/interview/token', requireAuth, async (req, res) => {
  const neonUserId = (req as any).user.id;
  const { interviewId } = req.body;

  if (!interviewId) {
    return res.status(400).json({ error: 'Missing interviewId' });
  }

  try {
    // Generate the unique room name
    const roomName = `interview-${interviewId}`;

    // We fetch the student's name from our DB to label them in the room
    const user = await db.query.users.findFirst({
      where: eq(users.neonUserId, neonUserId)
    });
    const participantName = user?.name || `Student-${neonUserId.substring(0, 5)}`;

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: neonUserId,
        name: participantName,
      }
    );

    // Grant permissions to join the room, publish audio, and subscribe to the AI's audio
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true
    });

    const token = await at.toJwt();

    // Dispatch the AI Agent to the room programmatically
    try {
      const dispatchClient = new AgentDispatchClient(
        process.env.LIVEKIT_URL!,
        process.env.LIVEKIT_API_KEY!,
        process.env.LIVEKIT_API_SECRET!
      );
      await dispatchClient.createDispatch(roomName, 'recruiter-agent');
      console.log(`Dispatched recruiter-agent to room ${roomName}`);
    } catch (dispatchError) {
      console.log(`Note: Agent dispatch failed or agent already exists in room: ${dispatchError}`);
    }

    res.json({ token, roomName });
  } catch (error) {
    console.error("Failed to generate LiveKit token:", error);
    res.status(500).json({ error: 'Failed to generate access token' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend server securely running on port ${port}`);
});
