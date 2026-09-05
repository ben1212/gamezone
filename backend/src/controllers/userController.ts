import { Request, Response, NextFunction } from 'express';
import { db } from '../data/db.js';

export class UserController {
  public static getProfile(_req: Request, res: Response, next: NextFunction) {
    try {
      const user = db.getUser();
      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  public static updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, phone, email } = req.body;
      const updated = db.updateUser({
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email && { email }),
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
