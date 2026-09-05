import { Request, Response, NextFunction } from 'express';
import { db } from '../data/db.js';
import { UserProfile } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

export const authenticateUser = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  req.user = db.getUser();
  next();
};
