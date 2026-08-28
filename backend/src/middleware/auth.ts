import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission insuffisante' });
    }

    next();
  };
};

export const requireFounder = (req: AuthRequest, res: Response, next: NextFunction) => {
  return requireRole(['founder'])(req, res, next);
};

export const requireFounderOrDirector = (req: AuthRequest, res: Response, next: NextFunction) => {
  return requireRole(['founder', 'director'])(req, res, next);
};

export const requireFounderOrDirectorOrTeacher = (req: AuthRequest, res: Response, next: NextFunction) => {
  return requireRole(['founder', 'director', 'teacher'])(req, res, next);
};

export const requireTeacher = (req: AuthRequest, res: Response, next: NextFunction) => {
  return requireRole(['teacher'])(req, res, next);
};

export const requireTeacherOrDirector = (req: AuthRequest, res: Response, next: NextFunction) => {
  return requireRole(['teacher', 'director'])(req, res, next);
};

export const requireDirector = (req: AuthRequest, res: Response, next: NextFunction) => {
  return requireRole(['director'])(req, res, next);
};
