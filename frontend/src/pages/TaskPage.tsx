import React from 'react';

interface TaskPageProps {
  onBack?: () => void;
}

export const TaskPage: React.FC<TaskPageProps> = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'pageFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {/* Pro Tasks Container */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--sheen-card)',
          borderRadius: 'var(--r-xl)',
          padding: '28px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--r-md)',
            background: 'var(--accent-dim)',
            border: '1px solid var(--border-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            boxShadow: '0 4px 16px var(--accent-glow)',
            marginBottom: '2px',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </div>
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
          Quests & Rewards
        </span>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '280px', lineHeight: 1.5 }}>
          No active tasks available right now. Check back soon for daily missions and bonus rewards!
        </span>
      </div>
    </div>
  );
};

