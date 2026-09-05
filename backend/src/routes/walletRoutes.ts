import { Router } from 'express';
import { WalletController } from '../controllers/walletController.js';

export const walletRoutes = Router();

walletRoutes.get('/balances', WalletController.getBalances);
walletRoutes.get('/transactions', WalletController.getTransactions);
walletRoutes.post('/deposit', WalletController.deposit);
walletRoutes.post('/withdraw', WalletController.withdraw);
