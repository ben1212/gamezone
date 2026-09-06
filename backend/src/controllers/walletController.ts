import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService.js';

export class WalletController {
  public static async getBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const telegramId =
        (req.headers['x-telegram-id'] as string) ||
        (req.query.telegramId as string) ||
        (req.query.telegram_id as string);

      if (!telegramId) {
        return res.json({
          success: true,
          data: {
            total: 0,
            withdrawable: 0,
            playable: 0,
            currency: 'ETB',
          },
        });
      }

      const balances = await UserService.getUserBalances(telegramId);
      res.json({
        success: true,
        data: balances,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const telegramId =
        (req.headers['x-telegram-id'] as string) ||
        (req.query.telegramId as string) ||
        (req.query.telegram_id as string);

      if (!telegramId) {
        return res.json({
          success: true,
          data: [],
        });
      }

      const transactions = await UserService.getUserTransactions(telegramId);
      res.json({
        success: true,
        data: transactions,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deposit(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, paymentMethod, referenceId, smsText } = req.body;
      const telegramId =
        (req.headers['x-telegram-id'] as string) ||
        (req.body.telegramId as string) ||
        (req.body.telegram_id as string) ||
        (req.query.telegramId as string);

      const numAmount = Number(amount);

      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Please provide a valid deposit amount greater than 0',
        });
        return;
      }

      if (!telegramId) {
        res.status(400).json({
          success: false,
          error: 'Telegram ID is required for deposits',
        });
        return;
      }

      const created = await UserService.createDeposit({
        telegram_id: telegramId,
        amount: numAmount,
        method: (paymentMethod || 'telebirr').toLowerCase().includes('cbe') ? 'cbe' : 'telebirr',
        sms_text: smsText || referenceId || '',
        reference_id: referenceId,
        status: 'pending',
      });

      const balances = await UserService.getUserBalances(telegramId);

      res.json({
        success: true,
        message: `Deposit request of ${numAmount} ETB submitted for review`,
        data: {
          deposit: created,
          balances,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, accountNumber, paymentMethod } = req.body;
      const telegramId =
        (req.headers['x-telegram-id'] as string) ||
        (req.body.telegramId as string) ||
        (req.body.telegram_id as string) ||
        (req.query.telegramId as string);

      const numAmount = Number(amount);

      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Please provide a valid withdrawal amount greater than 0',
        });
        return;
      }

      if (!telegramId) {
        res.status(400).json({
          success: false,
          error: 'Telegram ID is required for withdrawals',
        });
        return;
      }

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      if (Number(user.withdrawable_balance || 0) < numAmount) {
        res.status(400).json({
          success: false,
          error: `Insufficient withdrawable balance. Available: ${user.withdrawable_balance || 0} ETB`,
        });
        return;
      }

      // Deduct withdrawable balance immediately
      const newWithdrawable = Number(user.withdrawable_balance || 0) - numAmount;
      await UserService.updateUser(telegramId, { withdrawable_balance: newWithdrawable });

      const created = await UserService.createWithdrawal({
        telegram_id: telegramId,
        amount: numAmount,
        method: paymentMethod || 'Telebirr',
        account_number: accountNumber || user.phone || '0900000000',
        status: 'pending',
      });

      const balances = await UserService.getUserBalances(telegramId);

      res.json({
        success: true,
        message: `Withdrawal of ${numAmount} ETB submitted successfully`,
        data: {
          withdrawal: created,
          balances,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

