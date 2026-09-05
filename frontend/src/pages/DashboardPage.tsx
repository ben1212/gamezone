import React from 'react';
import { GameCard } from '../components/GameCard';
import '../styles/Dashboard.css';

interface DashboardPageProps {
  onOpenBingo: () => void;
  onOpenKeno: () => void;
  onOpenLudo: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenBingo,
  onOpenKeno,
  onOpenLudo,
}) => {
  return (
    <div className="dashboard-page">
      {/* High-Efficiency Live Arena Ticker Strip */}
      <div className="dash-ticker-strip">
        <div className="dash-ticker-left">
          <span className="dash-live-dot" />
          <span className="dash-ticker-title">LIVE ROOMS</span>
          <span className="dash-ticker-count">240+ Active</span>
        </div>
        <div className="dash-ticker-right">
          <span className="dash-ticker-jackpot-label">POOL:</span>
          <span className="dash-ticker-jackpot-val">50,000</span>
          <span className="dash-ticker-cur">ETB</span>
        </div>
      </div>

      {/* 2 in a row efficient grid */}
      <div className="game-grid-2col">
        <GameCard
          title="Bingo"
          icon="🎱"
          badge="LIVE"
          theme="indigo"
          onClick={onOpenBingo}
        />

        <GameCard
          title="Keno"
          icon="🎯"
          badge="TURBO"
          theme="amber"
          onClick={onOpenKeno}
        />

        <GameCard
          title="Ludo"
          icon="🎲"
          badge="CLASSIC"
          theme="emerald"
          onClick={onOpenLudo}
        />
      </div>
    </div>
  );
};

