// src/controllers/scheduleController.ts

import { Request, Response } from 'express';
import { Schedule } from '../models/Schedule';

export const createSchedule = async (req: Request, res: Response) => {
  try {
    const newSchedule = new Schedule(req.body);
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
    console.log('Fetched schedules:', schedules);
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Error fetching schedules' });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  // Implementation for updating a schedule
};

export const deleteSchedule = async (req: Request, res: Response) => {
  // Implementation for deleting a schedule
};

// Add more controller functions as needed