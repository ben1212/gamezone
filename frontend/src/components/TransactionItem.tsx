import React from 'react';
import { Transaction } from '../types';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onClick,
}) => {
  const isPositive = transaction.type === 'positive';
  const isDeposit = transaction.title.toLowerCase().includes('deposit');

  return (
    <div className="tx-item" onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className={`tx-icon ${isPositive ? 'positive' : 'negative'}`}>
        {isDeposit || isPositive ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        )}
      </div>

      <div className="tx-details">
        <div className="tx-title">{transaction.title}</div>
        <div className="tx-date">{transaction.meta}</div>
      </div>

      <div className={`tx-amount ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? '+' : '-'}{transaction.amount.toLocaleString()} {transaction.currency}
      </div>
    </div>
  );
};

