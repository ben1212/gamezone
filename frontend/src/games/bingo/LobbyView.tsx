import { useState, useEffect, useRef } from 'react';
import { Trophy, Users, Clock, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api';
import './Bingo.css';

export interface LobbyViewProps {
  user?: any;
  gameState?: any;
  countdown?: number | null;
  token?: string;
  onTicketPurchased?: (newBalance: number, withdrawableBalance?: number) => void;
  onCartellasChanged?: (cartellas: number[]) => void;
  onGoToGameplay?: () => void;
  onGoToWallet?: () => void;
}

export default function LobbyView({
  user,
  gameState,
  countdown = null,
  token,
  onTicketPurchased,
  onCartellasChanged,
  onGoToGameplay,
  onGoToWallet: _onGoToWallet
}: LobbyViewProps) {
  const [errMsg, setErrMsg] = useState('');
  const [localMyCartellas, setLocalMyCartellas] = useState<number[] | null>(null);
  const purchasingRef = useRef<Set<number>>(new Set());

  // Build a map of purchased tickets: { cartellaIndex -> userId }
  const purchasedMap: Record<number, any> = {};
  const uniquePlayers = new Set<string>();

  if (gameState?.purchasedTickets) {
    gameState.purchasedTickets.forEach((tk: any) => {
      purchasedMap[tk.cartellaIndex] = tk.userId;
      if (tk.userId) uniquePlayers.add(String(tk.userId));
    });
  }

  // Server-authoritative my cartellas
  const serverMyCartellas: number[] = gameState?.purchasedTickets
    ? gameState.purchasedTickets
        .filter((t: any) => String(t.userId) === String(user?.id))
        .map((t: any) => t.cartellaIndex)
    : [];

  // Use local state for instant feedback, sync when server updates
  const myCartellas = localMyCartellas !== null ? localMyCartellas : serverMyCartellas;

  useEffect(() => {
    setLocalMyCartellas(serverMyCartellas);
  }, [JSON.stringify(serverMyCartellas)]);

  const price = 10; // Fixed 10 ETB per Cartela
  const balance = parseFloat(user?.balance) || 0;
  const totalPrize = gameState?.prizePool !== undefined ? gameState.prizePool : (gameState?.totalTickets || 0) * price * 0.8;
  const selectedCartelasCount = gameState?.totalTickets !== undefined
    ? gameState.totalTickets
    : (gameState?.purchasedTickets ? gameState.purchasedTickets.length : Object.keys(purchasedMap).length);
  const isDrawing = gameState?.status === 'DRAWING';
  const currentSec = countdown !== null ? countdown : (gameState?.secondsLeft ?? 50);

  const handleCartellaClick = async (index: number) => {
    if (isDrawing) return; // Cannot change during drawing
    setErrMsg('');

    const isMine = myCartellas.includes(index);
    const ownerId = purchasedMap[index];
    const isTaken = !!ownerId && String(ownerId) !== String(user?.id);

    // UNSELECT
    if (isMine) {
      const updated = myCartellas.filter(i => i !== index);
      setLocalMyCartellas(updated);
      if (onCartellasChanged) onCartellasChanged(updated);
      if (onTicketPurchased) onTicketPurchased(balance + price);

      if (user?.isGuest) {
        return;
      }

      try {
        const res = await apiFetch('/api/game/unselect-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ cartellaIndex: index })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to unselect cartela');
        if (onTicketPurchased && data.newBalance !== undefined) {
          onTicketPurchased(data.newBalance, data.withdrawableBalance);
        }
      } catch (err: any) {
        setErrMsg(err.message);
        setTimeout(() => setErrMsg(''), 2500);
        setLocalMyCartellas(myCartellas); // rollback
        if (onCartellasChanged) onCartellasChanged(myCartellas);
      }
      return;
    }

    // Block if taken by someone else
    if (isTaken) {
      setErrMsg(`Cartela #${index} is already taken.`);
      setTimeout(() => setErrMsg(''), 2000);
      return;
    }

    // Block if this cartella is already being purchased (in-flight)
    if (purchasingRef.current.has(index)) return;

    // Max cartellas check — 2 cartellas limit per round
    const effectiveCount = myCartellas.length + purchasingRef.current.size;
    if (effectiveCount >= 2) {
      setErrMsg('You can select a maximum of 2 Cartelas per round.');
      setTimeout(() => setErrMsg(''), 2500);
      return;
    }

    // Balance check
    if (balance < price) {
      setErrMsg(`Insufficient balance (10 ETB required) — please top up your wallet.`);
      setTimeout(() => setErrMsg(''), 3000);
      return;
    }

    // INSTANT SELECT (Zero lag optimistic update)
    purchasingRef.current.add(index);
    const updated = [...myCartellas, index];
    setLocalMyCartellas(updated);
    if (onCartellasChanged) onCartellasChanged(updated);
    if (onTicketPurchased) onTicketPurchased(Math.max(0, balance - price));

    if (user?.isGuest) {
      purchasingRef.current.delete(index);
      return;
    }

    try {
      const res = await apiFetch('/api/game/buy-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cartellaIndex: index })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to select cartela');
      if (onTicketPurchased && data.newBalance !== undefined) {
        onTicketPurchased(data.newBalance, data.withdrawableBalance);
      }
    } catch (err: any) {
      setErrMsg(err.message);
      setTimeout(() => setErrMsg(''), 2500);
      setLocalMyCartellas(myCartellas); // rollback
    } finally {
      purchasingRef.current.delete(index);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: 'var(--font), sans-serif',
      }}
    >
      {/* ── FLOATING HIGHLIGHT PROMPT ALERT (DOES NOT MOVE LAYOUT) ── */}
      {errMsg && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: '24px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.5), 0 0 16px rgba(239, 68, 68, 0.4)',
            maxWidth: '90vw',
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <AlertCircle size={15} color="#ffffff" />
          <span>{errMsg}</span>
        </div>
      )}

      {/* ── PRO TOP BANNER (Obsidian background, titanium metric boxes) ── */}
      <div
        style={{
          flexShrink: 0,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          padding: '10px 12px',
          zIndex: 100
        }}
      >
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          
          {/* 3 Metric Cards with Matching Font Styling */}
          <div className="bingo-metric-grid">
            
            {/* 1. COUNTDOWN */}
            <div className="bingo-metric-card">
              <div className="bingo-metric-label">
                <Clock size={10} color="#f59e0b" />
                Game Starts
              </div>
              <div
                className="bingo-metric-value"
                style={{ color: currentSec <= 10 ? 'var(--rose)' : 'var(--amber)' }}
              >
                {isDrawing ? 'DRAWING' : `${currentSec}s`}
              </div>
            </div>

            {/* 2. PLAYERS / SELECTED CARTELAS */}
            <div className="bingo-metric-card">
              <div className="bingo-metric-label">
                <Users size={10} color="#6366f1" />
                Players
              </div>
              <div
                className="bingo-metric-value"
                style={{ color: 'var(--text-primary)' }}
              >
                {selectedCartelasCount}
              </div>
            </div>

            {/* 3. TOTAL PRIZE (POT) */}
            <div className="bingo-metric-card">
              <div className="bingo-metric-label">
                <Trophy size={10} color="#10b981" />
                Prize Pool
              </div>
              <div
                className="bingo-metric-value"
                style={{ color: 'var(--emerald)' }}
              >
                {parseFloat(String(totalPrize || 0)).toFixed(0)} <span style={{ fontSize: '9.5px', opacity: 0.85 }}>ETB</span>
              </div>
            </div>

          </div>

          {/* Spectator Prompt if live drawing */}
          {isDrawing && serverMyCartellas.length === 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--accent-dim)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--r-sm)',
                padding: '7px 12px',
                marginTop: '8px'
              }}
            >
              <div style={{ fontSize: '11.5px', color: 'var(--text-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--rose)', display: 'inline-block' }} />
                Live round in progress
              </div>
              <button
                type="button"
                onClick={onGoToGameplay}
                style={{
                  background: 'var(--accent-gradient)',
                  boxShadow: '0 2px 10px var(--accent-glow)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '5px 14px',
                  borderRadius: 'var(--r-xs)',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Watch Live →
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── SCROLLABLE CARTELA BOARD (200 TILES, 8 PER ROW) ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 10px 16px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div className="cartella-grid-container">
            {Array.from({ length: 200 }, (_, i) => i + 1).map(num => {
              const isMine = myCartellas.includes(num);
              const ownerId = purchasedMap[num];
              const isTaken = !!ownerId && String(ownerId) !== String(user?.id);

              let itemClass = 'cartella-grid-item';
              if (isMine) itemClass += ' mine';
              else if (isTaken) itemClass += ' taken';
              if (isDrawing && !isMine) itemClass += ' disabled';

              return (
                <div
                  key={num}
                  className={itemClass}
                  onClick={() => handleCartellaClick(num)}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
