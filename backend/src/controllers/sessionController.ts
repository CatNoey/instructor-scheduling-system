import { Request, Response } from 'express';
import { Schedule } from '../models/Schedule';
import { Session } from '../models/Session';
import { asyncHandler, sendData, sendError } from '../../shared/apiResponse';
import {
  isPlainObject,
  isTrainingType,
  optionalString,
  parseOffsetIsoTimestamp,
  parsePositiveInteger,
  requiredString,
  TrainingType,
} from '../../shared/validation';

type SessionInput = {
  startTime: Date;
  endTime: Date;
  instructor: string;
  notes?: string | null;
  trainingType: TrainingType;
};

const invalid = (res: Response, message: string) => sendError(res, 400, 'VALIDATION_ERROR', message);
const scheduleId = (req: Request) => parsePositiveInteger(req.params.scheduleId);
const sessionId = (req: Request) => parsePositiveInteger(req.params.sessionId);

const parseSessionInput = (body: unknown, partial: boolean): Partial<SessionInput> | string => {
  if (!isPlainObject(body)) return 'Request body must be an object';
  const input: Partial<SessionInput> = {};
  if (body.startTime !== undefined) {
    const startTime = parseOffsetIsoTimestamp(body.startTime);
    if (!startTime) return 'startTime must be an ISO timestamp with an explicit offset';
    input.startTime = startTime;
  }
  if (body.endTime !== undefined) {
    const endTime = parseOffsetIsoTimestamp(body.endTime);
    if (!endTime) return 'endTime must be an ISO timestamp with an explicit offset';
    input.endTime = endTime;
  }
  if (body.instructor !== undefined) {
    const instructor = requiredString(body.instructor);
    if (!instructor) return 'instructor is required';
    input.instructor = instructor;
  }
  if (body.notes !== undefined) {
    const notes = optionalString(body.notes);
    if (notes === undefined) return 'notes must be a string or null';
    input.notes = notes;
  }
  if (body.trainingType !== undefined) {
    if (!isTrainingType(body.trainingType)) return 'trainingType is invalid';
    input.trainingType = body.trainingType;
  }
  if (!partial) {
    for (const field of ['startTime', 'endTime', 'instructor', 'trainingType'] as const) {
      if (input[field] === undefined) return `${field} is required`;
    }
  }
  return input;
};

const hasValidRange = (input: Pick<SessionInput, 'startTime' | 'endTime'>) => input.endTime > input.startTime;

export const getSessions = asyncHandler(async (req, res) => {
  const parentId = scheduleId(req);
  if (!parentId) return invalid(res, 'Schedule id must be a positive integer');
  const schedule = await Schedule.findByPk(parentId);
  if (!schedule) return sendError(res, 404, 'NOT_FOUND', 'Schedule not found');
  const sessions = await Session.findAll({ where: { scheduleId: parentId }, order: [['startTime', 'ASC']] });
  return sendData(res, sessions);
});

export const createSession = asyncHandler(async (req, res) => {
  const parentId = scheduleId(req);
  if (!parentId) return invalid(res, 'Schedule id must be a positive integer');
  const input = parseSessionInput(req.body, false);
  if (typeof input === 'string') return invalid(res, input);
  if (!hasValidRange(input as SessionInput)) return invalid(res, 'endTime must be after startTime');
  const schedule = await Schedule.findByPk(parentId);
  if (!schedule) return sendError(res, 404, 'NOT_FOUND', 'Schedule not found');
  const session = await Session.create({ ...(input as SessionInput), scheduleId: schedule.id });
  return sendData(res, session, 201);
});

export const updateSession = asyncHandler(async (req, res) => {
  const parentId = scheduleId(req);
  const childId = sessionId(req);
  if (!parentId || !childId) return invalid(res, 'Schedule and session ids must be positive integers');
  const input = parseSessionInput(req.body, true);
  if (typeof input === 'string') return invalid(res, input);
  if (Object.keys(input).length === 0) return invalid(res, 'At least one editable field is required');
  const session = await Session.findOne({ where: { id: childId, scheduleId: parentId } });
  if (!session) return sendError(res, 404, 'NOT_FOUND', 'Session not found');
  const range = { startTime: input.startTime ?? session.startTime, endTime: input.endTime ?? session.endTime };
  if (!hasValidRange(range)) return invalid(res, 'endTime must be after startTime');
  await session.update(input);
  return sendData(res, session);
});

export const deleteSession = asyncHandler(async (req, res) => {
  const parentId = scheduleId(req);
  const childId = sessionId(req);
  if (!parentId || !childId) return invalid(res, 'Schedule and session ids must be positive integers');
  const deleted = await Session.destroy({ where: { id: childId, scheduleId: parentId } });
  if (!deleted) return sendError(res, 404, 'NOT_FOUND', 'Session not found');
  return sendData(res, null);
});
