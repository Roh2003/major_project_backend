import { Request, Response, NextFunction } from 'express';
import passport from 'passport';


export const authAdmin = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate("jwt", { session: false }, (err: any, user: any) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Server error during authentication", error: err });
        }

        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
            req.user = user;
            return next();
        }

        return res.status(403).json({ success: false, message: "Admin access required" });
    })(req, res, next);
};

export const authUser = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate("jwt", { session: false }, (err: any, user: any) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Server error during authentication", error: err });
        }

        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (user.role === "USER") {
            req.user = user;
            return next();
        }

        return res.status(403).json({ success: false, message: "User access required" });
    })(req, res, next);
};

export const authAdminOrUser = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate("jwt", { session: false }, (err: any, user: any) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Server error during authentication", error: err });
        }

        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized. Login to Continue" });
        }

        if (user.role === "ADMIN" || user.role === "USER") {
            req.user = user;
            return next();
        }

        return res.status(403).json({ success: false, message: "Unauthorized" });
    })(req, res, next);
};

