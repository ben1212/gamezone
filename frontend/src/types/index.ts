export type PageType = 'gamezone' | 'wallet' | 'task' | 'profile' | 'admin';

export interface GameItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  badge?: string;
}

export type TransactionType = 'positive' | 'negative';

export interface Transaction {
  id: string;
  title: string;
  meta: string;
  amount: number;
  currency: string;
  type: TransactionType;
  icon?: string;
  timestamp: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  username: string;
  telegramId: string;
  avatarIcon: string;
  phone: string;
  email?: string;
  country: string;
  joinedDate: string;
  referralCode: string;
  totalReferrals: number;
  referralBonusETB: number;
}

export interface WalletBalances {
  total: number;
  withdrawable: number;
  playable: number;
  currency: string;
}

export type ActiveModal =
  | { type: 'game'; gameId: string; title: string; icon: string }
  | { type: 'invite' }
  | { type: 'deposit' }
  | { type: 'withdraw' }
  | { type: 'settings' }
  | { type: 'personalInfo' }
  | { type: 'phoneNumber' }
  | { type: 'myReferrals' }
  | { type: 'allTransactions' }
  | null;
