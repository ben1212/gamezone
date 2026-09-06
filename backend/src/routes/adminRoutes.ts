import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase.js';
import { UserService } from '../services/userService.js';

export const adminRoutes = Router();

// Hardcoded Admin Credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'password123';

// 1. Admin Login
adminRoutes.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({
      success: true,
      token: `admin-token-${Date.now()}`,
      admin: {
        username: 'admin',
        name: 'Super Admin',
        role: 'Super Admin',
        avatar: 'A',
      },
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid username or password',
  });
});

// 2. Overview & Live KPIs
adminRoutes.get('/overview', async (_req: Request, res: Response) => {
  try {
    const { data: users } = await supabase.from('users').select('*');
    const { data: deposits } = await supabase.from('deposits').select('*');
    const { data: withdrawals } = await supabase.from('withdrawals').select('*');

    const totalUsers = users?.length || 0;
    const completedDeposits = deposits?.filter((d: any) => d.status === 'completed') || [];
    const completedWithdrawals = withdrawals?.filter((w: any) => w.status === 'completed') || [];

    const todayDeposits = completedDeposits.reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);
    const todayWithdrawals = completedWithdrawals.reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);
    const platformProfit = todayDeposits - todayWithdrawals;

    const pendingDeposits = deposits?.filter((d: any) => d.status === 'pending') || [];
    const pendingWithdrawals = withdrawals?.filter((w: any) => w.status === 'pending') || [];
    const pendingTransactions = pendingDeposits.length + pendingWithdrawals.length;

    res.json({
      success: true,
      data: {
        totalUsers,
        onlineNow: totalUsers > 0 ? 1 : 0,
        todayDeposits,
        todayWithdrawals,
        pendingTransactions,
        treasuryBalance: platformProfit,
        platformProfit,
        recentActivity: [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Transactions List (Combined Deposits + Withdrawals)
adminRoutes.get('/transactions', async (_req: Request, res: Response) => {
  try {
    const { data: deposits } = await supabase.from('deposits').select('*').order('id', { ascending: false });
    const { data: withdrawals } = await supabase.from('withdrawals').select('*').order('id', { ascending: false });
    const { data: users } = await supabase.from('users').select('*');

    const userMap = new Map<string, any>();
    users?.forEach((u: any) => {
      userMap.set(String(u.telegram_id), u);
    });

    const txList: any[] = [];

    deposits?.forEach((d: any) => {
      const u = userMap.get(String(d.telegram_id));
      txList.push({
        id: `DP-${d.id}`,
        userId: d.telegram_id,
        playerName: u?.first_name || 'Player',
        username: u?.username ? `@${u.username}` : '@player',
        phone: u?.phone || '',
        category: 'deposit',
        method: d.method === 'cbe' ? 'CBE Birr' : 'Telebirr',
        smsRef: d.sms_text || '',
        amount: Number(d.amount),
        currency: 'ETB',
        type: 'positive',
        status: d.status || 'pending',
        time: d.created_at ? new Date(d.created_at).toLocaleTimeString() : 'Just now',
      });
    });

    withdrawals?.forEach((w: any) => {
      const u = userMap.get(String(w.telegram_id));
      txList.push({
        id: `WD-${w.id}`,
        userId: w.telegram_id,
        playerName: u?.first_name || 'Player',
        username: u?.username ? `@${u.username}` : '@player',
        phone: u?.phone || '',
        accountNumber: w.account_number,
        category: 'withdrawal',
        method: w.method || 'Telebirr',
        amount: Number(w.amount),
        currency: 'ETB',
        type: 'negative',
        status: w.status || 'pending',
        time: w.created_at ? new Date(w.created_at).toLocaleTimeString() : 'Just now',
      });
    });

    res.json({
      success: true,
      data: txList,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Approve Transaction
adminRoutes.post('/transactions/:id/approve', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (id.startsWith('DP-')) {
      const depId = id.replace('DP-', '');
      const { data: dep } = await supabase.from('deposits').select('*').eq('id', depId).single();
      if (dep) {
        await supabase.from('deposits').update({ status: 'completed' }).eq('id', depId);
        // Credit player playable balance & set has_deposited = true
        const { data: user } = await supabase.from('users').select('balance').eq('telegram_id', dep.telegram_id).single();
        if (user) {
          await supabase.from('users').update({
            balance: Number(user.balance || 0) + Number(dep.amount || 0),
            has_deposited: true,
          }).eq('telegram_id', dep.telegram_id);
        }
      }
    } else if (id.startsWith('WD-')) {
      const wdId = id.replace('WD-', '');
      await supabase.from('withdrawals').update({ status: 'completed' }).eq('id', wdId);
    }

    res.json({
      success: true,
      message: `Transaction ${id} approved`,
      status: 'completed',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Reject Transaction
adminRoutes.post('/transactions/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    if (id.startsWith('DP-')) {
      const depId = id.replace('DP-', '');
      await supabase.from('deposits').update({ status: 'rejected' }).eq('id', depId);
    } else if (id.startsWith('WD-')) {
      const wdId = id.replace('WD-', '');
      const { data: wd } = await supabase.from('withdrawals').select('*').eq('id', wdId).single();
      if (wd) {
        await supabase.from('withdrawals').update({ status: 'rejected' }).eq('id', wdId);
        // Refund withdrawable balance back to player
        const { data: user } = await supabase.from('users').select('withdrawable_balance').eq('telegram_id', wd.telegram_id).single();
        if (user) {
          await supabase.from('users').update({
            withdrawable_balance: Number(user.withdrawable_balance || 0) + Number(wd.amount || 0),
          }).eq('telegram_id', wd.telegram_id);
        }
      }
    }

    res.json({
      success: true,
      message: `Transaction ${id} rejected (${reason || 'Unverified proof'})`,
      status: 'rejected',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Users List
adminRoutes.get('/users', async (_req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    const formatted = (users || []).map((u: any) => ({
      id: String(u.telegram_id || u.id),
      name: u.first_name || 'Player',
      username: u.username ? `@${u.username}` : '@player',
      phone: u.phone || '',
      playableBalance: Number(u.balance || 0),
      withdrawableBalance: Number(u.withdrawable_balance || 0),
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalWagered: 0,
      winCount: 0,
      lossCount: 0,
      status: u.is_banned ? 'blocked' : 'active',
      joinedDate: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Just now',
      lastActive: 'Online',
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Update User Status / Balance
adminRoutes.put('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, balanceAdjustment } = req.body;

  try {
    const isBanned = status === 'blocked';
    const updates: any = { is_banned: isBanned };

    if (balanceAdjustment && Number(balanceAdjustment) !== 0) {
      const { data: user } = await supabase.from('users').select('balance').eq('telegram_id', id).single();
      if (user) {
        updates.balance = Math.max(0, Number(user.balance || 0) + Number(balanceAdjustment));
      }
    }

    await supabase.from('users').update(updates).eq('telegram_id', id);

    res.json({
      success: true,
      message: `User #${id} updated successfully`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Dynamic Tasks Management
adminRoutes.get('/tasks', async (_req: Request, res: Response) => {
  try {
    const tasks = await UserService.getDynamicTasks();
    res.json({ success: true, data: tasks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRoutes.post('/tasks', async (req: Request, res: Response) => {
  try {
    const {
      type,
      title,
      buttonName,
      rewardAmount,
      target,
      telegramLink,
      depositAmount,
      requiredRounds,
      invitedCount,
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({ success: false, error: 'Title and type are required' });
    }

    const created = await UserService.createTask({
      type,
      title,
      buttonName,
      rewardAmount: Number(rewardAmount || 0),
      target,
      telegramLink,
      depositAmount: depositAmount ? Number(depositAmount) : undefined,
      requiredRounds: requiredRounds ? Number(requiredRounds) : undefined,
      invitedCount: invitedCount ? Number(invitedCount) : undefined,
    });

    res.json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRoutes.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await UserService.updateTask(id, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRoutes.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await UserService.deleteTask(id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Promo Codes Management
adminRoutes.get('/promos', async (_req: Request, res: Response) => {
  try {
    const promos = await UserService.getPromoCodes();
    res.json({ success: true, data: promos });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRoutes.post('/promos', async (req: Request, res: Response) => {
  try {
    const { code, reward, rewardAmount, maxUses, expiry } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Code is required' });
    }

    const created = await UserService.createPromoCode({
      code,
      reward: reward || `${rewardAmount || 50} ETB`,
      rewardAmount: rewardAmount ? Number(rewardAmount) : undefined,
      maxUses: maxUses ? Number(maxUses) : undefined,
      expiry,
    });

    res.json({ success: true, data: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRoutes.put('/promos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await UserService.updatePromoCode(id, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

adminRoutes.delete('/promos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await UserService.deletePromoCode(id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Broadcasts
const broadcastLogs: any[] = [];

adminRoutes.get('/broadcasts', async (_req: Request, res: Response) => {
  res.json({ success: true, data: broadcastLogs });
});

adminRoutes.post('/broadcasts', async (req: Request, res: Response) => {
  try {
    const { title, message, target } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }

    const { broadcastToUsers } = await import('../services/telegramBot.js');
    const result = await broadcastToUsers(title, message, target);

    const logEntry = {
      id: `bc-${Date.now()}`,
      title,
      message,
      target: target || 'All Players',
      sentAt: new Date().toLocaleTimeString(),
      recipients: result.sentCount,
      status: 'delivered',
    };

    broadcastLogs.unshift(logEntry);

    res.json({
      success: true,
      data: logEntry,
      result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

