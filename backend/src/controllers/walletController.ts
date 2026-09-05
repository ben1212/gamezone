import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../services/walletService.js';

export class WalletController {
  public static getBalances(_req: Request, res: Response, next: NextFunction) {
    try {
      const balances = WalletService.getBalances();
      res.json({
        success: true,
        data: balances,
      });
    } catch (err) {
      next(err);
    }
  }

  public static getTransactions(_req: Request, res: Response, next: NextFunction) {
    try {
      const transactions = WalletService.getTransactions();
      res.json({
        success: true,
        data: transactions,
      });
    } catch (err) {
      next(err);
    }
  }

  public static deposit(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, paymentMethod, referenceId } = req.body;
      const numAmount = Number(amount);

      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Please provide a valid deposit amount greater than 0',
        });
        return;
      }

      const result = WalletService.deposit(
        numAmount,
        paymentMethod || 'telebirr',
        referenceId
      );
      res.json({
        success: true,
        message: `Deposited ${numAmount} ETB successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount, accountNumber } = req.body;
      const numAmount = Number(amount);

      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Please provide a valid withdrawal amount greater than 0',
        });
        return;
      }

      const result = WalletService.withdraw(numAmount, accountNumber || '0912345678');
      res.json({
        success: true,
        message: `Withdrawal of ${numAmount} ETB initiated`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
