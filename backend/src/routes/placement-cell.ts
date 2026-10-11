import express from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, and, desc, sql, or, ilike } from 'drizzle-orm';

const router = express.Router();

// Helper to get current authenticated user record
async function getAuthUser(neonUserId: string) {
  if (!neonUserId) return null;
  return await db.query.users.findFirst({
    where: eq(users.neonUserId, neonUserId),
  });
}

// 1. Get stats for Placement Cell Dashboard (Students + Recruiters)
router.get('/stats', async (req, res) => {
  try {
    const allStudents = await db.query.users.findMany({
      where: eq(users.role, 'student'),
    });
    const allRecruiters = await db.query.users.findMany({
      where: eq(users.role, 'recruiter'),
    });

    const totalStudents = allStudents.length;
    const pendingCount = allStudents.filter(s => s.verificationStatus === 'pending').length;
    const verifiedCount = allStudents.filter(s => s.verificationStatus === 'verified').length;
    const rejectedCount = allStudents.filter(s => s.verificationStatus === 'rejected').length;

    const totalRecruiters = allRecruiters.length;
    const pendingRecruitersCount = allRecruiters.filter(r => r.verificationStatus === 'pending').length;
    const verifiedRecruitersCount = allRecruiters.filter(r => r.verificationStatus === 'verified').length;
    const rejectedRecruitersCount = allRecruiters.filter(r => r.verificationStatus === 'rejected').length;

    res.json({
      totalStudents,
      pendingCount,
      verifiedCount,
      rejectedCount,
      totalRecruiters,
      pendingRecruitersCount,
      verifiedRecruitersCount,
      rejectedRecruitersCount,
    });
  } catch (error) {
    console.error('Error fetching placement cell stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// 2. Get students with optional status filter and search query
router.get('/students', async (req, res) => {
  const { status, search } = req.query;

  try {
    let studentList = await db.query.users.findMany({
      where: eq(users.role, 'student'),
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    // Filter by verification status if specified and not 'all'
    if (status && typeof status === 'string' && status !== 'all') {
      studentList = studentList.filter(s => s.verificationStatus === status);
    }

    // Filter by search query if provided
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      studentList = studentList.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.skills && s.skills.toLowerCase().includes(q)) ||
        (s.degree && s.degree.toLowerCase().includes(q))
      );
    }

    res.json(studentList);
  } catch (error) {
    console.error('Error fetching student list for placement cell:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// 3. Approve and grant Drive Clearance to a student
router.post('/students/:id/verify', async (req, res) => {
  const neonUserId = (req as any).user?.id;
  const studentId = parseInt(req.params.id, 10);

  if (isNaN(studentId)) {
    return res.status(400).json({ error: 'Invalid student ID' });
  }

  try {
    const officer = await getAuthUser(neonUserId);
    const officerLabel = officer?.name ? `${officer.name} (Placement Cell)` : 'Royal College Placement Cell';

    const updated = await db.update(users)
      .set({
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: officerLabel,
        rejectionReason: null,
      })
      .where(and(eq(users.id, studentId), eq(users.role, 'student')))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      message: 'Drive clearance granted successfully!',
      student: updated[0],
    });
  } catch (error) {
    console.error('Error verifying student:', error);
    res.status(500).json({ error: 'Failed to verify student' });
  }
});

// 4. Reject / Flag student profile (request revisions/proof of skills)
router.post('/students/:id/reject', async (req, res) => {
  const neonUserId = (req as any).user?.id;
  const studentId = parseInt(req.params.id, 10);
  const { reason } = req.body;

  if (isNaN(studentId)) {
    return res.status(400).json({ error: 'Invalid student ID' });
  }

  try {
    const officer = await getAuthUser(neonUserId);
    const officerLabel = officer?.name ? `${officer.name} (Placement Cell)` : 'Royal College Placement Cell';

    const updated = await db.update(users)
      .set({
        verificationStatus: 'rejected',
        verifiedAt: null,
        verifiedBy: officerLabel,
        rejectionReason: reason || 'Skills or credentials require revision and proof before campus drive clearance can be granted.',
      })
      .where(and(eq(users.id, studentId), eq(users.role, 'student')))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      message: 'Student profile flagged for changes.',
      student: updated[0],
    });
  } catch (error) {
    console.error('Error rejecting student profile:', error);
    res.status(500).json({ error: 'Failed to flag student profile' });
  }
});

// 5. Reset status back to pending
router.post('/students/:id/reset-pending', async (req, res) => {
  const studentId = parseInt(req.params.id, 10);

  if (isNaN(studentId)) {
    return res.status(400).json({ error: 'Invalid student ID' });
  }

  try {
    const updated = await db.update(users)
      .set({
        verificationStatus: 'pending',
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
      })
      .where(and(eq(users.id, studentId), eq(users.role, 'student')))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      success: true,
      message: 'Student reset to pending verification.',
      student: updated[0],
    });
  } catch (error) {
    console.error('Error resetting student status:', error);
    res.status(500).json({ error: 'Failed to reset student status' });
  }
});

// 6. Get recruiters with optional status filter and search query
router.get('/recruiters', async (req, res) => {
  const { status, search } = req.query;

  try {
    let recruiterList = await db.query.users.findMany({
      where: eq(users.role, 'recruiter'),
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    if (status && typeof status === 'string' && status !== 'all') {
      recruiterList = recruiterList.filter(r => r.verificationStatus === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      recruiterList = recruiterList.filter(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.companyName && r.companyName.toLowerCase().includes(q))
      );
    }

    res.json(recruiterList);
  } catch (error) {
    console.error('Error fetching recruiter list for placement cell:', error);
    res.status(500).json({ error: 'Failed to fetch recruiters' });
  }
});

// 7. Approve recruiter account
router.post('/recruiters/:id/verify', async (req, res) => {
  const neonUserId = (req as any).user?.id;
  const recruiterId = parseInt(req.params.id, 10);

  if (isNaN(recruiterId)) {
    return res.status(400).json({ error: 'Invalid recruiter ID' });
  }

  try {
    const officer = await getAuthUser(neonUserId);
    const officerLabel = officer?.name ? `${officer.name} (Placement Cell)` : 'Royal College Placement Cell';

    const updated = await db.update(users)
      .set({
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: officerLabel,
        rejectionReason: null,
      })
      .where(and(eq(users.id, recruiterId), eq(users.role, 'recruiter')))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Recruiter not found' });
    }

    res.json({
      success: true,
      message: 'Recruiter account approved and drive access granted!',
      recruiter: updated[0],
    });
  } catch (error) {
    console.error('Error verifying recruiter:', error);
    res.status(500).json({ error: 'Failed to verify recruiter' });
  }
});

// 8. Reject recruiter account (e.g. fake recruiter, student impersonation)
router.post('/recruiters/:id/reject', async (req, res) => {
  const neonUserId = (req as any).user?.id;
  const recruiterId = parseInt(req.params.id, 10);
  const { reason } = req.body;

  if (isNaN(recruiterId)) {
    return res.status(400).json({ error: 'Invalid recruiter ID' });
  }

  try {
    const officer = await getAuthUser(neonUserId);
    const officerLabel = officer?.name ? `${officer.name} (Placement Cell)` : 'Royal College Placement Cell';

    const updated = await db.update(users)
      .set({
        verificationStatus: 'rejected',
        verifiedAt: null,
        verifiedBy: officerLabel,
        rejectionReason: reason || 'Application denied: Student impersonation or unverified corporate credentials.',
      })
      .where(and(eq(users.id, recruiterId), eq(users.role, 'recruiter')))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Recruiter not found' });
    }

    res.json({
      success: true,
      message: 'Recruiter account rejected.',
      recruiter: updated[0],
    });
  } catch (error) {
    console.error('Error rejecting recruiter:', error);
    res.status(500).json({ error: 'Failed to reject recruiter' });
  }
});

// 9. Reset recruiter to pending
router.post('/recruiters/:id/reset-pending', async (req, res) => {
  const recruiterId = parseInt(req.params.id, 10);

  if (isNaN(recruiterId)) {
    return res.status(400).json({ error: 'Invalid recruiter ID' });
  }

  try {
    const updated = await db.update(users)
      .set({
        verificationStatus: 'pending',
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
      })
      .where(and(eq(users.id, recruiterId), eq(users.role, 'recruiter')))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Recruiter not found' });
    }

    res.json({
      success: true,
      message: 'Recruiter reset to pending verification.',
      recruiter: updated[0],
    });
  } catch (error) {
    console.error('Error resetting recruiter status:', error);
    res.status(500).json({ error: 'Failed to reset recruiter status' });
  }
});

export default router;
