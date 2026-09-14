import express from 'express';
import { getScheduleApplications, reviewApplication } from '../controllers/adminApplicationController';
import { requireRole, verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

// This router is mounted at `/api`, alongside instructor routes. Applying the
// admin check to the entire router would also reject every instructor request.
router.get('/schedules/:scheduleId/applications', verifyToken, requireRole('admin'), getScheduleApplications);
router.patch('/applications/:applicationId/review', verifyToken, requireRole('admin'), reviewApplication);

export default router;
