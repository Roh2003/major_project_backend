import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

/**
 * Middleware that allows EITHER admin OR tutor authentication
 * Checks token and validates against both admin and tutor tables
 */
export const authAdminOrTutor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: "No token provided" });
            return;
        }

        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET_KEY;

        if (!secret) {
            res.status(500).json({ success: false, message: "Server configuration error" });
            return;
        }

        // Verify JWT token
        const decoded = jwt.verify(token, secret) as any;
        
        // Check if it's an admin token
        if (decoded.id && decoded.role === 'Admin') {
            const admin = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (admin && admin.isActive && !admin.isDeleted) {
                req.user = {
                    id: admin.id,
                    email: admin.email,
                    username: admin.username,
                    role: 'Admin'
                };
                return next();
            }
        }
        
        // Check if it's a tutor token
        if (decoded.tutorId && decoded.role === 'TUTOR') {
            const tutor = await prisma.tutor.findUnique({
                where: { id: decoded.tutorId }
            });

            if (tutor && tutor.isActive && !tutor.isDeleted) {
                req.user = {
                    tutorId: tutor.id,
                    id: tutor.id,
                    email: tutor.email,
                    username: tutor.username,
                    role: 'TUTOR'
                };
                return next();
            }
        }

        // If we reach here, authentication failed
        res.status(401).json({ success: false, message: "Unauthorized" });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, message: "Invalid token" });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: "Token expired" });
            return;
        }
        console.error('[authAdminOrTutor] Error:', error);
        res.status(500).json({ success: false, message: "Server error during authentication" });
    }
};
