import { Router } from 'express';
import { userRoutes } from './userRoutes.js';
import { walletRoutes } from './walletRoutes.js';
import { referralRoutes } from './referralRoutes.js';
import { gameRoutes } from './gameRoutes.js';
import { adminRoutes } from './adminRoutes.js';
import { taskRoutes } from './taskRoutes.js';
import { promoRoutes } from './promoRoutes.js';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'GameZone Backend API',
  });
});

apiRouter.use('/user', userRoutes);
apiRouter.use('/wallet', walletRoutes);
apiRouter.use('/referrals', referralRoutes);
apiRouter.use('/game', gameRoutes);
apiRouter.use('/tasks', taskRoutes);
apiRouter.use('/promos', promoRoutes);
apiRouter.use('/admin', adminRoutes);


