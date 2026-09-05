const RAW_API_URL =
  ((import.meta as any).env?.VITE_API_URL as string) ||
  'https://gamezone-ben.up.railway.app';

export const API_BASE = RAW_API_URL.replace(/\/+$/, '');

export const adminApi = {
  // Login
  login: async (credentials: { username: string; password: string }) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Overview stats
  getOverview: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/overview`);
      return await res.json();
    } catch {
      return null;
    }
  },

  // Transactions list
  getTransactions: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/transactions`);
      return await res.json();
    } catch {
      return null;
    }
  },

  // Approve transaction
  approveTransaction: async (id: string, amount?: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/transactions/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Reject transaction
  rejectTransaction: async (id: string, reason?: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/transactions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Users list
  getUsers: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`);
      return await res.json();
    } catch {
      return null;
    }
  },

  // Update user
  updateUser: async (id: string, data: { status?: string; balanceAdjustment?: number; reason?: string }) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Games control
  getGames: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/games`);
      return await res.json();
    } catch {
      return null;
    }
  },

  toggleGame: async (gameId: string, status?: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/games/${gameId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  createBingoRoom: async (roomData: { name: string; stake: number; minPlayers: number; maxPlayers: number }) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/games/bingo/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Broadcasts
  getBroadcasts: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/broadcasts`);
      return await res.json();
    } catch {
      return null;
    }
  },

  sendBroadcast: async (broadcastData: { title: string; message: string; target: string }) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/broadcasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcastData),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  // Staff & Logs
  getStaff: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/staff`);
      return await res.json();
    } catch {
      return null;
    }
  },

  addStaff: async (staffData: { name: string; username: string; role: string; email: string }) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  getLogs: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/logs`);
      return await res.json();
    } catch {
      return null;
    }
  },
};
