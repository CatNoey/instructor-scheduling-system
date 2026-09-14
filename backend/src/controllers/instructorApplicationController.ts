import { Request, Response } from 'express';
import { Op, UniqueConstraintError } from 'sequelize';
import sequelize from '../config/database';
import { InstructorApplication } from '../models/InstructorApplication';
import { Schedule } from '../models/Schedule';
import { Session } from '../models/Session';
import { asyncHandler, sendData, sendError } from '../../shared/apiResponse';
import { parsePositiveInteger } from '../../shared/validation';

const instructorIdFor = (req: Request) => parsePositiveInteger(req.user?.userId);
const invalid = (res: Response, message: string) => sendError(res, 400, 'VALIDATION_ERROR', message);

const canApply = (session: Session, schedule: Schedule | null) =>
  session.startTime > new Date() && schedule?.status === 'open';

const isUniqueViolation = (error: unknown) =>
  error instanceof UniqueConstraintError || (error instanceof Error && error.name === 'SequelizeUniqueConstraintError');

export class InstructorApplicationController {
  getAvailableSessions = asyncHandler(async (req, res) => {
    const instructorId = instructorIdFor(req);
    if (!instructorId) return invalid(res, 'Instructor id must be a positive integer');

    // Returning Session[] is deliberate: sessions already applied for are omitted,
    // so clients can retain their existing type and cannot offer a duplicate apply action.
    const sessions = await Session.findAll({
      where: { startTime: { [Op.gt]: new Date() }, '$applications.id$': null },
      include: [
        {
          model: Schedule,
          as: 'schedule',
          required: true,
          where: { status: 'open' },
          attributes: ['id', 'date', 'institutionName', 'region', 'status'],
        },
        {
          model: InstructorApplication,
          as: 'applications',
          required: false,
          where: { instructorId },
          attributes: [],
        },
      ],
      order: [['startTime', 'ASC']],
    });
    return sendData(res, sessions);
  });

  applyForSession = asyncHandler(async (req, res) => {
    const instructorId = instructorIdFor(req);
    const sessionId = parsePositiveInteger(req.params.sessionId);
    if (!instructorId || !sessionId) return invalid(res, 'Instructor and session ids must be positive integers');

    try {
      const result = await sequelize.transaction(async (transaction) => {
        const session = await Session.findByPk(sessionId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!session) return { kind: 'not-found' as const };
        const schedule = await Schedule.findByPk(session.scheduleId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!canApply(session, schedule)) return { kind: 'unavailable' as const };
        const existing = await InstructorApplication.findOne({ where: { instructorId, sessionId }, transaction, lock: transaction.LOCK.UPDATE });
        if (existing) return { kind: 'duplicate' as const };
        const application = await InstructorApplication.create({ instructorId, sessionId, status: 'pending' }, { transaction });
        return { kind: 'created' as const, application, session };
      });

      if (result.kind === 'not-found') return sendError(res, 404, 'NOT_FOUND', 'Session not found');
      if (result.kind === 'unavailable') return sendError(res, 409, 'CONFLICT', 'Only future sessions on open schedules can be applied for');
      if (result.kind === 'duplicate') return sendError(res, 409, 'CONFLICT', 'You have already applied for this session');
      return sendData(res, { ...result.application.toJSON(), session: result.session.toJSON() }, 201);
    } catch (error) {
      if (isUniqueViolation(error)) return sendError(res, 409, 'CONFLICT', 'You have already applied for this session');
      throw error;
    }
  });

  cancelApplication = asyncHandler(async (req, res) => {
    const instructorId = instructorIdFor(req);
    const applicationId = parsePositiveInteger(req.params.applicationId);
    if (!instructorId || !applicationId) return invalid(res, 'Instructor and application ids must be positive integers');
    const application = await InstructorApplication.findByPk(applicationId);
    if (!application) return sendError(res, 404, 'NOT_FOUND', 'Application not found');
    if (application.instructorId !== instructorId) return sendError(res, 403, 'FORBIDDEN', 'Not authorized to cancel this application');
    if (application.status !== 'pending') return invalid(res, 'Only pending applications can be cancelled');

    const deleted = await InstructorApplication.destroy({
      where: { id: applicationId, instructorId, status: 'pending' },
    });
    if (!deleted) return sendError(res, 409, 'CONFLICT', 'Application status changed before cancellation');
    return sendData(res, null);
  });

  getInstructorApplications = asyncHandler(async (req, res) => {
    const instructorId = instructorIdFor(req);
    if (!instructorId) return invalid(res, 'Instructor id must be a positive integer');
    const applications = await InstructorApplication.findAll({
      where: { instructorId },
      include: [{
        model: Session,
        as: 'session',
        include: [{ model: Schedule, as: 'schedule', attributes: ['id', 'date', 'institutionName', 'region', 'status'] }],
      }],
      order: [['createdAt', 'DESC']],
    });
    return sendData(res, applications);
  });
}
