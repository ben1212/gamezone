import React from 'react';
import '../styles/TopBanner.css';

interface TopBannerProps {
  balance: number;
  currency?: string;
  onOpenWallet?: () => void;
  onHomeClick: () => void;
}

export const TopBanner: React.FC<TopBannerProps> = ({
  balance,
  currency = 'ETB',
  onHomeClick,
}) => {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {/* Brand */}
        <button className="brand" onClick={onHomeClick} type="button" aria-label="GameZone Home">
          <div className="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="4" fill="url(#gamepad-grad)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <line x1="6" y1="12" x2="10" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="10" x2="8" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <circle cx="15.5" cy="10.5" r="1" fill="white" />
              <circle cx="17.5" cy="13.5" r="1" fill="white" />
              <defs>
                <linearGradient id="gamepad-grad" x1="2" y1="6" x2="22" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#4338ca" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-name">
              GAME<span className="brand-accent">ZONE</span>
            </div>
          </div>
        </button>

        {/* Static Plain Balance Display Badge (Luxury Obsidian Capsule) */}
        <div className="balance-badge" aria-label="Wallet balance">
          <span className="balance-pill-dot" />
          <span className="balance-val">
            {balance > 0 ? balance.toLocaleString() : '0.00'}
          </span>
          <span className="balance-pill-cur">{currency}</span>
        </div>
      </div>
    </header>
  );
};

