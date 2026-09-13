// src/routes/auth.ts

import express from 'express';
import { register, login } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';
import { loginRateLimiter } from '../middleware/loginRateLimit';

const router = express.Router();

router.post('/register', register);
router.post('/login', loginRateLimiter, login);

// Example of a protected route
router.get('/profile', verifyToken, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

export default router;
