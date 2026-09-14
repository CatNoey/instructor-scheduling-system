// src/routes/instructorApplicationRoutes.ts

import express from 'express';
import { InstructorApplicationController } from '../controllers/instructorApplicationController';
import { verifyToken } from '../middleware/authMiddleware';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../shared/apiResponse';

const router = express.Router();
const controller = new InstructorApplicationController();

// Middleware to check if the user is an instructor
const isInstructor = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'instructor') {
    next();
  } else {
    sendError(res, 403, 'FORBIDDEN', 'Instructor role required');
  }
};

// This router is mounted at `/api`, alongside administrator routes. Keep the
// role check on each exact route so it cannot intercept administrator paths.
router.get('/sessions/available', verifyToken, isInstructor, controller.getAvailableSessions);
router.post('/sessions/:sessionId/apply', verifyToken, isInstructor, controller.applyForSession);
router.delete('/applications/:applicationId', verifyToken, isInstructor, controller.cancelApplication);
router.get('/applications', verifyToken, isInstructor, controller.getInstructorApplications);

export default router;
