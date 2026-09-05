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
  updateUser: async (id: string, data: { status?: string; balanceAdjustment?: number }) => {
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
};
