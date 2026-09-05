# GameZone Backend API

Backend API service for GameZone built with **Node.js**, **Express**, and **TypeScript**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

---

## 📡 API Endpoints

### 🩺 System
- `GET /api/health`: Health status & server uptime.

### 💰 Wallet & Transactions
- `GET /api/wallet/balances`: Get current total, withdrawable, and playable balances.
- `GET /api/wallet/transactions`: Fetch transaction history.
- `POST /api/wallet/deposit`: Deposit ETB (via Telebirr / CBE Birr).
  ```json
  { "amount": 500, "paymentMethod": "telebirr" }
  ```
- `POST /api/wallet/withdraw`: Withdraw ETB to account.
  ```json
  { "amount": 200, "accountNumber": "0912345678" }
  ```

### 👤 User & Profile
- `GET /api/user/profile`: Retrieve user details.
- `PUT /api/user/profile`: Update name, phone number, email.

### 👥 Referrals
- `GET /api/referrals`: Get referral code, referral statistics, and accrued bonus.
- `POST /api/referrals/claim`: Claim accumulated referral rewards directly into the wallet.
