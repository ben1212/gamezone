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
  status: 'active' | 'restricted' | 'blocked';
  joinedDate: string;
  lastActive: string;
  invitedBy?: string;
  referralCount?: number;
  referralEarnings?: number;
}

interface GameRoom {
  id: string;
  name: string;
  stake: number;
  minPlayers: number;
  maxPlayers: number;
  activeTickets: number;
  status: string;
  prizePool: number;
}

interface GameConfig {
  id: string;
  name: string;
  icon: string;
  status: string;
  activePlayers: number;
  totalRoundsToday: number;
  todayTurnover: number;
  rakePercentage: number;
  rooms?: GameRoom[];
  roundIntervalSeconds?: number;
  rtpPercentage?: number;
  minBet?: number;
  maxBet?: number;
}

interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  target: string;
  sentCount: number;
  status: string;
  timestamp: string;
}

interface StaffItem {
  id: string;
  name: string;
  username: string;
  role: string;
  email: string;
  status: string;
  lastLogin: string;
}

interface AuditLogItem {
  id: string;
  admin: string;
  action: string;
  ip: string;
  timestamp: string;
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
    'overview' | 'games' | 'payments' | 'users' | 'referrals' | 'broadcast' | 'reports' | 'admins' | 'settings'
  >('overview');

  // ── Data State ──
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [games, setGames] = useState<GameConfig[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // ── Payments State ──
  const [paymentTab, setPaymentTab] = useState<'all' | 'deposit' | 'withdrawal' | 'pending'>('all');
  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [showNewPaymentModal, setShowNewPaymentModal] = useState<boolean>(false);

  // ── Users State ──
  const [usersSearch, setUsersSearch] = useState<string>('');
  const [usersStatusFilter, setUsersStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState<string>('');
  const [balanceAdjustReason, setBalanceAdjustReason] = useState<string>('');
  const [userDirectMessage, setUserDirectMessage] = useState<string>('');

  // ── Game Modals ──
  const [showNewBingoRoomModal, setShowNewBingoRoomModal] = useState<boolean>(false);

  // ── Broadcast State ──
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastTarget, setBroadcastTarget] = useState<string>('All Players');

  // ── Staff Modal ──
  const [showNewStaffModal, setShowNewStaffModal] = useState<boolean>(false);

  // ── Roles Permissions ──
  const [permissions, setPermissions] = useState({
    superViewUsers: true,
    superManagePayments: true,
    superManageGames: true,
    superManageAdmins: true,
    superSystemSettings: true,

    financeViewUsers: true,
    financeManagePayments: true,
    financeManageGames: false,
    financeManageAdmins: false,
    financeSystemSettings: false,

    supportViewUsers: true,
    supportManagePayments: false,
    supportManageGames: false,
    supportManageAdmins: false,
    supportSystemSettings: false,
  });

  // ── Settings ──
  const [minDeposit, setMinDeposit] = useState<number>(10);
  const [minWithdraw, setMinWithdraw] = useState<number>(50);
  const [telebirrPhone, setTelebirrPhone] = useState<string>('0911002233');
  const [cbeAccount, setCbeAccount] = useState<string>('1000123456789');
  const [paymentReviewReq, setPaymentReviewReq] = useState<boolean>(true);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [referralBonus, setReferralBonus] = useState<number>(10);
  const [referralWagerShare, setReferralWagerShare] = useState<number>(5);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Load all initial live data from backend
  const refreshAllData = async () => {
    try {
      const [txRes, usersRes, gamesRes, bcRes, staffRes, logsRes] = await Promise.all([
        adminApi.getTransactions(),
        adminApi.getUsers(),
        adminApi.getGames(),
        adminApi.getBroadcasts(),
        adminApi.getStaff(),
        adminApi.getLogs(),
      ]);

      if (txRes?.success && Array.isArray(txRes.data)) setTransactions(txRes.data);
      if (usersRes?.success && Array.isArray(usersRes.data)) setUsersList(usersRes.data);
      if (gamesRes?.success && Array.isArray(gamesRes.data)) setGames(gamesRes.data);
      if (bcRes?.success && Array.isArray(bcRes.data)) setBroadcasts(bcRes.data);
      if (staffRes?.success && Array.isArray(staffRes.data)) setStaffList(staffRes.data);
      if (logsRes?.success && Array.isArray(logsRes.data)) setAuditLogs(logsRes.data);
    } catch (e) {
      console.warn('Could not fetch from backend, using local state:', e);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshAllData();
  }, [isAuthenticated]);

  // ── Login ──
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      loginUser === 'admin' &&
      (loginPass === 'password123' || loginPass === 'admin123' || loginPass === 'gamezone2026')
    ) {
      setIsAuthenticated(true);
      localStorage.setItem('gamezone_admin_auth', 'true');
      setLoginError(null);
      showToast('Welcome to GameZone Admin Suite');
    } else {
      setLoginError('Invalid administrative username or password.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('gamezone_admin_auth');
    setLoginPass('');
  };

  // ── Payment Handlers ──
  const handleApproveTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'approved' as const } : t))
    );
    adminApi.approveTransaction(id, tx ? Math.abs(tx.amount) : 0);
    showToast(`Transaction #${id} approved & wallet credited`);
    if (selectedTx?.id === id) setSelectedTx(null);
  };

  const handleRejectTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'rejected' as const } : t))
    );
    adminApi.rejectTransaction(id, 'Unverified SMS receipt / mismatched reference');
    showToast(`Transaction #${id} rejected`);
    if (selectedTx?.id === id) setSelectedTx(null);
  };

  const handleBatchApprovePending = () => {
    const pendingIds = transactions.filter((t) => t.status === 'pending').map((t) => t.id);
    if (pendingIds.length === 0) {
      showToast('No pending transactions to approve');
      return;
    }
    setTransactions((prev) =>
      prev.map((t) => (t.status === 'pending' ? { ...t, status: 'approved' as const } : t))
    );
    pendingIds.forEach((id) => adminApi.approveTransaction(id));
    showToast(`Batch approved ${pendingIds.length} pending transactions`);
  };

  // ── User Handlers ──
  const handleToggleUserStatus = (userId: string, newStatus: 'active' | 'restricted' | 'blocked') => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    adminApi.updateUser(userId, { status: newStatus });
    showToast(`Player #${userId} status set to ${newStatus}`);
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleAdjustBalance = () => {
    if (!selectedUser || !balanceAdjustAmount) return;
    const adjust = parseFloat(balanceAdjustAmount);
    if (isNaN(adjust)) return;

    setUsersList((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              totalBalance: Math.max(0, u.totalBalance + adjust),
              playableBalance: Math.max(0, u.playableBalance + adjust),
            }
          : u
      )
    );

    adminApi.updateUser(selectedUser.id, { balanceAdjustment: adjust, reason: balanceAdjustReason });
    showToast(`Player #${selectedUser.id} balance adjusted by ${adjust > 0 ? '+' : ''}${adjust} ETB`);
    setBalanceAdjustAmount('');
    setBalanceAdjustReason('');
    setSelectedUser(null);
  };

  const handleSendUserDirectMsg = () => {
    if (!selectedUser || !userDirectMessage) return;
    adminApi.sendBroadcast({
      title: `Direct message to #${selectedUser.id}`,
      message: userDirectMessage,
      target: `Player #${selectedUser.id}`,
    });
    showToast(`Telegram message sent to ${selectedUser.username}`);
    setUserDirectMessage('');
  };

  // ── Game Handlers ──
  const handleToggleGameStatus = (gameId: string) => {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, status: g.status === 'active' ? 'paused' : 'active' } : g))
    );
    adminApi.toggleGame(gameId);
    showToast(`Game ${gameId.toUpperCase()} status updated`);
  };

  const handleCreateBingoRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const name = form.roomName.value;
    const stake = Number(form.stake.value);
    const minPlayers = Number(form.minPlayers.value);
    const maxPlayers = Number(form.maxPlayers.value);

    const newRoom: GameRoom = {
      id: `room-${Date.now().toString().slice(-4)}`,
      name,
      stake,
      minPlayers,
      maxPlayers,
      activeTickets: 0,
      status: 'active',
      prizePool: 0,
    };

    setGames((prev) =>
      prev.map((g) => (g.id === 'bingo' ? { ...g, rooms: [...(g.rooms || []), newRoom] } : g))
    );

    adminApi.createBingoRoom({ name, stake, minPlayers, maxPlayers });
    setShowNewBingoRoomModal(false);
    showToast(`Created Bingo room: ${name} (${stake} ETB)`);
  };

  // ── Broadcast Handler ──
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    const newBc: BroadcastItem = {
      id: `bc-${Date.now().toString().slice(-4)}`,
      title: broadcastTitle,
      message: broadcastMessage,
      target: broadcastTarget,
      sentCount: broadcastTarget === 'Active Players' ? 6820 : 18492,
      status: 'sent',
      timestamp: 'Just now',
    };

    setBroadcasts((prev) => [newBc, ...prev]);
    adminApi.sendBroadcast({ title: broadcastTitle, message: broadcastMessage, target: broadcastTarget });
    showToast(`Broadcast sent to ${newBc.sentCount} Telegram players`);
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  // ── CSV Export Helper ──
  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filename}.csv`);
  };

  // Filtering
  const filteredTransactions = transactions.filter((t) => {
    if (paymentTab === 'deposit' && t.type !== 'positive') return false;
    if (paymentTab === 'withdrawal' && t.type !== 'negative') return false;
    if (paymentTab === 'pending' && t.status !== 'pending') return false;
    if (paymentStatusFilter !== 'all' && t.status !== paymentStatusFilter) return false;
    if (paymentMethodFilter !== 'all' && t.method.toLowerCase() !== paymentMethodFilter.toLowerCase())
      return false;
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
    if (usersStatusFilter !== 'all' && u.status !== usersStatusFilter) return false;
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

  const pendingDepositsCount = transactions.filter((t) => t.type === 'positive' && t.status === 'pending').length;
  const pendingWithdrawalsCount = transactions.filter((t) => t.type === 'negative' && t.status === 'pending').length;

  // ── LOGIN SCREEN ──
  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay">
        <div className="admin-login-card">
          <div className="admin-login-brand">
            GAME<span>ZONE</span>
          </div>
          <div className="admin-login-badge">Standalone Admin Console</div>

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
              <div style={{ color: '#fb7185', fontSize: '11.5px', marginBottom: '14px', textAlign: 'left' }}>
                ⚠️ {loginError}
              </div>
            )}

            <button type="submit" className="admin-login-btn">
              Access Admin Console →
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-root">
      {/* ── Fixed Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          GAME<span>ZONE</span>
        </div>

        <div className="admin-nav-label">Operations</div>
        <button
          className={`admin-nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          <span>◉</span> Overview
        </button>

        <button
          className={`admin-nav-btn ${activeSection === 'games' ? 'active' : ''}`}
          onClick={() => setActiveSection('games')}
        >
          <span>🎮</span> Game Control
        </button>

        <button
          className={`admin-nav-btn ${activeSection === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveSection('payments')}
        >
          <span>▣</span> Cashier & Treasury
          {pendingDepositsCount + pendingWithdrawalsCount > 0 && (
            <span className="admin-nav-badge">
              {pendingDepositsCount + pendingWithdrawalsCount}
            </span>
          )}
        </button>

        <button
          className={`admin-nav-btn ${activeSection === 'users' ? 'active' : ''}`}
          onClick={() => setActiveSection('users')}
        >
          <span>♙</span> Player CRM
        </button>

        <button
          className={`admin-nav-btn ${activeSection === 'referrals' ? 'active' : ''}`}
          onClick={() => setActiveSection('referrals')}
        >
          <span>🎁</span> Affiliate Control
        </button>

        <button
          className={`admin-nav-btn ${activeSection === 'broadcast' ? 'active' : ''}`}
          onClick={() => setActiveSection('broadcast')}
        >
          <span>📢</span> Bot Broadcasts
        </button>

        <button
          className={`admin-nav-btn ${activeSection === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveSection('reports')}
        >
          <span>▤</span> Financial BI
        </button>

        <div className="admin-nav-label">Security & Config</div>
        <button
          className={`admin-nav-btn ${activeSection === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveSection('admins')}
        >
          <span>◆</span> Staff & Access
        </button>

        <button
          className={`admin-nav-btn ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          <span>⚙</span> Platform Settings
        </button>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-btn" onClick={handleLogout} style={{ color: '#fb7185' }}>
            <span>🚪</span> Log Out
          </button>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div>
            <div className="admin-page-title">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </div>
            <div className="admin-crumb">GameZone Admin / {activeSection}</div>
          </div>

          <div className="admin-top-right">
            <span className="admin-status active">● Live Gateway</span>
            <span style={{ fontSize: '11px', color: '#8490a5' }}>Super Admin</span>
            <div className="admin-avatar">BA</div>
          </div>
        </header>

        {/* Content Body */}
        <div className="admin-content">
          {/* ═════════ 1. OVERVIEW SECTION ═════════ */}
          {activeSection === 'overview' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Executive Operations Hub</h1>
                  <p>Real-time player activity, cash flow turnover, and live game room status.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="admin-btn primary" onClick={() => setActiveSection('broadcast')}>
                    📢 Send Telegram Broadcast
                  </button>
                  <button className="admin-btn" onClick={refreshAllData}>
                    ↻ Refresh Live Data
                  </button>
                </div>
              </div>

              {/* 6 KPI Cards Grid */}
              <div className="admin-grid-4">
                <div className="admin-card">
                  <div className="admin-stat-top">
                    Total Players <span className="admin-stat-icon">♙</span>
                  </div>
                  <div className="admin-stat-value">18,492</div>
                  <div className="admin-stat-delta up">+4.8% this month</div>
                </div>

                <div className="admin-card">
                  <div className="admin-stat-top">
                    Online Concurrent <span className="admin-stat-icon">●</span>
                  </div>
                  <div className="admin-stat-value">247</div>
                  <div className="admin-stat-delta up">+18 in live rooms</div>
                </div>

                <div className="admin-card">
                  <div className="admin-stat-top">
                    Today's Deposits <span className="admin-stat-icon">↓</span>
                  </div>
                  <div className="admin-stat-value">86,420 ETB</div>
                  <div className="admin-stat-delta up">+12.4% vs yesterday</div>
                </div>

                <div className="admin-card">
                  <div className="admin-stat-top">
                    Today's Withdrawals <span className="admin-stat-icon">↑</span>
                  </div>
                  <div className="admin-stat-value">41,850 ETB</div>
                  <div className="admin-stat-delta">
                    {transactions.filter((t) => t.type === 'negative' && t.status === 'approved').length} completed ·{' '}
                    {pendingWithdrawalsCount} pending
                  </div>
                </div>
              </div>

              {/* Secondary Metric Strip */}
              <div className="admin-grid-3" style={{ marginBottom: '18px' }}>
                <div className="admin-card" style={{ borderColor: 'rgba(34, 211, 238, 0.2)' }}>
                  <div style={{ color: '#8490a5', fontSize: '11px' }}>Gross Gaming Revenue (GGR)</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: '#22d3ee' }}>
                    133,500 ETB
                  </div>
                  <div style={{ color: '#8490a5', fontSize: '10.5px', marginTop: '4px' }}>
                    Turnover across Bingo, Keno & Ludo
                  </div>
                </div>

                <div className="admin-card" style={{ borderColor: 'rgba(52, 211, 153, 0.2)' }}>
                  <div style={{ color: '#8490a5', fontSize: '11px' }}>Net House Edge Margin</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: '#34d399' }}>
                    14,200 ETB
                  </div>
                  <div style={{ color: '#8490a5', fontSize: '10.5px', marginTop: '4px' }}>
                    Platform commission profit (Avg: ~10.6%)
                  </div>
                </div>

                <div className="admin-card" style={{ borderColor: 'rgba(251, 191, 36, 0.2)' }}>
                  <div style={{ color: '#8490a5', fontSize: '11px' }}>Pending Cashier Queue</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: '#fbbf24' }}>
                    {pendingDepositsCount + pendingWithdrawalsCount} Requests
                  </div>
                  <div style={{ color: '#8490a5', fontSize: '10.5px', marginTop: '4px' }}>
                    <button
                      className="admin-btn"
                      style={{ padding: '4px 8px', fontSize: '11px', marginTop: '4px' }}
                      onClick={() => setActiveSection('payments')}
                    >
                      Open Cashier Queue →
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart & Live Activity */}
              <div className="admin-grid-2">
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Real-Time Hourly Turnover (ETB)</span>
                    <span style={{ fontSize: '11px', color: '#8490a5' }}>Today</span>
                  </div>

                  <div style={{ height: '180px', display: 'flex', alignItems: 'end', gap: '8px', padding: '15px 5px' }}>
                    <div style={{ height: '35%', flex: 1, background: '#28334b', borderRadius: '4px 4px 0 0' }} title="8 AM: 12,400 ETB"></div>
                    <div style={{ height: '52%', flex: 1, background: '#354363', borderRadius: '4px 4px 0 0' }} title="9 AM: 18,200 ETB"></div>
                    <div style={{ height: '42%', flex: 1, background: '#2d3b59', borderRadius: '4px 4px 0 0' }} title="10 AM: 14,800 ETB"></div>
                    <div style={{ height: '67%', flex: 1, background: '#43527a', borderRadius: '4px 4px 0 0' }} title="11 AM: 23,500 ETB"></div>
                    <div style={{ height: '54%', flex: 1, background: '#596a9a', borderRadius: '4px 4px 0 0' }} title="12 PM: 19,100 ETB"></div>
                    <div style={{ height: '78%', flex: 1, background: '#6675ad', borderRadius: '4px 4px 0 0' }} title="1 PM: 28,400 ETB"></div>
                    <div style={{ height: '62%', flex: 1, background: '#7382c2', borderRadius: '4px 4px 0 0' }} title="2 PM: 21,900 ETB"></div>
                    <div style={{ height: '88%', flex: 1, background: '#818cf8', borderRadius: '4px 4px 0 0' }} title="3 PM: 32,000 ETB"></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#68758b', fontSize: '9.5px', marginTop: '6px' }}>
                    <span>8 AM</span>
                    <span>10 AM</span>
                    <span>12 PM</span>
                    <span>2 PM</span>
                    <span>4 PM</span>
                  </div>
                </div>

                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Live Activity Feed</span>
                    <span className="admin-status active">STREAM</span>
                  </div>

                  <div className="admin-activity-item">
                    <i className="admin-dot"></i>
                    <div>
                      <strong style={{ fontSize: '12px' }}>Deposit verified & approved</strong>
                      <small style={{ display: 'block', color: '#8490a5', fontSize: '10.5px' }}>
                        Player #10284 · 500 ETB · Telebirr
                      </small>
                    </div>
                  </div>

                  <div className="admin-activity-item">
                    <i className="admin-dot yellow"></i>
                    <div>
                      <strong style={{ fontSize: '12px' }}>Withdrawal requested</strong>
                      <small style={{ display: 'block', color: '#8490a5', fontSize: '10.5px' }}>
                        Player #102955 · 1,200 ETB · Pending review
                      </small>
                    </div>
                  </div>

                  <div className="admin-activity-item">
                    <i className="admin-dot"></i>
                    <div>
                      <strong style={{ fontSize: '12px' }}>Bingo Live Room #01 Won</strong>
                      <small style={{ display: 'block', color: '#8490a5', fontSize: '10.5px' }}>
                        Winner: @mekdes7 · Pot: 630 ETB
                      </small>
                    </div>
                  </div>

                  <div className="admin-activity-item">
                    <i className="admin-dot"></i>
                    <div>
                      <strong style={{ fontSize: '12px' }}>New player joined via Telegram</strong>
                      <small style={{ display: 'block', color: '#8490a5', fontSize: '10.5px' }}>
                        @abebe_21 · Invited by #102938
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ═════════ 2. GAME MANAGEMENT & LIVE ROOMS ═════════ */}
          {activeSection === 'games' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Game Management & Room Configuration</h1>
                  <p>Configure live game rooms, ticket pricing, house commissions, and RTP settings.</p>
                </div>
                <button
                  className="admin-btn primary"
                  onClick={() => setShowNewBingoRoomModal(true)}
                >
                  + Add Bingo Room
                </button>
              </div>

              {/* Games Grid */}
              <div className="admin-grid-3">
                {games.map((g) => (
                  <div key={g.id} className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '22px' }}>{g.icon}</span>
                        <div>
                          <strong style={{ fontSize: '15px' }}>{g.name}</strong>
                          <div style={{ fontSize: '11px', color: '#8490a5' }}>
                            {g.activePlayers} Players Online
                          </div>
                        </div>
                      </div>
                      <span className={`admin-status ${g.status}`}>{g.status}</span>
                    </div>

                    <div style={{ background: '#0b1220', padding: '12px', borderRadius: '10px', marginBottom: '14px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#8490a5' }}>Today's Turnover:</span>
                        <strong style={{ color: '#22d3ee' }}>{g.todayTurnover.toLocaleString()} ETB</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#8490a5' }}>Rounds Played:</span>
                        <span>{g.totalRoundsToday}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#8490a5' }}>Platform Rake / Edge:</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>{g.rakePercentage}%</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={`admin-btn ${g.status === 'active' ? 'danger' : 'success'}`}
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => handleToggleGameStatus(g.id)}
                      >
                        {g.status === 'active' ? '⏸ Pause Game' : '▶ Resume Game'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bingo Live Rooms Detailed Management */}
              <div className="admin-card" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>🎱 Bingo Live Active Room Lobbies</h3>
                    <p style={{ fontSize: '11.5px', color: '#8490a5' }}>Live tickets sold and real-time jackpot prize pools.</p>
                  </div>
                </div>

                <div className="admin-rooms-grid">
                  {games.find((g) => g.id === 'bingo')?.rooms?.map((room) => (
                    <div key={room.id} className="admin-room-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>{room.name}</strong>
                        <span className={`admin-status ${room.status}`}>{room.status}</span>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#22d3ee', margin: '6px 0' }}>
                        {room.stake} ETB <small style={{ fontSize: '11px', color: '#8490a5' }}>/ cartela</small>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#8490a5', marginBottom: '10px' }}>
                        <div>Active Tickets Sold: <strong style={{ color: '#fff' }}>{room.activeTickets}</strong></div>
                        <div>Current Prize Pool: <strong style={{ color: '#34d399' }}>{room.prizePool} ETB</strong></div>
                        <div>Capacity: {room.minPlayers} - {room.maxPlayers} players</div>
                      </div>
                      <button
                        className="admin-btn"
                        style={{ width: '100%', justifyContent: 'center', fontSize: '11.5px' }}
                        onClick={() => showToast(`Room ${room.name} settings updated`)}
                      >
                        ⚙ Configure Stakes
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ═════════ 3. PAYMENTS & CASHIER SUITE ═════════ */}
          {activeSection === 'payments' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Cashier & Treasury Management</h1>
                  <p>Process pending SMS receipts, approve payouts, and manage gateway liquidity.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="admin-btn success" onClick={handleBatchApprovePending}>
                    ✓ Batch Approve All Pending
                  </button>
                  <button className="admin-btn primary" onClick={() => setShowNewPaymentModal(true)}>
                    + Manual Payment Action
                  </button>
                </div>
              </div>

              {/* Status Summary */}
              <div className="admin-grid-3">
                <div className="admin-card" style={{ borderColor: 'rgba(251, 191, 36, 0.2)' }}>
                  <div style={{ color: '#8490a5', fontSize: '11px' }}>Pending Deposits (Unverified SMS)</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
                    {transactions
                      .filter((t) => t.type === 'positive' && t.status === 'pending')
                      .reduce((sum, t) => sum + t.amount, 0)}{' '}
                    ETB
                  </div>
                  <div style={{ color: '#8490a5', fontSize: '10.5px', marginTop: '4px' }}>
                    {pendingDepositsCount} transactions awaiting verification
                  </div>
                </div>

                <div className="admin-card" style={{ borderColor: 'rgba(251, 113, 133, 0.2)' }}>
                  <div style={{ color: '#8490a5', fontSize: '11px' }}>Pending Payout Requests</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
                    {Math.abs(
                      transactions
                        .filter((t) => t.type === 'negative' && t.status === 'pending')
                        .reduce((sum, t) => sum + t.amount, 0)
                    )}{' '}
                    ETB
                  </div>
                  <div style={{ color: '#8490a5', fontSize: '10.5px', marginTop: '4px' }}>
                    {pendingWithdrawalsCount} withdrawal payout requests
                  </div>
                </div>

                <div className="admin-card" style={{ borderColor: 'rgba(34, 211, 238, 0.2)' }}>
                  <div style={{ color: '#8490a5', fontSize: '11px' }}>Today's Processed Volume</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
                    128,270 ETB
                  </div>
                  <div style={{ color: '#8490a5', fontSize: '10.5px', marginTop: '4px' }}>
                    119 transactions processed
                  </div>
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
                  Pending Review ({pendingDepositsCount + pendingWithdrawalsCount})
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

              {/* Filters */}
              <div className="admin-toolbar">
                <input
                  type="text"
                  className="admin-search"
                  placeholder="Search player name, @username, transaction ID, SMS reference..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                />
                <select
                  className="admin-select"
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  className="admin-select"
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                >
                  <option value="all">All Methods</option>
                  <option value="telebirr">Telebirr</option>
                  <option value="cbe birr">CBE Birr</option>
                </select>
              </div>

              {/* Transactions Table */}
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Player</th>
                      <th>Amount</th>
                      <th>Gateway</th>
                      <th>Reference / SMS Proof</th>
                      <th>Status</th>
                      <th>Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontWeight: 700 }}>#{tx.id}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="admin-avatar" style={{ width: '26px', height: '26px', fontSize: '10px' }}>
                              {tx.playerName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{tx.playerName}</div>
                              <small style={{ color: '#8490a5' }}>{tx.username}</small>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: tx.type === 'positive' ? '#34d399' : '#fb7185' }}>
                          {tx.type === 'positive' ? '+' : ''}
                          {tx.amount} ETB
                        </td>
                        <td>{tx.method}</td>
                        <td style={{ color: '#22d3ee', fontSize: '11.5px' }}>{tx.meta}</td>
                        <td>
                          <span className={`admin-status ${tx.status}`}>{tx.status}</span>
                        </td>
                        <td style={{ color: '#8490a5' }}>{tx.timestamp}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="admin-btn"
                              onClick={() => setSelectedTx(tx)}
                            >
                              Review
                            </button>
                            {tx.status === 'pending' && (
                              <>
                                <button
                                  className="admin-btn success"
                                  onClick={() => handleApproveTransaction(tx.id)}
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  className="admin-btn danger"
                                  onClick={() => handleRejectTransaction(tx.id)}
                                >
                                  ✕
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ═════════ 4. PLAYER CRM & RISK MANAGEMENT ═════════ */}
          {activeSection === 'users' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Player CRM & Account Management</h1>
                  <p>Inspect 360-degree player profiles, balances, betting records, and risk scores.</p>
                </div>
                <button
                  className="admin-btn"
                  onClick={() =>
                    exportCSV(
                      'gamezone-players-crm',
                      ['ID', 'Name', 'Username', 'Phone', 'TotalBalance', 'Deposited', 'Withdrawn', 'Wagered', 'Status'],
                      usersList.map((u) => [
                        u.id,
                        u.name,
                        u.username,
                        u.phone,
                        u.totalBalance,
                        u.totalDeposited || 0,
                        u.totalWithdrawn || 0,
                        u.totalWagered || 0,
                        u.status,
                      ])
                    )
                  }
                >
                  📥 Export Player Ledger (CSV)
                </button>
              </div>

              {/* User Filters */}
              <div className="admin-toolbar">
                <input
                  type="text"
                  className="admin-search"
                  placeholder="Search player name, @username, Telegram ID, phone number..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                />
                <select
                  className="admin-select"
                  value={usersStatusFilter}
                  onChange={(e) => setUsersStatusFilter(e.target.value)}
                >
                  <option value="all">All Accounts</option>
                  <option value="active">Active</option>
                  <option value="restricted">Restricted (Flagged)</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Telegram ID</th>
                      <th>Total Balance</th>
                      <th>Total Deposited</th>
                      <th>Total Withdrawn</th>
                      <th>Wagered</th>
                      <th>Risk Status</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="admin-avatar" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{user.name}</div>
                              <small style={{ color: '#8490a5' }}>{user.username}</small>
                            </div>
                          </div>
                        </td>
                        <td>#{user.id}</td>
                        <td style={{ fontWeight: 700, color: '#22d3ee' }}>{user.totalBalance} ETB</td>
                        <td style={{ color: '#34d399' }}>+{user.totalDeposited || 0} ETB</td>
                        <td style={{ color: '#fb7185' }}>-{user.totalWithdrawn || 0} ETB</td>
                        <td>{user.totalWagered || 0} ETB</td>
                        <td>
                          <span className={`admin-status ${user.status}`}>{user.status}</span>
                        </td>
                        <td style={{ color: '#8490a5' }}>{user.joinedDate}</td>
                        <td>
                          <button
                            className="admin-btn primary"
                            onClick={() => setSelectedUser(user)}
                          >
                            360° Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ═════════ 5. AFFILIATE & REFERRAL CONTROL ═════════ */}
          {activeSection === 'referrals' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Affiliate & Referral Control Center</h1>
                  <p>Track viral growth loops, promoter payouts, and referral commission rules.</p>
                </div>
                <button
                  className="admin-btn primary"
                  onClick={() => showToast('Referral commission payout batch triggered')}
                >
                  💸 Trigger Referral Payouts
                </button>
              </div>

              {/* Referral KPIs */}
              <div className="admin-grid-3">
                <div className="admin-card">
                  <div className="admin-stat-top">Total Commission Paid</div>
                  <div className="admin-stat-value" style={{ color: '#34d399' }}>48,200 ETB</div>
                  <div className="admin-stat-delta up">Paid out to 412 promoters</div>
                </div>

                <div className="admin-card">
                  <div className="admin-stat-top">Invited Players</div>
                  <div className="admin-stat-value">5,840</div>
                  <div className="admin-stat-delta up">31.5% of platform player base</div>
                </div>

                <div className="admin-card">
                  <div className="admin-stat-top">Promoter Conversion Rate</div>
                  <div className="admin-stat-value">64.2%</div>
                  <div className="admin-stat-delta up">Deposited within 48h of invite</div>
                </div>
              </div>

              {/* Top Affiliates Leaderboard */}
              <div className="admin-card" style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                  🏆 Top Affiliate Promoters Leaderboard
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Promoter</th>
                        <th>Telegram ID</th>
                        <th>Invited Friends</th>
                        <th>Total Volume Generated</th>
                        <th>Commission Earned</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>🥇 #1</td>
                        <td><strong>Bini Eyoel</strong> (@bini)</td>
                        <td>#102938</td>
                        <td>124 Players</td>
                        <td>340,000 ETB</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>2,450 ETB</td>
                        <td><button className="admin-btn" onClick={() => showToast('Promoter bonus sent')}>+ Bonus</button></td>
                      </tr>
                      <tr>
                        <td>🥈 #2</td>
                        <td><strong>Yosef T.</strong> (@yosef_99)</td>
                        <td>#102988</td>
                        <td>88 Players</td>
                        <td>210,000 ETB</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>1,840 ETB</td>
                        <td><button className="admin-btn" onClick={() => showToast('Promoter bonus sent')}>+ Bonus</button></td>
                      </tr>
                      <tr>
                        <td>🥉 #3</td>
                        <td><strong>Mekdes K.</strong> (@mekdes7)</td>
                        <td>#102941</td>
                        <td>42 Players</td>
                        <td>115,000 ETB</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>820 ETB</td>
                        <td><button className="admin-btn" onClick={() => showToast('Promoter bonus sent')}>+ Bonus</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Referral Commission Rules */}
              <div className="admin-card" style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                  ⚙ Commission Rule Parameters
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-input-group">
                    <label>Instant Bonus Per Invited Friend (ETB)</label>
                    <input
                      type="number"
                      value={referralBonus}
                      onChange={(e) => setReferralBonus(Number(e.target.value))}
                    />
                  </div>
                  <div className="admin-input-group">
                    <label>Turnover Rev-Share % On Friend Bets</label>
                    <input
                      type="number"
                      value={referralWagerShare}
                      onChange={(e) => setReferralWagerShare(Number(e.target.value))}
                    />
                  </div>
                </div>
                <button
                  className="admin-btn primary"
                  onClick={() => showToast('Referral rules updated')}
                >
                  Save Referral Rules
                </button>
              </div>
            </section>
          )}

          {/* ═════════ 6. TELEGRAM BROADCAST CENTER ═════════ */}
          {activeSection === 'broadcast' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Telegram Bot Broadcast Center</h1>
                  <p>Send instant push notifications and promo announcements to all Telegram users.</p>
                </div>
                <span className="admin-status active">🤖 @bingox2019_bot Active</span>
              </div>

              <div className="admin-grid-2">
                {/* Broadcast Form */}
                <div className="admin-card">
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                    📢 Compose Broadcast Announcement
                  </div>

                  <form onSubmit={handleSendBroadcast}>
                    <div className="admin-input-group">
                      <label>Target Audience</label>
                      <select
                        className="admin-select"
                        style={{ width: '100%' }}
                        value={broadcastTarget}
                        onChange={(e) => setBroadcastTarget(e.target.value)}
                      >
                        <option value="All Players">All Registered Players (18,492 users)</option>
                        <option value="Active Players">Active Deposited Players (6,820 users)</option>
                        <option value="VIP Players">VIP & High Rollers (412 users)</option>
                      </select>
                    </div>

                    <div className="admin-input-group">
                      <label>Announcement Headline</label>
                      <input
                        type="text"
                        placeholder="e.g. 🔥 Weekend 50,000 ETB Jackpot Tournament!"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="admin-input-group">
                      <label>Message Body (Telegram Bot Markdown / Text)</label>
                      <textarea
                        placeholder="Type announcement message here..."
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        required
                        style={{ minHeight: '120px' }}
                      />
                    </div>

                    <button type="submit" className="admin-btn primary" style={{ width: '100%', justifyContent: 'center' }}>
                      🚀 Broadcast to Telegram Bot Now
                    </button>
                  </form>
                </div>

                {/* Broadcast History */}
                <div className="admin-card">
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                    📜 Recent Broadcast History
                  </div>

                  {broadcasts.map((bc) => (
                    <div key={bc.id} className="admin-activity-item" style={{ flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px' }}>{bc.title}</strong>
                        <span className="admin-status approved">{bc.status}</span>
                      </div>
                      <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: '4px 0' }}>{bc.message}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#8490a5' }}>
                        <span>Target: {bc.target} ({bc.sentCount.toLocaleString()} delivered)</span>
                        <span>{bc.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ═════════ 7. REPORTS & FINANCIAL BI ═════════ */}
          {activeSection === 'reports' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Financial Accounting & BI Reports</h1>
                  <p>Comprehensive Gross Gaming Revenue, turnover ledgers, and download exports.</p>
                </div>
                <button
                  className="admin-btn primary"
                  onClick={() =>
                    exportCSV(
                      'gamezone-complete-financials',
                      ['Metric', 'Amount (ETB)', 'Period', 'Status'],
                      [
                        ['Gross Deposit Volume', '1840000', '30 Days', 'Verified'],
                        ['Gross Withdrawal Volume', '926000', '30 Days', 'Verified'],
                        ['Gross Gaming Turnover', '4250000', '30 Days', 'Completed'],
                        ['Platform Net Margin', '914000', '30 Days', 'Realized'],
                        ['Affiliate Commission Paid', '48200', '30 Days', 'Settled'],
                      ]
                    )
                  }
                >
                  📥 Export 30-Day Master Financial Ledger
                </button>
              </div>

              <div className="admin-grid-4">
                <div className="admin-card">
                  <div className="admin-stat-top">Deposit Volume</div>
                  <div className="admin-stat-value">1.84M</div>
                  <div className="admin-stat-delta up">Last 30 days · ETB</div>
                </div>

                <div className="admin-card">
                  <div className="admin-stat-top">Withdrawal Volume</div>
                  <div className="admin-stat-value">926K</div>
                  <div className="admin-stat-delta">Last 30 days · ETB</div>
                </div>

                <div className="admin-card">
                  <div className="admin-stat-top">Total Transactions</div>
                  <div className="admin-stat-value">8,421</div>
                  <div className="admin-stat-delta up">+16.2% vs last month</div>
                </div>

                <div className="admin-card">
                  <div className="admin-stat-top">Active Unique Gamers</div>
                  <div className="admin-stat-value">6,820</div>
                  <div className="admin-stat-delta up">Last 30 days</div>
                </div>
              </div>

              {/* Game Turnover Breakdown */}
              <div className="admin-card" style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                  📊 Game Turnover & Gross Gaming Revenue Breakdown
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Game Title</th>
                        <th>Total Rounds</th>
                        <th>Turnover Volume</th>
                        <th>Player Winnings</th>
                        <th>Gross Gaming Revenue (GGR)</th>
                        <th>Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>🎱 Bingo Live</strong></td>
                        <td>4,820 Rounds</td>
                        <td>2,450,000 ETB</td>
                        <td>2,205,000 ETB</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>245,000 ETB</td>
                        <td>10.0%</td>
                      </tr>
                      <tr>
                        <td><strong>🎯 Keno Turbo</strong></td>
                        <td>14,200 Rounds</td>
                        <td>1,280,000 ETB</td>
                        <td>1,209,600 ETB</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>70,400 ETB</td>
                        <td>5.5%</td>
                      </tr>
                      <tr>
                        <td><strong>🎲 Ludo Arena</strong></td>
                        <td>2,140 Matches</td>
                        <td>520,000 ETB</td>
                        <td>478,400 ETB</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>41,600 ETB</td>
                        <td>8.0%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ═════════ 8. STAFF & ACCESS CONTROL ═════════ */}
          {activeSection === 'admins' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Administrative Staff & Role Permissions</h1>
                  <p>Manage team member privileges and review immutable system audit trails.</p>
                </div>
                <button
                  className="admin-btn primary"
                  onClick={() => setShowNewStaffModal(true)}
                >
                  + Add Team Member
                </button>
              </div>

              {/* Staff Directory */}
              <div className="admin-card" style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                  👥 Active Administrative Personnel
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Staff Name</th>
                        <th>Admin ID</th>
                        <th>Username</th>
                        <th>Role Tier</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map((st) => (
                        <tr key={st.id}>
                          <td><strong>{st.name}</strong></td>
                          <td>#{st.id}</td>
                          <td>@{st.username}</td>
                          <td><span className="admin-status active">{st.role}</span></td>
                          <td>{st.email}</td>
                          <td><span className="admin-status approved">{st.status}</span></td>
                          <td style={{ color: '#8490a5' }}>{st.lastLogin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Permissions Matrix */}
              <div className="admin-grid-3">
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontWeight: 700 }}>Super Admin Role</span>
                    <span className="admin-status approved">Full Access</span>
                  </div>
                  <div className="admin-perm-row">
                    <span>View Players</span>
                    <div
                      className={`admin-switch ${permissions.superViewUsers ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, superViewUsers: !p.superViewUsers }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>Approve Cashier Payments</span>
                    <div
                      className={`admin-switch ${permissions.superManagePayments ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, superManagePayments: !p.superManagePayments }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>Manage Game Rooms</span>
                    <div
                      className={`admin-switch ${permissions.superManageGames ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, superManageGames: !p.superManageGames }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>System Settings & Staff</span>
                    <div
                      className={`admin-switch ${permissions.superSystemSettings ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, superSystemSettings: !p.superSystemSettings }))}
                    ></div>
                  </div>
                </div>

                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontWeight: 700 }}>Finance Cashier</span>
                    <span className="admin-status approved">Payments Only</span>
                  </div>
                  <div className="admin-perm-row">
                    <span>View Players</span>
                    <div
                      className={`admin-switch ${permissions.financeViewUsers ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, financeViewUsers: !p.financeViewUsers }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>Approve Cashier Payments</span>
                    <div
                      className={`admin-switch ${permissions.financeManagePayments ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, financeManagePayments: !p.financeManagePayments }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>Manage Game Rooms</span>
                    <div
                      className={`admin-switch ${permissions.financeManageGames ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, financeManageGames: !p.financeManageGames }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>System Settings & Staff</span>
                    <div
                      className={`admin-switch ${permissions.financeSystemSettings ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, financeSystemSettings: !p.financeSystemSettings }))}
                    ></div>
                  </div>
                </div>

                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontWeight: 700 }}>Support Agent</span>
                    <span className="admin-status approved">Read Only</span>
                  </div>
                  <div className="admin-perm-row">
                    <span>View Players</span>
                    <div
                      className={`admin-switch ${permissions.supportViewUsers ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, supportViewUsers: !p.supportViewUsers }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>Approve Cashier Payments</span>
                    <div
                      className={`admin-switch ${permissions.supportManagePayments ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, supportManagePayments: !p.supportManagePayments }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>Manage Game Rooms</span>
                    <div
                      className={`admin-switch ${permissions.supportManageGames ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, supportManageGames: !p.supportManageGames }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>System Settings & Staff</span>
                    <div
                      className={`admin-switch ${permissions.supportSystemSettings ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, supportSystemSettings: !p.supportSystemSettings }))}
                    ></div>
                  </div>
                </div>
              </div>

              {/* System Audit Log */}
              <div className="admin-card" style={{ marginTop: '18px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                  🛡️ Immutable Administrative Audit Log
                </div>

                {auditLogs.map((log) => (
                  <div key={log.id} className="admin-activity-item">
                    <i className="admin-dot"></i>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{log.action}</strong>
                        <small style={{ color: '#8490a5' }}>{log.timestamp}</small>
                      </div>
                      <small style={{ color: '#8490a5' }}>By {log.admin} · IP: {log.ip}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ═════════ 9. PLATFORM SETTINGS ═════════ */}
          {activeSection === 'settings' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Platform & Gateway Settings</h1>
                  <p>Configure official Telebirr / CBE payment receiving accounts and maintenance modes.</p>
                </div>
                <button
                  className="admin-btn primary"
                  onClick={() => showToast('Platform configuration saved')}
                >
                  💾 Save Configuration
                </button>
              </div>

              <div className="admin-card" style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
                  Official Payment Gateways (Ethiopia)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="admin-input-group">
                    <label>Official Telebirr Receiver Phone</label>
                    <input
                      type="text"
                      value={telebirrPhone}
                      onChange={(e) => setTelebirrPhone(e.target.value)}
                    />
                  </div>

                  <div className="admin-input-group">
                    <label>Official CBE Bank Account Number</label>
                    <input
                      type="text"
                      value={cbeAccount}
                      onChange={(e) => setCbeAccount(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
                  Security & Operational Flags
                </div>

                <div className="admin-perm-row">
                  <div>
                    <strong style={{ fontSize: '13px' }}>Manual Deposit Verification Mode</strong>
                    <div style={{ color: '#8490a5', fontSize: '11px' }}>
                      Require cashier approval before crediting Telebirr/CBE SMS receipts
                    </div>
                  </div>
                  <div
                    className={`admin-switch ${paymentReviewReq ? 'on' : ''}`}
                    onClick={() => setPaymentReviewReq(!paymentReviewReq)}
                  ></div>
                </div>

                <div className="admin-perm-row">
                  <div>
                    <strong style={{ fontSize: '13px' }}>Maintenance Mode</strong>
                    <div style={{ color: '#8490a5', fontSize: '11px' }}>
                      Temporarily pause player logins and game lobbies for updates
                    </div>
                  </div>
                  <div
                    className={`admin-switch ${maintenanceMode ? 'on' : ''}`}
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                  ></div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ── Transaction Review Modal ── */}
      {selectedTx && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedTx(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">Review Transaction #{selectedTx.id}</div>
              <button
                onClick={() => setSelectedTx(null)}
                style={{ background: 'none', border: 'none', color: '#8490a5', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#0b1220', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Player:</span>
                <span style={{ fontWeight: 600 }}>{selectedTx.playerName} ({selectedTx.username})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Amount:</span>
                <span style={{ fontWeight: 800, fontSize: '16px', color: selectedTx.type === 'positive' ? '#34d399' : '#fb7185' }}>
                  {selectedTx.amount} ETB
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Method:</span>
                <span>{selectedTx.method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Payment Reference / SMS:</span>
                <span style={{ color: '#22d3ee', fontWeight: 600 }}>{selectedTx.meta}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Current Status:</span>
                <span className={`admin-status ${selectedTx.status}`}>{selectedTx.status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="admin-btn danger"
                onClick={() => handleRejectTransaction(selectedTx.id)}
              >
                Reject Transaction
              </button>
              <button
                className="admin-btn primary"
                onClick={() => handleApproveTransaction(selectedTx.id)}
              >
                ✓ Approve & Credit Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 360° Player Profile Drawer / Modal ── */}
      {selectedUser && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">360° Player CRM: {selectedUser.name}</div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', color: '#8490a5', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#0b1220', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Telegram ID:</span>
                <span style={{ fontWeight: 600 }}>#{selectedUser.id} ({selectedUser.username})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Phone:</span>
                <span>{selectedUser.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Total Balance:</span>
                <span style={{ fontWeight: 800, color: '#22d3ee', fontSize: '15px' }}>{selectedUser.totalBalance} ETB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Playable / Withdrawable:</span>
                <span>{selectedUser.playableBalance} ETB / {selectedUser.withdrawableBalance} ETB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Total Deposited / Withdrawn:</span>
                <span>+{selectedUser.totalDeposited || 0} ETB / -{selectedUser.totalWithdrawn || 0} ETB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Account Status:</span>
                <span className={`admin-status ${selectedUser.status}`}>{selectedUser.status}</span>
              </div>
            </div>

            {/* Adjust Balance Tool */}
            <div className="admin-input-group">
              <label>Manual Balance Adjustment (e.g. +500 or -200 ETB)</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="number"
                  placeholder="Amount ETB..."
                  value={balanceAdjustAmount}
                  onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                />
                <button className="admin-btn primary" onClick={handleAdjustBalance}>
                  Apply Adjustment
                </button>
              </div>
              <input
                type="text"
                placeholder="Reason / Audit Note (e.g. Tournament bonus credit)"
                value={balanceAdjustReason}
                onChange={(e) => setBalanceAdjustReason(e.target.value)}
              />
            </div>

            {/* Direct Telegram Message */}
            <div className="admin-input-group" style={{ marginTop: '14px' }}>
              <label>Send Direct Message via Telegram Bot</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Message text to player..."
                  value={userDirectMessage}
                  onChange={(e) => setUserDirectMessage(e.target.value)}
                />
                <button className="admin-btn" onClick={handleSendUserDirectMsg}>
                  Send
                </button>
              </div>
            </div>

            {/* Status Switcher */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '11px', color: '#8490a5', display: 'block', marginBottom: '6px' }}>
                ACCOUNT RISK STATUS
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`admin-btn ${selectedUser.status === 'active' ? 'success' : ''}`}
                  onClick={() => handleToggleUserStatus(selectedUser.id, 'active')}
                >
                  Active
                </button>
                <button
                  className={`admin-btn ${selectedUser.status === 'restricted' ? 'primary' : ''}`}
                  onClick={() => handleToggleUserStatus(selectedUser.id, 'restricted')}
                >
                  Restricted
                </button>
                <button
                  className={`admin-btn ${selectedUser.status === 'blocked' ? 'danger' : ''}`}
                  onClick={() => handleToggleUserStatus(selectedUser.id, 'blocked')}
                >
                  Blocked
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Bingo Room Modal ── */}
      {showNewBingoRoomModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowNewBingoRoomModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">Create New Bingo Room</div>
              <button
                onClick={() => setShowNewBingoRoomModal(false)}
                style={{ background: 'none', border: 'none', color: '#8490a5', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBingoRoom}>
              <div className="admin-input-group">
                <label>Room Name</label>
                <input name="roomName" placeholder="e.g. Diamond Lobby" required />
              </div>

              <div className="admin-input-group">
                <label>Ticket Price (ETB Stake)</label>
                <input name="stake" type="number" defaultValue="25" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="admin-input-group">
                  <label>Min Players</label>
                  <input name="minPlayers" type="number" defaultValue="2" required />
                </div>
                <div className="admin-input-group">
                  <label>Max Players</label>
                  <input name="maxPlayers" type="number" defaultValue="40" required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setShowNewBingoRoomModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn primary">
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Staff Modal ── */}
      {showNewStaffModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowNewStaffModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">Add Team Member</div>
              <button
                onClick={() => setShowNewStaffModal(false)}
                style={{ background: 'none', border: 'none', color: '#8490a5', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const newSt: StaffItem = {
                  id: `A00${staffList.length + 1}`,
                  name: form.name.value,
                  username: form.username.value,
                  role: form.role.value,
                  email: form.email.value,
                  status: 'active',
                  lastLogin: 'Never',
                };
                setStaffList((prev) => [...prev, newSt]);
                adminApi.addStaff(newSt);
                setShowNewStaffModal(false);
                showToast(`Staff member ${newSt.name} added`);
              }}
            >
              <div className="admin-input-group">
                <label>Full Name</label>
                <input name="name" placeholder="e.g. Abebe Kassahun" required />
              </div>

              <div className="admin-input-group">
                <label>Username</label>
                <input name="username" placeholder="e.g. abebe_admin" required />
              </div>

              <div className="admin-input-group">
                <label>Role</label>
                <select name="role" className="admin-select" style={{ width: '100%' }}>
                  <option value="Finance Cashier">Finance Cashier</option>
                  <option value="Support Agent">Support Agent</option>
                  <option value="Game Master">Game Master</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>

              <div className="admin-input-group">
                <label>Email Address</label>
                <input name="email" type="email" placeholder="staff@gamezone.et" required />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setShowNewStaffModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn primary">
                  Add Personnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── New Manual Payment Modal ── */}
      {showNewPaymentModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowNewPaymentModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">Create Manual Payment Action</div>
              <button
                onClick={() => setShowNewPaymentModal(false)}
                style={{ background: 'none', border: 'none', color: '#8490a5', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const newTx: TransactionItem = {
                  id: `DP-${Math.floor(10000 + Math.random() * 90000)}`,
                  userId: '102938',
                  playerName: form.playerName.value,
                  username: '@' + form.playerName.value.toLowerCase().replace(/\s+/g, ''),
                  title: `${form.type.value} via ${form.method.value}`,
                  meta: `Manual Action: ${form.note.value || 'Admin Adjustment'}`,
                  amount: form.type.value === 'Deposit' ? Number(form.amount.value) : -Number(form.amount.value),
                  currency: 'ETB',
                  type: form.type.value === 'Deposit' ? 'positive' : 'negative',
                  method: form.method.value,
                  status: 'approved',
                  timestamp: 'Just now',
                };
                setTransactions((prev) => [newTx, ...prev]);
                setShowNewPaymentModal(false);
                showToast(`Manual ${form.type.value} of ${form.amount.value} ETB executed`);
              }}
            >
              <div className="admin-input-group">
                <label>Player Name</label>
                <input name="playerName" defaultValue="Bini Eyoel" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="admin-input-group">
                  <label>Type</label>
                  <select name="type" className="admin-select" style={{ width: '100%' }}>
                    <option value="Deposit">Deposit (+)</option>
                    <option value="Withdrawal">Withdrawal (-)</option>
                  </select>
                </div>

                <div className="admin-input-group">
                  <label>Amount (ETB)</label>
                  <input name="amount" type="number" defaultValue="500" required />
                </div>
              </div>

              <div className="admin-input-group">
                <label>Payment Method</label>
                <select name="method" className="admin-select" style={{ width: '100%' }}>
                  <option value="Telebirr">Telebirr</option>
                  <option value="CBE Birr">CBE Birr</option>
                  <option value="Direct Admin">Direct Admin</option>
                </select>
              </div>

              <div className="admin-input-group">
                <label>Admin Note / Memo</label>
                <input name="note" placeholder="e.g. Promotional bonus / dispute resolution" />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => setShowNewPaymentModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn primary">
                  Execute Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#111827',
            border: '1px solid #22d3ee',
            color: '#f8fafc',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            fontSize: '12.5px',
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
