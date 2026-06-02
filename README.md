# PokerCalc

A mobile poker odds calculator built with React Native and Expo. Designed for live game use — minimum taps to get your outs and percentages instantly. Supports both Texas Hold'em and Omaha (PLO).

---

## Features

### Calculator
- **2-tap card input** — Tap a slot, pick rank, pick suit. Picker closes automatically.
- **Long-press to remove** — Long-press any filled card to clear it; tap to change it.
- **8 draw types** — Flush draw, OESD, Gutshot, Two pair draw, Set draw, Full house (two pair & trips), Quads
- **Combo draw detection** — Automatically detects flush + OESD or flush + gutshot combinations with combined outs
- **Dual percentage display** — Exact combinatorial math + Rule of 2/4 approximation side by side
- **Current hand display** — Shows your best made hand in real time (One Pair, Flush, etc.)
- **Duplicate prevention** — Already-used cards are grayed out in the picker
- **Texas Hold'em & Omaha** — Switch variants with a single tap

### Pot Odds
- Enter pot size and bet to call
- Instantly see if you have the equity to call
- Shows exact breakeven % vs your current equity with CALL / FOLD verdict

### Equity Calculator
- **Multi-way equity** — Add up to 3 villains and calculate your win/tie/loss % across all of them
- Results shown as a colour-coded bar with exact percentages
- Requires flop to be entered (prevents device-crashing pre-flop enumeration)

### Session Tracker
- Start a session with a buy-in amount
- End the session with a cash-out to record profit/loss
- Tracks all-time stats: total sessions, total P&L, hourly rate

### Hand History
- Hands are saved automatically when you get results
- Shows hole cards, board, made hand, draw type, outs and exact %
- **Share any hand** — tap "Share Hand" to export a formatted hand summary via the system share sheet
- Stores up to 20 recent hands

### Reference Sheet
- Full outs cheat sheet for all common draw types
- Rule of 2/4 quick-reference table
- Complete hand rankings

### Settings
- **Theme** — System / Light / Dark, persisted across app restarts
- **Default variant** — Set Hold'em or Omaha as your default
- **Haptic feedback** — Toggle vibration on/off
- **Clear history** — Wipe all saved hands

---

## Download

The latest APK can be built via [EAS Build](https://expo.dev/eas). See **Running Locally** below for setup.

---

## Screenshots

> Coming soon

---

## Usage

### Step 1 — Choose your variant
Tap **Hold'em** or **Omaha** at the top of the screen.

### Step 2 — Enter your hole cards
Tap an empty card slot under **Your Hand**:
1. Tap the rank (A, 2, 3 … K)
2. Tap the suit (♠ ♥ ♦ ♣)

The card is placed and the picker closes automatically. Long-press a filled card to remove it.

### Step 3 — Enter the community cards
Do the same for the **Flop** (3 cards), and optionally **Turn** and **River**.

### Step 4 — Select your draw
Once you have at least 2 hole cards and the flop, draw chips appear. Tap what you're drawing to:

| Draw | Typical Outs |
|---|---|
| Flush Draw | 9 |
| Open-Ended Straight Draw | 8 |
| Flush + OESD (combo) | 15 |
| Gutshot Straight Draw | 4 |
| Two Pair Draw | ~5 |
| Set Draw | 2 |
| Full House (Two Pair) | 4 |
| Full House (Trips) | 7 |
| Quads Draw | 1 |

### Step 5 — Read your results
- **Outs** — cards that complete your draw
- **Exact %** — precise probability via full enumeration
- **Rule of 2/4 %** — quick mental approximation

### Pot Odds
Scroll down, enter the pot and bet size. The app tells you if you have enough equity to call.

### Equity vs Villain
Enter opponent hole cards and tap **+ Add Villain** for multi-way pots. Results appear automatically once the flop is entered.

### Session Tracker
Tap the 💰 tab. Press **Start New Session**, enter your buy-in, and tap **End Session** when you leave the table.

---

## Running Locally

### Prerequisites
- [Node.js](https://nodejs.org) LTS
- [Expo Go](https://expo.dev/go) app on your Android or iOS device

### Setup
```bash
git clone https://github.com/Athanasioust/PokerCalc.git
cd PokerCalc
npm install --legacy-peer-deps
npx expo start
```

Scan the QR code with Expo Go. Make sure your phone and computer are on the same Wi-Fi network.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Language | TypeScript |
| State | React hooks (useState, useMemo, useEffect) |
| Persistence | AsyncStorage (history, sessions, settings) |
| Styling | React Native StyleSheet with light/dark theme |
| Poker logic | Custom combinatorial engine — no external poker libraries |

---

## Project Structure

```
src/
├── logic/
│   ├── deck.ts              # Card types, suits, ranks, deck generation
│   ├── outsCalculator.ts    # Outs calculation + combo draw detection
│   ├── percentages.ts       # Rule of 2/4 + exact combinatorial enumeration
│   ├── handEvaluator.ts     # Best-hand evaluator (high card → royal flush)
│   ├── equity.ts            # Heads-up and multi-way equity calculation
│   ├── history.ts           # Hand history persistence (AsyncStorage)
│   └── sessions.ts          # Session tracking persistence (AsyncStorage)
├── components/
│   ├── CardSlot.tsx         # Tappable card placeholder with haptics
│   ├── CardPicker.tsx       # Bottom sheet rank/suit selector
│   ├── DrawSelector.tsx     # Scrollable draw type chips
│   ├── ResultsPanel.tsx     # Outs + percentage display
│   ├── HandDisplay.tsx      # Current best hand indicator
│   ├── PotOdds.tsx          # Pot odds calculator with call/fold verdict
│   ├── EquityCalculator.tsx # Multi-way equity with villain card slots
│   └── ErrorBoundary.tsx    # Catches runtime crashes gracefully
├── screens/
│   ├── MainScreen.tsx       # Calculator tab
│   ├── HistoryScreen.tsx    # Saved hands with share feature
│   ├── SessionScreen.tsx    # Session tracker with P&L stats
│   ├── ReferenceScreen.tsx  # Outs cheat sheet + hand rankings
│   └── SettingsScreen.tsx   # Theme, variant, haptics, data management
├── theme.ts                 # Light and dark colour palettes
└── ThemeContext.tsx          # Theme provider with system/manual override
```
