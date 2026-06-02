# PokerCalc

A mobile poker odds calculator built with React Native and Expo. Designed for live game use — minimum taps to get your outs and percentages instantly. Supports both Texas Hold'em and Omaha (PLO).

---

## Features

- **Card input UI** — Tap a slot, pick a rank, pick a suit. 2 taps per card.
- **All common draw types** — Flush draw, OESD, Gutshot, Two pair draw, Set draw, Full house (two pair & trips), Quads
- **Dual percentage calculation** — Exact combinatorial math + Rule of 2/4 approximation shown side by side
- **Duplicate prevention** — Cards already on the board are grayed out in the picker
- **Texas Hold'em & Omaha** — Switch variants with a single tap
- **Instant results** — Outs and percentages update as soon as you select a draw

---

## Usage

### Step 1 — Choose your variant
Tap **Hold'em** or **Omaha** at the top of the screen. Hold'em gives you 2 hole card slots, Omaha gives you 4.

### Step 2 — Enter your hole cards
Tap an empty card slot under **Your Hand**. A picker will appear:
1. Tap the rank (A, 2, 3 … K)
2. Tap the suit (♠ ♥ ♦ ♣)
The card is placed and the picker closes automatically.

### Step 3 — Enter the community cards
Do the same for the **Flop** (3 cards), and optionally **Turn** and **River** as the hand progresses.

### Step 4 — Select your draw
Once you have at least 2 hole cards and the flop entered, a row of draw chips appears. Tap the hand you are drawing to:
- **Flush Draw** — 4 cards of the same suit, need 1 more
- **Open-Ended Straight Draw** — 4 connected cards, can complete on either end
- **Gutshot Straight Draw** — Missing an inside card to complete the straight
- **Two Pair Draw** — Have one pair, need to pair your second hole card
- **Set Draw** — Have a pocket pair, need the third card
- **Full House (Two Pair → FH)** — Have two pair, need to fill up
- **Full House (Trips → FH)** — Have trips, need any pairing card
- **Quads Draw** — Have a set, need the fourth card

### Step 5 — Read your results
The results panel shows:
- **Outs** — the number of cards in the remaining deck that complete your draw
- **Exact %** — precise probability calculated by enumerating all remaining card combinations
- **Rule of 2/4 %** — quick approximation (outs × 4 on the flop, outs × 2 on the turn)
- **Street context** — "2 cards to come" or "1 card to come"

### Resetting
Tap the **Clear** button in the top right to reset all cards and start a new hand.

---

## Running Locally

### Prerequisites
- [Node.js](https://nodejs.org) (LTS)
- [Expo Go](https://expo.dev/go) app on your Android or iOS device

### Setup
```bash
git clone https://github.com/Athanasioust/PokerCalc.git
cd PokerCalc
npm install --legacy-peer-deps
npx expo start
```

Scan the QR code shown in the terminal with the Expo Go app on your phone.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Language | TypeScript |
| State | React hooks (useState, useMemo) |
| Styling | React Native StyleSheet |
| Poker logic | Custom combinatorial engine (no external libraries) |

---

## Project Structure

```
src/
├── logic/
│   ├── deck.ts            # Card types, suits, ranks, deck generation
│   ├── outsCalculator.ts  # Outs calculation for each draw type
│   └── percentages.ts     # Rule of 2/4 + exact enumeration
├── components/
│   ├── CardSlot.tsx        # Tappable card placeholder
│   ├── CardPicker.tsx      # Bottom sheet rank/suit selector
│   ├── DrawSelector.tsx    # Scrollable draw type chips
│   └── ResultsPanel.tsx    # Outs + percentage display
└── screens/
    └── MainScreen.tsx      # Main app screen
```
