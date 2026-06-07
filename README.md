# PokerCalc

A mobile poker odds calculator built with React Native and Expo. Designed for live game use — minimum taps to get your outs and percentages instantly. Supports both Texas Hold'em and Omaha (PLO).

---

## Features

### Calculator
- **2-tap card input** — Tap a slot, pick rank, pick suit. Picker closes automatically.
- **Long-press to remove** — Long-press any filled card to clear it; tap to change it.
- **8 draw types** — Flush draw, OESD, Gutshot, Two pair draw, Set draw, Full house (two pair & trips), Quads
- **Combo draw detection** — Automatically detects flush + OESD or flush + gutshot combinations with combined outs and exact %
- **Dual percentage display** — Exact combinatorial math + Rule of 2/4 approximation side by side
- **Current hand display** — Shows your best made hand in real time (One Pair, Flush, etc.)
- **Hand strength percentile** — "Beats X% of hands" shown alongside your made hand; colour-coded green/amber/red
- **Board texture labels** — Instant Dry / Semi-wet / Wet · Rainbow / Two-tone / Monotone · Unpaired / Paired / Trips pills below the flop
- **Duplicate prevention** — Already-used cards are grayed out in the picker
- **Texas Hold'em & Omaha** — Switch variants with a single tap; villain slots auto-adjust to 4 cards in Omaha

### Pot Odds, SPR & Implied Odds
- Enter pot size and bet to call; optionally add effective stack
- **SPR (Stack-to-Pot Ratio)** — stack ÷ pot with interpretation label (Low / Medium / High implied-odds spot)
- **Implied odds** — if equity is below pot odds, shows the exact dollar amount you need to win on future streets to break even
- CALL / FOLD verdict with exact margin above/below breakeven

### Equity Calculator
- **Pre-flop equity** — Monte Carlo sampling (2500 runs) for instant heads-up and multi-way equity before the flop
- **Multi-way equity** — Add up to 3 villains and calculate your win/tie/loss % across all of them
- **Villain range mode** — Assign an entire hand range instead of specific cards; pair-sampled Monte Carlo keeps calculations smooth even on large ranges
- **Hand distribution** — Breakdown of hand types you make across all runouts (Flush 18% · Two Pair 24% · etc.) in Advanced Mode
- Results shown as a colour-coded bar with exact percentages

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

SOON

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
- **Board texture** — three pills appear below the board (e.g. Wet · Two-tone · Unpaired) as soon as the flop is complete
- **Hand strength** — the Current Hand banner shows "Beats X% of hands" so you know how strong your holding is relative to all possible villain cards on this board

### Pot Odds
Scroll down, enter the pot and bet size. Add your effective stack to see the SPR. If your equity falls below pot odds, the implied odds box tells you exactly how much more you need to win on later streets to break even.

### Equity vs Villain
Enter opponent hole cards and tap **+ Add Villain** for multi-way pots. Switch to Range mode to assign a hand range instead of specific cards. Results appear automatically once the flop is entered; pre-flop equity is also calculated via Monte Carlo.

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
│   ├── equity.ts            # Heads-up, multi-way, and range equity (Monte Carlo)
│   ├── boardTexture.ts      # Board texture analysis (wetness, suitedness, pairedness)
│   ├── handStrength.ts      # Hand strength percentile vs all possible villain holdings
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
