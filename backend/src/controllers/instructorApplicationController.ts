import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { InstructorApplication } from '../models/InstructorApplication';
import { Session } from '../models/Session';

export class InstructorApplicationController {
  async getAvailableSessions(_req: Request, res: Response) {
    const sessions = await Session.findAll({
      where: { startTime: { [Op.gte]: new Date() } },
      order: [['startTime', 'ASC']],
    });
    res.json({ success: true, data: sessions });
  }

  async applyForSession(req: Request, res: Response) {
    const instructorId = Number(req.user?.userId);
    const sessionId = Number(req.params.sessionId);
    if (!Number.isInteger(sessionId)) return res.status(400).json({ message: 'Invalid session id' });
    const session = await Session.findByPk(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    const existing = await InstructorApplication.findOne({ where: { instructorId, sessionId } });
    if (existing) return res.status(409).json({ message: 'You have already applied for this session' });
    const application = await InstructorApplication.create({ instructorId, sessionId, status: 'pending' });
    res.status(201).json({ success: true, data: { ...application.toJSON(), session: session.toJSON() } });
  }

  async cancelApplication(req: Request, res: Response) {
    const application = await InstructorApplication.findByPk(req.params.applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.instructorId !== Number(req.user?.userId)) return res.status(403).json({ message: 'Not authorized to cancel this application' });
    if (application.status !== 'pending') return res.status(400).json({ message: 'Only pending applications can be cancelled' });
    await application.destroy();
    res.json({ success: true, data: null });
  }

  async getInstructorApplications(req: Request, res: Response) {
    const applications = await InstructorApplication.findAll({
      where: { instructorId: Number(req.user?.userId) },
      include: [{ model: Session, as: 'session' }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: applications });
  }
}
