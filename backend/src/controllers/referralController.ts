import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService.js';

export class ReferralController {
  public static async getReferrals(req: Request, res: Response, next: NextFunction) {
    try {
      const telegramId =
        (req.headers['x-telegram-id'] as string) ||
        (req.query.telegramId as string) ||
        (req.query.telegram_id as string);

      if (!telegramId) {
        return res.json({
          success: true,
          data: {
            referralCode: 'GAMEZONE',
            totalReferrals: 0,
            referralBonusETB: 0,
            bonusPerReferral: 25,
          },
        });
      }

      const referrals = await UserService.getUserReferrals(telegramId);
      res.json({
        success: true,
        data: referrals,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async claimBonus(req: Request, res: Response, next: NextFunction) {
    try {
      const telegramId =
        (req.headers['x-telegram-id'] as string) ||
        (req.body.telegramId as string) ||
        (req.body.telegram_id as string) ||
        (req.query.telegramId as string);

      if (!telegramId) {
        return res.status(400).json({
          success: false,
          error: 'Telegram ID is required',
        });
      }

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const referrals = await UserService.getUserReferrals(telegramId);
      if (referrals.referralBonusETB <= 0) {
        return res.status(400).json({
          success: false,
          error: 'No referral bonus available to claim',
        });
      }

      const bonusToClaim = referrals.referralBonusETB;
      const newPlayable = Number(user.balance || 0) + bonusToClaim;
      await UserService.updateUser(telegramId, { balance: newPlayable });

      const balances = await UserService.getUserBalances(telegramId);

      res.json({
        success: true,
        message: `Claimed ${bonusToClaim} ETB referral bonus!`,
        data: {
          claimedAmount: bonusToClaim,
          balances,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

