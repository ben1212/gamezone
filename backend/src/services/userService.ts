import { supabase } from './supabase.js';

export interface DbUser {
  id?: number;
  telegram_id: string;
  phone: string;
  username: string;
  first_name: string;
  referral_code: string;
  balance: number;
  withdrawable_balance: number;
  has_deposited: boolean;
  is_banned: boolean;
  created_at?: string;
}

export class UserService {
  public static async getUserByTelegramId(telegramId: string): Promise<DbUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', String(telegramId))
        .maybeSingle();

      if (error) {
        console.error(`Error fetching user ${telegramId}:`, error);
        return null;
      }
      return data;
    } catch (err) {
      console.error(`Exception fetching user ${telegramId}:`, err);
      return null;
    }
  }

  public static async getUserByPhone(phone: string): Promise<DbUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching user by phone ${phone}:`, error);
        return null;
      }
      return data;
    } catch (err) {
      console.error(`Exception fetching user by phone ${phone}:`, err);
      return null;
    }
  }

  public static async registerUser(userData: {
    telegram_id: string;
    phone: string;
    username?: string;
    first_name: string;
    referral_code?: string;
  }): Promise<DbUser | null> {
    try {
      const refCode = userData.referral_code || `GZ${userData.telegram_id.slice(-6)}`;

      const { data, error } = await supabase
        .from('users')
        .insert({
          telegram_id: String(userData.telegram_id),
          phone: userData.phone,
          username: userData.username ? userData.username.replace('@', '') : '',
          first_name: userData.first_name,
          referral_code: refCode,
          balance: 0,
          withdrawable_balance: 0,
          has_deposited: false,
          is_banned: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user in Supabase:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Exception creating user in Supabase:', err);
      return null;
    }
  }

  public static async updateUser(telegramId: string, updates: Partial<DbUser>): Promise<DbUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('telegram_id', String(telegramId))
        .select()
        .single();

      if (error) {
        console.error(`Error updating user ${telegramId}:`, error);
        return null;
      }
      return data;
    } catch (err) {
      console.error(`Exception updating user ${telegramId}:`, err);
      return null;
    }
  }

  public static async getAllUsers(): Promise<DbUser[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching all users:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Exception fetching all users:', err);
      return [];
    }
  }

  public static async createDeposit(depositData: {
    telegram_id: string;
    amount: number;
    method: string;
    sms_text?: string;
    reference_id?: string;
    status?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('deposits')
        .insert({
          telegram_id: String(depositData.telegram_id),
          amount: depositData.amount,
          method: depositData.method,
          sms_text: depositData.sms_text || depositData.reference_id || '',
          status: depositData.status || 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating deposit:', error);
      }
      return data;
    } catch (err) {
      console.error('Exception creating deposit:', err);
      return null;
    }
  }

  public static async createWithdrawal(withdrawData: {
    telegram_id: string;
    amount: number;
    method: string;
    account_number: string;
    status?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .insert({
          telegram_id: String(withdrawData.telegram_id),
          amount: withdrawData.amount,
          method: withdrawData.method,
          account_number: withdrawData.account_number,
          status: withdrawData.status || 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating withdrawal:', error);
      }
      return data;
    } catch (err) {
      console.error('Exception creating withdrawal:', err);
      return null;
    }
  }
}
