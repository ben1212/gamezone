import React, { useState, useEffect } from 'react';
import './styles/Admin.css';
import { adminApi } from './services/api';

type NavSection =
  | 'dashboard'
  | 'users'
  | 'tasks'
  | 'promocodes'
  | 'deposits'
  | 'withdrawals'
  | 'broadcast'
  | 'settings'
  | 'maintenance';

interface TransactionItem {
  id: string;
  userId: string;
  playerName: string;
  username: string;
  phone: string;
  amount: number;
  currency: string;
  category: 'deposit' | 'withdrawal';
  method: string;
  smsRef?: string;
  accountNumber?: string;
  status: 'pending' | 'completed' | 'rejected';
  time: string;
}

interface UserItem {
  id: string;
  name: string;
  username: string;
  phone: string;
  playableBalance: number;
  withdrawableBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalWagered: number;
  winCount: number;
  lossCount: number;
  status: 'active' | 'blocked';
  joinedDate: string;
  lastActive: string;
}

interface TaskItem {
  id: string;
  title: string;
  desc: string;
  reward: string;
  target: string;
  status: 'active' | 'disabled';
  completions: number;
}

interface PromoItem {
  id: string;
  code: string;
  reward: string;
  maxUses: number;
  usedCount: number;
  expiry: string;
  status: 'active' | 'expired' | 'disabled';
}

interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  target: string;
  sentAt: string;
  recipients: number;
  status: 'delivered' | 'sending';
}

export const App: React.FC = () => {
  // ── Authentication ──
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('gamezone_admin_auth') === 'true';
  });
  const [loginUser, setLoginUser] = useState<string>('admin');
  const [loginPass, setLoginPass] = useState<string>('password123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Layout Navigation & Sidebar State ──
  const [activeTab, setActiveTab] = useState<NavSection>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  const handleNavClick = (tab: NavSection) => {
    setActiveTab(tab);
    if (window.innerWidth <= 900) {
      setIsMobileOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gamezone_admin_auth');
    setIsAuthenticated(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (loginUser === 'admin' && loginPass === 'password123') ||
      (loginUser === 'admin123' && loginPass === 'gamezone2026')
    ) {
      localStorage.setItem('gamezone_admin_auth', 'true');
      setIsAuthenticated(true);
      setLoginError(null);
      showToast('Welcome back, Admin!');
    } else {
      setLoginError('Invalid administrator credentials.');
    }
  };

  // ── Transactions & Cashier State ──
  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: 'DP48291',
      userId: '10284',
      playerName: 'Abebe T.',
      username: '@player_284',
      phone: '+251911002233',
      amount: 500,
      currency: 'ETB',
      category: 'deposit',
      method: 'Telebirr',
      smsRef: 'TB-998822441',
      status: 'pending',
      time: '2 min ago',
    },
    {
      id: 'DP48289',
      userId: '10295',
      playerName: 'Mekdes K.',
      username: '@mekdes_bingo',
      phone: '+251922334455',
      amount: 250,
      currency: 'ETB',
      category: 'deposit',
      method: 'Telebirr',
      smsRef: 'TB-334411990',
      status: 'pending',
      time: '6 min ago',
    },
    {
      id: 'DP48288',
      userId: '10288',
      playerName: 'Daniel A.',
      username: '@bingo_player',
      phone: '+251933445566',
      amount: 1000,
      currency: 'ETB',
      category: 'deposit',
      method: 'CBE Birr',
      smsRef: 'CBE-77112233',
      status: 'pending',
      time: '9 min ago',
    },
    {
      id: 'WD17402',
      userId: '10293',
      playerName: 'Yosef B.',
      username: '@player_931',
      phone: '+251944556677',
      accountNumber: '0944556677 (Telebirr)',
      amount: 300,
      currency: 'ETB',
      category: 'withdrawal',
      method: 'Telebirr',
      status: 'pending',
      time: '5 min ago',
    },
    {
      id: 'WD17396',
      userId: '10282',
      playerName: 'Helen G.',
      username: '@player_482',
      phone: '+251911889900',
      accountNumber: '100049281920 (CBE)',
      amount: 750,
      currency: 'ETB',
      category: 'withdrawal',
      method: 'CBE Bank',
      status: 'pending',
      time: '14 min ago',
    },
    {
      id: 'DP48270',
      userId: '10201',
      playerName: 'Ermias D.',
      username: '@ermi_2026',
      phone: '+251912345678',
      amount: 500,
      currency: 'ETB',
      category: 'deposit',
      method: 'Telebirr',
      smsRef: 'TB-102938475',
      status: 'completed',
      time: '25 min ago',
    },
    {
      id: 'WD17380',
      userId: '10214',
      playerName: 'Sara M.',
      username: '@sara_win',
      phone: '+251911998877',
      accountNumber: '0911998877',
      amount: 450,
      currency: 'ETB',
      category: 'withdrawal',
      method: 'Telebirr',
      status: 'completed',
      time: '38 min ago',
    },
    {
      id: 'DP48260',
      userId: '10299',
      playerName: 'Kaleb S.',
      username: '@kaleb_99',
      phone: '+251922001122',
      amount: 300,
      currency: 'ETB',
      category: 'deposit',
      method: 'Telebirr',
      smsRef: 'INVALID_REF',
      status: 'rejected',
      time: '1 hour ago',
    },
  ]);

  // Modals & Selection
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Invalid SMS reference code');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [withdrawFilter, setWithdrawFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [txSearch, setTxSearch] = useState<string>('');

  // ── Users State ──
  const [users, setUsers] = useState<UserItem[]>([
    {
      id: '10284',
      name: 'Abebe T.',
      username: '@player_284',
      phone: '+251911002233',
      playableBalance: 1450,
      withdrawableBalance: 650,
      totalDeposited: 12500,
      totalWithdrawn: 8400,
      totalWagered: 45200,
      winCount: 42,
      lossCount: 38,
      status: 'active',
      joinedDate: 'Aug 14, 2026',
      lastActive: 'Just now',
    },
    {
      id: '10295',
      name: 'Mekdes K.',
      username: '@mekdes_bingo',
      phone: '+251922334455',
      playableBalance: 520,
      withdrawableBalance: 320,
      totalDeposited: 4200,
      totalWithdrawn: 3100,
      totalWagered: 18400,
      winCount: 18,
      lossCount: 22,
      status: 'active',
      joinedDate: 'Aug 20, 2026',
      lastActive: '6 min ago',
    },
    {
      id: '10288',
      name: 'Daniel A.',
      username: '@bingo_player',
      phone: '+251933445566',
      playableBalance: 3100,
      withdrawableBalance: 1900,
      totalDeposited: 18000,
      totalWithdrawn: 14000,
      totalWagered: 89000,
      winCount: 74,
      lossCount: 65,
      status: 'active',
      joinedDate: 'Jul 29, 2026',
      lastActive: '9 min ago',
    },
    {
      id: '10293',
      name: 'Yosef B.',
      username: '@player_931',
      phone: '+251944556677',
      playableBalance: 800,
      withdrawableBalance: 400,
      totalDeposited: 9500,
      totalWithdrawn: 6800,
      totalWagered: 32000,
      winCount: 29,
      lossCount: 31,
      status: 'active',
      joinedDate: 'Aug 02, 2026',
      lastActive: '12 min ago',
    },
    {
      id: '10299',
      name: 'Kaleb S.',
      username: '@kaleb_99',
      phone: '+251922001122',
      playableBalance: 0,
      withdrawableBalance: 0,
      totalDeposited: 300,
      totalWithdrawn: 0,
      totalWagered: 300,
      winCount: 0,
      lossCount: 3,
      status: 'blocked',
      joinedDate: 'Sep 01, 2026',
      lastActive: '1 hour ago',
    },
  ]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // ── Tasks State ──
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 't-1',
      title: 'Daily Login Reward',
      desc: 'Claim daily bonus by logging in consecutive days.',
      reward: '+5 ETB Playable',
      target: 'All Players',
      status: 'active',
      completions: 1284,
    },
    {
      id: 't-2',
      title: 'Join Telegram Channel',
      desc: 'Subscribe to the official @GameZoneETH announcement channel.',
      reward: '+15 ETB Playable',
      target: 'New Players',
      status: 'active',
      completions: 3410,
    },
    {
      id: 't-3',
      title: 'Play 5 Bingo Rounds',
      desc: 'Participate in any 5 Live Bingo or Turbo games.',
      reward: '+20 ETB Bonus',
      target: 'Active Players',
      status: 'active',
      completions: 890,
    },
    {
      id: 't-4',
      title: 'First Deposit Match',
      desc: 'Deposit 100 ETB or more for an instant 50 ETB ticket credit.',
      reward: '+50 ETB Cartela',
      target: 'First-time Depositors',
      status: 'active',
      completions: 642,
    },
  ]);
  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskDesc, setNewTaskDesc] = useState<string>('');
  const [newTaskReward, setNewTaskReward] = useState<string>('');
  const [newTaskTarget, setNewTaskTarget] = useState<string>('All Players');

  // ── Promo Codes State ──
  const [promos, setPromos] = useState<PromoItem[]>([
    {
      id: 'p-1',
      code: 'WELCOME100',
      reward: '+100 ETB Bonus on 200 ETB Deposit',
      maxUses: 1000,
      usedCount: 742,
      expiry: '30 Sep 2026',
      status: 'active',
    },
    {
      id: 'p-2',
      code: 'BINGO2026',
      reward: '2 Free VIP Cartelas',
      maxUses: 500,
      usedCount: 318,
      expiry: '15 Sep 2026',
      status: 'active',
    },
    {
      id: 'p-3',
      code: 'TELEGRAM15',
      reward: '+15 ETB Free Playable',
      maxUses: 2000,
      usedCount: 1980,
      expiry: '31 Dec 2026',
      status: 'active',
    },
    {
      id: 'p-4',
      code: 'EXPIRED50',
      reward: '+50 ETB Bonus',
      maxUses: 200,
      usedCount: 200,
      expiry: '01 Sep 2026',
      status: 'expired',
    },
  ]);
  const [showNewPromoModal, setShowNewPromoModal] = useState<boolean>(false);
  const [newPromoCode, setNewPromoCode] = useState<string>('');
  const [newPromoReward, setNewPromoReward] = useState<string>('');
  const [newPromoUses, setNewPromoUses] = useState<number>(500);
  const [newPromoExpiry, setNewPromoExpiry] = useState<string>('30 Sep 2026');

  // ── Broadcast State ──
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([
    {
      id: 'bc-1',
      title: '🎉 Weekend Mega Bingo Jackpot Active!',
      message: 'Join the 50,000 ETB Mega Pool in Bingo Live Room #108. Double rewards for the top 5 cartelas!',
      target: 'All Players',
      sentAt: 'Yesterday, 18:30',
      recipients: 1284,
      status: 'delivered',
    },
    {
      id: 'bc-2',
      title: '⚡ Instant Telebirr Deposits Online',
      message: 'Fast automated deposit verification is active. Deposits take under 30 seconds to credit.',
      target: 'All Players',
      sentAt: '03 Sep 2026',
      recipients: 1190,
      status: 'delivered',
    },
  ]);
  const [bcTitle, setBcTitle] = useState<string>('');
  const [bcMessage, setBcMessage] = useState<string>('');
  const [bcTarget, setBcTarget] = useState<string>('All Players');

  // ── Settings State ──
  const [telebirrPhone, setTelebirrPhone] = useState<string>('0911002233');
  const [cbeAccount, setCbeAccount] = useState<string>('1000123456789');
  const [cbeAccountName, setCbeAccountName] = useState<string>('GameZone Gaming Systems');
  const [minDeposit, setMinDeposit] = useState<number>(10);
  const [minWithdraw, setMinWithdraw] = useState<number>(50);
  const [bingoHouseFee, setBingoHouseFee] = useState<number>(10);

  // ── Maintenance State ──
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [maintenanceBanner, setMaintenanceBanner] = useState<string>(
    'System undergoing scheduled server optimization. We will be back online shortly!'
  );

  // ── Chart Period State ──
  const [chartPeriod, setChartPeriod] = useState<string>('Last 7 days');

  // Load live data from backend if connected
  useEffect(() => {
    if (!isAuthenticated) return;
    adminApi.getTransactions().then((res) => {
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setTransactions(res.data);
      }
    });
    adminApi.getUsers().then((res) => {
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setUsers(res.data);
      }
    });
  }, [isAuthenticated]);

  // Pending counts
  const pendingDepositsCount = transactions.filter((t) => t.category === 'deposit' && t.status === 'pending').length;
  const pendingWithdrawalsCount = transactions.filter((t) => t.category === 'withdrawal' && t.status === 'pending').length;

  // ── Handlers for Transactions ──
  const handleApproveTx = (tx: TransactionItem) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === tx.id ? { ...t, status: 'completed' } : t))
    );
    setSelectedTx(null);
    showToast(
      tx.category === 'deposit'
        ? `Deposit #${tx.id} approved & +${tx.amount} ETB credited!`
        : `Withdrawal #${tx.id} approved & marked as sent!`
    );
  };

  const handleRejectTx = (tx: TransactionItem) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === tx.id ? { ...t, status: 'rejected' } : t))
    );
    setSelectedTx(null);
    showToast(`Transaction #${tx.id} rejected (${rejectReason}).`);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'active' ? 'blocked' : 'active';
          showToast(`Player ${u.username} is now ${nextStatus.toUpperCase()}`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser((prev) =>
        prev ? { ...prev, status: prev.status === 'active' ? 'blocked' : 'active' } : null
      );
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskReward.trim()) return;
    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      title: newTaskTitle.trim(),
      desc: newTaskDesc.trim() || 'Complete the task to earn reward balance.',
      reward: newTaskReward.trim(),
      target: newTaskTarget,
      status: 'active',
      completions: 0,
    };
    setTasks([newTask, ...tasks]);
    setShowNewTaskModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskReward('');
    showToast(`Task "${newTask.title}" created successfully!`);
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim() || !newPromoReward.trim()) return;
    const newPromo: PromoItem = {
      id: `p-${Date.now()}`,
      code: newPromoCode.trim().toUpperCase(),
      reward: newPromoReward.trim(),
      maxUses: newPromoUses,
      usedCount: 0,
      expiry: newPromoExpiry,
      status: 'active',
    };
    setPromos([newPromo, ...promos]);
    setShowNewPromoModal(false);
    setNewPromoCode('');
    setNewPromoReward('');
    showToast(`Promo Code "${newPromo.code}" generated!`);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcTitle.trim() || !bcMessage.trim()) return;
    const newBroadcast: BroadcastItem = {
      id: `bc-${Date.now()}`,
      title: bcTitle.trim(),
      message: bcMessage.trim(),
      target: bcTarget,
      sentAt: 'Just now',
      recipients: bcTarget === 'All Players' ? 1284 : 450,
      status: 'delivered',
    };
    setBroadcasts([newBroadcast, ...broadcasts]);
    setBcTitle('');
    setBcMessage('');
    showToast(`Broadcast sent to ${newBroadcast.recipients} players!`);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Platform settings saved and applied.');
  };

  // ── Render Login Screen if not authenticated ──
  if (!isAuthenticated) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-mark">
              <svg viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <path d="M8 12h8M12 8v8" />
              </svg>
            </div>
            <h2>GameZone Admin</h2>
            <p>Operations & Platform Management</p>
          </div>

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {loginError && (
              <div style={{ color: 'var(--red)', fontSize: '11px', marginBottom: '12px', fontWeight: 600 }}>
                {loginError}
              </div>
            )}

            <button type="submit" className="login-btn">
              Sign In to Admin Portal
            </button>
          </form>

          <div className="login-hint">
            <strong>Default Credentials:</strong> <code>admin</code> / <code>password123</code>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Layout ──
  return (
    <>
      {/* SIDEBAR */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`} id="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" rx="4" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>

          <span className="brand-name">GameZone</span>
          <small>ADMIN</small>
        </div>

        <div className="sidebar-scroll">
          {/* OVERVIEW */}
          <div className="section">
            <div className="section-title">OVERVIEW</div>

            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('dashboard')}
            >
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span className="nav-text">Dashboard</span>
            </button>
          </div>

          {/* MANAGEMENT */}
          <div className="section">
            <div className="section-title">MANAGEMENT</div>

            <button
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => handleNavClick('users')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="nav-text">Users</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => handleNavClick('tasks')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
                <path d="M16 2v6h6" />
                <path d="M16 13H8M16 17H8M10 9H8" />
              </svg>
              <span className="nav-text">Tasks</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'promocodes' ? 'active' : ''}`}
              onClick={() => handleNavClick('promocodes')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8" />
                <path d="M2 7h20v5H2z" />
                <path d="M12 7v14" />
                <path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7Z" />
                <path d="M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z" />
              </svg>
              <span className="nav-text">Promo Codes</span>
            </button>
          </div>

          {/* PAYMENTS */}
          <div className="section">
            <div className="section-title">PAYMENTS</div>

            <button
              className={`nav-item ${activeTab === 'deposits' ? 'active' : ''}`}
              onClick={() => handleNavClick('deposits')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 3v18" />
                <path d="M17 7c0-2-2-4-5-4S7 5 7 7s2 3 5 4 5 2 5 4-2 4-5 4-5-2-5-4" />
              </svg>
              <span className="nav-text">Deposits</span>
              {pendingDepositsCount > 0 && <span className="badge">{pendingDepositsCount}</span>}
            </button>

            <button
              className={`nav-item ${activeTab === 'withdrawals' ? 'active' : ''}`}
              onClick={() => handleNavClick('withdrawals')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 21V3" />
                <path d="m6 9 6-6 6 6" />
              </svg>
              <span className="nav-text">Withdrawals</span>
              {pendingWithdrawalsCount > 0 && <span className="badge">{pendingWithdrawalsCount}</span>}
            </button>
          </div>

          {/* COMMUNICATION */}
          <div className="section">
            <div className="section-title">COMMUNICATION</div>

            <button
              className={`nav-item ${activeTab === 'broadcast' ? 'active' : ''}`}
              onClick={() => handleNavClick('broadcast')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.4 9.4 0 0 1-4-.9L3 21l1.9-4.4A8.3 8.3 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" />
              </svg>
              <span className="nav-text">Broadcast</span>
            </button>
          </div>

          {/* SYSTEM */}
          <div className="section">
            <div className="section-title">SYSTEM</div>

            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleNavClick('settings')}
            >
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.4 1.4-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-1.4-1.4.06-.06A1.65 1.65 0 0 0 8.6 15a1.65 1.65 0 0 0-1.51-1H7v-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 1.4-1.4.06.06a1.65 1.65 0 0 0 1.82.33h.02A1.65 1.65 0 0 0 12.5 6.6V6h2v.6a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 1.4 1.4-.06.06a1.65 1.65 0 0 0-.33 1.82v.02a1.65 1.65 0 0 0 1.51 1H20v2h-.6a1.65 1.65 0 0 0-1.51 1Z" />
              </svg>
              <span className="nav-text">Settings</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'maintenance' ? 'active' : ''}`}
              onClick={() => handleNavClick('maintenance')}
            >
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span className="nav-text">Maintenance</span>
            </button>
          </div>
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item logout" onClick={handleLogout}>
            <svg viewBox="0 0 24 24">
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
            </svg>
            <span className="nav-text">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* OVERLAY */}
      <div
        className={`overlay ${isMobileOpen ? 'show' : ''}`}
        id="overlay"
        onClick={() => setIsMobileOpen(false)}
      />

      {/* MAIN CONTENT AREA */}
      <main className="main">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="top-left">
            <button className="menu-btn desktop-menu" id="collapseBtn" onClick={toggleCollapse} title="Toggle Sidebar">
              <svg viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <button
              className="menu-btn mobile-menu"
              id="mobileBtn"
              onClick={() => setIsMobileOpen(true)}
              title="Open Navigation"
            >
              <svg viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <span className="top-title">Admin Panel</span>
          </div>

          <div className="top-right">
            <div className="status">
              <span className="status-dot"></span>
              {isMaintenanceMode ? 'Maintenance Mode' : 'System Online'}
            </div>

            <div className="admin-avatar">A</div>
          </div>
        </header>

        {/* VIEW ROUTING */}
        <section className="content">
          {/* =========================================
              VIEW 1: DASHBOARD
             ========================================= */}
          {activeTab === 'dashboard' && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Dashboard</h1>
                  <p>06 September 2026</p>
                </div>
              </div>

              {/* STATS */}
              <div className="stats">
                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">Total Deposits</span>
                    <div className="stat-icon">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 3v18" />
                        <path d="M17 7c0-2-2-4-5-4S7 5 7 7s2 3 5 4 5 2 5 4-2 4-5 4-5-2-5-4" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-value">84,250 ETB</div>
                  <div className="stat-change up">+12.8% this month</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">Withdrawals</span>
                    <div className="stat-icon">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 21V3" />
                        <path d="m6 9 6-6 6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-value">61,430 ETB</div>
                  <div className="stat-change down">-4.6% this month</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">System Profit</span>
                    <div className="stat-icon">
                      <svg viewBox="0 0 24 24">
                        <path d="m4 19 6-6 4 4 6-8" />
                        <path d="M15 9h5v5" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-value">+22,820 ETB</div>
                  <div className="stat-change up">Successful transactions</div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">Active Players</span>
                    <div className="stat-icon">
                      <svg viewBox="0 0 24 24">
                        <circle cx="9" cy="7" r="4" />
                        <path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
                        <path d="M16 3.1a4 4 0 0 1 0 7.8" />
                      </svg>
                    </div>
                  </div>
                  <div className="stat-value">1,284</div>
                  <div className="stat-change up">+86 today</div>
                </div>
              </div>

              {/* DASHBOARD CONTENT */}
              <div className="dashboard-grid">
                {/* FINANCIAL ACTIVITY */}
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Financial Activity</div>
                      <div className="panel-sub">Deposits vs withdrawals</div>
                    </div>

                    <select
                      className="select"
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value)}
                    >
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>Last 90 days</option>
                    </select>
                  </div>

                  <div className="chart-box">
                    <div className="chart">
                      <div className="chart-grid">
                        <span className="chart-line"></span>
                        <span className="chart-line"></span>
                        <span className="chart-line"></span>
                        <span className="chart-line"></span>
                        <span className="chart-line"></span>
                      </div>

                      <svg className="chart-svg" viewBox="0 0 700 210" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="area1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stopColor="#22d3ee" stopOpacity=".16" />
                            <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        <path
                          d="M0 145
                             C35 130 55 142 90 118
                             S145 90 180 112
                             S225 150 260 105
                             S320 80 350 92
                             S405 65 440 78
                             S490 118 525 82
                             S570 45 610 67
                             S665 40 700 51
                             L700 210 L0 210 Z"
                          fill="url(#area1)"
                        />

                        <path
                          d="M0 145
                             C35 130 55 142 90 118
                             S145 90 180 112
                             S225 150 260 105
                             S320 80 350 92
                             S405 65 440 78
                             S490 118 525 82
                             S570 45 610 67
                             S665 40 700 51"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="3"
                        />

                        <path
                          d="M0 170
                             C45 160 60 168 100 150
                             S150 130 185 143
                             S235 175 270 140
                             S320 120 360 130
                             S410 105 450 120
                             S500 150 535 128
                             S585 100 620 115
                             S665 85 700 102"
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="3"
                        />
                      </svg>

                      <div className="chart-labels">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </div>

                    <div className="chart-legend">
                      <div className="legend">
                        <span className="legend-dot deposit-dot"></span>
                        Deposits
                      </div>

                      <div className="legend">
                        <span className="legend-dot withdraw-dot"></span>
                        Withdrawals
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECENT TRANSACTIONS */}
                <div className="panel transactions" style={{ marginTop: 0 }}>
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Recent Transactions</div>
                      <div className="panel-sub">Latest platform activity</div>
                    </div>
                    <button
                      className="open-btn"
                      onClick={() => handleNavClick('deposits')}
                    >
                      View All
                    </button>
                  </div>

                  <div>
                    {transactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="transaction"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedTx(tx)}
                      >
                        <div className={`tx-icon ${tx.category}`}>
                          {tx.category === 'deposit' ? (
                            <svg viewBox="0 0 24 24">
                              <path d="M12 19V5" />
                              <path d="m6 11 6-6 6 6" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24">
                              <path d="M12 5v14" />
                              <path d="m18 13-6 6-6-6" />
                            </svg>
                          )}
                        </div>

                        <div className="tx-info">
                          <div className="tx-name">
                            {tx.category === 'deposit' ? 'Deposit' : 'Withdrawal'} · #{tx.id}
                          </div>
                          <div className="tx-meta">
                            {tx.username} · {tx.time}
                          </div>
                        </div>

                        <div className={`tx-amount ${tx.category}`}>
                          {tx.category === 'deposit' ? `+${tx.amount}` : `-${tx.amount}`} ETB
                          <div className="tx-status" style={{ textTransform: 'capitalize' }}>
                            {tx.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================
              VIEW 2: USERS MANAGEMENT (SEARCH-ONLY)
             ========================================= */}
          {activeTab === 'users' && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Users Lookup</h1>
                  <p>Search players by name, phone number, username (@handle), or ID</p>
                </div>
              </div>

              {/* SEARCH PANEL */}
              <div className="search-panel">
                <div className="search-panel-inner">
                  <div className="search-panel-input-wrap">
                    <svg viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      className="search-panel-input"
                      placeholder="Search by Name, @username, Phone (e.g. 09...), or User ID..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="filter-tabs" style={{ margin: 0 }}>
                    <button
                      className={`filter-tab ${userStatusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setUserStatusFilter('all')}
                    >
                      All Status
                    </button>
                    <button
                      className={`filter-tab ${userStatusFilter === 'active' ? 'active' : ''}`}
                      onClick={() => setUserStatusFilter('active')}
                    >
                      Active
                    </button>
                    <button
                      className={`filter-tab ${userStatusFilter === 'blocked' ? 'active' : ''}`}
                      onClick={() => setUserStatusFilter('blocked')}
                    >
                      Blocked
                    </button>
                  </div>

                  {userSearch && (
                    <button
                      className="sm-btn outline"
                      style={{ height: '42px', padding: '0 14px' }}
                      onClick={() => setUserSearch('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* EMPTY / INITIAL STATE (BEFORE SEARCH) */}
              {!userSearch.trim() ? (
                <div className="search-placeholder-card">
                  <div className="search-icon-circle">
                    <svg viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  <h3>Search User Database</h3>
                  <p>
                    Enter a player's name, phone number, username (@handle), or ID in the search box above to look up their balance, gameplay record, and manage account status.
                  </p>
                  <div className="search-shortcuts">
                    <span style={{ fontSize: '11px', color: 'var(--muted)', alignSelf: 'center', marginRight: '4px' }}>
                      Try:
                    </span>
                    <button
                      type="button"
                      className="search-shortcut-pill"
                      onClick={() => setUserSearch('@player_284')}
                    >
                      @player_284
                    </button>
                    <button
                      type="button"
                      className="search-shortcut-pill"
                      onClick={() => setUserSearch('0911002233')}
                    >
                      0911002233
                    </button>
                    <button
                      type="button"
                      className="search-shortcut-pill"
                      onClick={() => setUserSearch('Abebe')}
                    >
                      Abebe
                    </button>
                    <button
                      type="button"
                      className="search-shortcut-pill"
                      onClick={() => setUserSearch('10284')}
                    >
                      #10284
                    </button>
                  </div>
                </div>
              ) : (
                /* SEARCH RESULTS */
                (() => {
                  const s = userSearch.toLowerCase().trim();
                  const matchedUsers = users.filter((u) => {
                    if (userStatusFilter !== 'all' && u.status !== userStatusFilter) return false;
                    return (
                      u.username.toLowerCase().includes(s) ||
                      u.name.toLowerCase().includes(s) ||
                      u.phone.includes(s) ||
                      u.id.includes(s)
                    );
                  });

                  if (matchedUsers.length === 0) {
                    return (
                      <div className="search-placeholder-card">
                        <div className="search-icon-circle" style={{ color: 'var(--red)' }}>
                          <svg viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </div>
                        <h3>No Players Found</h3>
                        <p>
                          No player matches "<strong>{userSearch}</strong>". Please verify the spelling, phone number, or user ID.
                        </p>
                        <button className="sm-btn outline" onClick={() => setUserSearch('')}>
                          Clear Search
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="panel">
                      <div className="panel-header">
                        <div>
                          <div className="panel-title">Search Results ({matchedUsers.length})</div>
                          <div className="panel-sub">Matching query "{userSearch}"</div>
                        </div>
                      </div>

                      <div className="table-wrap">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Player</th>
                              <th>Phone</th>
                              <th>Playable</th>
                              <th>Withdrawable</th>
                              <th>Total Wagered</th>
                              <th>Record</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchedUsers.map((u) => (
                              <tr key={u.id}>
                                <td>
                                  <div style={{ fontWeight: 700, color: '#f8fafc' }}>{u.name}</div>
                                  <div style={{ color: '#8995a7', fontSize: '10px' }}>{u.username} · #{u.id}</div>
                                </td>
                                <td style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>{u.phone}</td>
                                <td style={{ color: '#22d3ee', fontWeight: 700 }}>{u.playableBalance.toLocaleString()} ETB</td>
                                <td style={{ color: '#4ade80', fontWeight: 700 }}>{u.withdrawableBalance.toLocaleString()} ETB</td>
                                <td style={{ color: '#8995a7' }}>{u.totalWagered.toLocaleString()} ETB</td>
                                <td>
                                  <span style={{ color: '#4ade80', fontWeight: 600 }}>{u.winCount}W</span> /{' '}
                                  <span style={{ color: '#f87171', fontWeight: 600 }}>{u.lossCount}L</span>
                                </td>
                                <td>
                                  <span className={`pill-badge ${u.status}`}>{u.status}</span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button className="sm-btn outline" onClick={() => setSelectedUser(u)}>
                                      Profile
                                    </button>
                                    <button
                                      className={`sm-btn ${u.status === 'active' ? 'danger' : 'success'}`}
                                      onClick={() => handleToggleUserStatus(u.id)}
                                    >
                                      {u.status === 'active' ? 'Block' : 'Unblock'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()
              )}
            </>
          )}

          {/* =========================================
              VIEW 3: TASKS
             ========================================= */}
          {activeTab === 'tasks' && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Task & Quest Management</h1>
                  <p>Incentivize player engagement with automated daily tasks and rewards</p>
                </div>
                <button className="action-btn" onClick={() => setShowNewTaskModal(true)}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Create New Task
                </button>
              </div>

              <div className="cards-grid">
                {tasks.map((task) => (
                  <div key={task.id} className="item-card">
                    <div>
                      <div className="item-card-top">
                        <div className="item-card-title">{task.title}</div>
                        <span className={`pill-badge ${task.status}`}>{task.status}</span>
                      </div>
                      <div className="item-card-desc">{task.desc}</div>
                    </div>

                    <div>
                      <div className="item-card-meta">
                        <div>
                          Reward: <span className="item-reward">{task.reward}</span>
                        </div>
                        <div>Target: {task.target}</div>
                        <div style={{ marginLeft: 'auto', color: '#a5b4fc', fontWeight: 600 }}>
                          {task.completions.toLocaleString()} claimed
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          className={`sm-btn ${task.status === 'active' ? 'danger' : 'success'}`}
                          style={{ flex: 1 }}
                          onClick={() => {
                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === task.id
                                  ? { ...t, status: t.status === 'active' ? 'disabled' : 'active' }
                                  : t
                              )
                            );
                          }}
                        >
                          {task.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="sm-btn outline"
                          onClick={() => {
                            setTasks((prev) => prev.filter((t) => t.id !== task.id));
                            showToast('Task removed.');
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* =========================================
              VIEW 4: PROMO CODES
             ========================================= */}
          {activeTab === 'promocodes' && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Promo Codes & Vouchers</h1>
                  <p>Create deposit bonuses and free cartela tickets for social campaigns</p>
                </div>
                <button className="action-btn" onClick={() => setShowNewPromoModal(true)}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Generate Promo Code
                </button>
              </div>

              <div className="cards-grid">
                {promos.map((promo) => (
                  <div key={promo.id} className="item-card">
                    <div>
                      <div className="item-card-top">
                        <div style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: 800, color: '#a5b4fc' }}>
                          {promo.code}
                        </div>
                        <span className={`pill-badge ${promo.status}`}>{promo.status}</span>
                      </div>
                      <div className="item-card-desc" style={{ marginTop: '6px' }}>
                        {promo.reward}
                      </div>
                    </div>

                    <div>
                      <div className="item-card-meta">
                        <div>
                          Usage: <span style={{ color: '#f8fafc', fontWeight: 700 }}>{promo.usedCount}</span> / {promo.maxUses}
                        </div>
                        <div style={{ marginLeft: 'auto' }}>Expires: {promo.expiry}</div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          className="sm-btn primary"
                          style={{ flex: 1 }}
                          onClick={() => {
                            navigator.clipboard?.writeText(promo.code);
                            showToast(`Copied code ${promo.code} to clipboard!`);
                          }}
                        >
                          Copy Code
                        </button>
                        <button
                          className="sm-btn outline"
                          onClick={() => {
                            setPromos((prev) => prev.filter((p) => p.id !== promo.id));
                            showToast('Promo code deleted.');
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* =========================================
              VIEW 5: DEPOSITS
             ========================================= */}
          {activeTab === 'deposits' && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Deposits Cashier</h1>
                  <p>Telebirr & CBE Birr customer payment verification requests</p>
                </div>
              </div>

              <div className="filter-bar">
                <div className="filter-tabs">
                  <button
                    className={`filter-tab ${depositFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDepositFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={`filter-tab ${depositFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setDepositFilter('pending')}
                  >
                    Pending ({pendingDepositsCount})
                  </button>
                  <button
                    className={`filter-tab ${depositFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setDepositFilter('completed')}
                  >
                    Completed
                  </button>
                  <button
                    className={`filter-tab ${depositFilter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setDepositFilter('rejected')}
                  >
                    Rejected
                  </button>
                </div>

                <div className="search-input-wrap">
                  <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search player, TX ID, or SMS code..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="panel">
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Player</th>
                        <th>Method</th>
                        <th>SMS Reference</th>
                        <th>Amount</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .filter((t) => t.category === 'deposit')
                        .filter((t) => (depositFilter !== 'all' ? t.status === depositFilter : true))
                        .filter((t) => {
                          if (!txSearch) return true;
                          const s = txSearch.toLowerCase();
                          return (
                            t.id.toLowerCase().includes(s) ||
                            t.username.toLowerCase().includes(s) ||
                            t.playerName.toLowerCase().includes(s) ||
                            (t.smsRef && t.smsRef.toLowerCase().includes(s))
                          );
                        })
                        .map((tx) => (
                          <tr key={tx.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f8fafc' }}>
                              #{tx.id}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{tx.playerName}</div>
                              <div style={{ color: '#8995a7', fontSize: '10px' }}>{tx.username}</div>
                            </td>
                            <td style={{ color: '#22d3ee', fontWeight: 600 }}>{tx.method}</td>
                            <td style={{ fontFamily: 'monospace', color: '#a5b4fc' }}>{tx.smsRef || '—'}</td>
                            <td style={{ color: '#4ade80', fontWeight: 700, fontSize: '13px' }}>
                              +{tx.amount} ETB
                            </td>
                            <td style={{ color: '#8995a7' }}>{tx.time}</td>
                            <td>
                              <span className={`pill-badge ${tx.status}`}>{tx.status}</span>
                            </td>
                            <td>
                              <button className="sm-btn primary" onClick={() => setSelectedTx(tx)}>
                                {tx.status === 'pending' ? 'Review & Approve' : 'Details'}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =========================================
              VIEW 6: WITHDRAWALS
             ========================================= */}
          {activeTab === 'withdrawals' && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Withdrawals Cashier</h1>
                  <p>Player prize payout requests awaiting transfer approval</p>
                </div>
              </div>

              <div className="filter-bar">
                <div className="filter-tabs">
                  <button
                    className={`filter-tab ${withdrawFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setWithdrawFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={`filter-tab ${withdrawFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setWithdrawFilter('pending')}
                  >
                    Pending ({pendingWithdrawalsCount})
                  </button>
                  <button
                    className={`filter-tab ${withdrawFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setWithdrawFilter('completed')}
                  >
                    Completed
                  </button>
                  <button
                    className={`filter-tab ${withdrawFilter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setWithdrawFilter('rejected')}
                  >
                    Rejected
                  </button>
                </div>

                <div className="search-input-wrap">
                  <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search player or payout account..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="panel">
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Player</th>
                        <th>Method</th>
                        <th>Destination Account</th>
                        <th>Amount</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions
                        .filter((t) => t.category === 'withdrawal')
                        .filter((t) => (withdrawFilter !== 'all' ? t.status === withdrawFilter : true))
                        .filter((t) => {
                          if (!txSearch) return true;
                          const s = txSearch.toLowerCase();
                          return (
                            t.id.toLowerCase().includes(s) ||
                            t.username.toLowerCase().includes(s) ||
                            t.playerName.toLowerCase().includes(s) ||
                            (t.accountNumber && t.accountNumber.toLowerCase().includes(s))
                          );
                        })
                        .map((tx) => (
                          <tr key={tx.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f8fafc' }}>
                              #{tx.id}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{tx.playerName}</div>
                              <div style={{ color: '#8995a7', fontSize: '10px' }}>{tx.username}</div>
                            </td>
                            <td style={{ color: '#a5b4fc', fontWeight: 600 }}>{tx.method}</td>
                            <td style={{ fontFamily: 'monospace', color: '#f8fafc' }}>
                              {tx.accountNumber || tx.phone}
                            </td>
                            <td style={{ color: '#f87171', fontWeight: 700, fontSize: '13px' }}>
                              -{tx.amount} ETB
                            </td>
                            <td style={{ color: '#8995a7' }}>{tx.time}</td>
                            <td>
                              <span className={`pill-badge ${tx.status}`}>{tx.status}</span>
                            </td>
                            <td>
                              <button className="sm-btn primary" onClick={() => setSelectedTx(tx)}>
                                {tx.status === 'pending' ? 'Review & Pay' : 'Details'}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =========================================
              VIEW 7: BROADCAST
             ========================================= */}
          {activeTab === 'broadcast' && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Broadcast Announcement</h1>
                  <p>Send real-time notifications to Telegram bot users and in-game feeds</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)', gap: '16px' }}>
                <div className="form-panel">
                  <h3 style={{ fontSize: '14px', marginBottom: '16px', fontWeight: 700 }}>New Message Broadcast</h3>
                  <form onSubmit={handleSendBroadcast}>
                    <div className="form-group">
                      <label className="form-label">Target Audience</label>
                      <select
                        className="select"
                        style={{ width: '100%', height: '40px', fontSize: '12px' }}
                        value={bcTarget}
                        onChange={(e) => setBcTarget(e.target.value)}
                      >
                        <option>All Players (1,284)</option>
                        <option>Active Today (450)</option>
                        <option>VIP High Rollers (Deposits &gt; 1,000 ETB)</option>
                        <option>New Players (Registered &lt; 7 Days)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Broadcast Title</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 🎁 Weekend Free Ticket Bonus!"
                        value={bcTitle}
                        onChange={(e) => setBcTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Message Content</label>
                      <textarea
                        placeholder="Write your announcement here. Supports Telegram markdown formatting and emojis..."
                        value={bcMessage}
                        onChange={(e) => setBcMessage(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className="action-btn" style={{ width: '100%', justifyContent: 'center', height: '42px' }}>
                      <svg viewBox="0 0 24 24">
                        <path d="m22 2-7 20-4-9-9-4Z" />
                        <path d="M22 2 11 13" />
                      </svg>
                      Send Broadcast Message Now
                    </button>
                  </form>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Sent History</div>
                      <div className="panel-sub">Recent announcements</div>
                    </div>
                  </div>

                  <div className="sidebar-scroll" style={{ maxHeight: '420px', padding: '10px' }}>
                    {broadcasts.map((bc) => (
                      <div
                        key={bc.id}
                        style={{
                          background: '#111827',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '12px',
                          marginBottom: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '12px', color: '#f8fafc' }}>{bc.title}</span>
                          <span className="pill-badge healthy">{bc.status}</span>
                        </div>
                        <p style={{ fontSize: '10px', color: '#8995a7', marginBottom: '8px', lineHeight: 1.4 }}>
                          {bc.message}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#566276' }}>
                          <span>Target: {bc.target}</span>
                          <span>{bc.sentAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =========================================
              VIEW 8: SETTINGS
             ========================================= */}
          {activeTab === 'settings' && (
            <>
              <div className="page-heading">
                <div>
                  <h1>System & Payment Settings</h1>
                  <p>Configure automated cashier bank accounts, limits, and system parameters</p>
                </div>
              </div>

              <div className="form-panel">
                <form onSubmit={handleSaveSettings}>
                  <h3 style={{ fontSize: '13px', color: '#a5b4fc', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Telebirr Configuration
                  </h3>

                  <div className="form-group">
                    <label className="form-label">Telebirr Merchant / Receiver Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={telebirrPhone}
                      onChange={(e) => setTelebirrPhone(e.target.value)}
                    />
                  </div>

                  <h3 style={{ fontSize: '13px', color: '#a5b4fc', margin: '24px 0 16px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Commercial Bank of Ethiopia (CBE) Configuration
                  </h3>

                  <div className="form-group">
                    <label className="form-label">CBE Account Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={cbeAccount}
                      onChange={(e) => setCbeAccount(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CBE Account Holder Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={cbeAccountName}
                      onChange={(e) => setCbeAccountName(e.target.value)}
                    />
                  </div>

                  <h3 style={{ fontSize: '13px', color: '#a5b4fc', margin: '24px 0 16px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Platform Limits & House Margin
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Min Deposit (ETB)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={minDeposit}
                        onChange={(e) => setMinDeposit(Number(e.target.value))}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Min Withdrawal (ETB)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={minWithdraw}
                        onChange={(e) => setMinWithdraw(Number(e.target.value))}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Bingo Commission (%)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={bingoHouseFee}
                        onChange={(e) => setBingoHouseFee(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <button type="submit" className="action-btn" style={{ marginTop: '16px' }}>
                    Save Platform Settings
                  </button>
                </form>
              </div>
            </>
          )}

          {/* =========================================
              VIEW 9: MAINTENANCE
             ========================================= */}
          {activeTab === 'maintenance' && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Maintenance & Server Controls</h1>
                  <p>Manage system state, engine restarts, and emergency maintenance mode</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(300px, 1fr)', gap: '16px' }}>
                <div className="form-panel">
                  <h3 style={{ fontSize: '14px', marginBottom: '16px', fontWeight: 700 }}>Maintenance Mode</h3>

                  <div
                    style={{
                      background: '#111827',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>System Maintenance Switch</div>
                      <div style={{ color: '#8995a7', fontSize: '10px', marginTop: '2px' }}>
                        When active, players see the maintenance banner and gameplay is paused.
                      </div>
                    </div>

                    <button
                      className={`sm-btn ${isMaintenanceMode ? 'danger' : 'success'}`}
                      style={{ padding: '8px 16px', fontSize: '11px' }}
                      onClick={() => {
                        setIsMaintenanceMode(!isMaintenanceMode);
                        showToast(
                          !isMaintenanceMode ? 'Maintenance mode ACTIVATED.' : 'Maintenance mode DEACTIVATED.'
                        );
                      }}
                    >
                      {isMaintenanceMode ? 'DISABLE MAINTENANCE' : 'ACTIVATE MAINTENANCE'}
                    </button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Player Notice Message</label>
                    <textarea
                      value={maintenanceBanner}
                      onChange={(e) => setMaintenanceBanner(e.target.value)}
                    />
                  </div>

                  <button
                    className="action-btn"
                    onClick={() => showToast('Maintenance message updated.')}
                  >
                    Update Banner Notice
                  </button>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Server Engine Actions</div>
                      <div className="panel-sub">Operational commands</div>
                    </div>
                  </div>

                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                      className="sm-btn outline"
                      style={{ padding: '12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => showToast('Bingo Multiplayer Engine restarted successfully.')}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '11px', color: '#f8fafc' }}>Restart Bingo Engine</div>
                        <div style={{ fontSize: '9px', color: '#8995a7' }}>Soft reload of active game room daubers</div>
                      </div>
                      <span className="pill-badge healthy">Ready</span>
                    </button>

                    <button
                      className="sm-btn outline"
                      style={{ padding: '12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => showToast('Telegram Webhook reconnect initiated.')}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '11px', color: '#f8fafc' }}>Reconnect Telegram Gateway</div>
                        <div style={{ fontSize: '9px', color: '#8995a7' }}>Refreshes bot webhook connection</div>
                      </div>
                      <span className="pill-badge healthy">Ready</span>
                    </button>

                    <button
                      className="sm-btn outline"
                      style={{ padding: '12px', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => showToast('Database snapshot created successfully.')}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '11px', color: '#f8fafc' }}>Create Database Backup</div>
                        <div style={{ fontSize: '9px', color: '#8995a7' }}>Exports encrypted ledger backup</div>
                      </div>
                      <span className="pill-badge healthy">Ready</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* =========================================
          MODAL: TRANSACTION REVIEW (DEPOSIT / WITHDRAWAL)
         ========================================= */}
      {selectedTx && (
        <div className="modal-backdrop" onClick={() => setSelectedTx(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                Review {selectedTx.category === 'deposit' ? 'Deposit' : 'Withdrawal'} #{selectedTx.id}
              </h3>
              <button className="modal-close" onClick={() => setSelectedTx(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="receipt-box">
                <div className="receipt-row">
                  <span className="label">Order ID</span>
                  <span className="val" style={{ fontFamily: 'monospace' }}>#{selectedTx.id}</span>
                </div>
                <div className="receipt-row">
                  <span className="label">Player Name</span>
                  <span className="val">{selectedTx.playerName} ({selectedTx.username})</span>
                </div>
                <div className="receipt-row">
                  <span className="label">Phone Number</span>
                  <span className="val">{selectedTx.phone}</span>
                </div>
                <div className="receipt-row">
                  <span className="label">Payment Method</span>
                  <span className="val" style={{ color: '#22d3ee' }}>{selectedTx.method}</span>
                </div>
                {selectedTx.smsRef && (
                  <div className="receipt-row">
                    <span className="label">SMS Reference Code</span>
                    <span className="val" style={{ color: '#ffd15c', fontFamily: 'monospace' }}>
                      {selectedTx.smsRef}
                    </span>
                  </div>
                )}
                {selectedTx.accountNumber && (
                  <div className="receipt-row">
                    <span className="label">Payout Account</span>
                    <span className="val" style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>
                      {selectedTx.accountNumber}
                    </span>
                  </div>
                )}
                <div className="receipt-row" style={{ marginTop: '8px', paddingTop: '8px' }}>
                  <span className="label" style={{ fontSize: '13px', fontWeight: 700 }}>Total Amount</span>
                  <span
                    className="val"
                    style={{
                      fontSize: '15px',
                      color: selectedTx.category === 'deposit' ? '#4ade80' : '#f87171',
                      fontWeight: 800,
                    }}
                  >
                    {selectedTx.category === 'deposit' ? `+${selectedTx.amount}` : `-${selectedTx.amount}`} ETB
                  </span>
                </div>
              </div>

              {selectedTx.status === 'pending' && (
                <div className="form-group">
                  <label className="form-label">Rejection Note (if rejecting)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Invalid SMS confirmation / amount mismatch"
                  />
                </div>
              )}
            </div>

            <div className="modal-foot">
              {selectedTx.status === 'pending' ? (
                <>
                  <button className="sm-btn danger" style={{ padding: '8px 14px' }} onClick={() => handleRejectTx(selectedTx)}>
                    Reject Request
                  </button>
                  <button className="sm-btn success" style={{ padding: '8px 16px' }} onClick={() => handleApproveTx(selectedTx)}>
                    {selectedTx.category === 'deposit' ? 'Approve & Credit Balance' : 'Approve & Mark Paid'}
                  </button>
                </>
              ) : (
                <button className="sm-btn outline" onClick={() => setSelectedTx(null)}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL: USER PROFILE INSPECT
         ========================================= */}
      {selectedUser && (
        <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Player Profile: {selectedUser.username}</h3>
              <button className="modal-close" onClick={() => setSelectedUser(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="receipt-box">
                <div className="receipt-row">
                  <span className="label">Full Name</span>
                  <span className="val">{selectedUser.name}</span>
                </div>
                <div className="receipt-row">
                  <span className="label">User ID</span>
                  <span className="val">#{selectedUser.id}</span>
                </div>
                <div className="receipt-row">
                  <span className="label">Phone</span>
                  <span className="val">{selectedUser.phone}</span>
                </div>
                <div className="receipt-row">
                  <span className="label">Playable Balance</span>
                  <span className="val" style={{ color: '#22d3ee' }}>{selectedUser.playableBalance.toLocaleString()} ETB</span>
                </div>
                <div className="receipt-row">
                  <span className="label">Withdrawable Balance</span>
                  <span className="val" style={{ color: '#4ade80' }}>{selectedUser.withdrawableBalance.toLocaleString()} ETB</span>
                </div>
                <div className="receipt-row">
                  <span className="label">Total Deposited</span>
                  <span className="val">{selectedUser.totalDeposited.toLocaleString()} ETB</span>
                </div>
                <div className="receipt-row">
                  <span className="label">Total Withdrawn</span>
                  <span className="val">{selectedUser.totalWithdrawn.toLocaleString()} ETB</span>
                </div>
                <div className="receipt-row">
                  <span className="label">Game Record</span>
                  <span className="val">{selectedUser.winCount} Wins / {selectedUser.lossCount} Losses</span>
                </div>
                <div className="receipt-row">
                  <span className="label">Account Status</span>
                  <span className={`pill-badge ${selectedUser.status}`}>{selectedUser.status}</span>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button
                className={`sm-btn ${selectedUser.status === 'active' ? 'danger' : 'success'}`}
                onClick={() => handleToggleUserStatus(selectedUser.id)}
              >
                {selectedUser.status === 'active' ? 'Block Account' : 'Unblock Account'}
              </button>
              <button className="sm-btn outline" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL: CREATE TASK
         ========================================= */}
      {showNewTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowNewTaskModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Create New Player Task</h3>
              <button className="modal-close" onClick={() => setShowNewTaskModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Task Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Play 10 Bingo Games"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reward Amount / Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +25 ETB Playable"
                    value={newTaskReward}
                    onChange={(e) => setNewTaskReward(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Task details and instructions for the player..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Group</label>
                  <select
                    className="select"
                    style={{ width: '100%', height: '40px' }}
                    value={newTaskTarget}
                    onChange={(e) => setNewTaskTarget(e.target.value)}
                  >
                    <option>All Players</option>
                    <option>New Players</option>
                    <option>Active Players</option>
                    <option>VIP Depositors</option>
                  </select>
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" className="sm-btn outline" onClick={() => setShowNewTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sm-btn primary">
                  Save & Launch Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL: CREATE PROMO CODE
         ========================================= */}
      {showNewPromoModal && (
        <div className="modal-backdrop" onClick={() => setShowNewPromoModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Generate Promo Code</h3>
              <button className="modal-close" onClick={() => setShowNewPromoModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromo}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Promo Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. BINGO50"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reward / Bonus Value</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +50 ETB Bonus"
                    value={newPromoReward}
                    onChange={(e) => setNewPromoReward(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Max Claims</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newPromoUses}
                      onChange={(e) => setNewPromoUses(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPromoExpiry}
                      onChange={(e) => setNewPromoExpiry(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" className="sm-btn outline" onClick={() => setShowNewPromoModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="sm-btn primary">
                  Generate Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST FEEDBACK NOTIFICATION */}
      {toastMessage && <div className="toast">{toastMessage}</div>}
    </>
  );
};

export default App;
