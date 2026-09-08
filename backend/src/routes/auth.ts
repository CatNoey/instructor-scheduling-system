// src/routes/auth.ts

import express from 'express';
import { register, login } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Example of a protected route
router.get('/profile', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
