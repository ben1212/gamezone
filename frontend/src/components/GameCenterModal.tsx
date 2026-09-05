import React, { useEffect } from 'react';
import '../styles/GameCenter.css';
import { UserProfile, WalletBalances, Transaction } from '../types';
import { BingoGame } from '../games/bingo/BingoGame';

interface GameCenterModalProps {
  gameId: string;
  gameTitle: string;
  gameIcon: string;
  balances: WalletBalances;
  user: UserProfile;
  onUpdateBalances: (newBalances: WalletBalances, newTx?: Transaction) => void;
  onOpenWallet: () => void;
  onClose: () => void;
}

export const GameCenterModal: React.FC<GameCenterModalProps> = ({
  gameId,
  gameTitle,
  gameIcon,
  balances,
  user,
  onUpdateBalances,
  onOpenWallet,
  onClose,
}) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const isBingo = gameId.toLowerCase() === 'bingo';

  return (
    <div className="gc-overlay" role="dialog" aria-modal="true">
      {/* Top Bar */}
      <header className="gc-topbar">
        <div className="gc-game-info">
          <div className="gc-game-icon">{gameIcon}</div>
          <div>
            <div className="gc-game-name">{gameTitle}</div>
            <div className="gc-game-sub">{isBingo ? 'Cartela Selection' : 'Game Center'}</div>
          </div>
        </div>

        <div className="gc-topbar-actions">
          <div className="gc-topbar-balance">
            <span className="gc-topbar-balance-dot" />
            <span className="gc-topbar-balance-label">Balance:</span>
            <span className="gc-topbar-balance-val">
              {balances.playable.toLocaleString()} <span className="gc-topbar-balance-currency">{balances.currency}</span>
            </span>
          </div>

          <button className="gc-exit-btn" onClick={onClose} type="button" aria-label="Exit Game">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Game Stage Canvas */}
      <div className="gc-canvas">
        {/* Mount point for user's game */}
        <div id="game-mount-point" data-game-id={gameId} style={{ width: '100%', height: '100%' }}>
          {isBingo ? (
            <BingoGame
              user={user}
              balances={balances}
              onUpdateBalances={onUpdateBalances}
              onOpenWallet={onOpenWallet}
            />
          ) : (
            <div className="gc-waiting">
              <div className="gc-waiting-label">Waiting for Game Engine</div>
              <p className="gc-waiting-desc">
                Mount your game canvas, iframe or component into <code>#game-mount-point</code>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Balance Strip - only shown for non-Bingo games where balance is not in topbar */}
      {!isBingo && (
        <footer className="gc-bottombar">
          <div className="gc-balance-item">
            <span className="gc-balance-label">Playable:</span>
            <span className="gc-balance-val">
              {balances.playable > 0 ? `${balances.playable.toLocaleString()} ${balances.currency}` : `0 ${balances.currency}`}
            </span>
          </div>

          <div className="gc-balance-item">
            <span className="gc-balance-label">Total:</span>
            <span className="gc-balance-val">
              {balances.total > 0 ? `${balances.total.toLocaleString()} ${balances.currency}` : `0 ${balances.currency}`}
            </span>
          </div>
        </footer>
      )}
    </div>
  );
};

