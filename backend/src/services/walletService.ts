import { db } from '../data/db.js';
import { Transaction, WalletBalances } from '../types/index.js';

export class WalletService {
  public static getBalances(): WalletBalances {
    return db.getBalances();
  }

  public static getTransactions(): Transaction[] {
    return db.getTransactions();
  }

  public static deposit(
    amount: number,
    paymentMethod: string = 'telebirr',
    referenceId?: string,
    userId: string = 'user-102938'
  ): { balances: WalletBalances; transaction: Transaction } {
    if (amount <= 0) {
      throw new Error('Deposit amount must be greater than zero');
    }

    const currentBalances = db.getBalances();
    const newPlayable = currentBalances.playable + amount;
    const newTotal = currentBalances.withdrawable + newPlayable;

    const updatedBalances: WalletBalances = {
      ...currentBalances,
      total: newTotal,
      playable: newPlayable,
    };

    db.updateBalances(updatedBalances);

    const methodName = paymentMethod.toLowerCase().includes('cbe') ? 'CBE Birr' : 'Telebirr';
    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      userId,
      title: `Deposit (${methodName})`,
      meta: referenceId ? `Ref: ${referenceId}` : 'Completed',
      amount,
      currency: currentBalances.currency,
      type: 'positive',
      icon: '↓',
      status: 'completed',
      timestamp: new Date().toISOString(),
    };

    db.addTransaction(transaction);

    return { balances: updatedBalances, transaction };
  }

  public static withdraw(
    amount: number,
    accountNumber: string = '0912345678',
    userId: string = 'user-102938'
  ): { balances: WalletBalances; transaction: Transaction } {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be greater than zero');
    }

    const currentBalances = db.getBalances();
    if (amount > currentBalances.withdrawable) {
      throw new Error(
        `Insufficient withdrawable funds. Max withdrawable: ${currentBalances.withdrawable} ${currentBalances.currency}`
      );
    }

    const newWithdrawable = currentBalances.withdrawable - amount;
    const newTotal = newWithdrawable + currentBalances.playable;

    const updatedBalances: WalletBalances = {
      ...currentBalances,
      total: newTotal,
      withdrawable: newWithdrawable,
    };

    db.updateBalances(updatedBalances);

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      userId,
      title: `Withdrawal to ${accountNumber}`,
      meta: 'Today · Completed',
      amount,
      currency: currentBalances.currency,
      type: 'negative',
      icon: '↑',
      status: 'completed',
      timestamp: new Date().toISOString(),
    };

    db.addTransaction(transaction);

    return { balances: updatedBalances, transaction };
  }

  public static creditReward(
    amount: number,
    title: string,
    icon: string = '🎁',
    userId: string = 'user-102938'
  ): { balances: WalletBalances; transaction: Transaction } {
    const currentBalances = db.getBalances();
    const newWithdrawable = currentBalances.withdrawable + amount;
    const newTotal = newWithdrawable + currentBalances.playable;

    const updatedBalances: WalletBalances = {
      ...currentBalances,
      total: newTotal,
      withdrawable: newWithdrawable,
    };

    db.updateBalances(updatedBalances);

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      userId,
      title,
      meta: 'Just now · Completed',
      amount,
      currency: currentBalances.currency,
      type: 'positive',
      icon,
      status: 'completed',
      timestamp: new Date().toISOString(),
    };

    db.addTransaction(transaction);

    return { balances: updatedBalances, transaction };
  }
}
