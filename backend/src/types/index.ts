export type TransactionType = 'positive' | 'negative';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  userId: string;
  title: string;
  meta: string;
  amount: number;
  currency: string;
  type: TransactionType;
  icon?: string;
  status: TransactionStatus;
  timestamp: string;
}

export interface WalletBalances {
  total: number;
  withdrawable: number;
  playable: number;
  currency: string;
}

export interface UserProfile {
  id: string;
  telegramId: string;
  name: string;
  username: string;
  avatarIcon: string;
  phone: string;
  email?: string;
  country: string;
  joinedDate: string;
  referralCode: string;
  referredBy?: string;
  totalReferrals: number;
  referralBonusETB: number;
}

export interface DepositRequest {
  userId?: string;
  amount: number;
  paymentMethod?: 'telebirr' | 'cbe' | 'bank';
  referenceId?: string;
}

export interface WithdrawRequest {
  userId?: string;
  amount: number;
  accountNumber?: string;
  accountName?: string;
  paymentMethod?: 'telebirr' | 'cbe';
}

export interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  referralBonusETB: number;
  bonusPerReferral: number;
}
