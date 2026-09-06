import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService.js';

export class UserController {
  public static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const telegramId =
        (req.headers['x-telegram-id'] as string) ||
        (req.query.telegramId as string) ||
        (req.query.telegram_id as string);

      if (!telegramId) {
        return res.json({
          success: true,
          data: {
            name: 'Player',
            username: '@player',
            telegramId: '',
            phone: '',
            balance: 0,
            withdrawable_balance: 0,
            referralCode: 'GAMEZONE',
            totalReferrals: 0,
            referralBonusETB: 0,
          },
        });
      }

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        return res.json({
          success: true,
          data: {
            name: 'Player',
            username: '@player',
            telegramId: String(telegramId),
            phone: '',
            balance: 0,
            withdrawable_balance: 0,
            referralCode: `GZ${String(telegramId).slice(-6)}`,
            totalReferrals: 0,
            referralBonusETB: 0,
          },
        });
      }

      const referrals = await UserService.getUserReferrals(telegramId);

      res.json({
        success: true,
        data: {
          name: user.first_name || 'Player',
          username: user.username ? `@${user.username}` : '@player',
          telegramId: user.telegram_id,
          avatarIcon: '🎮',
          phone: user.phone || '',
          balance: Number(user.balance || 0),
          withdrawableBalance: Number(user.withdrawable_balance || 0),
          joinedDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Just now',
          referralCode: user.referral_code || referrals.referralCode,
          totalReferrals: referrals.totalReferrals,
          referralBonusETB: referrals.referralBonusETB,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const telegramId =
        (req.headers['x-telegram-id'] as string) ||
        (req.body.telegramId as string) ||
        (req.body.telegram_id as string);

      if (!telegramId) {
        return res.status(400).json({ success: false, error: 'Telegram ID required' });
      }

      const { name, phone } = req.body;
      const updated = await UserService.updateUser(telegramId, {
        ...(name && { first_name: name }),
        ...(phone && { phone }),
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

