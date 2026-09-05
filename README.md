# GameZone Web Application

Full-stack application cleanly organized into separate **`frontend/`** and **`backend/`** folders.

---

## 📁 Repository Structure

```
Gamezone/
├── package.json              # Root scripts to run frontend & backend
├── README.md                 # Project guide
│
├── frontend/                 # React 18 + TypeScript + CSS (Vite)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts        # Proxies /api to http://localhost:5000
│   └── src/
│       ├── main.tsx
│       ├── App.tsx           # State, routing, backend auto-sync
│       ├── components/
│       │   ├── TopBanner.tsx
│       │   ├── GameCard.tsx
│       │   ├── GameCenterModal.tsx # Empty mount container ready for your game
│       │   ├── TransactionItem.tsx
│       │   ├── Modal.tsx
│       │   └── QuickActionModal.tsx # Deposit, Withdraw, Referrals, Profile
│       ├── pages/
│       │   ├── DashboardPage.tsx
│       │   ├── WalletPage.tsx
│       │   └── ProfilePage.tsx
│       ├── services/api.ts
│       └── styles/
│
└── backend/                  # Node.js + Express + TypeScript
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    └── src/
        ├── index.ts          # Server entry (port 5000)
        ├── app.ts            # Express app & middleware
        ├── services/         # Wallet & Transactions logic
        ├── controllers/      # Wallet, User, Referral controllers
        ├── routes/           # REST endpoints (/api/wallet, /api/user, etc.)
        └── data/             # Persistent data store (database.json)
```

---

## 🎮 Game Center Container

The Game Center UI is an empty viewport container located at:
`frontend/src/components/GameCenterModal.tsx`

When you're ready to add your game:
1. Open any game card on the dashboard (Bingo, Keno, Ludo).
2. The modal loads with an empty container with `id="game-mount-point"`.
3. Simply mount your canvas, iframe, or React component inside `#game-mount-point`.

---

## 🚀 How to Run

### 1. Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev
```
*API runs on `http://localhost:5000`.*

### 2. Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
*Web app runs on `http://localhost:3000`.*
