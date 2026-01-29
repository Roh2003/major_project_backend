import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { number } from 'joi';

interface JwtPayload {
  userId: number;
  email: string;
  username: string;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: "No token provided" });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const secret = process.env.JWT_SECRET_KEY;

        if (!secret) {
            res.status(500).json({ success: false, message: "Server configuration error" });
            return;
        }

        const decoded = jwt.verify(token, secret) as JwtPayload;
        
        // Fetch user with role information
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

        if (!user || user.isDeleted || !user.isActive) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        // Attach user with role to request
        req.user = {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.userRoleMappings[0]?.role.name || 'User'
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, message: "Invalid token" });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: "Token expired" });
            return;
        }
        res.status(500).json({ success: false, message: "Server error during authentication" });
    }
};


export const authAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

        const decoded = jwt.verify(token, secret) as JwtPayload;
        
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

        if (!user || user.isDeleted || !user.isActive) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const roleName = user.userRoleMappings[0]?.role.name;
        
        if (roleName === "admin" || roleName === "SUPERADMIN") {
            req.user = {
                id: user.id,
                email: user.email,
                username: user.username,
                role: roleName
            };
            next();
        } else {
            res.status(403).json({ success: false, message: "Admin access required" });
        }
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, message: "Invalid token" });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: "Token expired" });
            return;
        }
        res.status(500).json({ success: false, message: "Server error during authentication" });
    }
};

export const authUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

        const decoded = jwt.verify(token, secret) as JwtPayload;
        
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

        if (!user || user.isDeleted || !user.isActive) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const roleName = user.userRoleMappings[0]?.role.name;
        
        if (roleName === "User" || roleName === "Counselor") {
            req.user = {
                id: user.id,
                email: user.email,
                username: user.username,
                role: roleName
            };
            next();
        } else {
            res.status(403).json({ success: false, message: "User access required" });
        }
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, message: "Invalid token" });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: "Token expired" });
            return;
        }
        res.status(500).json({ success: false, message: "Server error during authentication" });
    }
};

export const authAdminOrUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

        const decoded = jwt.verify(token, secret) as JwtPayload;
        
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

        if (!user || user.isDeleted || !user.isActive) {
            res.status(401).json({ success: false, message: "Unauthorized. Login to Continue" });
            return;
        }

        const roleName = user.userRoleMappings[0]?.role.name;
        
        if (roleName === "admin" || roleName === "User") {
            req.user = {
                id: user.id,
                email: user.email,
                username: user.username,
                role: roleName
            };
            next();
        } else {
            res.status(403).json({ success: false, message: "Unauthorized" });
        }
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, message: "Invalid token" });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: "Token expired" });
            return;
        }
        res.status(500).json({ success: false, message: "Server error during authentication" });
    }
};


export const authCounselor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        
        // Find counselor in Counselor table by email (since Counselor table is separate from User table)
        const counselor = await prisma.counselor.findUnique({
            where: { email: decoded.email }
        });

        if (!counselor) {
            res.status(401).json({ success: false, message: "Counselor not found" });
            return;
        }

        // Attach counselor info to request
        req.user = {
            id: Number(counselor.id),
            email: counselor.email,
            username: counselor.name,
            role: 'Counselor'
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, message: "Invalid token" });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: "Token expired" });
            return;
        }
        console.error('[authCounselor] Error:', error);
        res.status(500).json({ success: false, message: "Server error during authentication" });
    }
};

/**
 * Middleware for endpoints accessible to both Users and Counselors
 * Used for meeting-related endpoints where both participants need access
 */
export const authUserOrCounselor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

        // Try to find user first (in User table)
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
            
            // Accept if role is User or Counselor (from User table)
            if (roleName === "User" || roleName === "Counselor") {
                req.user = {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: roleName
                };
                next();
                return;
            }
        }

        // If not found in User table, try Counselor table
        const counselor = await prisma.counselor.findUnique({
            where: { email: decoded.email }
        });

        if (counselor) {
            req.user = {
                id: Number(counselor.id),
                email: counselor.email,
                username: counselor.name,
                role: 'Counselor'
            };
            next();
            return;
        }

        // Neither user nor counselor found
        res.status(401).json({ success: false, message: "Unauthorized - User or Counselor access required" });
        
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, message: "Invalid token" });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: "Token expired" });
            return;
        }
        console.error('[authUserOrCounselor] Error:', error);
        res.status(500).json({ success: false, message: "Server error during authentication" });
    }
};

/**
 * Middleware for Tutor authentication
 * Verifies JWT token and checks against Tutor table
 */
export const authTutor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        
        // Find tutor in Tutor table by tutorId
        const tutor = await prisma.tutor.findUnique({
            where: { id: decoded.tutorId }
        });

        if (!tutor) {
            res.status(401).json({ success: false, message: "Tutor not found" });
            return;
        }

        // Check if tutor account is active and not deleted
        if (tutor.isDeleted) {
            res.status(401).json({ success: false, message: "Tutor account has been deleted" });
            return;
        }

        if (!tutor.isActive) {
            res.status(401).json({ success: false, message: "Tutor account is not active" });
            return;
        }

        // Attach tutor info to request
        req.user = {
            tutorId: tutor.id,
            id: tutor.id,
            email: tutor.email,
            username: tutor.username,
            role: 'TUTOR'
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, message: "Invalid token" });
            return;
        }
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, message: "Token expired" });
            return;
        }
        console.error('[authTutor] Error:', error);
        res.status(500).json({ success: false, message: "Server error during authentication" });
    }
};
