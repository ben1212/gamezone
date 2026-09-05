# GameZone Frontend

Modern, mobile-first frontend built with **React**, **TypeScript**, and **Modular CSS**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```

---

## 🎮 Game Center Integration

When any game card (Bingo, Keno, Ludo) is opened, it renders the **Game Center** modal component (`src/components/GameCenterModal.tsx`).

The container inside has:
```html
<div id="game-mount-point" data-game-id="bingo">
  <!-- Mount your HTML5 canvas, Phaser instance, iframe, or React game component here -->
</div>
```

You can simply place your game's iframe or mount your game script inside this container.
