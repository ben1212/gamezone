import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService.js';

export const taskRoutes = Router();

// GET /api/tasks (list active tasks)
taskRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const telegramId =
      (req.headers['x-telegram-id'] as string) ||
      (req.query.telegramId as string) ||
      (req.query.telegram_id as string);

    const tasks = await UserService.getDynamicTasks(telegramId);
    res.json({
      success: true,
      data: tasks,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tasks/:id/claim (claim task reward)
taskRoutes.post('/:id/claim', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const telegramId =
      (req.headers['x-telegram-id'] as string) ||
      (req.body.telegramId as string) ||
      (req.body.telegram_id as string) ||
      (req.query.telegramId as string);

    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'Telegram ID is required to claim task reward',
      });
    }

    const result = await UserService.claimTask(telegramId, id);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
