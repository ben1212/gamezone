import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initTelegramBot } from './services/telegramBot.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log('==============================================');
  console.log(`🎮 GameZone Backend API Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
  console.log(`💰 Balances: http://localhost:${PORT}/api/wallet/balances`);
  console.log('==============================================');

  // Launch Telegram Bot
  initTelegramBot();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
