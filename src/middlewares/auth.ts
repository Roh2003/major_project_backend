import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

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
        
        if (roleName === "ADMIN" || roleName === "SUPERADMIN") {
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
        
        if (roleName === "User") {
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
        
        if (roleName === "ADMIN" || roleName === "User") {
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
