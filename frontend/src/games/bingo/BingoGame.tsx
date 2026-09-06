import React, { useState, useEffect, useRef } from 'react';
import LobbyView from './LobbyView';
import GameplayView from './GameplayView';
import { UserProfile, WalletBalances, Transaction } from '../../types';
import { generateCartellaGrid } from './bingoUtils';

interface BingoGameProps {
  user: UserProfile;
  balances: WalletBalances;
  onUpdateBalances: (newBalances: WalletBalances, newTx?: Transaction) => void;
  onOpenWallet: () => void;
}

export const BingoGame: React.FC<BingoGameProps> = ({
  user,
  balances,
  onUpdateBalances,
  onOpenWallet,
}) => {
  const [viewMode, setViewMode] = useState<'lobby' | 'gameplay'>('lobby');
  const [countdown, setCountdown] = useState<number>(30); // 30s lobby countdown
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [lastBall, setLastBall] = useState<number | null>(null);
  const [winnerData, setWinnerData] = useState<any>(null);

  // Active tickets purchased by user: cartellaIndex (1-200)
  const [myCartellaIndices, setMyCartellaIndices] = useState<number[]>([]);

  // Active tickets purchased by players in the room
  const [roomTickets, setRoomTickets] = useState<Array<{ cartellaIndex: number; userId: string }>>([]);

  const drawIntervalRef = useRef<any>(null);

  // Combine room tickets + user tickets
  const allPurchasedTickets = [
    ...roomTickets,
    ...myCartellaIndices.map((idx) => ({
      cartellaIndex: idx,
      userId: user.username || 'current-player',
    })),
  ];

  const totalPrize = allPurchasedTickets.length * 10 * 0.8;

  // ── LOBBY COUNTDOWN TIMER ──
  useEffect(() => {
    if (viewMode !== 'lobby') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Time's up! Start the game
          startDrawingPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [viewMode, myCartellaIndices]);

  // ── START DRAWING PHASE ──
  const startDrawingPhase = () => {
    setIsDrawing(true);
    setCalledNumbers([]);
    setLastBall(null);
    setWinnerData(null);

    // If user has tickets or wants to watch, show gameplay
    if (myCartellaIndices.length > 0) {
      setViewMode('gameplay');
    }

    // Ball caller sequence: calls a ball every 3.5s
    const pool = Array.from({ length: 75 }, (_, i) => i + 1);
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    let ballIndex = 0;
    const drawn: number[] = [];

    if (drawIntervalRef.current) clearInterval(drawIntervalRef.current);

    drawIntervalRef.current = setInterval(() => {
      if (ballIndex >= pool.length || ballIndex >= 45) {
        // Round finishes
        endRound(drawn);
        return;
      }

      const nextBall = pool[ballIndex];
      drawn.push(nextBall);
      setCalledNumbers([...drawn]);
      setLastBall(nextBall);
      ballIndex++;

      // Check if any cartella has BINGO after at least 4 balls
      if (ballIndex >= 5) {
        // Check user's tickets
        for (const cIdx of myCartellaIndices) {
          const grid = generateCartellaGrid(cIdx);
          if (checkGridBingo(grid, drawn)) {
            declareWinner(user.username || 'Player', cIdx, totalPrize, true);
            return;
          }
        }
      }
    }, 3200);
  };

  const checkGridBingo = (grid: number[][], drawnNums: number[]): boolean => {
    const set = new Set(drawnNums);
    set.add(0); // free
    // rows
    for (let r = 0; r < 5; r++) {
      if (grid[r].every((n) => set.has(n))) return true;
    }
    // cols
    for (let c = 0; c < 5; c++) {
      if ([grid[0][c], grid[1][c], grid[2][c], grid[3][c], grid[4][c]].every((n) => set.has(n))) return true;
    }
    // diag
    if ([grid[0][0], grid[1][1], grid[2][2], grid[3][3], grid[4][4]].every((n) => set.has(n))) return true;
    if ([grid[0][4], grid[1][3], grid[2][2], grid[3][1], grid[4][0]].every((n) => set.has(n))) return true;
    return false;
  };

  const declareWinner = (winnerName: string, cartellaIndex: number, prize: number, isUser: boolean) => {
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }

    const winPayload = {
      winners: [{ username: winnerName, cartellaIndex, userId: isUser ? user.id || 'current-player' : 'other' }],
      splitPrizePerWinner: prize,
    };
    setWinnerData(winPayload);

    // If user won, credit balance!
    if (isUser && prize > 0) {
      const newPlayable = balances.playable + prize;
      const newTotal = balances.withdrawable + newPlayable;
      const winTx: Transaction = {
        id: 'tx-win-' + Date.now(),
        title: 'Bingo Prize Winner! 🏆',
        meta: `Cartela #${cartellaIndex}`,
        amount: prize,
        currency: balances.currency,
        type: 'positive',
        icon: '🏆',
        timestamp: new Date().toISOString(),
      };
      onUpdateBalances(
        {
          ...balances,
          playable: newPlayable,
          total: newTotal,
        },
        winTx
      );
    }
  };

  const endRound = (_drawn: number[]) => {
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }
    if (myCartellaIndices.length > 0) {
      for (const cIdx of myCartellaIndices) {
        const grid = generateCartellaGrid(cIdx);
        if (checkGridBingo(grid, _drawn)) {
          declareWinner(user.username || 'Player', cIdx, totalPrize, true);
          return;
        }
      }
    }
    // No winner in this round
    setWinnerData({
      winners: [],
      splitPrizePerWinner: 0,
    });
  };

  // Reset back to lobby for next round
  const handleBackToLobby = () => {
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }
    setIsDrawing(false);
    setViewMode('lobby');
    setCountdown(35); // Next round in 35s
    setCalledNumbers([]);
    setLastBall(null);
    setWinnerData(null);
    setMyCartellaIndices([]); // Reset user's tickets for next round
    setRoomTickets([]);
  };

  // ── CARTELA SELECTION & TICKET PURCHASES ──
  const handleTicketPurchased = (newPlayable: number) => {
    const prevPlayable = balances.playable;
    const diff = newPlayable - prevPlayable;
    const newTotal = balances.withdrawable + newPlayable;

    let newTx: Transaction | undefined;
    if (diff < 0) {
      newTx = {
        id: 'tx-bingo-' + Date.now(),
        title: 'Bingo Cartela Purchase',
        meta: 'Lobby Round',
        amount: Math.abs(diff),
        currency: balances.currency,
        type: 'negative',
        icon: '🎱',
        timestamp: new Date().toISOString(),
      };
    } else if (diff > 0) {
      newTx = {
        id: 'tx-bingo-ref-' + Date.now(),
        title: 'Bingo Cartela Refund',
        meta: 'Unselected ticket',
        amount: diff,
        currency: balances.currency,
        type: 'positive',
        icon: '🎱',
        timestamp: new Date().toISOString(),
      };
    }

    onUpdateBalances(
      {
        ...balances,
        playable: newPlayable,
        total: newTotal,
      },
      newTx
    );
  };

  const gameUser = {
    id: user.id || user.username || 'current-player',
    name: user.name || 'Player',
    balance: balances.playable,
    isGuest: false,
  };

  const gameState = {
    status: isDrawing ? 'DRAWING' : 'COUNTDOWN',
    secondsLeft: countdown,
    totalTickets: allPurchasedTickets.length,
    ticketPrice: 10,
    prizePool: totalPrize,
    purchasedTickets: allPurchasedTickets,
    calledNumbers,
    lastCalledBall: lastBall,
    winnerData,
  };

  // Prepare user tickets for gameplay
  const userTickets = myCartellaIndices.map((idx) => ({
    cartellaIndex: idx,
    grid: generateCartellaGrid(idx),
  }));

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {viewMode === 'lobby' ? (
        <LobbyView
          user={gameUser}
          gameState={gameState}
          countdown={countdown}
          token="gamezone-session-token"
          onTicketPurchased={(newPlayable) => {
            handleTicketPurchased(newPlayable);
          }}
          onCartellasChanged={(cartellas) => {
            setMyCartellaIndices(cartellas);
          }}
          onGoToGameplay={() => setViewMode('gameplay')}
          onGoToWallet={onOpenWallet}
        />
      ) : (
        <GameplayView
          user={gameUser}
          gameState={gameState}
          userTickets={userTickets}
          onBackToLobby={handleBackToLobby}
          onGoToWallet={onOpenWallet}
        />
      )}
    </div>
  );
};
