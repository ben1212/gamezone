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

  // ── Dynamic Tasks ──
  public static async getDynamicTasks(telegramId?: string) {
    try {
      const { data: tasks, error } = await supabase
        .from('dynamic_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dynamic tasks:', error);
        return [];
      }

      let claimedSet = new Set<string>();
      if (telegramId) {
        const { data: claims } = await supabase
          .from('user_task_claims')
          .select('task_id')
          .eq('telegram_id', String(telegramId));

        if (claims) {
          claims.forEach((c: any) => claimedSet.add(c.task_id));
        }
      }

      return (tasks || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        title: t.title,
        buttonName: t.button_name || 'Claim',
        rewardAmount: Number(t.reward_amount || 0),
        target: t.target || 'All Players',
        telegramLink: t.telegram_link,
        depositAmount: t.deposit_amount ? Number(t.deposit_amount) : undefined,
        requiredRounds: t.required_rounds ? Number(t.required_rounds) : undefined,
        invitedCount: t.invited_count ? Number(t.invited_count) : undefined,
        status: t.status || 'active',
        completions: Number(t.completions || 0),
        claimed: claimedSet.has(t.id),
      }));
    } catch (err) {
      console.error('Exception fetching dynamic tasks:', err);
      return [];
    }
  }

  public static async createTask(task: {
    id?: string;
    type: string;
    title: string;
    buttonName?: string;
    rewardAmount: number;
    target?: string;
    telegramLink?: string;
    depositAmount?: number;
    requiredRounds?: number;
    invitedCount?: number;
  }) {
    try {
      const taskId = task.id || `t-${Date.now()}`;
      const { data, error } = await supabase
        .from('dynamic_tasks')
        .insert({
          id: taskId,
          type: task.type,
          title: task.title,
          button_name: task.buttonName || 'Claim Reward',
          reward_amount: task.rewardAmount,
          target: task.target || 'All Players',
          telegram_link: task.telegramLink || null,
          deposit_amount: task.depositAmount || null,
          required_rounds: task.requiredRounds || null,
          invited_count: task.invitedCount || null,
          status: 'active',
          completions: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating dynamic task:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Exception creating dynamic task:', err);
      return null;
    }
  }

  public static async updateTask(taskId: string, updates: any) {
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.buttonName !== undefined) dbUpdates.button_name = updates.buttonName;
      if (updates.rewardAmount !== undefined) dbUpdates.reward_amount = updates.rewardAmount;
      if (updates.target !== undefined) dbUpdates.target = updates.target;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.telegramLink !== undefined) dbUpdates.telegram_link = updates.telegramLink;
      if (updates.depositAmount !== undefined) dbUpdates.deposit_amount = updates.depositAmount;
      if (updates.requiredRounds !== undefined) dbUpdates.required_rounds = updates.requiredRounds;
      if (updates.invitedCount !== undefined) dbUpdates.invited_count = updates.invitedCount;

      const { data, error } = await supabase
        .from('dynamic_tasks')
        .update(dbUpdates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Exception updating task:', err);
      return null;
    }
  }

  public static async deleteTask(taskId: string) {
    try {
      // Also delete claims for this task
      await supabase.from('user_task_claims').delete().eq('task_id', taskId);
      const { error } = await supabase.from('dynamic_tasks').delete().eq('id', taskId);
      if (error) {
        console.error('Error deleting task:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception deleting task:', err);
      return false;
    }
  }

  public static async claimTask(telegramId: string, taskId: string): Promise<{
    success: boolean;
    message: string;
    rewardAmount?: number;
    newBalance?: number;
  }> {
    try {
      const user = await this.getUserByTelegramId(telegramId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // 1. Check task exists and active
      const { data: task, error: taskErr } = await supabase
        .from('dynamic_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskErr || !task) {
        return { success: false, message: 'Task not found or expired' };
      }

      if (task.status !== 'active') {
        return { success: false, message: 'Task is currently disabled' };
      }

      // 2. Check if already claimed
      const { data: existingClaim } = await supabase
        .from('user_task_claims')
        .select('id')
        .eq('telegram_id', String(telegramId))
        .eq('task_id', taskId)
        .maybeSingle();

      if (existingClaim) {
        return { success: false, message: 'Task already claimed!' };
      }

      // 3. Verify conditions if applicable
      if (task.type === 'deposit_quest' && task.deposit_amount) {
        if (!user.has_deposited) {
          return {
            success: false,
            message: `Deposit at least ${task.deposit_amount} ETB to unlock this reward!`,
          };
        }
      } else if (task.type === 'invitation' && task.invited_count) {
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('referral_code', user.referral_code);

        if ((count || 0) < Number(task.invited_count)) {
          return {
            success: false,
            message: `Invite at least ${task.invited_count} friends to claim (Currently: ${count || 0})`,
          };
        }
      }

      // 4. Insert claim record
      const { error: claimErr } = await supabase
        .from('user_task_claims')
        .insert({
          telegram_id: String(telegramId),
          task_id: taskId,
        });

      if (claimErr) {
        return { success: false, message: 'Failed to record task claim: ' + claimErr.message };
      }

      // 5. Increment task completions count
      await supabase
        .from('dynamic_tasks')
        .update({ completions: Number(task.completions || 0) + 1 })
        .eq('id', taskId);

      // 6. Credit reward to user balance
      const reward = Number(task.reward_amount || 0);
      const newBalance = Number(user.balance || 0) + reward;
      await this.updateUser(telegramId, { balance: newBalance });

      return {
        success: true,
        message: `🎉 Claimed +${reward} ETB reward for "${task.title}"!`,
        rewardAmount: reward,
        newBalance,
      };
    } catch (err: any) {
      console.error('Exception claiming task:', err);
      return { success: false, message: err?.message || 'Server error claiming task' };
    }
  }

  // ── Promo Codes ──
  public static async getPromoCodes() {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching promo codes:', error);
        return [];
      }

      return (data || []).map((p: any) => ({
        id: String(p.id),
        code: p.code,
        reward: p.reward || `${p.reward_amount} ETB`,
        rewardAmount: Number(p.reward_amount || 0),
        maxUses: Number(p.max_uses || 100),
        usedCount: Number(p.used_count || 0),
        expiry: p.expiry || 'Permanent',
        status: p.status || 'active',
      }));
    } catch (err) {
      console.error('Exception fetching promo codes:', err);
      return [];
    }
  }

  public static async createPromoCode(promo: {
    code: string;
    reward: string;
    rewardAmount?: number;
    maxUses?: number;
    expiry?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          code: promo.code.trim().toUpperCase(),
          reward: promo.reward.trim(),
          reward_amount: promo.rewardAmount || parseFloat(promo.reward) || 50,
          max_uses: promo.maxUses || 500,
          used_count: 0,
          expiry: promo.expiry || '30 Sep 2026',
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating promo code:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Exception creating promo code:', err);
      return null;
    }
  }

  public static async updatePromoCode(id: number | string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating promo code:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Exception updating promo code:', err);
      return null;
    }
  }

  public static async deletePromoCode(id: number | string) {
    try {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) {
        console.error('Error deleting promo code:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Exception deleting promo code:', err);
      return false;
    }
  }

  public static async redeemPromoCode(telegramId: string, code: string): Promise<{
    success: boolean;
    message: string;
    rewardAmount?: number;
    newBalance?: number;
  }> {
    try {
      const user = await this.getUserByTelegramId(telegramId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const cleanCode = code.trim().toUpperCase();
      const { data: promo, error: promoErr } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', cleanCode)
        .single();

      if (promoErr || !promo) {
        return { success: false, message: 'Invalid or non-existent promo code.' };
      }

      if (promo.status !== 'active') {
        return { success: false, message: 'This promo code is no longer active.' };
      }

      if (Number(promo.used_count || 0) >= Number(promo.max_uses || 100)) {
        return { success: false, message: 'This promo code has reached its maximum usage limit.' };
      }

      // Increment used count
      const newUsed = Number(promo.used_count || 0) + 1;
      await supabase
        .from('promo_codes')
        .update({
          used_count: newUsed,
          ...(newUsed >= Number(promo.max_uses || 100) ? { status: 'expired' } : {}),
        })
        .eq('id', promo.id);

      // Credit reward to user
      const reward = Number(promo.reward_amount || parseFloat(promo.reward) || 25);
      const newBalance = Number(user.balance || 0) + reward;
      await this.updateUser(telegramId, { balance: newBalance });

      return {
        success: true,
        message: `🎉 Successfully redeemed code ${cleanCode}! +${reward} ETB credited.`,
        rewardAmount: reward,
        newBalance,
      };
    } catch (err: any) {
      console.error('Exception redeeming promo code:', err);
      return { success: false, message: err?.message || 'Server error redeeming promo code' };
    }
  }

  // ── User Wallet Balances & Transactions ──
  public static async getUserBalances(telegramId: string) {
    const user = await this.getUserByTelegramId(telegramId);
    if (!user) {
      return {
        total: 0,
        withdrawable: 0,
        playable: 0,
        currency: 'ETB',
      };
    }

    const playable = Number(user.balance || 0);
    const withdrawable = Number(user.withdrawable_balance || 0);
    return {
      total: playable + withdrawable,
      playable,
      withdrawable,
      currency: 'ETB',
    };
  }

  public static async getUserTransactions(telegramId: string) {
    try {
      const { data: deposits } = await supabase
        .from('deposits')
        .select('*')
        .eq('telegram_id', String(telegramId))
        .order('id', { ascending: false });

      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('telegram_id', String(telegramId))
        .order('id', { ascending: false });

      const txList: any[] = [];

      (deposits || []).forEach((d: any) => {
        txList.push({
          id: `tx-dep-${d.id}`,
          title: `Deposit (${d.method === 'cbe' ? 'CBE Birr' : 'Telebirr'})`,
          meta: d.sms_text ? `Ref: ${d.sms_text.slice(0, 16)}...` : 'Pending review',
          amount: Number(d.amount),
          currency: 'ETB',
          type: 'positive',
          icon: '↓',
          status: d.status || 'pending',
          timestamp: d.created_at || new Date().toISOString(),
        });
      });

      (withdrawals || []).forEach((w: any) => {
        txList.push({
          id: `tx-wd-${w.id}`,
          title: `Withdrawal to ${w.account_number}`,
          meta: w.status === 'completed' ? 'Paid out' : 'Processing',
          amount: Number(w.amount),
          currency: 'ETB',
          type: 'negative',
          icon: '↑',
          status: w.status || 'pending',
          timestamp: w.created_at || new Date().toISOString(),
        });
      });

      // Sort by timestamp desc
      txList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return txList;
    } catch (err) {
      console.error('Exception fetching user transactions:', err);
      return [];
    }
  }

  // ── Referrals ──
  public static async getUserReferrals(telegramId: string) {
    try {
      const user = await this.getUserByTelegramId(telegramId);
      if (!user) {
        return {
          referralCode: 'GAMEZONE',
          totalReferrals: 0,
          referralBonusETB: 0,
          bonusPerReferral: 25,
        };
      }

      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('referral_code', user.referral_code);

      const totalReferrals = count || 0;
      // 25 ETB bonus per invited friend
      const referralBonusETB = totalReferrals * 25;

      return {
        referralCode: user.referral_code,
        totalReferrals,
        referralBonusETB,
        bonusPerReferral: 25,
      };
    } catch (err) {
      console.error('Exception fetching referrals:', err);
      return {
        referralCode: 'GAMEZONE',
        totalReferrals: 0,
        referralBonusETB: 0,
        bonusPerReferral: 25,
      };
    }
  }
}

