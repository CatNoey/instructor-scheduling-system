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

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Apply isInstructor middleware to all routes
router.use(isInstructor);

router.get('/sessions/available', controller.getAvailableSessions);
router.post('/sessions/:sessionId/apply', controller.applyForSession);
router.delete('/applications/:applicationId', controller.cancelApplication);
router.get('/applications', controller.getInstructorApplications);

export default router;
