// src/routes/scheduleRoutes.ts

import express from 'express';
import { createSchedule, getSchedules, updateSchedule, deleteSchedule } from '../controllers/scheduleController';
import { createSession, deleteSession, getSessions, updateSession } from '../controllers/sessionController';
import { requireRole, verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken);
router.get('/', getSchedules);
router.post('/', requireRole('admin'), createSchedule);
router.put('/:id', requireRole('admin'), updateSchedule);
router.delete('/:id', requireRole('admin'), deleteSchedule);
router.get('/:scheduleId/sessions', getSessions);
router.post('/:scheduleId/sessions', requireRole('admin'), createSession);
router.put('/:scheduleId/sessions/:sessionId', requireRole('admin'), updateSession);
router.delete('/:scheduleId/sessions/:sessionId', requireRole('admin'), deleteSession);

export default router;
