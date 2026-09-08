// src/controllers/InstructorApplicationController.ts

import { Request, Response } from 'express';
import { Schedule } from '../models/Schedule';
import { InstructorApplication } from '../models/InstructorApplication';
import { User } from '../models/User';
import { Op } from 'sequelize';

export class InstructorApplicationController {
  async getAvailableSessions(req: Request, res: Response) {
    try {
      const sessions = await Schedule.findAll({
        where: {
          status: 'open',
          date: {
            [Op.gte]: new Date(), // Only future sessions
          },
        },
        order: [['date', 'ASC']],
      });

      return res.status(200).json(sessions);
    } catch (error) {
      console.error('Error in getAvailableSessions:', error);
      return res.status(500).json({ message: 'An error occurred while fetching available sessions' });
    }
  }

  async applyForSession(req: Request, res: Response) {
    const { scheduleId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const schedule = await Schedule.findByPk(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }

      if (schedule.status !== 'open') {
        return res.status(400).json({ message: 'This schedule is not open for applications' });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const existingApplication = await InstructorApplication.findOne({
        where: { scheduleId, instructorId: userId }
      });

      if (existingApplication) {
        return res.status(400).json({ message: 'You have already applied for this schedule' });
      }

      const newApplication = await InstructorApplication.create({
        scheduleId: parseInt(scheduleId),
        instructorId: parseInt(userId),
        status: 'pending'
      });

      return res.status(201).json({ message: 'Application submitted successfully', application: newApplication });
    } catch (error) {
      console.error('Error in applyForSession:', error);
      return res.status(500).json({ message: 'An error occurred while processing your application' });
    }
  }

  async cancelApplication(req: Request, res: Response) {
    const { applicationId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const application = await InstructorApplication.findByPk(applicationId, {
        include: [{ model: Schedule, as: 'schedule' }]
      });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      if (application.instructorId !== parseInt(userId)) {
        return res.status(403).json({ message: 'You are not authorized to cancel this application' });
      }

      if (application.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending applications can be cancelled' });
      }

      await application.destroy();

      return res.status(200).json({ message: 'Application cancelled successfully' });
    } catch (error) {
      console.error('Error in cancelApplication:', error);
      return res.status(500).json({ message: 'An error occurred while cancelling your application' });
    }
  }

  async getInstructorApplications(req: Request, res: Response) {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const { count, rows } = await InstructorApplication.findAndCountAll({
        where: { instructorId: userId },
        include: [{ model: Schedule, as: 'schedule' }],
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit
      });

      return res.status(200).json({
        applications: rows,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count
      });
    } catch (error) {
      console.error('Error in getInstructorApplications:', error);
      return res.status(500).json({ message: 'An error occurred while fetching your applications' });
    }
  }
}