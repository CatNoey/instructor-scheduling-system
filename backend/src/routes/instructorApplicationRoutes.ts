// src/routes/instructorApplicationRoutes.ts

import express from 'express';
import { InstructorApplicationController } from '../controllers/instructorApplicationController';
import { verifyToken } from '../middleware/authMiddleware';
import { Request, Response, NextFunction } from 'express';

const router = express.Router();
const controller = new InstructorApplicationController();

// Middleware to check if the user is an instructor
const isInstructor = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'instructor') {
    next();
  } else {
    res.status(403).json({ message: 'Access forbidden. Instructor role required.' });
  }
};

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Apply isInstructor middleware to all routes
router.use(isInstructor);

router.get('/available-sessions', controller.getAvailableSessions.bind(controller));
router.post('/sessions/:scheduleId/apply', controller.applyForSession.bind(controller));
router.delete('/applications/:applicationId', controller.cancelApplication.bind(controller));
router.get('/applications', controller.getInstructorApplications.bind(controller));

export default router;