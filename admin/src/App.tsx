import React, { useState, useEffect } from 'react';
import { adminApi } from './services/api';

interface TransactionItem {
  id: string;
  userId: string;
  playerName: string;
  username: string;
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
  status: 'active' | 'restricted' | 'blocked';
  joinedDate: string;
  lastActive: string;
}

export const App: React.FC = () => {
  // ── Hardcoded Authentication State ──
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('gamezone_admin_auth') === 'true';
  });
  const [loginUser, setLoginUser] = useState<string>('admin');
  const [loginPass, setLoginPass] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Active Navigation Section ──
  const [activeSection, setActiveSection] = useState<
    'overview' | 'payments' | 'users' | 'reports' | 'admins' | 'settings'
  >('overview');

  // ── Payments State ──
  const [paymentTab, setPaymentTab] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [showNewPaymentModal, setShowNewPaymentModal] = useState<boolean>(false);

  // ── Data State ──
  const [transactions, setTransactions] = useState<TransactionItem[]>([
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
    {
      id: 'WD-10918',
      userId: '10284',
      playerName: 'Abebe T.',
      username: '@abebe_21',
      title: 'Withdrawal via Telebirr',
      meta: 'Phone: 0911002233',
      amount: -450,
      currency: 'ETB',
      type: 'negative',
      method: 'Telebirr',
      status: 'approved',
      timestamp: '08:30',
    },
  ]);

  // ── Users State ──
  const [usersSearch, setUsersSearch] = useState<string>('');
  const [usersStatusFilter, setUsersStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState<string>('');

  const [usersList, setUsersList] = useState<UserItem[]>([
    {
      id: '102938',
      name: 'Bini Eyoel',
      username: '@bini',
      phone: '+251911223344',
      totalBalance: 2450,
      playableBalance: 1800,
      withdrawableBalance: 650,
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
  ]);

  // ── Permissions State ──
  const [permissions, setPermissions] = useState({
    superViewUsers: true,
    superManagePayments: true,
    superManageAdmins: true,
    superSystemSettings: true,

    financeViewUsers: true,
    financeManagePayments: true,
    financeManageAdmins: false,
    financeSystemSettings: false,

    supportViewUsers: true,
    supportManagePayments: false,
    supportManageAdmins: false,
    supportSystemSettings: false,
  });

  // ── Settings State ──
  const [minDeposit, setMinDeposit] = useState<number>(10);
  const [minWithdraw, setMinWithdraw] = useState<number>(50);
  const [telebirrPhone, setTelebirrPhone] = useState<string>('0911002233');
  const [cbeAccount, setCbeAccount] = useState<string>('1000123456789');
  const [paymentReviewReq, setPaymentReviewReq] = useState<boolean>(true);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Fetch live backend data if available
  useEffect(() => {
    if (!isAuthenticated) return;

    adminApi.getTransactions().then((res) => {
      if (res?.success && Array.isArray(res.data)) {
        setTransactions(res.data);
      }
    });

    adminApi.getUsers().then((res) => {
      if (res?.success && Array.isArray(res.data)) {
        setUsersList(res.data);
      }
    });
  }, [isAuthenticated]);

  // ── Login Handler ──
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      loginUser === 'admin' &&
      (loginPass === 'password123' || loginPass === 'admin123' || loginPass === 'gamezone2026')
    ) {
      setIsAuthenticated(true);
      localStorage.setItem('gamezone_admin_auth', 'true');
      setLoginError(null);
      showToast('Welcome to GameZone Admin Console');
    } else {
      setLoginError('Invalid administrative username or password.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('gamezone_admin_auth');
    setLoginPass('');
  };

  // ── Payment Actions (Approve / Reject) ──
  const handleApproveTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'approved' as const } : t))
    );
    adminApi.approveTransaction(id, tx ? tx.amount : 0);
    showToast(`Transaction #${id} approved successfully`);
    if (selectedTx?.id === id) {
      setSelectedTx(null);
    }
  };

  const handleRejectTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'rejected' as const } : t))
    );
    adminApi.rejectTransaction(id, 'Unverified SMS / receipt');
    showToast(`Transaction #${id} rejected`);
    if (selectedTx?.id === id) {
      setSelectedTx(null);
    }
  };

  // ── User Actions ──
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

    adminApi.updateUser(selectedUser.id, { balanceAdjustment: adjust });
    showToast(`Player #${selectedUser.id} balance adjusted by ${adjust > 0 ? '+' : ''}${adjust} ETB`);
    setSelectedUser(null);
    setBalanceAdjustAmount('');
  };

  // ── CSV Export ──
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

  // Filtered Payments
  const filteredTransactions = transactions.filter((t) => {
    if (paymentTab === 'deposit' && t.type !== 'positive') return false;
    if (paymentTab === 'withdrawal' && t.type !== 'negative') return false;
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

  // Filtered Users
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
          <div className="admin-login-badge">Administrative Portal</div>

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
          className={`admin-nav-btn ${activeSection === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveSection('payments')}
        >
          <span>▣</span> Payments
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
          <span>♙</span> Users
        </button>
        <button
          className={`admin-nav-btn ${activeSection === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveSection('reports')}
        >
          <span>▤</span> Reports
        </button>

        <div className="admin-nav-label">Administration</div>
        <button
          className={`admin-nav-btn ${activeSection === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveSection('admins')}
        >
          <span>◆</span> Admin Control
        </button>
        <button
          className={`admin-nav-btn ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          <span>⚙</span> Settings
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
            <div className="admin-crumb">GameZone / {activeSection}</div>
          </div>

          <div className="admin-top-right">
            <span className="admin-status active">● Live</span>
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
                  <h1>Good morning, Admin</h1>
                  <p>Here’s real-time operational activity across GameZone today.</p>
                </div>
                <button
                  className="admin-btn"
                  onClick={() => showToast('Live operational data refreshed')}
                >
                  ↻ Refresh Data
                </button>
              </div>

              {/* Stat Grid */}
              <div className="admin-grid-4">
                <div className="admin-card">
                  <div className="admin-stat-top">
                    Total Users <span className="admin-stat-icon">♙</span>
                  </div>
                  <div className="admin-stat-value">18,492</div>
                  <div className="admin-stat-delta up">+4.8% this month</div>
                </div>

                <div className="admin-card">
                  <div className="admin-stat-top">
                    Online Now <span className="admin-stat-icon">●</span>
                  </div>
                  <div className="admin-stat-value">247</div>
                  <div className="admin-stat-delta up">+18 in last hour</div>
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

              {/* Chart & Live Activity */}
              <div className="admin-grid-2">
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Payment Activity (ETB Volume)</span>
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
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Live Feed</span>
                    <span className="admin-status active">LIVE</span>
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
                      <strong style={{ fontSize: '12px' }}>New player joined via Telegram</strong>
                      <small style={{ display: 'block', color: '#8490a5', fontSize: '10.5px' }}>
                        @abebe_21 · Invited by #102938
                      </small>
                    </div>
                  </div>

                  <div className="admin-activity-item">
                    <i className="admin-dot"></i>
                    <div>
                      <strong style={{ fontSize: '12px' }}>Bingo Live Room #04 Jackpot Won</strong>
                      <small style={{ display: 'block', color: '#8490a5', fontSize: '10.5px' }}>
                        Winner: @mekdes7 · Pot: 3,450 ETB
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ═════════ 2. PAYMENTS SECTION ═════════ */}
          {activeSection === 'payments' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Payments & Treasury</h1>
                  <p>Review, verify, and approve incoming deposits and pending withdrawals.</p>
                </div>
                <button
                  className="admin-btn primary"
                  onClick={() => setShowNewPaymentModal(true)}
                >
                  + Payment Action
                </button>
              </div>

              {/* Payment Metric Cards */}
              <div className="admin-grid-3">
                <div className="admin-card" style={{ borderColor: 'rgba(251, 191, 36, 0.2)' }}>
                  <div style={{ color: '#8490a5', fontSize: '11px' }}>Pending Deposits</div>
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
                  <div style={{ color: '#8490a5', fontSize: '11px' }}>Pending Withdrawals</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
                    {Math.abs(
                      transactions
                        .filter((t) => t.type === 'negative' && t.status === 'pending')
                        .reduce((sum, t) => sum + t.amount, 0)
                    )}{' '}
                    ETB
                  </div>
                  <div style={{ color: '#8490a5', fontSize: '10.5px', marginTop: '4px' }}>
                    {pendingWithdrawalsCount} payout requests
                  </div>
                </div>

                <div className="admin-card" style={{ borderColor: 'rgba(34, 211, 238, 0.2)' }}>
                  <div style={{ color: '#8490a5', fontSize: '11px' }}>Today's Processed Volume</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
                    128,270 ETB
                  </div>
                  <div style={{ color: '#8490a5', fontSize: '10.5px', marginTop: '4px' }}>
                    119 transactions completed
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="admin-tabs">
                <button
                  className={paymentTab === 'all' ? 'active' : ''}
                  onClick={() => setPaymentTab('all')}
                >
                  All Transactions ({transactions.length})
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
                  placeholder="Search player, transaction ID, phone..."
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
                      <th>Transaction</th>
                      <th>Player</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Time</th>
                      <th>Actions</th>
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

          {/* ═════════ 3. USERS SECTION ═════════ */}
          {activeSection === 'users' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Player Directory</h1>
                  <p>View registered Telegram accounts, check wallet balances, and manage risk.</p>
                </div>
                <button
                  className="admin-btn"
                  onClick={() =>
                    exportCSV(
                      'gamezone-players',
                      ['ID', 'Name', 'Username', 'Phone', 'TotalBalance', 'Status', 'JoinedDate'],
                      usersList.map((u) => [
                        u.id,
                        u.name,
                        u.username,
                        u.phone,
                        u.totalBalance,
                        u.status,
                        u.joinedDate,
                      ])
                    )
                  }
                >
                  📥 Export CSV
                </button>
              </div>

              {/* User Filters */}
              <div className="admin-toolbar">
                <input
                  type="text"
                  className="admin-search"
                  placeholder="Search name, @username, Player ID, phone..."
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
                  <option value="restricted">Restricted</option>
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
                      <th>Playable</th>
                      <th>Withdrawable</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Last Active</th>
                      <th>Actions</th>
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
                        <td>{user.playableBalance} ETB</td>
                        <td>{user.withdrawableBalance} ETB</td>
                        <td>
                          <span className={`admin-status ${user.status}`}>{user.status}</span>
                        </td>
                        <td style={{ color: '#8490a5' }}>{user.joinedDate}</td>
                        <td style={{ color: '#8490a5' }}>{user.lastActive}</td>
                        <td>
                          <button
                            className="admin-btn primary"
                            onClick={() => setSelectedUser(user)}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ═════════ 4. REPORTS SECTION ═════════ */}
          {activeSection === 'reports' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Financial Reports & Ledgers</h1>
                  <p>Comprehensive 30-day accounting metrics and audit downloads.</p>
                </div>
                <button
                  className="admin-btn primary"
                  onClick={() =>
                    exportCSV(
                      'gamezone-financial-summary',
                      ['Metric', 'Value', 'Currency', 'Period'],
                      [
                        ['Deposit Volume', '1840000', 'ETB', '30 Days'],
                        ['Withdrawal Volume', '926000', 'ETB', '30 Days'],
                        ['Net Margin', '914000', 'ETB', '30 Days'],
                        ['Total Completed Transactions', '8421', 'Count', '30 Days'],
                        ['Active Gaming Players', '6820', 'Users', '30 Days'],
                      ]
                    )
                  }
                >
                  📥 Export Complete Report
                </button>
              </div>

              {/* 30-Day Metrics Grid */}
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
                  <div className="admin-stat-top">Active Players</div>
                  <div className="admin-stat-value">6,820</div>
                  <div className="admin-stat-delta up">Last 30 days</div>
                </div>
              </div>

              {/* Available Reports */}
              <div className="admin-card" style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>
                  Available Exportable Ledgers
                </div>

                <div className="admin-activity-item" style={{ alignItems: 'center' }}>
                  <i className="admin-dot"></i>
                  <div>
                    <strong>Deposit Ledger</strong>
                    <small style={{ display: 'block', color: '#8490a5' }}>
                      Complete deposit transactions, bank references, and approval history
                    </small>
                  </div>
                  <button
                    className="admin-btn"
                    style={{ marginLeft: 'auto' }}
                    onClick={() =>
                      exportCSV(
                        'deposit-ledger',
                        ['TxID', 'Player', 'Amount', 'Method', 'Status', 'Time'],
                        transactions
                          .filter((t) => t.type === 'positive')
                          .map((t) => [t.id, t.playerName, t.amount, t.method, t.status, t.timestamp])
                      )
                    }
                  >
                    Export CSV
                  </button>
                </div>

                <div className="admin-activity-item" style={{ alignItems: 'center' }}>
                  <i className="admin-dot"></i>
                  <div>
                    <strong>Withdrawal Ledger</strong>
                    <small style={{ display: 'block', color: '#8490a5' }}>
                      Withdrawal payout requests, destination phone/bank accounts, and admin approvals
                    </small>
                  </div>
                  <button
                    className="admin-btn"
                    style={{ marginLeft: 'auto' }}
                    onClick={() =>
                      exportCSV(
                        'withdrawal-ledger',
                        ['TxID', 'Player', 'Amount', 'Method', 'Status', 'Time'],
                        transactions
                          .filter((t) => t.type === 'negative')
                          .map((t) => [t.id, t.playerName, t.amount, t.method, t.status, t.timestamp])
                      )
                    }
                  >
                    Export CSV
                  </button>
                </div>

                <div className="admin-activity-item" style={{ alignItems: 'center' }}>
                  <i className="admin-dot"></i>
                  <div>
                    <strong>Wallet Balance Movement</strong>
                    <small style={{ display: 'block', color: '#8490a5' }}>
                      Account balance changes with game stakes, game wins, and referral earnings
                    </small>
                  </div>
                  <button
                    className="admin-btn"
                    style={{ marginLeft: 'auto' }}
                    onClick={() =>
                      exportCSV(
                        'wallet-movements',
                        ['PlayerID', 'PlayerName', 'TotalBalance', 'Playable', 'Withdrawable'],
                        usersList.map((u) => [u.id, u.name, u.totalBalance, u.playableBalance, u.withdrawableBalance])
                      )
                    }
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ═════════ 5. ADMIN CONTROL SECTION ═════════ */}
          {activeSection === 'admins' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Admin Role Control</h1>
                  <p>Manage administrative roles, access controls, and view the immutable audit trail.</p>
                </div>
                <button
                  className="admin-btn primary"
                  onClick={() => showToast('Invite link generated for new admin')}
                >
                  + Add Admin
                </button>
              </div>

              {/* Roles Cards */}
              <div className="admin-grid-3">
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontWeight: 700 }}>Super Admin</span>
                    <span className="admin-status approved">1 User</span>
                  </div>
                  <div className="admin-perm-row">
                    <span>View Players</span>
                    <div
                      className={`admin-switch ${permissions.superViewUsers ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, superViewUsers: !p.superViewUsers }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>Manage Payments</span>
                    <div
                      className={`admin-switch ${permissions.superManagePayments ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, superManagePayments: !p.superManagePayments }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>Manage Team</span>
                    <div
                      className={`admin-switch ${permissions.superManageAdmins ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, superManageAdmins: !p.superManageAdmins }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>System Settings</span>
                    <div
                      className={`admin-switch ${permissions.superSystemSettings ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, superSystemSettings: !p.superSystemSettings }))}
                    ></div>
                  </div>
                </div>

                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontWeight: 700 }}>Finance Admin</span>
                    <span className="admin-status approved">2 Users</span>
                  </div>
                  <div className="admin-perm-row">
                    <span>View Players</span>
                    <div
                      className={`admin-switch ${permissions.financeViewUsers ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, financeViewUsers: !p.financeViewUsers }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>Manage Payments</span>
                    <div
                      className={`admin-switch ${permissions.financeManagePayments ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, financeManagePayments: !p.financeManagePayments }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>Manage Team</span>
                    <div
                      className={`admin-switch ${permissions.financeManageAdmins ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, financeManageAdmins: !p.financeManageAdmins }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>System Settings</span>
                    <div
                      className={`admin-switch ${permissions.financeSystemSettings ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, financeSystemSettings: !p.financeSystemSettings }))}
                    ></div>
                  </div>
                </div>

                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span style={{ fontWeight: 700 }}>Support Admin</span>
                    <span className="admin-status approved">3 Users</span>
                  </div>
                  <div className="admin-perm-row">
                    <span>View Players</span>
                    <div
                      className={`admin-switch ${permissions.supportViewUsers ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, supportViewUsers: !p.supportViewUsers }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>Manage Payments</span>
                    <div
                      className={`admin-switch ${permissions.supportManagePayments ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, supportManagePayments: !p.supportManagePayments }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>Manage Team</span>
                    <div
                      className={`admin-switch ${permissions.supportManageAdmins ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, supportManageAdmins: !p.supportManageAdmins }))}
                    ></div>
                  </div>
                  <div className="admin-perm-row">
                    <span>System Settings</span>
                    <div
                      className={`admin-switch ${permissions.supportSystemSettings ? 'on' : ''}`}
                      onClick={() => setPermissions((p) => ({ ...p, supportSystemSettings: !p.supportSystemSettings }))}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Audit Log */}
              <div className="admin-card" style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>
                  Live Administrative Audit Trail
                </div>

                <div className="admin-activity-item">
                  <i className="admin-dot"></i>
                  <div>
                    <strong>Super Admin approved withdrawal #WD-10918</strong>
                    <small style={{ display: 'block', color: '#8490a5', fontSize: '10.5px' }}>
                      09:01 · Admin ID #A001 · Amount: 450 ETB
                    </small>
                  </div>
                </div>

                <div className="admin-activity-item">
                  <i className="admin-dot yellow"></i>
                  <div>
                    <strong>Support Admin restricted player #102955</strong>
                    <small style={{ display: 'block', color: '#8490a5', fontSize: '10.5px' }}>
                      08:43 · Admin ID #A003 · Reason: Duplicate account verification
                    </small>
                  </div>
                </div>

                <div className="admin-activity-item">
                  <i className="admin-dot"></i>
                  <div>
                    <strong>Finance Admin approved Telebirr deposit #DP-20840</strong>
                    <small style={{ display: 'block', color: '#8490a5', fontSize: '10.5px' }}>
                      08:15 · Admin ID #A002 · Amount: 1,000 ETB
                    </small>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ═════════ 6. SETTINGS SECTION ═════════ */}
          {activeSection === 'settings' && (
            <section>
              <div className="admin-head">
                <div>
                  <h1>Platform Settings</h1>
                  <p>Financial parameters, official payment gateway numbers, and security options.</p>
                </div>
                <button
                  className="admin-btn primary"
                  onClick={() => showToast('Platform configuration saved')}
                >
                  💾 Save Configuration
                </button>
              </div>

              <div className="admin-card" style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>
                  Financial Limits & Thresholds
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="admin-input-group">
                    <label>Minimum Deposit Amount (ETB)</label>
                    <input
                      type="number"
                      value={minDeposit}
                      onChange={(e) => setMinDeposit(Number(e.target.value))}
                    />
                  </div>

                  <div className="admin-input-group">
                    <label>Minimum Withdrawal Amount (ETB)</label>
                    <input
                      type="number"
                      value={minWithdraw}
                      onChange={(e) => setMinWithdraw(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-input-group">
                    <label>Official Telebirr Merchant Phone</label>
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
              </div>

              <div className="admin-card">
                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>
                  Security & Workflow Flags
                </div>

                <div className="admin-perm-row">
                  <div>
                    <strong style={{ fontSize: '13px' }}>Manual Deposit Review Mode</strong>
                    <div style={{ color: '#8490a5', fontSize: '11px' }}>
                      Require admin confirmation before crediting Telebirr/CBE SMS receipts
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
                      Temporarily pause game lobbies for scheduled server maintenance
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

      {/* ── User Manage Modal ── */}
      {selectedUser && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">Manage Player: {selectedUser.name}</div>
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
                <span style={{ fontWeight: 600 }}>#{selectedUser.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Total Balance:</span>
                <span style={{ fontWeight: 800, color: '#22d3ee' }}>{selectedUser.totalBalance} ETB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8490a5', fontSize: '12px' }}>Account Status:</span>
                <span className={`admin-status ${selectedUser.status}`}>{selectedUser.status}</span>
              </div>
            </div>

            {/* Adjust Balance */}
            <div className="admin-input-group">
              <label>Adjust Balance (e.g. +500 or -200 ETB)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Enter amount..."
                  value={balanceAdjustAmount}
                  onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                />
                <button className="admin-btn primary" onClick={handleAdjustBalance}>
                  Apply
                </button>
              </div>
            </div>

            {/* Status Switcher */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '11px', color: '#8490a5', display: 'block', marginBottom: '6px' }}>
                ACCOUNT STATUS CONTROL
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

      {/* ── New Payment Action Modal ── */}
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
                  meta: `Manual Admin Action: ${form.note.value || 'None'}`,
                  amount: form.type.value === 'Deposit' ? Number(form.amount.value) : -Number(form.amount.value),
                  currency: 'ETB',
                  type: form.type.value === 'Deposit' ? 'positive' : 'negative',
                  method: form.method.value,
                  status: 'approved',
                  timestamp: 'Just now',
                };
                setTransactions((prev) => [newTx, ...prev]);
                setShowNewPaymentModal(false);
                showToast(`Manual ${form.type.value} of ${form.amount.value} ETB created`);
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
                <label>Admin Note / Reference</label>
                <input name="note" placeholder="e.g. Promotional bonus credit" />
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

      {/* ── Toast Message ── */}
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
