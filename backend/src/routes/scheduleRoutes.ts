// src/routes/scheduleRoutes.ts

import express from 'express';
import { createSchedule, getSchedules, updateSchedule, deleteSchedule } from '../controllers/scheduleController';

const router = express.Router();

router.post('/', createSchedule);
router.get('/', getSchedules);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

// Add more routes as needed

export default router;