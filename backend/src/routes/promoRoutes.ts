import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService.js';

export const promoRoutes = Router();

// POST /api/promos/redeem
promoRoutes.post('/redeem', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const telegramId =
      (req.headers['x-telegram-id'] as string) ||
      (req.body.telegramId as string) ||
      (req.body.telegram_id as string) ||
      (req.query.telegramId as string);

    if (!code) {
      return res.status(400).json({ success: false, error: 'Promo code is required' });
    }

    if (!telegramId) {
      return res.status(400).json({ success: false, error: 'Telegram ID is required' });
    }

    const result = await UserService.redeemPromoCode(telegramId, code);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
