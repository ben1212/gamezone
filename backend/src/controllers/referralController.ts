import { Request, Response, NextFunction } from 'express';
import { db } from '../data/db.js';
import { WalletService } from '../services/walletService.js';

export class ReferralController {
  public static getReferrals(_req: Request, res: Response, next: NextFunction) {
    try {
      const user = db.getUser();
      res.json({
        success: true,
        data: {
          referralCode: user.referralCode,
          totalReferrals: user.totalReferrals,
          referralBonusETB: user.referralBonusETB,
          bonusPerReferral: 25,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static claimBonus(_req: Request, res: Response, next: NextFunction) {
    try {
      const user = db.getUser();
      if (user.referralBonusETB <= 0) {
        res.status(400).json({
          success: false,
          error: 'No referral bonus available to claim',
        });
        return;
      }

      const bonusToClaim = user.referralBonusETB;
      db.updateUser({ referralBonusETB: 0 });

      const { balances, transaction } = WalletService.creditReward(
        bonusToClaim,
        'Referral Bonus',
        '🎁',
        user.id
      );

      res.json({
        success: true,
        message: `Claimed ${bonusToClaim} ETB referral bonus!`,
        data: {
          claimedAmount: bonusToClaim,
          balances,
          transaction,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
