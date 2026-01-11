import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdevkey';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: 'ADMIN' | 'EDITOR' | 'VIEWER';
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid token' });
    }
};

export const requireRole = (roles: ('ADMIN' | 'EDITOR' | 'VIEWER')[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            console.error(`[AUTH_ERROR] User Role: ${req.user?.role}, Required: ${roles.join(',')}, UserID: ${req.user?.id}`);
            return res.status(403).json({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
        }
        next();
    };
};
