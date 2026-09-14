import express from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notificationController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(verifyToken);
router.get('/', getNotifications);
router.patch('/:notificationId/read', markNotificationRead);

export default router;
