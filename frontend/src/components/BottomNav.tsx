import React from 'react';
import { PageType } from '../types';
import '../styles/BottomNav.css';

interface BottomNavProps {
  activePage: PageType;
  onNavigate: (page: PageType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activePage,
  onNavigate,
}) => {
  return (
    <nav className="bottom-nav" aria-label="Main Navigation">
      <div className="bottom-nav-inner">
        {/* HOME */}
        <button
          className={`bottom-nav-item ${activePage === 'gamezone' ? 'active' : ''}`}
          onClick={() => onNavigate('gamezone')}
          type="button"
          aria-label="Home"
        >
          <div className="bottom-nav-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="bottom-nav-label">Home</span>
        </button>

        {/* WALLET */}
        <button
          className={`bottom-nav-item ${activePage === 'wallet' ? 'active' : ''}`}
          onClick={() => onNavigate('wallet')}
          type="button"
          aria-label="Wallet"
        >
          <div className="bottom-nav-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <span className="bottom-nav-label">Wallet</span>
        </button>

        {/* TASK */}
        <button
          className={`bottom-nav-item ${activePage === 'task' ? 'active' : ''}`}
          onClick={() => onNavigate('task')}
          type="button"
          aria-label="Task"
        >
          <div className="bottom-nav-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <span className="bottom-nav-label">Task</span>
        </button>

        {/* PROFILE */}
        <button
          className={`bottom-nav-item ${activePage === 'profile' ? 'active' : ''}`}
          onClick={() => onNavigate('profile')}
          type="button"
          aria-label="Profile"
        >
          <div className="bottom-nav-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span className="bottom-nav-label">Profile</span>
        </button>
      </div>
    </nav>
  );
};
