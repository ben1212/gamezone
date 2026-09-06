import React, { useState, useEffect } from 'react';
import { WalletBalances, Transaction } from '../types';
import { tg } from '../services/telegram';

interface TaskPageProps {
  balances?: WalletBalances;
  onUpdateBalances?: (balances: WalletBalances, newTx?: Transaction) => void;
  onShowToast?: (message: string) => void;
  onOpenDeposit?: () => void;
}

interface DailyStreakData {
  streakDay: number; // 1 to 7
  lastClaimTime: number; // timestamp in ms
  totalEarnedETB: number;
}

const STREAK_REWARDS = [
  { day: 1, amount: 1, icon: '🪙', label: '1 ETB' },
  { day: 2, amount: 2, icon: '🪙', label: '2 ETB' },
  { day: 3, amount: 3, icon: '🪙', label: '3 ETB' },
  { day: 4, amount: 4, icon: '🪙', label: '4 ETB' },
  { day: 5, amount: 5, icon: '🪙', label: '5 ETB' },
  { day: 6, amount: 6, icon: '🪙', label: '6 ETB' },
  { day: 7, amount: 10, icon: '🎁', label: '10 ETB', isJackpot: true },
];

const STREAK_STORAGE_KEY = 'gamezone_player_daily_streak_v1';
const CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const STREAK_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours to claim next day

export const TaskPage: React.FC<TaskPageProps> = ({
  balances,
  onUpdateBalances,
  onShowToast,
  onOpenDeposit: _onOpenDeposit,
}) => {
  // ── Daily Streak State ──
  const [streakData, setStreakData] = useState<DailyStreakData>(() => {
    try {
      const saved = localStorage.getItem(STREAK_STORAGE_KEY);
      if (saved) {
        const parsed: DailyStreakData = JSON.parse(saved);
        const now = Date.now();
        const timeSinceClaim = now - parsed.lastClaimTime;

        // If more than 48 hours passed since last claim, streak resets to Day 1
        if (parsed.lastClaimTime > 0 && timeSinceClaim > STREAK_EXPIRY_MS) {
          return { streakDay: 1, lastClaimTime: 0, totalEarnedETB: parsed.totalEarnedETB || 0 };
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error reading streak storage', e);
    }
    return { streakDay: 1, lastClaimTime: 0, totalEarnedETB: 0 };
  });

  const [timeRemainingStr, setTimeRemainingStr] = useState<string>('');
  const [canClaimStreak, setCanClaimStreak] = useState<boolean>(true);

  // Calculate cooldown and countdown timer
  useEffect(() => {
    const checkClaimStatus = () => {
      if (!streakData.lastClaimTime) {
        setCanClaimStreak(true);
        setTimeRemainingStr('');
        return;
      }

      const now = Date.now();
      const elapsed = now - streakData.lastClaimTime;

      // Missed streak check (> 48 hours)
      if (elapsed > STREAK_EXPIRY_MS) {
        setStreakData((prev) => {
          const resetData: DailyStreakData = {
            streakDay: 1,
            lastClaimTime: 0,
            totalEarnedETB: prev.totalEarnedETB,
          };
          localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(resetData));
          return resetData;
        });
        setCanClaimStreak(true);
        setTimeRemainingStr('');
        return;
      }

      // Check if 24 hours have passed since previous claim
      if (elapsed >= CLAIM_COOLDOWN_MS) {
        setCanClaimStreak(true);
        setTimeRemainingStr('');
      } else {
        setCanClaimStreak(false);
        const remaining = CLAIM_COOLDOWN_MS - elapsed;
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeRemainingStr(
          `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    };

    checkClaimStatus();
    const interval = setInterval(checkClaimStatus, 1000);
    return () => clearInterval(interval);
  }, [streakData]);

  // Current active day reward
  const currentRewardConfig =
    STREAK_REWARDS.find((r) => r.day === streakData.streakDay) || STREAK_REWARDS[0];

  // ── Handle Daily Streak Claim ──
  const handleClaimDailyStreak = () => {
    if (!canClaimStreak) return;

    tg.hapticImpact('heavy');
    const rewardAmount = currentRewardConfig.amount;
    const nextDay = streakData.streakDay >= 7 ? 1 : streakData.streakDay + 1;

    const newStreakData: DailyStreakData = {
      streakDay: nextDay,
      lastClaimTime: Date.now(),
      totalEarnedETB: (streakData.totalEarnedETB || 0) + rewardAmount,
    };

    setStreakData(newStreakData);
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(newStreakData));

    // Update balances
    if (balances && onUpdateBalances) {
      const updated: WalletBalances = {
        ...balances,
        playable: (balances.playable || 0) + rewardAmount,
        total: (balances.total || 0) + rewardAmount,
      };

      const streakTx: Transaction = {
        id: `tx-streak-${Date.now()}`,
        title: `Daily Streak Day ${streakData.streakDay}`,
        meta: `Daily Login Bonus (${rewardAmount} ETB)`,
        amount: rewardAmount,
        currency: 'ETB',
        type: 'positive',
        icon: '🔥',
        timestamp: 'Just now',
      };

      onUpdateBalances(updated, streakTx);
    }

    if (onShowToast) {
      onShowToast(
        `🎉 Claimed +${rewardAmount} ETB! Day ${streakData.streakDay} streak collected!`
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'pageFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {/* ========================================================
          1. FIXED / TOP DAILY STREAK CLAIM BANNER
         ======================================================== */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20, 26, 44, 0.95), rgba(12, 17, 30, 0.98))',
          border: '1px solid rgba(99, 102, 241, 0.28)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow ambient decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Streak Top Stats Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '18px',
              }}
            >
              🔥
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.2px' }}>
                Daily Claim Streak
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Claim every 24h to unlock higher daily rewards
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '4px 10px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#a5b4fc',
            }}
          >
            Day {streakData.streakDay}/7
          </div>
        </div>

        {/* 7-Day Streak Horizontal Carousel / Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px',
          }}
        >
          {STREAK_REWARDS.map((item) => {
            const isClaimedPast =
              !canClaimStreak && item.day < streakData.streakDay;
            const isTodayCurrent =
              item.day === (canClaimStreak ? streakData.streakDay : streakData.streakDay - 1);

            return (
              <div
                key={item.day}
                style={{
                  background: isTodayCurrent
                    ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))'
                    : isClaimedPast
                    ? 'rgba(34, 197, 94, 0.08)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isTodayCurrent
                    ? '1.5px solid #f59e0b'
                    : isClaimedPast
                    ? '1px solid rgba(34, 197, 94, 0.35)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '8px 2px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: isTodayCurrent ? '0 0 14px rgba(245, 158, 11, 0.25)' : 'none',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {/* Day label */}
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    color: isTodayCurrent ? '#fbbf24' : isClaimedPast ? '#4ade80' : '#64748b',
                  }}
                >
                  D{item.day}
                </span>

                {/* Icon or Status */}
                <div style={{ fontSize: '14px' }}>
                  {isClaimedPast ? '✅' : item.icon}
                </div>

                {/* Amount */}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isTodayCurrent ? '#f8fafc' : isClaimedPast ? '#86efac' : '#94a3b8',
                  }}
                >
                  {item.label}
                </span>

                {/* Active Indicator Pin */}
                {isTodayCurrent && canClaimStreak && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#f59e0b',
                      boxShadow: '0 0 6px #f59e0b',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Main Claim Action Button */}
        {canClaimStreak ? (
          <button
            onClick={handleClaimDailyStreak}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(90deg, #f59e0b, #eab308)',
              color: '#070b14',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '-0.1px',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <span>🔥 Claim Day {streakData.streakDay} Reward</span>
            <span
              style={{
                background: 'rgba(0,0,0,0.15)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            >
              +{currentRewardConfig.amount} ETB
            </span>
          </button>
        ) : (
          <button
            disabled
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'not-allowed',
            }}
          >
            <span>✅ Claimed Today · Next streak in:</span>
            <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>
              {timeRemainingStr}
            </span>
          </button>
        )}
      </div>

      {/* ========================================================
          2. AVAILABLE QUESTS & TASKS SECTION
         ======================================================== */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
            Missions & Quests
          </h2>
          <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600 }}>
            Automated instant rewards
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '28px 16px',
            textAlign: 'center',
            color: '#8995a7',
          }}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎯</div>
          <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '14px', marginBottom: '4px' }}>No Active Tasks</div>
          <div style={{ fontSize: '12px' }}>Check back soon for new special quests and rewards!</div>
        </div>
      </div>
    </div>
  );
};

export default TaskPage;


