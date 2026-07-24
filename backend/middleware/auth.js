import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid or expired token" });
        req.user = user;
        next();
    });
};
