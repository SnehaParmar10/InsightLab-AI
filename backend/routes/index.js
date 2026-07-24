import express from 'express';
import { signup, login, logout, getMe, sendOtp, verifyOtp, updateProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import aiRoutes from './aiRoutes.js';

import expressRateLimit from 'express-rate-limit';

const otpLimiter = expressRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // Limit each IP to 3 OTP requests per windowMs
    message: { error: "Too many OTP requests from this IP, please try again after 5 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router();

// Auth Routes
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', authenticateToken, getMe);
router.put('/auth/profile', authenticateToken, updateProfile);

// OTP Routes
router.post('/auth/send-otp', otpLimiter, sendOtp);       // Resend OTP request
router.post('/auth/verify-otp', verifyOtp);   // Verify OTP

// AI Routes
router.use('/ai', aiRoutes);

export default router;

