import React, { useState, useEffect } from 'react';
import { PageType, ActiveModal, WalletBalances, Transaction, UserProfile } from './types';
import { TopBanner } from './components/TopBanner';
import { DashboardPage } from './pages/DashboardPage';
import { WalletPage } from './pages/WalletPage';
import { ProfilePage } from './pages/ProfilePage';
import { TaskPage } from './pages/TaskPage';
import { GameCenterModal } from './components/GameCenterModal';
import { QuickActionModal } from './components/QuickActionModal';
import { BottomNav } from './components/BottomNav';
import { api } from './services/api';
import { tg } from './services/telegram';
import './styles/global.css';

const emptyBalances: WalletBalances = {
  total: 0,
  withdrawable: 0,
  playable: 0,
  currency: 'ETB',
};

const emptyUserProfile: UserProfile = {
  name: 'Player',
  username: '@player',
  telegramId: '',
  avatarIcon: '🎮',
  phone: '',
  email: '',
  country: '',
  joinedDate: '',
  referralCode: 'GAMEZONE',
  totalReferrals: 0,
  referralBonusETB: 0,
};

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageType>('gamezone');
  const [balances, setBalances] = useState<WalletBalances>(emptyBalances);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<UserProfile>(emptyUserProfile);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize Telegram WebApp & URL query params
  useEffect(() => {
    tg.init();

    // Check if running inside Telegram with user info
    const tgUser = tg.getUser();
    if (tgUser) {
      const tgDisplayName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Player';
      const tgUsername = tgUser.username ? `@${tgUser.username}` : '@player';
      const tgId = String(tgUser.id);

      setUser((prev) => ({
        ...prev,
        name: tgDisplayName,
        username: tgUsername,
        telegramId: tgId,
      }));
    }

    // Handle initial deep-links / URL parameters from bot
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const page = urlParams.get('page');
      const game = urlParams.get('game');

      if (action === 'deposit') {
        setActiveModal({ type: 'deposit' });
      } else if (action === 'withdraw') {
        setActiveModal({ type: 'withdraw' });
      } else if (game === 'bingo') {
        setActiveModal({ type: 'game', gameId: 'bingo', title: 'Bingo Live', icon: '🎱' });
      } else if (game === 'keno') {
        setActiveModal({ type: 'game', gameId: 'keno', title: 'Keno Turbo', icon: '🎯' });
      } else if (game === 'ludo') {
        setActiveModal({ type: 'game', gameId: 'ludo', title: 'Ludo Arena', icon: '🎲' });
      } else if (page === 'wallet' || page === 'profile' || page === 'task') {
        setActivePage(page);
      }
    } catch (e) {
      console.warn('Could not parse URL query parameters:', e);
    }
  }, []);

  // Telegram BackButton integration
  useEffect(() => {
    const backBtn = tg.webApp?.BackButton;
    if (!backBtn) return;

    if (activeModal || activePage !== 'gamezone') {
      backBtn.show();
      const handleBack = () => {
        tg.hapticImpact('light');
        if (activeModal) {
          setActiveModal(null);
        } else if (activePage !== 'gamezone') {
          setActivePage('gamezone');
        }
      };
      backBtn.onClick(handleBack);
      return () => {
        backBtn.offClick(handleBack);
      };
    } else {
      backBtn.hide();
    }
  }, [activeModal, activePage]);

  // Sync with backend API if available
  useEffect(() => {
    let mounted = true;
    const syncBackend = async () => {
      try {
        const [fetchedBalances, fetchedTxs, fetchedProfile] = await Promise.all([
          api.getBalances(),
          api.getTransactions(),
          api.getProfile(),
        ]);

        if (!mounted) return;
        if (fetchedBalances) setBalances(fetchedBalances);
        if (fetchedTxs && fetchedTxs.length > 0) setTransactions(fetchedTxs);
        if (fetchedProfile) {
          setUser((prev) => {
            const tgUser = tg.getUser();
            return {
              ...fetchedProfile,
              name: tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : fetchedProfile.name || prev.name,
              username: tgUser?.username ? `@${tgUser.username}` : fetchedProfile.username || prev.username,
              telegramId: tgUser ? String(tgUser.id) : fetchedProfile.telegramId || prev.telegramId,
            };
          });
        }
      } catch (err) {
        // Backend offline — running in clean local mode
      }
    };

    syncBackend();
    return () => {
      mounted = false;
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const navigateTo = (page: PageType) => {
    tg.hapticImpact('light');
    setActivePage(page);
    scrollToTop();
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 2800);
  };

  const handleUpdateBalances = (newBalances: WalletBalances, newTx?: Transaction) => {
    setBalances(newBalances);
    if (newTx) {
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  return (
    <div className="app-shell">
      {/* Floating Modern Header */}
      <TopBanner
        balance={balances.total}
        currency={balances.currency}
        onHomeClick={() => navigateTo('gamezone')}
      />

      {/* Main Content Area */}
      <main className="main-scroll">
        <div className="page-container">
          {activePage === 'gamezone' && (
            <DashboardPage
              onOpenBingo={() =>
                setActiveModal({ type: 'game', gameId: 'bingo', title: 'Bingo Live', icon: '🎱' })
              }
              onOpenKeno={() =>
                setActiveModal({ type: 'game', gameId: 'keno', title: 'Keno Turbo', icon: '🎯' })
              }
              onOpenLudo={() =>
                setActiveModal({ type: 'game', gameId: 'ludo', title: 'Ludo Arena', icon: '🎲' })
              }
            />
          )}

          {activePage === 'wallet' && (
            <WalletPage
              balances={balances}
              transactions={transactions}
              onDeposit={() => setActiveModal({ type: 'deposit' })}
              onWithdraw={() => setActiveModal({ type: 'withdraw' })}
              onSeeAll={() => setActiveModal({ type: 'allTransactions' })}
            />
          )}

          {activePage === 'task' && (
            <TaskPage
              balances={balances}
              onUpdateBalances={handleUpdateBalances}
              onShowToast={showToast}
              onOpenDeposit={() => setActiveModal({ type: 'deposit' })}
            />
          )}

          {activePage === 'profile' && (
            <ProfilePage
              user={user}
              onShowToast={showToast}
            />
          )}
        </div>
      </main>

      {/* Clean Game Center Modal (Mount Point for user's game) */}
      {activeModal && activeModal.type === 'game' && (
        <GameCenterModal
          gameId={activeModal.gameId}
          gameTitle={activeModal.title}
          gameIcon={activeModal.icon}
          balances={balances}
          user={user}
          onUpdateBalances={handleUpdateBalances}
          onOpenWallet={() => {
            setActiveModal(null);
            navigateTo('wallet');
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Action Modals */}
      <QuickActionModal
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        balances={balances}
        onUpdateBalances={handleUpdateBalances}
        user={user}
        transactions={transactions}
        onShowToast={showToast}
      />

      {/* Fixed Bottom Navigation */}
      {(!activeModal || activeModal.type !== 'game') && (
        <BottomNav
          activePage={activePage}
          onNavigate={navigateTo}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast" role="alert">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;
