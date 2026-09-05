import express, { Express } from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';
import { authenticateUser } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

export const createApp = (): Express => {
  const app = express();

  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Basic request logger
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Attach authenticated user context
  app.use(authenticateUser);

  // Mount API endpoints
  app.use('/api', apiRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
