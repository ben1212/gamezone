import { Transaction, UserProfile, WalletBalances } from '../types';

const RAW_API_URL = ((import.meta as any).env?.VITE_API_URL as string) || 'https://gamezone-ben.up.railway.app';
const API_BASE_URL = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api` : '/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      console.warn(`[ApiService] Request to ${endpoint} failed, using local state:`, err);
      return null;
    }
  }

  // Wallet Endpoints
  public async getBalances(): Promise<WalletBalances | null> {
    return this.request<WalletBalances>('/wallet/balances');
  }

  public async getTransactions(): Promise<Transaction[] | null> {
    return this.request<Transaction[]>('/wallet/transactions');
  }

  public async deposit(
    amount: number,
    paymentMethod: string = 'telebirr',
    referenceId?: string
  ): Promise<{ balances: WalletBalances; transaction: Transaction } | null> {
    return this.request<{ balances: WalletBalances; transaction: Transaction }>('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod, referenceId }),
    });
  }

  public async withdraw(
    amount: number,
    accountNumber: string = '0912345678'
  ): Promise<{ balances: WalletBalances; transaction: Transaction } | null> {
    return this.request<{ balances: WalletBalances; transaction: Transaction }>('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, accountNumber }),
    });
  }

  // User & Profile
  public async getProfile(): Promise<UserProfile | null> {
    return this.request<UserProfile>('/user/profile');
  }

  public async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    return this.request<UserProfile>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Referrals
  public async claimReferralBonus(): Promise<{
    claimedAmount: number;
    balances: WalletBalances;
    transaction: Transaction;
  } | null> {
    return this.request('/referrals/claim', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
