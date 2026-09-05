import React from 'react';
import { Transaction, WalletBalances } from '../types';
import { TransactionItem } from '../components/TransactionItem';
import '../styles/Wallet.css';

interface WalletPageProps {
  balances: WalletBalances;
  transactions: Transaction[];
  onBack?: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onSeeAll: () => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({
  balances,
  transactions,
  onDeposit,
  onWithdraw,
  onSeeAll,
}) => {
  const recentTransactions = transactions.slice(0, 5);
  const hasTotal = balances.total > 0;

  return (
    <div className="wallet-page">

      {/* Balance Hero Card */}
      <div className="balance-hero">
        <span className="balance-hero-label">Total Balance</span>
        <div className={`balance-hero-amount ${hasTotal ? 'has-value' : 'empty-value'}`}>
          {hasTotal ? balances.total.toLocaleString() : '--'}
        </div>
        <span className="balance-hero-currency">{balances.currency}</span>

        {/* Sub-balances breakdown */}
        <div className="balance-sub-grid">
          <div className="balance-sub-card playable-card">
            <span className="balance-sub-tag">
              <span className="dot" />
              Playable
            </span>
            <span className={`balance-sub-val ${balances.playable === 0 ? 'empty' : ''}`}>
              {balances.playable > 0 ? `${balances.playable.toLocaleString()} ${balances.currency}` : `--`}
            </span>
          </div>

          <div className="balance-sub-card withdrawable-card">
            <span className="balance-sub-tag">
              <span className="dot" />
              Withdrawable
            </span>
            <span className={`balance-sub-val ${balances.withdrawable === 0 ? 'empty' : ''}`}>
              {balances.withdrawable > 0 ? `${balances.withdrawable.toLocaleString()} ${balances.currency}` : `--`}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="wallet-actions">
        <button className="wallet-action-btn deposit" onClick={onDeposit} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
          <span>Deposit</span>
        </button>

        <button className="wallet-action-btn withdraw" onClick={onWithdraw} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
          <span>Withdraw</span>
        </button>
      </div>

      {/* Activity / Transactions */}
      <div className="tx-section">
        <div className="section-header">
          <span className="section-title">Recent Activity</span>
          {transactions.length > 5 && (
            <button className="section-action" onClick={onSeeAll} type="button">
              View All
            </button>
          )}
        </div>

        <div className="tx-list">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} />
            ))
          ) : (
            <div className="tx-empty">
              <div className="tx-empty-icon">📜</div>
              <div className="tx-empty-title">No activity yet</div>
              <div className="tx-empty-sub">Your deposits and game payouts will appear here.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
