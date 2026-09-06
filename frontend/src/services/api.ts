import { Transaction, UserProfile, WalletBalances } from '../types';
import { tg } from './telegram';

const RAW_API_URL = ((import.meta as any).env?.VITE_API_URL as string) || 'https://gamezone-ben.up.railway.app';
const API_BASE_URL = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api` : '/api';

export interface DynamicTaskItem {
  id: string;
  type: 'telegram_join' | 'deposit_quest' | 'bingo_challenge' | 'invitation';
  title: string;
  buttonName: string;
  rewardAmount: number;
  target: string;
  telegramLink?: string;
  depositAmount?: number;
  requiredRounds?: number;
  invitedCount?: number;
  status: 'active' | 'disabled';
  completions: number;
  claimed: boolean;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    try {
      const tgUser = tg.getUser();
      const telegramId = tgUser ? String(tgUser.id) : '';

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(telegramId ? { 'x-telegram-id': telegramId } : {}),
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

  // Dynamic Tasks
  public async getTasks(): Promise<DynamicTaskItem[] | null> {
    return this.request<DynamicTaskItem[]>('/tasks');
  }

  public async claimTask(taskId: string): Promise<{
    success: boolean;
    message: string;
    rewardAmount?: number;
    newBalance?: number;
  } | null> {
    return this.request(`/tasks/${taskId}/claim`, {
      method: 'POST',
    });
  }

  // Promo Codes
  public async redeemPromo(code: string): Promise<{
    success: boolean;
    message: string;
    rewardAmount?: number;
    newBalance?: number;
  } | null> {
    return this.request('/promos/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }
}

export const api = new ApiService();

