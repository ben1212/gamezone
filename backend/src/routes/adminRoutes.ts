import { Router, Request, Response } from 'express';
import { db } from '../data/db.js';

export const adminRoutes = Router();

// Hardcoded Admin Credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'password123';

// 1. Admin Login
adminRoutes.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({
      success: true,
      token: `admin-token-${Date.now()}`,
      admin: {
        username: 'admin',
        name: 'Super Admin',
        role: 'Super Admin',
        avatar: 'BA',
      },
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid username or password',
  });
});

// 2. Overview & Live KPIs
adminRoutes.get('/overview', (_req: Request, res: Response) => {
  const transactions = db.getTransactions();
  const balances = db.getBalances();
  const user = db.getUser();

  const totalDeposits = transactions
    .filter((t) => t.type === 'positive' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 86420);

  const totalWithdrawals = transactions
    .filter((t) => t.type === 'negative')
    .reduce((sum, t) => sum + Math.abs(t.amount), 41850);

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;

  res.json({
    success: true,
    data: {
      totalUsers: 18492,
      onlineNow: 247,
      todayDeposits: totalDeposits,
      todayWithdrawals: totalWithdrawals,
      pendingTransactions: pendingCount,
      treasuryBalance: balances.total,
      recentActivity: [
        { id: '1', title: 'Deposit approved', detail: 'Player #10284 · 500 ETB', time: '2m ago', type: 'green' },
        { id: '2', title: 'Withdrawal requested', detail: 'Player #08412 · 1,200 ETB', time: '4m ago', type: 'yellow' },
        { id: '3', title: 'New player registered', detail: `@${user.username || 'abebe_21'}`, time: '7m ago', type: 'green' },
        { id: '4', title: 'Deposit approved', detail: 'Player #19021 · 1,000 ETB', time: '9m ago', type: 'green' },
      ],
    },
  });
});

// 3. Transactions & Approval
adminRoutes.get('/transactions', (_req: Request, res: Response) => {
  const transactions = db.getTransactions();

  // Mock initial transactions if database is fresh
  const defaultList = [
    {
      id: 'DP-20841',
      userId: '10284',
      playerName: 'Abebe T.',
      username: '@abebe_21',
      title: 'Deposit via Telebirr',
      meta: 'SMS: 9A8B7C · 0911002233',
      amount: 500,
      currency: 'ETB',
      type: 'positive',
      method: 'Telebirr',
      status: 'pending',
      timestamp: '09:18',
    },
    {
      id: 'DP-20840',
      userId: '102941',
      playerName: 'Mekdes K.',
      username: '@mekdes7',
      title: 'Deposit via Telebirr',
      meta: 'SMS: 7X8Y9Z · 0922334455',
      amount: 1000,
      currency: 'ETB',
      type: 'positive',
      method: 'Telebirr',
      status: 'approved',
      timestamp: '09:12',
    },
    {
      id: 'WD-10921',
      userId: '102955',
      playerName: 'Daniel A.',
      username: '@dani_11',
      title: 'Withdrawal to CBE',
      meta: 'Acc: 1000987654321',
      amount: -1200,
      currency: 'ETB',
      type: 'negative',
      method: 'CBE Birr',
      status: 'pending',
      timestamp: '09:07',
    },
    {
      id: 'DP-20838',
      userId: '102999',
      playerName: 'Hana M.',
      username: '@hana22',
      title: 'Deposit via Telebirr',
      meta: 'Invalid SMS format',
      amount: 300,
      currency: 'ETB',
      type: 'positive',
      method: 'Telebirr',
      status: 'rejected',
      timestamp: '08:54',
    },
  ];

  const allTxs = [...transactions, ...defaultList];

  res.json({
    success: true,
    data: allTxs,
  });
});

// 4. Approve Transaction
adminRoutes.post('/transactions/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (amount && Number(amount) > 0) {
    const balances = db.getBalances();
    db.updateBalances({
      ...balances,
      total: balances.total + Number(amount),
      playable: balances.playable + Number(amount),
    });
  }

  res.json({
    success: true,
    message: `Transaction ${id} successfully approved`,
    transactionId: id,
    status: 'approved',
  });
});

// 5. Reject Transaction
adminRoutes.post('/transactions/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  res.json({
    success: true,
    message: `Transaction ${id} rejected: ${reason || 'Unverified receipt'}`,
    transactionId: id,
    status: 'rejected',
  });
});

// 6. Users List & Modification
adminRoutes.get('/users', (_req: Request, res: Response) => {
  const user = db.getUser();
  const balances = db.getBalances();

  const usersList = [
    {
      id: user.telegramId || '102938',
      name: user.name || 'Bini Eyoel',
      username: user.username || '@bini',
      phone: user.phone || '+251911223344',
      totalBalance: balances.total || 2450,
      playableBalance: balances.playable || 1800,
      withdrawableBalance: balances.withdrawable || 650,
      status: 'active',
      joinedDate: 'Sep 03',
      lastActive: 'Just now',
    },
    {
      id: '102941',
      name: 'Mekdes K.',
      username: '@mekdes7',
      phone: '+251922334455',
      totalBalance: 820,
      playableBalance: 500,
      withdrawableBalance: 320,
      status: 'active',
      joinedDate: 'Sep 02',
      lastActive: '12m ago',
    },
    {
      id: '102955',
      name: 'Daniel A.',
      username: '@dani_11',
      phone: '+251933445566',
      totalBalance: 3100,
      playableBalance: 1200,
      withdrawableBalance: 1900,
      status: 'restricted',
      joinedDate: 'Aug 29',
      lastActive: '1h ago',
    },
    {
      id: '102988',
      name: 'Yosef T.',
      username: '@yosef_99',
      phone: '+251944556677',
      totalBalance: 4500,
      playableBalance: 2000,
      withdrawableBalance: 2500,
      status: 'active',
      joinedDate: 'Aug 25',
      lastActive: '3h ago',
    },
  ];

  res.json({
    success: true,
    data: usersList,
  });
});

// 7. Update User Status / Balance
adminRoutes.put('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, balanceAdjustment } = req.body;

  if (balanceAdjustment) {
    const balances = db.getBalances();
    db.updateBalances({
      ...balances,
      total: Math.max(0, balances.total + Number(balanceAdjustment)),
      playable: Math.max(0, balances.playable + Number(balanceAdjustment)),
    });
  }

  res.json({
    success: true,
    message: `User #${id} updated successfully`,
    userId: id,
    status: status || 'active',
  });
});
