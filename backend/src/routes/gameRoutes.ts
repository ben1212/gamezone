import { Router } from 'express';
import { db } from '../data/db.js';

export const gameRoutes = Router();

interface PurchasedTicket {
  cartellaIndex: number;
  userId: string;
}

let purchasedTickets: PurchasedTicket[] = [
  { cartellaIndex: 4, userId: 'player-2' },
  { cartellaIndex: 17, userId: 'player-3' },
  { cartellaIndex: 28, userId: 'player-4' },
];

gameRoutes.get('/state', (_req, res) => {
  res.json({
    status: 'COUNTDOWN',
    secondsLeft: 45,
    totalTickets: purchasedTickets.length,
    prizePool: purchasedTickets.length * 10 * 0.8,
    purchasedTickets,
  });
});

gameRoutes.post('/buy-ticket', (req, res) => {
  const { cartellaIndex } = req.body;
  const user = db.getUser();
  const balances = db.getBalances();
  const price = 10;

  if (balances.playable < price) {
    return res.status(400).json({ error: 'Insufficient playable balance (10 ETB required)' });
  }

  // Deduct from playable
  const newPlayable = balances.playable - price;
  const updatedBalances = db.updateBalances({
    ...balances,
    playable: newPlayable,
    total: balances.withdrawable + newPlayable,
  });

  db.addTransaction({
    id: 'tx-' + Date.now(),
    userId: user.id || 'user-1',
    title: 'Bingo Cartela Purchase',
    meta: `Cartela #${cartellaIndex}`,
    amount: price,
    currency: balances.currency,
    type: 'negative',
    icon: '🎱',
    status: 'completed',
    timestamp: new Date().toISOString(),
  });

  // Track ticket
  purchasedTickets = purchasedTickets.filter((t) => t.cartellaIndex !== cartellaIndex);
  purchasedTickets.push({ cartellaIndex, userId: user.id || 'user-1' });

  return res.json({
    success: true,
    cartellaIndex,
    newBalance: updatedBalances.playable,
    withdrawableBalance: updatedBalances.withdrawable,
  });
});

gameRoutes.post('/unselect-ticket', (req, res) => {
  const { cartellaIndex } = req.body;
  const user = db.getUser();
  const balances = db.getBalances();
  const price = 10;

  // Refund to playable
  const newPlayable = balances.playable + price;
  const updatedBalances = db.updateBalances({
    ...balances,
    playable: newPlayable,
    total: balances.withdrawable + newPlayable,
  });

  db.addTransaction({
    id: 'tx-' + Date.now(),
    userId: user.id || 'user-1',
    title: 'Bingo Cartela Refund',
    meta: `Unselected Cartela #${cartellaIndex}`,
    amount: price,
    currency: balances.currency,
    type: 'positive',
    icon: '🎱',
    status: 'completed',
    timestamp: new Date().toISOString(),
  });

  purchasedTickets = purchasedTickets.filter(
    (t) => !(t.cartellaIndex === cartellaIndex && String(t.userId) === String(user.id || 'user-1'))
  );

  return res.json({
    success: true,
    cartellaIndex,
    newBalance: updatedBalances.playable,
    withdrawableBalance: updatedBalances.withdrawable,
  });
});
