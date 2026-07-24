import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { sendOtpEmail } from '../config/mailer.js';

const JWT_SECRET = process.env.JWT_SECRET;
const IS_PROD = process.env.NODE_ENV === 'production';

export const signup = async (req, res) => {
    const { name, email, password, interests } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: "Email already registered" });

        const hashedPassword = await bcrypt.hash(password, 10);

        let role = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
        if (!role) {
            role = await prisma.role.create({ data: { name: 'STUDENT' } });
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                roleId: role.id,
                interests: interests || [],
                isVerified: false
            }
        });

        await generateAndSendOtp(email);

        res.status(201).json({
            message: "Registration successful! Please check your email for OTP.",
            email: user.email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

const generateAndSendOtp = async (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpVerification.deleteMany({ where: { email } });
    await prisma.otpVerification.create({ data: { email, otp, expiresAt } });
    await sendOtpEmail(email, otp);
};

export const sendOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: "User not found. Please signup first." });
        if (user.isVerified) return res.status(400).json({ error: "Email already verified." });

        await generateAndSendOtp(email);

        res.json({ message: "OTP sent to your email!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send OTP" });
    }
};

export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const record = await prisma.otpVerification.findFirst({
            where: { email, otp }
        });

        if (!record) return res.status(400).json({ error: "Invalid OTP. Please try again." });

        if (new Date() > record.expiresAt) {
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        await prisma.user.update({
            where: { email },
            data: { isVerified: true }
        });

        await prisma.otpVerification.deleteMany({ where: { email } });

        res.json({ message: "Email verified successfully! You can now login." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Verification failed" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: true }
        });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

        if (!user.isVerified) {
            return res.status(403).json({
                error: "Please verify your email before logging in.",
                needsVerification: true,
                email: user.email
            });
        }

        const accessToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: IS_PROD,
            sameSite: IS_PROD ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
        });

        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role.name }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server login error: " + err.message });
    }
};

export const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: IS_PROD ? 'none' : 'lax'
    });
    res.json({ message: "Logged out" });
};

export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, interests: true, customInstructions: true }
        });
        res.json(user);
    } catch (err) {
        console.error("Error in getMe:", err);
        res.status(500).json({ error: "Failed to fetch user: " + err.message });
    }
};

export const updateProfile = async (req, res) => {
    const { customInstructions } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { customInstructions }
        });
        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update profile" });
    }
};
