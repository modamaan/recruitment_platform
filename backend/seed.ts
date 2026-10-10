import { db } from './src/db';
import { users } from './src/db/schema';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

const dummyStudents = [
  {
    neonUserId: 'dummy-student-1',
    name: 'Rahul Sanap',
    email: 'rahul.sanap@example.com',
    role: 'student',
    university: 'Stanford University',
    degree: 'M.S. Computer Science',
    gradYear: '2025',
    phone: '+1-555-0101',
    skills: 'React, Node.js, Python, PostgreSQL, AWS',
    linkedin: 'https://linkedin.com/in/rahulsanap',
    github: 'https://github.com/rahulsanap',
    bio: 'Full-stack developer with a passion for building scalable web applications. Experience with cloud infrastructure and microservices.'
  },
  {
    neonUserId: 'dummy-student-2',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    role: 'student',
    university: 'MIT',
    degree: 'B.S. Software Engineering',
    gradYear: '2024',
    phone: '+1-555-0102',
    skills: 'Java, Spring Boot, MySQL, Docker, Kubernetes',
    linkedin: 'https://linkedin.com/in/sarahj',
    github: 'https://github.com/sarahj',
    bio: 'Backend engineering specialist focused on high-performance APIs and distributed systems design.'
  },
  {
    neonUserId: 'dummy-student-3',
    name: 'Alex Chen',
    email: 'alex.chen@example.com',
    role: 'student',
    university: 'UC Berkeley',
    degree: 'B.A. Data Science',
    gradYear: '2026',
    phone: '+1-555-0103',
    skills: 'Python, PyTorch, TensorFlow, SQL, Data Visualization',
    linkedin: 'https://linkedin.com/in/alexchen',
    github: 'https://github.com/alexchen',
    bio: 'Data science student passionate about machine learning and artificial intelligence. Looking for ML engineering roles.'
  },
  {
    neonUserId: 'dummy-student-4',
    name: 'Emily Davis',
    email: 'emily.d@example.com',
    role: 'student',
    university: 'University of Washington',
    degree: 'B.S. Human Computer Interaction',
    gradYear: '2025',
    phone: '+1-555-0104',
    skills: 'Figma, UI/UX Design, React, CSS, User Research',
    linkedin: 'https://linkedin.com/in/emilyd',
    github: 'https://github.com/emilyd',
    bio: 'Frontend developer with a strong eye for design. Bridging the gap between engineering and user experience.'
  }
];

async function seed() {
  console.log('🌱 Starting database seed...');
  let inserted = 0;

  for (const student of dummyStudents) {
    // Check if exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, student.email)
    });

    if (!existing) {
      await db.insert(users).values(student);
      console.log(`✅ Inserted ${student.name}`);
      inserted++;
    } else {
      console.log(`⚠️ ${student.name} already exists. Skipping.`);
    }
  }

  console.log(`\n🎉 Seed complete! Inserted ${inserted} dummy candidates.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
