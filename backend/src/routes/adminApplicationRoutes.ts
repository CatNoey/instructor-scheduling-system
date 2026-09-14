import express from 'express';
import { getScheduleApplications, reviewApplication } from '../controllers/adminApplicationController';
import { requireRole, verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken, requireRole('admin'));
router.get('/schedules/:scheduleId/applications', getScheduleApplications);
router.patch('/applications/:applicationId/review', reviewApplication);

export default router;
