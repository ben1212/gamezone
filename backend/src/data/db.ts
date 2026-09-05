import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Transaction, UserProfile, WalletBalances } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

interface Schema {
  user: UserProfile;
  balances: WalletBalances;
  transactions: Transaction[];
}

class Database {
  private data: Schema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): Schema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.warn('⚠️ Could not load database.json, initializing with default empty schema:', err);
    }

    const defaultData: Schema = {
      user: {
        id: 'user-1',
        telegramId: '',
        name: 'Player',
        username: '@player',
        avatarIcon: '👤',
        phone: '',
        email: '',
        country: '',
        joinedDate: '',
        referralCode: 'GAMEZONE',
        totalReferrals: 0,
        referralBonusETB: 0,
      },
      balances: {
        total: 0,
        withdrawable: 0,
        playable: 0,
        currency: 'ETB',
      },
      transactions: [],
    };
    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(data: Schema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database.json:', err);
    }
  }

  // User
  public getUser(): UserProfile {
    return this.data.user;
  }

  public updateUser(updates: Partial<UserProfile>): UserProfile {
    this.data.user = { ...this.data.user, ...updates };
    this.saveData(this.data);
    return this.data.user;
  }

  // Wallet
  public getBalances(): WalletBalances {
    return this.data.balances;
  }

  public updateBalances(balances: WalletBalances): WalletBalances {
    this.data.balances = { ...balances };
    this.saveData(this.data);
    return this.data.balances;
  }

  // Transactions
  public getTransactions(): Transaction[] {
    return this.data.transactions;
  }

  public addTransaction(tx: Transaction): Transaction {
    this.data.transactions = [tx, ...this.data.transactions];
    this.saveData(this.data);
    return tx;
  }
}

export const db = new Database();
