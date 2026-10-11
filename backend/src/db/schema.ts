import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  neonUserId: text("neon_user_id").unique().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // 'student' or 'recruiter'
  university: text("university"),
  degree: text("degree"),
  gradYear: text("grad_year"),
  phone: text("phone"),
  skills: text("skills"),
  linkedin: text("linkedin"),
  github: text("github"),
  bio: text("bio"),
  projects: text("projects"),
  internships: text("internships"),
  hackathons: text("hackathons"),
  verificationStatus: text("verification_status").default("pending").notNull(), // 'pending', 'verified', 'rejected'
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  recruiterId: text("recruiter_id").notNull(), // References neonUserId of the recruiter
  title: text("title").notNull(),
  companyName: text("company_name").default("").notNull(),
  location: text("location").default("").notNull(),
  employmentType: text("employment_type").notNull().default('Full-time'),
  salaryRange: text("salary_range"),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  studentId: text("student_id").notNull(), // References neonUserId of the student
  interviewType: text("interview_type").notNull().default('General Interview'),
  stage: text("stage").default('briefing').notNull(), // 'briefing', 'mcq', 'technical', 'voice', 'completed'
  mcqQuestions: jsonb("mcq_questions"),
  mcqAnswers: jsonb("mcq_answers"),
  mcqScore: integer("mcq_score").default(0),
  technicalQuestions: jsonb("technical_questions"),
  technicalAnswers: jsonb("technical_answers"),
  technicalScore: integer("technical_score").default(0),
  voiceScore: integer("voice_score").default(0),
  reportData: jsonb("report_data"),
  transcript: jsonb("transcript"),
  feedback: text("feedback"),
  matchScore: integer("match_score"),
  status: text("status").default('pending').notNull(), // 'pending', 'completed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
