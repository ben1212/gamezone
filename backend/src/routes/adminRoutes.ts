import { Router, Request, Response } from 'express';
import { db } from '../data/db.js';

export const adminRoutes = Router();

// Hardcoded Admin Credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'password123';

// Mock in-memory state for games, broadcasts, affiliates, staff, and system logs
let systemGames = [
  {
    id: 'bingo',
    name: 'Bingo Live',
    icon: '🎱',
    status: 'active',
    activePlayers: 184,
    totalRoundsToday: 342,
    todayTurnover: 76400,
    rakePercentage: 10,
    rooms: [
      { id: 'room-01', name: 'Standard Room', stake: 10, minPlayers: 2, maxPlayers: 50, activeTickets: 28, status: 'active', prizePool: 252 },
      { id: 'room-02', name: 'High Roller', stake: 50, minPlayers: 2, maxPlayers: 30, activeTickets: 14, status: 'active', prizePool: 630 },
      { id: 'room-03', name: 'VIP Jackpot', stake: 100, minPlayers: 2, maxPlayers: 20, activeTickets: 8, status: 'active', prizePool: 720 },
    ],
  },
  {
    id: 'keno',
    name: 'Keno Turbo',
    icon: '🎯',
    status: 'active',
    activePlayers: 42,
    totalRoundsToday: 820,
    todayTurnover: 38200,
    rakePercentage: 8,
    roundIntervalSeconds: 60,
    rtpPercentage: 94.5,
    minBet: 5,
    maxBet: 1000,
  },
  {
    id: 'ludo',
    name: 'Ludo Arena',
    icon: '🎲',
    status: 'active',
    activePlayers: 21,
    totalRoundsToday: 115,
    todayTurnover: 18900,
    rakePercentage: 8,
    activeTables: 6,
    minStake: 20,
    maxStake: 500,
  },
];

let systemBroadcasts = [
  {
    id: 'bc-01',
    title: '🔥 Weekend 50,000 ETB Bingo Tournament',
    message: 'Join the Grand Weekend Bingo Tournament! Over 50,000 ETB in guaranteed prizes. Top 10 cartelas win cash instantly!',
    target: 'All Players',
    sentCount: 18492,
    status: 'sent',
    timestamp: 'Yesterday at 18:00',
  },
  {
    id: 'bc-02',
    title: '⚡ Fast Telebirr & CBE Payouts Active',
    message: 'Telebirr and CBE Birr instant deposits & withdrawals are active 24/7 with zero delay.',
    target: 'Active Players',
    sentCount: 6820,
    status: 'sent',
    timestamp: '2 days ago',
  },
];

let systemStaff = [
  { id: 'A001', name: 'Super Admin', username: 'admin', role: 'Super Admin', email: 'admin@gamezone.et', status: 'active', lastLogin: 'Just now' },
  { id: 'A002', name: 'Yonas Finance', username: 'yonas_cashier', role: 'Finance Admin', email: 'yonas@gamezone.et', status: 'active', lastLogin: '2h ago' },
  { id: 'A003', name: 'Helen Support', username: 'helen_ops', role: 'Support Agent', email: 'helen@gamezone.et', status: 'active', lastLogin: '5h ago' },
];

let auditLogs = [
  { id: 'log-1', admin: 'Super Admin (A001)', action: 'Approved withdrawal #WD-10918 (450 ETB)', ip: '196.188.24.12', timestamp: '09:01' },
  { id: 'log-2', admin: 'Support Agent (A003)', action: 'Updated status of Player #102955 to Restricted', ip: '196.188.24.15', timestamp: '08:43' },
  { id: 'log-3', admin: 'Finance Admin (A002)', action: 'Verified & approved Telebirr deposit #DP-20840 (1,000 ETB)', ip: '196.188.24.14', timestamp: '08:15' },
  { id: 'log-4', admin: 'Super Admin (A001)', action: 'Updated Bingo Room #02 stake configuration to 50 ETB', ip: '196.188.24.12', timestamp: 'Yesterday' },
];

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
      totalGGR: 133500,
      platformProfit: 14200,
      recentActivity: [
        { id: '1', title: 'Deposit approved', detail: 'Player #10284 · 500 ETB · Telebirr', time: '2m ago', type: 'green' },
        { id: '2', title: 'Withdrawal requested', detail: 'Player #08412 · 1,200 ETB · CBE Birr', time: '4m ago', type: 'yellow' },
        { id: '3', title: 'New player registered', detail: `@${user.username || 'abebe_21'} via Telegram`, time: '7m ago', type: 'green' },
        { id: '4', title: 'Bingo Live Room #01 Won', detail: 'Player #19021 won 450 ETB pot', time: '9m ago', type: 'green' },
      ],
    },
  });
});

// 3. Transactions & Approval
adminRoutes.get('/transactions', (_req: Request, res: Response) => {
  const transactions = db.getTransactions();

  const defaultList = [
    {
      id: 'DP-20841',
      userId: '10284',
      playerName: 'Abebe T.',
      username: '@abebe_21',
      phone: '+251911002233',
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
      phone: '+251922334455',
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
      phone: '+251933445566',
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
      phone: '+251955667788',
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

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    admin: 'Super Admin (A001)',
    action: `Approved transaction #${id} (${amount || ''} ETB)`,
    ip: '196.188.24.12',
    timestamp: 'Just now',
  });

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

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    admin: 'Super Admin (A001)',
    action: `Rejected transaction #${id} (${reason || 'Unverified proof'})`,
    ip: '196.188.24.12',
    timestamp: 'Just now',
  });

  res.json({
    success: true,
    message: `Transaction ${id} rejected: ${reason || 'Unverified receipt'}`,
    transactionId: id,
    status: 'rejected',
  });
});

// 6. Users List & Deep Profile
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
      totalDeposited: 12500,
      totalWithdrawn: 8400,
      totalWagered: 45200,
      winCount: 42,
      lossCount: 38,
      status: 'active',
      joinedDate: 'Sep 03',
      lastActive: 'Just now',
      invitedBy: '#08912 (@gamezone_king)',
      referralCount: user.totalReferrals || 12,
      referralEarnings: user.referralBonusETB || 85,
    },
    {
      id: '102941',
      name: 'Mekdes K.',
      username: '@mekdes7',
      phone: '+251922334455',
      totalBalance: 820,
      playableBalance: 500,
      withdrawableBalance: 320,
      totalDeposited: 4200,
      totalWithdrawn: 3100,
      totalWagered: 18400,
      winCount: 18,
      lossCount: 22,
      status: 'active',
      joinedDate: 'Sep 02',
      lastActive: '12m ago',
      invitedBy: '#102938 (@bini)',
      referralCount: 4,
      referralEarnings: 30,
    },
    {
      id: '102955',
      name: 'Daniel A.',
      username: '@dani_11',
      phone: '+251933445566',
      totalBalance: 3100,
      playableBalance: 1200,
      withdrawableBalance: 1900,
      totalDeposited: 18000,
      totalWithdrawn: 14000,
      totalWagered: 89000,
      winCount: 74,
      lossCount: 65,
      status: 'restricted',
      joinedDate: 'Aug 29',
      lastActive: '1h ago',
      invitedBy: 'Direct',
      referralCount: 0,
      referralEarnings: 0,
    },
    {
      id: '102988',
      name: 'Yosef T.',
      username: '@yosef_99',
      phone: '+251944556677',
      totalBalance: 4500,
      playableBalance: 2000,
      withdrawableBalance: 2500,
      totalDeposited: 22000,
      totalWithdrawn: 16500,
      totalWagered: 114000,
      winCount: 95,
      lossCount: 88,
      status: 'active',
      joinedDate: 'Aug 25',
      lastActive: '3h ago',
      invitedBy: '#102938 (@bini)',
      referralCount: 19,
      referralEarnings: 140,
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
  const { status, balanceAdjustment, reason } = req.body;

  if (balanceAdjustment) {
    const balances = db.getBalances();
    db.updateBalances({
      ...balances,
      total: Math.max(0, balances.total + Number(balanceAdjustment)),
      playable: Math.max(0, balances.playable + Number(balanceAdjustment)),
    });
  }

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    admin: 'Super Admin (A001)',
    action: `Updated Player #${id}: status=${status || 'unchanged'}, balanceAdjust=${balanceAdjustment || 0} ETB (${reason || 'Admin memo'})`,
    ip: '196.188.24.12',
    timestamp: 'Just now',
  });

  res.json({
    success: true,
    message: `User #${id} updated successfully`,
    userId: id,
    status: status || 'active',
  });
});

// 8. Games Control & Room Configuration
adminRoutes.get('/games', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: systemGames,
  });
});

adminRoutes.post('/games/:gameId/toggle', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const { status } = req.body;

  systemGames = systemGames.map((g) => (g.id === gameId ? { ...g, status: status || (g.status === 'active' ? 'paused' : 'active') } : g));

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    admin: 'Super Admin (A001)',
    action: `Changed ${gameId} game status to ${status || 'toggled'}`,
    ip: '196.188.24.12',
    timestamp: 'Just now',
  });

  res.json({
    success: true,
    message: `Game ${gameId} status updated`,
    data: systemGames,
  });
});

adminRoutes.post('/games/bingo/rooms', (req: Request, res: Response) => {
  const { name, stake, minPlayers, maxPlayers } = req.body;
  const newRoom = {
    id: `room-${Date.now().toString().slice(-4)}`,
    name: name || 'Custom Room',
    stake: Number(stake) || 20,
    minPlayers: Number(minPlayers) || 2,
    maxPlayers: Number(maxPlayers) || 40,
    activeTickets: 0,
    status: 'active',
    prizePool: 0,
  };

  const bingoGame = systemGames.find((g) => g.id === 'bingo');
  if (bingoGame && bingoGame.rooms) {
    bingoGame.rooms.push(newRoom);
  }

  res.json({
    success: true,
    message: 'New Bingo room created',
    data: newRoom,
  });
});

// 9. Telegram Broadcast Center
adminRoutes.get('/broadcasts', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: systemBroadcasts,
  });
});

adminRoutes.post('/broadcasts', (req: Request, res: Response) => {
  const { title, message, target } = req.body;
  const newBroadcast = {
    id: `bc-${Date.now().toString().slice(-4)}`,
    title: title || 'Announcement',
    message: message || '',
    target: target || 'All Players',
    sentCount: target === 'Active Players' ? 6820 : 18492,
    status: 'sent',
    timestamp: 'Just now',
  };

  systemBroadcasts.unshift(newBroadcast);

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    admin: 'Super Admin (A001)',
    action: `Sent Telegram broadcast: "${title}" to ${target}`,
    ip: '196.188.24.12',
    timestamp: 'Just now',
  });

  res.json({
    success: true,
    message: `Broadcast message sent to ${newBroadcast.sentCount} Telegram users`,
    data: newBroadcast,
  });
});

// 10. Audit Logs & Staff Management
adminRoutes.get('/logs', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: auditLogs,
  });
});

adminRoutes.get('/staff', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: systemStaff,
  });
});

adminRoutes.post('/staff', (req: Request, res: Response) => {
  const { name, username, role, email } = req.body;
  const newMember = {
    id: `A00${systemStaff.length + 1}`,
    name: name || 'Admin User',
    username: username || 'new_admin',
    role: role || 'Support Agent',
    email: email || 'admin@gamezone.et',
    status: 'active',
    lastLogin: 'Never',
  };

  systemStaff.push(newMember);

  res.json({
    success: true,
    message: `New team member ${name} added`,
    data: newMember,
  });
});
