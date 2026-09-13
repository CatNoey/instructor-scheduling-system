import { Request, Response } from 'express';
import { Schedule } from '../models/Schedule';
import { Session } from '../models/Session';

const validTimeRange = (startTime: unknown, endTime: unknown) => {
  const start = new Date(String(startTime));
  const end = new Date(String(endTime));
  return !Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf()) && end > start;
};

export const getSessions = async (req: Request, res: Response) => {
  const sessions = await Session.findAll({ where: { scheduleId: req.params.scheduleId }, order: [['startTime', 'ASC']] });
  res.json({ success: true, data: sessions });
};

export const createSession = async (req: Request, res: Response) => {
  const schedule = await Schedule.findByPk(req.params.scheduleId);
  if (!schedule) return res.status(404).json({ success: false, error: { message: 'Schedule not found' } });
  if (!validTimeRange(req.body.startTime, req.body.endTime)) {
    return res.status(400).json({ success: false, error: { message: 'End time must be after start time' } });
  }
  const session = await Session.create({ ...req.body, scheduleId: schedule.id });
  res.status(201).json({ success: true, data: session });
};

export const updateSession = async (req: Request, res: Response) => {
  const session = await Session.findOne({ where: { id: req.params.sessionId, scheduleId: req.params.scheduleId } });
  if (!session) return res.status(404).json({ success: false, error: { message: 'Session not found' } });
  if ((req.body.startTime || req.body.endTime) && !validTimeRange(req.body.startTime ?? session.startTime, req.body.endTime ?? session.endTime)) {
    return res.status(400).json({ success: false, error: { message: 'End time must be after start time' } });
  }
  await session.update(req.body);
  res.json({ success: true, data: session });
};

export const deleteSession = async (req: Request, res: Response) => {
  const deleted = await Session.destroy({ where: { id: req.params.sessionId, scheduleId: req.params.scheduleId } });
  if (!deleted) return res.status(404).json({ success: false, error: { message: 'Session not found' } });
  res.json({ success: true, data: null });
};
