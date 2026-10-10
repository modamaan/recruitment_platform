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
  transcript: jsonb("transcript"),
  feedback: text("feedback"),
  matchScore: integer("match_score"),
  status: text("status").default('pending').notNull(), // 'pending', 'completed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
