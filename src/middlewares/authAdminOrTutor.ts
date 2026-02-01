import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

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
        const decoded = jwt.verify(token, secret) as JwtPayload;
        
        // 1. Check if token belongs to an Admin (User table)
        if (decoded.userId) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                include: {
                    userRoleMappings: {
                        include: {
                            role: true
                        }
                    }
                }
            });

            if (user && !user.isDeleted && user.isActive) {
                const roleName = user.userRoleMappings[0]?.role.name;
                if (roleName === "admin" || roleName === "superAdmin") {
                    req.user = {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        role: roleName
                    };
                    return next();
                }
            }
        }
        
        // 2. Check if token belongs to a Tutor (Tutor table)
        if (decoded.tutorId) {
            const tutor = await prisma.tutor.findUnique({
                where: { id: decoded.tutorId }
            });

            if (tutor && tutor.isActive && !tutor.isDeleted) {
                req.user = {
                    tutorId: tutor.id, // Keep tutorId for specific usage
                    id: tutor.id,
                    email: tutor.email,
                    username: tutor.username,
                    role: 'TUTOR'
                };
                return next();
            }
        }

        // If we reach here, authentication failed for both
        res.status(401).json({ success: false, message: "Unauthorized: Admin or Tutor access required" });
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
