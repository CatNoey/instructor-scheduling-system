import { Request, Response } from 'express';
import sequelize from '../config/database';
import { Schedule } from '../models/Schedule';
import { asyncHandler, sendData, sendError } from '../../shared/apiResponse';
import {
  isDateOnly,
  isPlainObject,
  isScheduleStatus,
  isTrainingType,
  parsePositiveInteger,
  requiredString,
  ScheduleStatus,
  TrainingType,
} from '../../shared/validation';

type ScheduleInput = {
  date: string;
  institutionName: string;
  region: string;
  capacity: number;
  trainingType: TrainingType;
  status?: ScheduleStatus;
};

const invalid = (res: Response, message: string) => sendError(res, 400, 'VALIDATION_ERROR', message);

const parseScheduleInput = (body: unknown, partial: boolean): ScheduleInput | string => {
  if (!isPlainObject(body)) return 'Request body must be an object';
  const input: Partial<ScheduleInput> = {};
  if (body.date !== undefined) {
    if (!isDateOnly(body.date)) return 'date must be a valid YYYY-MM-DD value';
    input.date = body.date;
  }
  if (body.institutionName !== undefined) {
    const institutionName = requiredString(body.institutionName);
    if (!institutionName) return 'institutionName is required';
    input.institutionName = institutionName;
  }
  if (body.region !== undefined) {
    const region = requiredString(body.region);
    if (!region) return 'region is required';
    input.region = region;
  }
  if (body.capacity !== undefined) {
    const capacity = typeof body.capacity === 'number' && Number.isInteger(body.capacity) && body.capacity > 0
      ? body.capacity
      : null;
    if (!capacity) return 'capacity must be a positive integer';
    input.capacity = capacity;
  }
  if (body.trainingType !== undefined) {
    if (!isTrainingType(body.trainingType)) return 'trainingType is invalid';
    input.trainingType = body.trainingType;
  }
  if (body.status !== undefined) {
    if (!isScheduleStatus(body.status)) return 'status is invalid';
    input.status = body.status;
  }
  if (!partial) {
    for (const field of ['date', 'institutionName', 'region', 'capacity', 'trainingType'] as const) {
      if (input[field] === undefined) return `${field} is required`;
    }
  }
  return input as ScheduleInput;
};

const scheduleId = (req: Request): number | null => parsePositiveInteger(req.params.id);

export const createSchedule = asyncHandler(async (req, res) => {
  const input = parseScheduleInput(req.body, false);
  if (typeof input === 'string') return invalid(res, input);
  const savedSchedule = await Schedule.create(input);
  return sendData(res, savedSchedule, 201);
});

export const getSchedules = asyncHandler(async (_req, res) => {
  const schedules = await Schedule.findAll({ order: [['date', 'ASC'], ['id', 'ASC']] });
  return sendData(res, schedules);
});

export const updateSchedule = asyncHandler(async (req, res) => {
  const id = scheduleId(req);
  if (!id) return invalid(res, 'Schedule id must be a positive integer');
  const input = parseScheduleInput(req.body, true);
  if (typeof input === 'string') return invalid(res, input);

  const schedule = await sequelize.transaction(async (transaction) => {
    const record = await Schedule.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!record) return null;
    await record.update(input, { transaction });
    return record;
  });
  if (!schedule) return sendError(res, 404, 'NOT_FOUND', 'Schedule not found');
  return sendData(res, schedule);
});

export const deleteSchedule = asyncHandler(async (req, res) => {
  const id = scheduleId(req);
  if (!id) return invalid(res, 'Schedule id must be a positive integer');
  const deleted = await Schedule.destroy({ where: { id } });
  if (!deleted) return sendError(res, 404, 'NOT_FOUND', 'Schedule not found');
  return sendData(res, null);
});
