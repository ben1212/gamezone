import React, { useState, useEffect } from 'react';
import { adminApi } from './services/api';

interface TransactionItem {
  id: string;
  userId: string;
  playerName: string;
  username: string;
  phone?: string;
  title: string;
  meta: string;
  amount: number;
  currency: string;
  type: 'positive' | 'negative';
  category?: 'deposit' | 'withdrawal' | 'game' | 'bonus';
  method: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

interface UserItem {
  id: string;
  name: string;
  username: string;
  phone: string;
  totalBalance: number;
  playableBalance: number;
  withdrawableBalance: number;
  totalDeposited?: number;
  totalWithdrawn?: number;
  totalWagered?: number;
  winCount?: number;
  lossCount?: number;
  status: 'active' | 'blocked';
  joinedDate: string;
  lastActive: string;
}

interface LiveGameItem {
  id: string;
  gameNumber: string;
  gameType: string;
  playersCount: number;
  totalStakes: number;
  prizePool: number;
  status: string;
  timeRemaining?: string;
}

interface ActivityItem {
  id: string;
  type: 'user' | 'deposit_approved' | 'withdraw_approved' | 'deposit_rejected' | 'withdraw_rejected' | 'game_completed';
  title: string;
  detail: string;
  time: string;
}

interface NotificationItem {
  id: string;
  type: 'payment' | 'system' | 'alert';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface PromotionItem {
  id: string;
  title: string;
  type: 'Deposit Bonus' | 'Free Spins' | 'Task' | 'Promo Code';
  reward: string;
  target: string;
  status: 'active' | 'expired';
  claimedCount: number;
}

export const App: React.FC = () => {
  // ── Authentication ──
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('gamezone_admin_auth') === 'true';
  });
  const [loginUser, setLoginUser] = useState<string>('admin');
  const [loginPass, setLoginPass] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Navigation ──
  const [activeSection, setActiveSection] = useState<
    'overview' | 'payments' | 'users' | 'games' | 'analytics' | 'promotions' | 'transactions' | 'notifications' | 'settings'
  >('overview');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // ── Stateful Data ──
  const [transactions, setTransactions] = useState<TransactionItem[]>([
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
      category: 'deposit',
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
      category: 'deposit',
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
      category: 'withdrawal',
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
      meta: 'SMS: Invalid format',
      amount: 300,
      currency: 'ETB',
      type: 'positive',
      category: 'deposit',
      method: 'Telebirr',
      status: 'rejected',
      timestamp: '08:54',
    },
    {
      id: 'WD-10918',
      userId: '10284',
      playerName: 'Abebe T.',
      username: '@abebe_21',
      phone: '+251911002233',
      title: 'Withdrawal via Telebirr',
      meta: 'Phone: 0911002233',
      amount: -450,
      currency: 'ETB',
      type: 'negative',
      category: 'withdrawal',
      method: 'Telebirr',
      status: 'approved',
      timestamp: '08:30',
    },
  ]);

  const [usersList, setUsersList] = useState<UserItem[]>([
    {
      id: '102938',
      name: 'Bini Eyoel',
      username: '@bini',
      phone: '+251911223344',
      totalBalance: 2450,
      playableBalance: 1800,
      withdrawableBalance: 650,
      totalDeposited: 12500,
      totalWithdrawn: 8400,
      totalWagered: 45200,
      winCount: 42,
      lossCount: 38,
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
      totalDeposited: 4200,
      totalWithdrawn: 3100,
      totalWagered: 18400,
      winCount: 18,
      lossCount: 22,
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
      totalDeposited: 18000,
      totalWithdrawn: 14000,
      totalWagered: 89000,
      winCount: 74,
      lossCount: 65,
      status: 'active',
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
      totalDeposited: 22000,
      totalWithdrawn: 16500,
      totalWagered: 114000,
      winCount: 95,
      lossCount: 88,
      status: 'blocked',
      joinedDate: 'Aug 25',
      lastActive: '3h ago',
    },
  ]);

  const [liveGames] = useState<LiveGameItem[]>([
    {
      id: 'g-1',
      gameNumber: '#BINGO-108',
      gameType: 'Bingo Live (10 ETB)',
      playersCount: 28,
      totalStakes: 280,
      prizePool: 252,
      status: 'Drawing Ball 24/75',
      timeRemaining: '01:14',
    },
    {
      id: 'g-2',
      gameNumber: '#KENO-402',
      gameType: 'Keno Turbo (Fast)',
      playersCount: 14,
      totalStakes: 420,
      prizePool: 390,
      status: 'Counting Down',
      timeRemaining: '00:18',
    },
    {
      id: 'g-3',
      gameNumber: '#BINGO-109',
      gameType: 'VIP Bingo (50 ETB)',
      playersCount: 8,
      totalStakes: 400,
      prizePool: 360,
      status: 'Waiting for Players',
      timeRemaining: '00:45',
    },
  ]);

  const [recentActivities] = useState<ActivityItem[]>([
    { id: '1', type: 'deposit_approved', title: 'Deposit approved', detail: 'Player #10284 · 500 ETB · Telebirr', time: '2m ago' },
    { id: '2', type: 'withdraw_approved', title: 'Withdrawal approved', detail: 'Player #102941 · 450 ETB · Telebirr', time: '8m ago' },
    { id: '3', type: 'user', title: 'New user registered', detail: '@abebe_21 joined via Telegram bot', time: '14m ago' },
    { id: '4', type: 'game_completed', title: 'Game completed', detail: '#BINGO-107 won by @mekdes7 · 630 ETB', time: '21m ago' },
    { id: '5', type: 'deposit_rejected', title: 'Deposit rejected', detail: 'Player #102999 · 300 ETB (Invalid SMS)', time: '35m ago' },
  ]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 'n-1', type: 'payment', title: 'New Deposit Request', message: 'Player #10284 submitted Telebirr deposit of 500 ETB', time: 'Just now', read: false },
    { id: 'n-2', type: 'payment', title: 'New Withdrawal Request', message: 'Player #102955 requested 1,200 ETB to CBE Bank', time: '7m ago', read: false },
    { id: 'n-3', type: 'alert', title: 'High Concurrent Players', message: 'Bingo Live server reached 247 concurrent players', time: '1h ago', read: false },
  ]);

  const [promotions, setPromotions] = useState<PromotionItem[]>([
    { id: 'p-1', title: '100% First Deposit Match', type: 'Deposit Bonus', reward: '+100% Bonus up to 1,000 ETB', target: 'New Players', status: 'active', claimedCount: 1420 },
    { id: 'p-2', title: 'Weekend Bingo Free Ticket', type: 'Free Spins', reward: '1 Free Cartela on 50 ETB Deposit', target: 'All Players', status: 'active', claimedCount: 820 },
    { id: 'p-3', title: 'Telegram Channel Join Bonus', type: 'Task', reward: '15 ETB Free Playable Balance', target: 'Verified Users', status: 'active', claimedCount: 3410 },
  ]);

  // ── Modals & Filtering State ──
  const [paymentTab, setPaymentTab] = useState<'all' | 'deposit' | 'withdrawal' | 'pending'>('all');
  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Invalid SMS reference / unverified');

  const [usersSearch, setUsersSearch] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [analyticsPeriod, setAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showNewPromoModal, setShowNewPromoModal] = useState<boolean>(false);

  // ── Settings State ──
  const [telebirrPhone, setTelebirrPhone] = useState<string>('0911002233');
  const [cbeAccount, setCbeAccount] = useState<string>('1000123456789');
  const [minDeposit, setMinDeposit] = useState<number>(10);
  const [minWithdraw, setMinWithdraw] = useState<number>(50);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((prev) => (prev === msg ? null : prev)), 2600);
  };

  // Live data sync
  useEffect(() => {
    if (!isAuthenticated) return;
    adminApi.getTransactions().then((res) => {
      if (res?.success && Array.isArray(res.data)) setTransactions(res.data);
    });
    adminApi.getUsers().then((res) => {
      if (res?.success && Array.isArray(res.data)) setUsersList(res.data);
    });
  }, [isAuthenticated]);

  // ── Authentication Handlers ──
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      loginUser === 'admin' &&
      (loginPass === 'password123' || loginPass === 'admin123' || loginPass === 'gamezone2026')
    ) {
      setIsAuthenticated(true);
      localStorage.setItem('gamezone_admin_auth', 'true');
      setLoginError(null);
      showToast('Welcome to Bingo X Admin Panel');
    } else {
      setLoginError('Invalid administrator credentials.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('gamezone_admin_auth');
    setLoginPass('');
  };

  // ── Payment Actions ──
  const handleApproveTx = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'approved' as const } : t))
    );
    adminApi.approveTransaction(id, tx ? Math.abs(tx.amount) : 0);
    showToast(`Payment #${id} approved successfully`);
    if (selectedTx?.id === id) setSelectedTx(null);
  };

  const handleRejectTx = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'rejected' as const } : t))
    );
    adminApi.rejectTransaction(id, rejectReason);
    showToast(`Payment #${id} rejected`);
    if (selectedTx?.id === id) setSelectedTx(null);
  };

  // ── User Actions (Block / Unblock) ──
  const handleToggleBlockUser = (userId: string) => {
    const targetUser = usersList.find((u) => u.id === userId);
    if (!targetUser) return;
    const newStatus = targetUser.status === 'active' ? 'blocked' : 'active';

    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    adminApi.updateUser(userId, { status: newStatus });
    showToast(`Player #${userId} ${newStatus === 'blocked' ? 'Blocked' : 'Unblocked'}`);
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Filtered lists
  const pendingDeposits = transactions.filter((t) => t.type === 'positive' && t.status === 'pending');
  const pendingWithdrawals = transactions.filter((t) => t.type === 'negative' && t.status === 'pending');
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const filteredPayments = transactions.filter((t) => {
    if (paymentTab === 'deposit' && t.type !== 'positive') return false;
    if (paymentTab === 'withdrawal' && t.type !== 'negative') return false;
    if (paymentTab === 'pending' && t.status !== 'pending') return false;
    if (paymentSearch) {
      const q = paymentSearch.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.playerName.toLowerCase().includes(q) ||
        t.username.toLowerCase().includes(q) ||
        t.meta.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredUsers = usersList.filter((u) => {
    if (usersSearch) {
      const q = usersSearch.toLowerCase();
      return (
        u.id.includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.phone.includes(q)
      );
    }
    return true;
  });

  // Navigation switch helper (closes drawer on mobile)
  const navigateTo = (section: typeof activeSection) => {
    setActiveSection(section);
    setMobileDrawerOpen(false);
  };

  // ── LOGIN SCREEN ──
  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay">
        <div className="admin-login-card">
          <div className="admin-login-brand">
            ✦ Bingo <span>X</span>
          </div>
          <div className="admin-login-badge">Admin Operations Center</div>

          <form onSubmit={handleLogin}>
            <div className="admin-input-group">
              <label>Administrator Username</label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin"
                required
              />
            </div>

            <div className="admin-input-group">
              <label>Password</label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="password123"
                required
              />
            </div>

            {loginError && (
              <div style={{ color: '#fb7185', fontSize: '11px', marginBottom: '14px', textAlign: 'left' }}>
                ⚠️ {loginError}
              </div>
            )}

            <button type="submit" className="admin-login-btn">
              Access Admin Panel →
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      {/* ── Sidebar (Desktop Fixed / Mobile Drawer) ── */}
      <aside className={`admin-sidebar ${mobileDrawerOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            ✦ Bingo <span>X</span>
            <span className="admin-brand-tag">ADMIN</span>
          </div>
          <button
            className="admin-drawer-close"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Category 1: MAIN */}
        <div className="admin-nav-group">
          <div className="admin-nav-label">MAIN</div>
          <button
            className={`admin-nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => navigateTo('overview')}
          >
            <span className="admin-nav-icon">🏠</span> Overview
          </button>
          <button
            className={`admin-nav-btn ${activeSection === 'payments' ? 'active' : ''}`}
            onClick={() => navigateTo('payments')}
          >
            <span className="admin-nav-icon">💳</span> Payments
            {pendingDeposits.length + pendingWithdrawals.length > 0 && (
              <span className="admin-nav-badge">
                {pendingDeposits.length + pendingWithdrawals.length}
              </span>
            )}
          </button>
          <button
            className={`admin-nav-btn ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => navigateTo('users')}
          >
            <span className="admin-nav-icon">👥</span> Users
          </button>
          <button
            className={`admin-nav-btn ${activeSection === 'games' ? 'active' : ''}`}
            onClick={() => navigateTo('games')}
          >
            <span className="admin-nav-icon">🎮</span> Games
          </button>
        </div>

        {/* Category 2: MANAGEMENT */}
        <div className="admin-nav-group">
          <div className="admin-nav-label">MANAGEMENT</div>
          <button
            className={`admin-nav-btn ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => navigateTo('analytics')}
          >
            <span className="admin-nav-icon">📊</span> Analytics
          </button>
          <button
            className={`admin-nav-btn ${activeSection === 'promotions' ? 'active' : ''}`}
            onClick={() => navigateTo('promotions')}
          >
            <span className="admin-nav-icon">🎁</span> Promotions
          </button>
          <button
            className={`admin-nav-btn ${activeSection === 'transactions' ? 'active' : ''}`}
            onClick={() => navigateTo('transactions')}
          >
            <span className="admin-nav-icon">🧾</span> Transactions
          </button>
        </div>

        {/* Category 3: SYSTEM */}
        <div className="admin-nav-group">
          <div className="admin-nav-label">SYSTEM</div>
          <button
            className={`admin-nav-btn ${activeSection === 'notifications' ? 'active' : ''}`}
            onClick={() => navigateTo('notifications')}
          >
            <span className="admin-nav-icon">🔔</span> Notifications
            {unreadNotifCount > 0 && (
              <span className="admin-nav-badge danger">{unreadNotifCount}</span>
            )}
          </button>
          <button
            className={`admin-nav-btn ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => navigateTo('settings')}
          >
            <span className="admin-nav-icon">⚙️</span> Settings
          </button>
        </div>

        {/* Sidebar Footer: Profile & Logout */}
        <div className="admin-sidebar-footer">
          <div className="admin-profile-pill">
            <div className="admin-avatar">AD</div>
            <div className="admin-profile-info">
              <div className="admin-profile-name">Admin</div>
              <div className="admin-profile-role">Owner</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <span>🚪</span> Log out
          </button>
        </div>
      </aside>

      {/* ── Main Operations Screen ── */}
      <main className="admin-main">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="admin-top-left">
            <button
              className="admin-menu-toggle"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="admin-page-title">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </div>
          </div>

          <div className="admin-top-right">
            <div className="admin-status-strip">
              <span className="admin-status-badge">
                <i className="admin-dot" /> System Online
              </span>
              <span className="admin-status-badge">
                <i className="admin-dot" /> Game Server Online
              </span>
              <span className="admin-status-badge">
                <i className="admin-dot" /> Payment Gateway
              </span>
            </div>

            <button
              className="admin-notif-btn"
              onClick={() => navigateTo('notifications')}
              aria-label="Notifications"
            >
              🔔
              {unreadNotifCount > 0 && (
                <span className="admin-notif-count">{unreadNotifCount}</span>
              )}
            </button>

            <div className="admin-avatar" style={{ cursor: 'pointer' }} onClick={() => navigateTo('settings')}>
              AD
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="admin-content">
          {/* ══════════════════════════════════════════════════
              1. 🏠 OVERVIEW (Main Dashboard Snapshot)
          ══════════════════════════════════════════════════ */}
          {activeSection === 'overview' && (
            <section>
              {/* Platform Status Bar */}
              <div className="admin-platform-status-bar">
                <div className="admin-status-item">
                  <i className="admin-dot" /> System Status: <strong>Online</strong>
                </div>
                <div className="admin-status-item">
                  <i className="admin-dot" /> Game Server: <strong>Online (3 Rooms)</strong>
                </div>
                <div className="admin-status-item">
                  <i className="admin-dot" /> Payment System: <strong>Online (Telebirr / CBE)</strong>
                </div>
              </div>

              {/* 🚨 Payment Alerts (Immediate Action Area) */}
              {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
                <div className="admin-alerts-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ color: '#fbbf24', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ⚠️ Payment Alerts ({pendingDeposits.length + pendingWithdrawals.length} Pending Actions)
                    </strong>
                    <button className="admin-btn" style={{ padding: '4px 8px', fontSize: '10.5px' }} onClick={() => navigateTo('payments')}>
                      View Cashier →
                    </button>
                  </div>

                  {pendingDeposits.slice(0, 2).map((tx) => (
                    <div key={tx.id} className="admin-alert-row">
                      <div>
                        <strong style={{ fontSize: '12px' }}>💰 New Deposit Request: {tx.amount} ETB</strong>
                        <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                          Player: {tx.playerName} ({tx.username}) · {tx.method} · {tx.meta}
                        </div>
                      </div>
                      <button className="admin-btn review" onClick={() => setSelectedTx(tx)}>
                        Review
                      </button>
                    </div>
                  ))}

                  {pendingWithdrawals.slice(0, 2).map((tx) => (
                    <div key={tx.id} className="admin-alert-row">
                      <div>
                        <strong style={{ fontSize: '12px', color: '#fb7185' }}>💸 New Withdrawal Request: {Math.abs(tx.amount)} ETB</strong>
                        <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                          Player: {tx.playerName} ({tx.username}) · {tx.method} · {tx.meta}
                        </div>
                      </div>
                      <button className="admin-btn review" onClick={() => setSelectedTx(tx)}>
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Key Statistics Grids */}
              {/* Users */}
              <div className="admin-section-title">👥 Users Statistics</div>
              <div className="admin-grid-3">
                <div className="admin-card">
                  <div className="admin-stat-top">Total Users</div>
                  <div className="admin-stat-value">18,492</div>
                  <div className="admin-stat-delta up">+4.8% this month</div>
                </div>
                <div className="admin-card">
                  <div className="admin-stat-top">Active Users</div>
                  <div className="admin-stat-value">6,820</div>
                  <div className="admin-stat-delta up">Wagered in last 7 days</div>
                </div>
                <div className="admin-card">
                  <div className="admin-stat-top">Online Players</div>
                  <div className="admin-stat-value" style={{ color: '#34d399' }}>247</div>
                  <div className="admin-stat-delta up">In live rooms right now</div>
                </div>
              </div>

              {/* Games */}
              <div className="admin-section-title">🎮 Games Statistics</div>
              <div className="admin-grid-3">
                <div className="admin-card">
                  <div className="admin-stat-top">Games Played Today</div>
                  <div className="admin-stat-value">1,277</div>
                  <div className="admin-stat-delta up">Across all rooms</div>
                </div>
                <div className="admin-card">
                  <div className="admin-stat-top">Live Games Running</div>
                  <div className="admin-stat-value" style={{ color: '#22d3ee' }}>3 Active</div>
                  <div className="admin-stat-delta">Bingo & Keno lobbies</div>
                </div>
                <div className="admin-card">
                  <div className="admin-stat-top">Players Today</div>
                  <div className="admin-stat-value">4,150</div>
                  <div className="admin-stat-delta up">Unique participants</div>
                </div>
              </div>

              {/* Payments & Revenue */}
              <div className="admin-section-title">💳 Payments & Revenue</div>
              <div className="admin-grid-4">
                <div className="admin-card">
                  <div className="admin-stat-top">Deposits Today</div>
                  <div className="admin-stat-value" style={{ color: '#34d399' }}>86,420 ETB</div>
                  <div className="admin-stat-delta up">119 transactions</div>
                </div>
                <div className="admin-card">
                  <div className="admin-stat-top">Withdrawals Today</div>
                  <div className="admin-stat-value" style={{ color: '#fb7185' }}>41,850 ETB</div>
                  <div className="admin-stat-delta">32 completed · 2 pending</div>
                </div>
                <div className="admin-card">
                  <div className="admin-stat-top">Today's Revenue (Rake)</div>
                  <div className="admin-stat-value" style={{ color: '#22d3ee' }}>14,200 ETB</div>
                  <div className="admin-stat-delta up">+12.8% margin</div>
                </div>
                <div className="admin-card">
                  <div className="admin-stat-top">Monthly Revenue</div>
                  <div className="admin-stat-value">342,000 ETB</div>
                  <div className="admin-stat-delta up">30-day net commission</div>
                </div>
              </div>

              {/* Live Games & Recent Activity */}
              <div className="admin-grid-2" style={{ marginTop: '16px' }}>
                {/* Live Games Table (View-Only) */}
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '13px' }}>🎮 Live Running Games</strong>
                    <span className="admin-status online">View Only</span>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table" style={{ minWidth: '100%' }}>
                      <thead>
                        <tr>
                          <th>Game #</th>
                          <th>Players</th>
                          <th>Stakes</th>
                          <th>Prize Pool</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveGames.map((g) => (
                          <tr key={g.id}>
                            <td><strong>{g.gameNumber}</strong></td>
                            <td>{g.playersCount} players</td>
                            <td>{g.totalStakes} ETB</td>
                            <td style={{ color: '#34d399', fontWeight: 700 }}>{g.prizePool} ETB</td>
                            <td><span className="admin-status approved">{g.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Activity Stream */}
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '13px' }}>📜 Recent Activity</strong>
                    <span style={{ fontSize: '10.5px', color: '#8490a5' }}>Real-time</span>
                  </div>

                  {recentActivities.map((act) => (
                    <div key={act.id} className="admin-activity-item">
                      <i className="admin-dot" />
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong style={{ fontSize: '12px' }}>{act.title}</strong>
                          <small style={{ color: '#8490a5', fontSize: '10.5px' }}>{act.time}</small>
                        </div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
                          {act.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              2. 💳 PAYMENTS SECTION
          ══════════════════════════════════════════════════ */}
          {activeSection === 'payments' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Payments & Cashier</h1>
                  <p>Review incoming deposits, verify SMS receipts, and approve withdrawal payouts.</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="admin-tabs">
                <button
                  className={paymentTab === 'all' ? 'active' : ''}
                  onClick={() => setPaymentTab('all')}
                >
                  All ({transactions.length})
                </button>
                <button
                  className={paymentTab === 'pending' ? 'active' : ''}
                  onClick={() => setPaymentTab('pending')}
                >
                  Pending ({pendingDeposits.length + pendingWithdrawals.length})
                </button>
                <button
                  className={paymentTab === 'deposit' ? 'active' : ''}
                  onClick={() => setPaymentTab('deposit')}
                >
                  Deposits ({transactions.filter((t) => t.type === 'positive').length})
                </button>
                <button
                  className={paymentTab === 'withdrawal' ? 'active' : ''}
                  onClick={() => setPaymentTab('withdrawal')}
                >
                  Withdrawals ({transactions.filter((t) => t.type === 'negative').length})
                </button>
              </div>

              {/* Search */}
              <div className="admin-toolbar">
                <input
                  type="text"
                  className="admin-search"
                  placeholder="Search player, transaction ID, phone, SMS..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                />
              </div>

              {/* Transactions Table */}
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Player</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference / SMS Proof</th>
                      <th>Status</th>
                      <th>Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontWeight: 700 }}>#{tx.id}</td>
                        <td>
                          <strong>{tx.playerName}</strong>
                          <div style={{ fontSize: '10.5px', color: '#8490a5' }}>{tx.username}</div>
                        </td>
                        <td style={{ fontWeight: 700, color: tx.type === 'positive' ? '#34d399' : '#fb7185' }}>
                          {tx.type === 'positive' ? '+' : ''}{tx.amount} ETB
                        </td>
                        <td>{tx.method}</td>
                        <td style={{ color: '#22d3ee', fontSize: '11px' }}>{tx.meta}</td>
                        <td><span className={`admin-status ${tx.status}`}>{tx.status}</span></td>
                        <td style={{ color: '#8490a5' }}>{tx.timestamp}</td>
                        <td>
                          <button className="admin-btn review" onClick={() => setSelectedTx(tx)}>
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              3. 👥 USERS SECTION
          ══════════════════════════════════════════════════ */}
          {activeSection === 'users' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>User Accounts</h1>
                  <p>Search players, review profiles, inspect betting history, and manage access.</p>
                </div>
              </div>

              <div className="admin-toolbar">
                <input
                  type="text"
                  className="admin-search"
                  placeholder="Search name, @username, ID, phone..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                />
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Telegram ID</th>
                      <th>Phone</th>
                      <th>Total Balance</th>
                      <th>Wagered</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.name}</strong>
                          <div style={{ fontSize: '10.5px', color: '#8490a5' }}>{user.username}</div>
                        </td>
                        <td>#{user.id}</td>
                        <td>{user.phone}</td>
                        <td style={{ color: '#22d3ee', fontWeight: 700 }}>{user.totalBalance} ETB</td>
                        <td>{user.totalWagered || 0} ETB</td>
                        <td><span className={`admin-status ${user.status}`}>{user.status}</span></td>
                        <td style={{ color: '#8490a5' }}>{user.joinedDate}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="admin-btn" onClick={() => setSelectedUser(user)}>
                              Profile
                            </button>
                            <button
                              className={`admin-btn ${user.status === 'active' ? 'danger' : 'success'}`}
                              onClick={() => handleToggleBlockUser(user.id)}
                            >
                              {user.status === 'active' ? 'Block' : 'Unblock'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              4. 🎮 GAMES (View-Only Monitoring)
          ══════════════════════════════════════════════════ */}
          {activeSection === 'games' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Games Monitoring (View Only)</h1>
                  <p>Real-time game server activity, active tickets, and historical round records.</p>
                </div>
                <span className="admin-status online">● Game Server Active</span>
              </div>

              <div className="admin-section-title">Live Active Lobbies</div>
              <div className="admin-grid-3">
                {liveGames.map((g) => (
                  <div key={g.id} className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>{g.gameType}</strong>
                      <span className="admin-status approved">{g.status}</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#22d3ee', margin: '4px 0' }}>
                      {g.prizePool} ETB <small style={{ fontSize: '11px', color: '#8490a5' }}>Prize Pool</small>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                      <div>Game Number: <strong>{g.gameNumber}</strong></div>
                      <div>Active Players: {g.playersCount}</div>
                      <div>Total Stakes Collected: {g.totalStakes} ETB</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-section-title" style={{ marginTop: '20px' }}>Completed Games History</div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Game #</th>
                      <th>Game Mode</th>
                      <th>Players</th>
                      <th>Total Stakes</th>
                      <th>Winner Prize</th>
                      <th>Platform Commission</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>#BINGO-107</td>
                      <td>Bingo Live (10 ETB)</td>
                      <td>35 players</td>
                      <td>350 ETB</td>
                      <td style={{ color: '#34d399', fontWeight: 700 }}>315 ETB</td>
                      <td>35 ETB (10%)</td>
                      <td><span className="admin-status approved">Completed</span></td>
                    </tr>
                    <tr>
                      <td>#KENO-401</td>
                      <td>Keno Turbo</td>
                      <td>19 players</td>
                      <td>570 ETB</td>
                      <td style={{ color: '#34d399', fontWeight: 700 }}>524 ETB</td>
                      <td>46 ETB (8%)</td>
                      <td><span className="admin-status approved">Completed</span></td>
                    </tr>
                    <tr>
                      <td>#BINGO-106</td>
                      <td>VIP Bingo (50 ETB)</td>
                      <td>12 players</td>
                      <td>600 ETB</td>
                      <td style={{ color: '#34d399', fontWeight: 700 }}>540 ETB</td>
                      <td>60 ETB (10%)</td>
                      <td><span className="admin-status approved">Completed</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              5. 📊 ANALYTICS
          ══════════════════════════════════════════════════ */}
          {activeSection === 'analytics' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Performance Analytics</h1>
                  <p>Daily, weekly, and monthly breakdown of platform revenue and user engagement.</p>
                </div>
                <div className="admin-tabs" style={{ marginBottom: 0 }}>
                  <button className={analyticsPeriod === 'daily' ? 'active' : ''} onClick={() => setAnalyticsPeriod('daily')}>Daily</button>
                  <button className={analyticsPeriod === 'weekly' ? 'active' : ''} onClick={() => setAnalyticsPeriod('weekly')}>Weekly</button>
                  <button className={analyticsPeriod === 'monthly' ? 'active' : ''} onClick={() => setAnalyticsPeriod('monthly')}>Monthly</button>
                </div>
              </div>

              <div className="admin-grid-4">
                <div className="admin-card">
                  <div className="admin-stat-top">Turnover Volume</div>
                  <div className="admin-stat-value">133,500 ETB</div>
                  <div className="admin-stat-delta up">+18% growth</div>
                </div>
                <div className="admin-card">
                  <div className="admin-stat-top">Deposit Volume</div>
                  <div className="admin-stat-value">86,420 ETB</div>
                  <div className="admin-stat-delta up">+12.4% vs prev</div>
                </div>
                <div className="admin-card">
                  <div className="admin-stat-top">Withdrawal Volume</div>
                  <div className="admin-stat-value">41,850 ETB</div>
                  <div className="admin-stat-delta">Paid out</div>
                </div>
                <div className="admin-card">
                  <div className="admin-stat-top">Net Platform Margin</div>
                  <div className="admin-stat-value" style={{ color: '#34d399' }}>14,200 ETB</div>
                  <div className="admin-stat-delta up">House profit</div>
                </div>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              6. 🎁 PROMOTIONS
          ══════════════════════════════════════════════════ */}
          {activeSection === 'promotions' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Promotions & Campaigns</h1>
                  <p>Manage user incentives, deposit match bonuses, daily tasks, and promo codes.</p>
                </div>
                <button className="admin-btn primary" onClick={() => setShowNewPromoModal(true)}>
                  + New Campaign
                </button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Campaign Title</th>
                      <th>Type</th>
                      <th>Reward</th>
                      <th>Target Audience</th>
                      <th>Claimed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.title}</strong></td>
                        <td>{p.type}</td>
                        <td style={{ color: '#22d3ee' }}>{p.reward}</td>
                        <td>{p.target}</td>
                        <td>{p.claimedCount.toLocaleString()} users</td>
                        <td><span className="admin-status approved">{p.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              7. 🧾 TRANSACTIONS
          ══════════════════════════════════════════════════ */}
          {activeSection === 'transactions' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Master Transaction Ledger</h1>
                  <p>Complete historical ledger of all deposits, withdrawals, and game transactions.</p>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Player</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Details</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td><strong>#{tx.id}</strong></td>
                        <td>{tx.playerName}</td>
                        <td>{tx.title}</td>
                        <td style={{ color: tx.type === 'positive' ? '#34d399' : '#fb7185', fontWeight: 700 }}>
                          {tx.type === 'positive' ? '+' : ''}{tx.amount} ETB
                        </td>
                        <td>{tx.method}</td>
                        <td style={{ fontSize: '11px', color: '#8490a5' }}>{tx.meta}</td>
                        <td><span className={`admin-status ${tx.status}`}>{tx.status}</span></td>
                        <td style={{ color: '#8490a5' }}>{tx.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              8. 🔔 NOTIFICATIONS
          ══════════════════════════════════════════════════ */}
          {activeSection === 'notifications' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>System & Operational Alerts</h1>
                  <p>Critical platform alerts, pending payment reminders, and server notices.</p>
                </div>
                <button
                  className="admin-btn"
                  onClick={() => {
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                    showToast('All notifications marked as read');
                  }}
                >
                  Mark All as Read
                </button>
              </div>

              <div className="admin-card">
                {notifications.map((n) => (
                  <div key={n.id} className="admin-activity-item">
                    <i className={`admin-dot ${n.type === 'alert' ? 'yellow' : ''}`} />
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '12.5px' }}>{n.title}</strong>
                        <small style={{ color: '#8490a5', fontSize: '10.5px' }}>{n.time}</small>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '2px' }}>
                        {n.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════
              9. ⚙️ SETTINGS
          ══════════════════════════════════════════════════ */}
          {activeSection === 'settings' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>System & Gateway Configuration</h1>
                  <p>Configure official receiving accounts, limits, and administrator credentials.</p>
                </div>
                <button className="admin-btn primary" onClick={() => showToast('Configuration saved')}>
                  💾 Save Settings
                </button>
              </div>

              <div className="admin-card" style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>
                  Official Payment Gateway Receiving Accounts
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="admin-input-group">
                    <label>Telebirr Merchant / Phone</label>
                    <input
                      type="text"
                      value={telebirrPhone}
                      onChange={(e) => setTelebirrPhone(e.target.value)}
                    />
                  </div>
                  <div className="admin-input-group">
                    <label>CBE Bank Account Number</label>
                    <input
                      type="text"
                      value={cbeAccount}
                      onChange={(e) => setCbeAccount(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="admin-input-group">
                    <label>Minimum Deposit Limit (ETB)</label>
                    <input
                      type="number"
                      value={minDeposit}
                      onChange={(e) => setMinDeposit(Number(e.target.value))}
                    />
                  </div>
                  <div className="admin-input-group">
                    <label>Minimum Withdrawal Limit (ETB)</label>
                    <input
                      type="number"
                      value={minWithdraw}
                      onChange={(e) => setMinWithdraw(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>
                  Admin Security Account
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  Current Active Account: <strong>admin</strong> (Role: Owner)
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ── Mobile Bottom Navigation Bar (4 Items) ── */}
        <nav className="admin-bottom-nav">
          <button
            className={`admin-bottom-btn ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => navigateTo('overview')}
          >
            <span className="admin-bottom-icon">🏠</span>
            <span>Overview</span>
          </button>

          <button
            className={`admin-bottom-btn ${activeSection === 'payments' ? 'active' : ''}`}
            onClick={() => navigateTo('payments')}
          >
            <span className="admin-bottom-icon">💳</span>
            <span>Payments</span>
            {pendingDeposits.length + pendingWithdrawals.length > 0 && (
              <span className="admin-bottom-badge">
                {pendingDeposits.length + pendingWithdrawals.length}
              </span>
            )}
          </button>

          <button
            className={`admin-bottom-btn ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => navigateTo('users')}
          >
            <span className="admin-bottom-icon">👥</span>
            <span>Users</span>
          </button>

          <button
            className="admin-bottom-btn"
            onClick={() => setMobileDrawerOpen(true)}
          >
            <span className="admin-bottom-icon">⋯</span>
            <span>More</span>
          </button>
        </nav>
      </main>

      {/* ── Fast Payment Review Modal ── */}
      {selectedTx && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedTx(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">Review Payment #{selectedTx.id}</div>
              <button
                onClick={() => setSelectedTx(null)}
                style={{ background: 'none', border: 'none', color: '#8490a5', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#0b1220', padding: '14px', borderRadius: '10px', marginBottom: '14px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5' }}>Player:</span>
                <strong>{selectedTx.playerName} ({selectedTx.username})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5' }}>Amount:</span>
                <strong style={{ fontSize: '15px', color: selectedTx.type === 'positive' ? '#34d399' : '#fb7185' }}>
                  {selectedTx.amount} ETB
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5' }}>Method:</span>
                <span>{selectedTx.method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5' }}>Payment Reference / SMS:</span>
                <strong style={{ color: '#22d3ee' }}>{selectedTx.meta}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8490a5' }}>Status:</span>
                <span className={`admin-status ${selectedTx.status}`}>{selectedTx.status}</span>
              </div>
            </div>

            {selectedTx.status === 'pending' && (
              <div className="admin-input-group">
                <label>Rejection Reason (if rejecting)</label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
              {selectedTx.status === 'pending' ? (
                <>
                  <button className="admin-btn danger" onClick={() => handleRejectTx(selectedTx.id)}>
                    Reject Payment
                  </button>
                  <button className="admin-btn success" onClick={() => handleApproveTx(selectedTx.id)}>
                    ✓ Approve Payment
                  </button>
                </>
              ) : (
                <button className="admin-btn" onClick={() => setSelectedTx(null)}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── User Profile Drawer Modal ── */}
      {selectedUser && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">Player Profile: {selectedUser.name}</div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', color: '#8490a5', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#0b1220', padding: '14px', borderRadius: '10px', marginBottom: '14px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#8490a5' }}>Telegram ID:</span>
                <strong>#{selectedUser.id} ({selectedUser.username})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#8490a5' }}>Phone:</span>
                <span>{selectedUser.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#8490a5' }}>Total Balance:</span>
                <strong style={{ color: '#22d3ee', fontSize: '14px' }}>{selectedUser.totalBalance} ETB</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#8490a5' }}>Total Wagered:</span>
                <span>{selectedUser.totalWagered || 0} ETB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8490a5' }}>Status:</span>
                <span className={`admin-status ${selectedUser.status}`}>{selectedUser.status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '14px' }}>
              <button
                className={`admin-btn ${selectedUser.status === 'active' ? 'danger' : 'success'}`}
                onClick={() => handleToggleBlockUser(selectedUser.id)}
              >
                {selectedUser.status === 'active' ? 'Block Player' : 'Unblock Player'}
              </button>
              <button className="admin-btn" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Promotion Modal ── */}
      {showNewPromoModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowNewPromoModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">Create Campaign / Promotion</div>
              <button
                onClick={() => setShowNewPromoModal(false)}
                style={{ background: 'none', border: 'none', color: '#8490a5', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const newP: PromotionItem = {
                  id: `p-${Date.now().toString().slice(-4)}`,
                  title: form.title.value,
                  type: form.type.value,
                  reward: form.reward.value,
                  target: form.target.value,
                  status: 'active',
                  claimedCount: 0,
                };
                setPromotions((prev) => [newP, ...prev]);
                setShowNewPromoModal(false);
                showToast(`Campaign ${newP.title} launched`);
              }}
            >
              <div className="admin-input-group">
                <label>Campaign Title</label>
                <input name="title" placeholder="e.g. Deposit Match 50%" required />
              </div>

              <div className="admin-input-group">
                <label>Type</label>
                <select name="type" className="admin-select" style={{ width: '100%' }}>
                  <option value="Deposit Bonus">Deposit Bonus</option>
                  <option value="Free Spins">Free Cartela / Spins</option>
                  <option value="Task">Task Reward</option>
                  <option value="Promo Code">Promo Code</option>
                </select>
              </div>

              <div className="admin-input-group">
                <label>Reward Description</label>
                <input name="reward" placeholder="e.g. +50 ETB Playable balance" required />
              </div>

              <div className="admin-input-group">
                <label>Target Audience</label>
                <input name="target" defaultValue="All Players" required />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="admin-btn" onClick={() => setShowNewPromoModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn primary">
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Message ── */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '72px',
            right: '20px',
            background: '#111827',
            border: '1px solid #22d3ee',
            color: '#f8fafc',
            padding: '10px 18px',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 1000,
          }}
        >
          ✨ {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;
