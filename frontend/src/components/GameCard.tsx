import React from 'react';

interface GameCardProps {
  title: string;
  icon: string;
  badge?: string;
  theme?: 'indigo' | 'amber' | 'emerald' | 'cyan';
  onClick: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  title,
  icon,
  badge,
  theme = 'indigo',
  onClick,
}) => {
  return (
    <button
      className={`game-item-wrap theme-${theme}`}
      onClick={onClick}
      type="button"
      aria-label={`Play ${title}`}
    >
      {/* Sleek Squircle Icon Card */}
      <div className="game-icon-card">
        {/* Subtle Ambient Glow Behind Card */}
        <div className="game-icon-glow" />

        {/* Custom Visual Emblem */}
        <div className="game-icon-inner">
          {title.toLowerCase() === 'bingo' ? (
            <svg className="game-svg-art" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="url(#bingo-sphere-grad)" />
              <circle cx="24" cy="24" r="19.5" stroke="rgba(248,250,252,0.2)" strokeWidth="1" />
              <circle cx="24" cy="24" r="11" fill="#F8FAFC" />
              <text x="24" y="28.5" textAnchor="middle" fill="#6366F1" fontSize="13.5" fontWeight="900" fontFamily="var(--font), sans-serif">B</text>
              <ellipse cx="19" cy="13" rx="6" ry="3" fill="#FFFFFF" fillOpacity="0.4" />
              <defs>
                <radialGradient id="bingo-sphere-grad" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="55%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#312E81" />
                </radialGradient>
              </defs>
            </svg>
          ) : title.toLowerCase() === 'keno' ? (
            <svg className="game-svg-art" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="4" width="40" height="40" rx="10" fill="url(#keno-sphere-grad)" />
              <rect x="4.5" y="4.5" width="39" height="39" rx="9.5" stroke="rgba(248,250,252,0.2)" strokeWidth="1" />
              <circle cx="24" cy="24" r="13" stroke="#22D3EE" strokeWidth="2" strokeDasharray="3 3" opacity="0.9" />
              <circle cx="24" cy="24" r="7" fill="rgba(34, 211, 238, 0.2)" stroke="#F8FAFC" strokeWidth="1.5" />
              <circle cx="24" cy="24" r="3" fill="#22D3EE" />
              <defs>
                <radialGradient id="keno-sphere-grad" cx="30%" cy="25%" r="75%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="50%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#082F49" />
                </radialGradient>
              </defs>
            </svg>
          ) : title.toLowerCase() === 'ludo' ? (
            <svg className="game-svg-art" viewBox="0 0 48 48" fill="none">
              <rect x="6" y="6" width="36" height="36" rx="8" fill="url(#ludo-sphere-grad)" />
              <rect x="6.5" y="6.5" width="35" height="35" rx="7.5" stroke="rgba(248,250,252,0.2)" strokeWidth="1" />
              <circle cx="16" cy="16" r="3" fill="#F8FAFC" />
              <circle cx="32" cy="16" r="3" fill="#F8FAFC" />
              <circle cx="24" cy="24" r="3" fill="#22D3EE" />
              <circle cx="16" cy="32" r="3" fill="#F8FAFC" />
              <circle cx="32" cy="32" r="3" fill="#F8FAFC" />
              <defs>
                <radialGradient id="ludo-sphere-grad" cx="30%" cy="25%" r="75%">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="50%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#064E3B" />
                </radialGradient>
              </defs>
            </svg>
          ) : (
            <span className="game-fallback-emoji">{icon}</span>
          )}
        </div>

        {/* Status Pill Badge */}
        {badge && <span className="game-card-badge">{badge}</span>}
      </div>

      {/* Game Name Underneath The Icon Card */}
      <div className="game-name-meta">
        <span className="game-name-title">{title}</span>
      </div>
    </button>
  );
};

