import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Users, Zap } from 'lucide-react';
import MasterBoard from './MasterBoard';
import CartellaCard from './CartellaCard';
import { generateCartellaGrid } from './bingoUtils';
import './Bingo.css';

const LETTER_COLORS: Record<string, string> = {
  B: '#ef4444',
  I: '#f59e0b',
  N: '#10b981',
  G: '#38bdf8',
  O: '#a855f7',
};

const getBallLetter = (num: number): string => {
  if (!num) return 'B';
  if (num <= 15) return 'B';
  if (num <= 30) return 'I';
  if (num <= 45) return 'N';
  if (num <= 60) return 'G';
  return 'O';
};

export interface GameplayViewProps {
  user?: any;
  gameState?: any;
  userTickets?: Array<{ cartellaIndex: number; grid?: number[][] }>;
  socket?: any;
  onBackToLobby: () => void;
  onGoToWallet?: () => void;
}

export default function GameplayView({
  user,
  gameState,
  userTickets = [],
  socket,
  onBackToLobby,
  onGoToWallet: _onGoToWallet,
}: GameplayViewProps) {
  const initialLastBall = gameState?.lastCalledBall
    ? { number: gameState.lastCalledBall, letter: getBallLetter(gameState.lastCalledBall) }
    : null;

  const [calledNumbers, setCalledNumbers] = useState<number[]>(gameState?.calledNumbers || []);
  const [lastBall, setLastBall] = useState<{ number: number; letter: string } | null>(initialLastBall);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [redirectSec, setRedirectSec] = useState<number | null>(null);
  const confettiFired = useRef<boolean>(false);

  // calledSet for rendering the cartella — always include FREE (0)
  const calledSet = new Set<number>(calledNumbers);
  calledSet.add(0);

  // ── Sync with gameState if updated from outside / props ──
  useEffect(() => {
    if (gameState?.calledNumbers && gameState.calledNumbers.length !== calledNumbers.length) {
      setCalledNumbers(gameState.calledNumbers);
    }
    if (gameState?.lastCalledBall) {
      setLastBall({
        number: gameState.lastCalledBall,
        letter: getBallLetter(gameState.lastCalledBall),
      });
    }
    if (gameState?.winnerData && !winnerData) {
      setWinnerData(gameState.winnerData);
      setRedirectSec(6);
      if (!confettiFired.current && gameState.winnerData.winners?.some((w: any) => String(w.userId) === String(user?.id))) {
        confettiFired.current = true;
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 }, colors: ['#38bdf8', '#10b981', '#fbbf24'] });
        setTimeout(() =>
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 }, colors: ['#38bdf8', '#0284c7'] }), 600
        );
      }
    } else if (!gameState?.winnerData && winnerData) {
      setWinnerData(null);
      setRedirectSec(null);
      confettiFired.current = false;
    }
  }, [gameState?.calledNumbers, gameState?.lastCalledBall, gameState?.winnerData, user?.id]);

  // ── Socket listeners ──
  useEffect(() => {
    if (!socket) return;

    const onBallDrawn = (data: any) => {
      const drawnLetter = data.letter || getBallLetter(data.number);
      setLastBall({ number: data.number, letter: drawnLetter });
      setCalledNumbers(data.calledNumbers || []);
    };

    const onRoundEnded = (data: any) => {
      setWinnerData(data);
      setRedirectSec(6);
      if (!confettiFired.current && data.winners?.some((w: any) => String(w.userId) === String(user?.id))) {
        confettiFired.current = true;
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 }, colors: ['#38bdf8', '#10b981', '#fbbf24'] });
        setTimeout(() =>
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 }, colors: ['#38bdf8', '#0284c7'] }), 600
        );
      }
    };

    const onRoundState = (state: any) => {
      if (state.calledNumbers) setCalledNumbers(state.calledNumbers);
      if (state.lastCalledBall) {
        setLastBall({ number: state.lastCalledBall, letter: getBallLetter(state.lastCalledBall) });
      }
    };

    socket.on('ball_drawn', onBallDrawn);
    socket.on('round_ended', onRoundEnded);
    socket.on('round_state', onRoundState);

    return () => {
      socket.off('ball_drawn', onBallDrawn);
      socket.off('round_ended', onRoundEnded);
      socket.off('round_state', onRoundState);
    };
  }, [socket, user]);

  // ── 6-second auto-redirect countdown ──
  useEffect(() => {
    if (redirectSec === null) return;
    if (redirectSec <= 0) {
      onBackToLobby();
      return;
    }
    const t = setTimeout(() => setRedirectSec((prev) => (prev !== null && prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearTimeout(t);
  }, [redirectSec, onBackToLobby]);

  const lastBallColor = lastBall ? (LETTER_COLORS[lastBall.letter] || '#38bdf8') : '#38bdf8';
  const isWinner = winnerData?.winners?.some((w: any) => String(w.userId) === String(user?.id));

  // Ensure each ticket has its 5x5 grid
  const processedTickets = userTickets.map((tk) => ({
    ...tk,
    grid: tk.grid && tk.grid.length === 5 ? tk.grid : generateCartellaGrid(tk.cartellaIndex),
  }));

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '6px 8px 8px',
        boxSizing: 'border-box',
        maxWidth: '600px',
        margin: '0 auto',
        fontFamily: 'var(--font), sans-serif',
        gap: '5px',
      }}
    >
      {/* ── TOP HUD BANNER ── */}
      <div className="bingo-hud-grid">
        <div className="bingo-hud-card">
          <div className="bingo-hud-label"><Trophy size={10} color="#10b981" /> PRIZE</div>
          <div className="bingo-metric-value" style={{ color: 'var(--emerald)' }}>
            {(gameState?.prizePool || 0).toFixed(0)} <span style={{ fontSize: '8px', opacity: 0.85 }}>ETB</span>
          </div>
        </div>
        <div className="bingo-hud-card">
          <div className="bingo-hud-label"><Users size={10} color="#6366f1" /> PLAYERS</div>
          <div className="bingo-metric-value">{gameState?.totalTickets || 1}</div>
        </div>
        <div className="bingo-hud-card">
          <div className="bingo-hud-label"><Zap size={10} color="#f59e0b" /> STAKE</div>
          <div className="bingo-metric-value" style={{ color: 'var(--amber)' }}>
            {(gameState?.ticketPrice || 10).toFixed(0)} <span style={{ fontSize: '8px', opacity: 0.85 }}>ETB</span>
          </div>
        </div>
        <div className="bingo-hud-card">
          <div className="bingo-hud-label">🎱 CALLED</div>
          <div className="bingo-metric-value">
            {calledNumbers.length} <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>/75</span>
          </div>
        </div>
      </div>

      {/* ── LIVE BALL STRIP ── */}
      <div className="bingo-ball-strip">
        {/* Ball */}
        {lastBall ? (
          <div
            key={lastBall.number}
            className="bingo-3d-ball"
            style={{
              width: '46px',
              height: '46px',
              flexShrink: 0,
              background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${lastBallColor} 45%, #050505 100%)`,
              border: `2px solid rgba(255,255,255,0.4)`,
              boxShadow: `0 0 16px ${lastBallColor}88, 0 4px 10px rgba(0,0,0,0.5)`,
            }}
          >
            <span style={{ fontSize: '8px', color: '#000', fontWeight: '700', background: 'rgba(255,255,255,0.95)', padding: '1px 4px', borderRadius: '6px', lineHeight: 1 }}>
              {lastBall.letter}
            </span>
            <span style={{ fontSize: '15px', color: '#fff', fontWeight: '700', lineHeight: 1 }}>
              {lastBall.number}
            </span>
          </div>
        ) : (
          <div style={{ width: '46px', height: '46px', flexShrink: 0, borderRadius: '50%', background: 'rgba(248,250,252,0.04)', border: '1.5px dashed rgba(248,250,252,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>–</span>
          </div>
        )}

        {/* Live label + recent balls */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 5px #ef4444', animation: 'radarBeacon 1.2s infinite', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>LIVE DRAW</span>
          </div>
          <div style={{ display: 'flex', gap: '3px', overflowX: 'auto' }}>
            {calledNumbers.length === 0 ? (
              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Waiting...</span>
            ) : (
              [...calledNumbers].reverse().slice(0, 10).map((n, i) => {
                const letter = getBallLetter(n);
                const col = LETTER_COLORS[letter] || '#22D3EE';
                return (
                  <span key={n} style={{ flexShrink: 0, padding: '1px 4px', borderRadius: '4px', fontSize: '8.5px', fontWeight: '700', background: i === 0 ? col : 'rgba(248,250,252,0.07)', color: i === 0 ? '#000' : col, border: i === 0 ? 'none' : `1px solid ${col}38` }}>
                    {letter}{n}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── SIDE-BY-SIDE: MASTER BOARD (LEFT) + MY CARTELA (RIGHT) ── */}
      <div className="bingo-split-view">

        {/* LEFT — Master Board */}
        <div className="bingo-split-panel bingo-split-left">
          <div className="bingo-panel-label">📋 Master Board</div>
          <div className="bingo-panel-inner">
            <MasterBoard calledNumbers={calledNumbers} />
          </div>
        </div>

        {/* RIGHT — My Cartela(s) */}
        <div className="bingo-split-panel bingo-split-right">
          {processedTickets.length > 0 ? (
            <>
              <div className="bingo-panel-label">
                🎫 My Cartela{processedTickets.length > 1 ? 's' : ''}
                <span style={{ color: 'var(--cyan)', marginLeft: '3px' }}>({processedTickets.length})</span>
              </div>
              <div className="bingo-panel-inner" style={{ gap: '6px', overflowY: processedTickets.length > 1 ? 'auto' : 'visible' }}>
                {processedTickets.map((tk) => (
                  <div key={tk.cartellaIndex}>
                    <div style={{ fontSize: '8px', fontWeight: '800', color: 'var(--cyan)', textAlign: 'center', marginBottom: '3px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      #{tk.cartellaIndex}
                    </div>
                    <CartellaCard
                      id={tk.cartellaIndex}
                      grid={tk.grid}
                      calledSet={calledSet}
                      price={gameState?.ticketPrice || 10}
                      compact
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="bingo-panel-label">👀 Spectator</div>
              <div className="bingo-panel-inner" style={{ justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>Watching the live draw</span>
                <button
                  type="button"
                  onClick={onBackToLobby}
                  style={{ background: 'var(--accent-gradient)', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                >
                  ← Lobby
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── WINNER MODAL ── */}
      {winnerData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--r-xl)', padding: '24px 20px', border: `2px solid ${isWinner ? 'var(--cyan)' : 'var(--border)'}`, textAlign: 'center', maxWidth: '360px', width: '100%', boxShadow: isWinner ? '0 0 40px rgba(34,211,238,0.35)' : '0 20px 40px rgba(0,0,0,0.7)' }}>
            <div style={{ fontSize: '42px', marginBottom: '6px' }}>{isWinner ? '🏆' : '🎉'}</div>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: isWinner ? 'var(--cyan)' : 'var(--text-primary)', marginBottom: '8px' }}>
              {isWinner ? 'You Won! 🎉' : 'Round Complete!'}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              {winnerData.winners?.map((w: any, i: number) => (
                <div key={i}>
                  <span style={{ color: 'var(--cyan)', fontWeight: '600' }}>{w.username || 'Player'} (#{w.cartellaIndex})</span>
                  {' '}— <span style={{ color: 'var(--emerald)', fontWeight: '700' }}>{(winnerData.splitPrizePerWinner || 0).toFixed(0)} ETB</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-accent)', borderRadius: 'var(--r-sm)', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Clock size={13} color="var(--accent)" />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Back to Lobby in <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{redirectSec ?? 6}</span>s
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
