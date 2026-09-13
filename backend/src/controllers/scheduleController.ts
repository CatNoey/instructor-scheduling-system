// src/controllers/scheduleController.ts

import { Request, Response } from 'express';
import { Schedule } from '../models/Schedule';

const allowedFields = ['date', 'institutionName', 'region', 'capacity', 'trainingType', 'status'];
const scheduleInput = (body: Record<string, unknown>) => Object.fromEntries(
  allowedFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]])
);

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const newSchedule = new Schedule(scheduleInput(req.body) as any);
    const savedSchedule = await newSchedule.save();
    res.status(201).json({ success: true, data: savedSchedule });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(400).json({ success: false, error: 'An unknown error occurred' });
    }
  }
};

export const getSchedules = async (req: Request, res: Response) => {
  try {
    const schedules = await Schedule.findAll();
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Error fetching schedules' });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, error: { message: 'Schedule not found' } });
    await schedule.update(scheduleInput(req.body));
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error instanceof Error ? error.message : 'Invalid schedule data' } });
  }
};

export const deleteSchedule = async (req: Request, res: Response) => {
  const deleted = await Schedule.destroy({ where: { id: req.params.id } });
  if (!deleted) return res.status(404).json({ success: false, error: { message: 'Schedule not found' } });
  res.json({ success: true, data: null });
};
