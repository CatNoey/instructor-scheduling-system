import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { InstructorApplication } from '../models/InstructorApplication';
import { Schedule } from '../models/Schedule';
import { Session } from '../models/Session';
import { User } from '../models/User';
import { UserNotification } from '../models/UserNotification';
import { asyncHandler, sendData, sendError } from '../../shared/apiResponse';
import { isPlainObject, parsePositiveInteger } from '../../shared/validation';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

const invalid = (res: Response, message: string) => sendError(res, 400, 'VALIDATION_ERROR', message);
const scheduleId = (req: Request) => parsePositiveInteger(req.params.scheduleId);
const applicationId = (req: Request) => parsePositiveInteger(req.params.applicationId);

const reviewStatus = (body: unknown): ReviewStatus | null => {
  if (!isPlainObject(body)) return null;
  return body.status === 'pending' || body.status === 'approved' || body.status === 'rejected'
    ? body.status
    : null;
};

const applicationInclude = [
  { model: Session, as: 'session' },
  { model: User, as: 'instructor', attributes: ['id', 'username', 'email'] },
];

export const getScheduleApplications = asyncHandler(async (req, res) => {
  const parentId = scheduleId(req);
  if (!parentId) return invalid(res, 'Schedule id must be a positive integer');
  const schedule = await Schedule.findByPk(parentId);
  if (!schedule) return sendError(res, 404, 'NOT_FOUND', 'Schedule not found');

  const applications = await InstructorApplication.findAll({
    include: [
      { model: Session, as: 'session', required: true, where: { scheduleId: parentId } },
      { model: User, as: 'instructor', attributes: ['id', 'username', 'email'] },
    ],
    order: [['createdAt', 'ASC'], ['id', 'ASC']],
  });
  return sendData(res, applications);
});

export const reviewApplication = asyncHandler(async (req, res) => {
  const id = applicationId(req);
  const status = reviewStatus(req.body);
  if (!id || !status) return invalid(res, 'applicationId and status are required');

  const result = await sequelize.transaction(async (transaction) => {
    const application = await InstructorApplication.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!application) return { kind: 'not-found' as const };

    // User and schedule locks serialize approvals for one instructor and one schedule.
    // This prevents simultaneous administrators from exceeding capacity or bypassing an overlap check.
    const instructor = await User.findByPk(application.instructorId, { transaction, lock: transaction.LOCK.UPDATE });
    const session = await Session.findByPk(application.sessionId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!instructor || !session) return { kind: 'not-found' as const };
    const schedule = await Schedule.findByPk(session.scheduleId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!schedule) return { kind: 'not-found' as const };

    if (status === 'approved' && application.status !== 'approved') {
      const approvedCount = await InstructorApplication.count({
        where: { status: 'approved' },
        include: [{ model: Session, as: 'session', required: true, where: { scheduleId: schedule.id } }],
        transaction,
      });
      if (approvedCount >= schedule.capacity) return { kind: 'capacity-reached' as const };

      const overlap = await InstructorApplication.findOne({
        where: { instructorId: application.instructorId, status: 'approved', id: { [Op.ne]: application.id } },
        include: [{
          model: Session,
          as: 'session',
          required: true,
          where: {
            startTime: { [Op.lt]: session.endTime },
            endTime: { [Op.gt]: session.startTime },
          },
        }],
        transaction,
      });
      if (overlap) return { kind: 'time-conflict' as const };
    }

    const wasApproved = application.status === 'approved';
    if (application.status !== status) await application.update({ status }, { transaction });
    if (status === 'approved' && !wasApproved) {
      await UserNotification.create({
        userId: application.instructorId,
        type: 'info',
        message: `${schedule.date} ${schedule.institutionName} 세션 배정이 확정되었습니다.`,
      }, { transaction });
    }
    const reviewed = await InstructorApplication.findByPk(application.id, { include: applicationInclude, transaction });
    return { kind: 'reviewed' as const, application: reviewed };
  });

  if (result.kind === 'not-found') return sendError(res, 404, 'NOT_FOUND', 'Application not found');
  if (result.kind === 'capacity-reached') return sendError(res, 409, 'CAPACITY_REACHED', 'The schedule has reached its assigned instructor capacity');
  if (result.kind === 'time-conflict') return sendError(res, 409, 'TIME_CONFLICT', 'The instructor is already assigned to an overlapping session');
  return sendData(res, result.application);
});
