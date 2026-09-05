<div align="center">

# 🃏 Easy Hit — Tactical Card RPG

[![Play Now](https://img.shields.io/badge/▶_PLAY_NOW-Easy_Hit-FF6B35?style=for-the-badge&logo=github&logoColor=white)](https://harmondez.github.io/easy_hit/)
[![Status](https://img.shields.io/badge/Status-In_Development-22c55e?style=flat-square)](https://harmondez.github.io/easy_hit/)
[![Platform](https://img.shields.io/badge/platform-Web-orange?style=flat-square)]()
[![Stack](https://img.shields.io/badge/stack-Vanilla_JS_%2F_ES6-f7df1e?style=flat-square&logo=javascript&logoColor=black)]()
[![No Backend](https://img.shields.io/badge/backend-none_(100%25_client)-blue?style=flat-square)]()
[![License](https://img.shields.io/badge/license-Proprietary-lightgrey?style=flat-square)](#-proprietary-notice)

**No packs. No pulls. No luck. Just VEL order, Fervor, and the hit you built.**

Easy Hit is a turn-based tactical card RPG that runs entirely in your browser — no server, no build step, no gacha. Every fighter's power comes from how you distribute a hard stat budget and which passive you paired it with, not from what you were lucky enough to pull.

[▶ Play Now](https://harmondez.github.io/easy_hit/) · [Report a Bug](https://github.com/harmondez/easy_hit/issues) · [Game Modes](#-game-modes) · [Combat System](#%EF%B8%8F-combat-system)

</div>

---

## 📖 Table of Contents

- [Why Easy Hit](#-why-easy-hit)
- [Game Modes](#-game-modes)
- [Combat System](#️-combat-system)
- [Elements & Classes](#-elements--classes)
- [Quick Start](#-quick-start)
- [Tech Stack](#️-tech-stack)
- [AI Design Assistant](#-ai-design-assistant-developer-tool)
- [Proprietary Notice](#-proprietary-notice)

---

## 💡 Why Easy Hit

- **Zero latency, zero backend.** Everything — combat math, card storage, progression — runs client-side. Open `index.html` behind any static server and you're playing.
- **A stat budget, not a card pool.** Every card you forge is capped at a hard **7,400-point budget** across HP, DEF, ATQ, and VEL. Skill is in the distribution, not the drop rate.
- **Initiative-driven combat.** Turns resolve strictly by VEL (speed), interleaved between allies and enemies — not team blocks, not simultaneous clashes. Reading the turn order *is* the strategy.
- **A resource you have to earn mid-fight.** Fervor builds from attacking, getting hit, and surviving turns. Hit 10 and your Ultimate fires — no cooldowns, no cast bar, just pressure.

---

## 🎮 Game Modes

| Mode | Description | Status |
|------|-------------|:------:|
| **🏗️ Forge** | Build custom cards with live stat sliders, elements, classes, passives, and image cropping | ✅ Live |
| **📚 Library** | Browse, search, and manage your full card collection | ✅ Live |
| **🏟️ Coliseum** | 1v1 arena — VEL-ordered turns, full passive resolution, live combat log | ✅ Live |
| **🗺️ Adventure** | Single-hero roguelike run: combat, upgrade, and boss nodes, item drops, potions | ✅ Live |
| **🏆 Tournament** | 16-fighter bracket, randomized seeding, single elimination, champion crowning | ✅ Live |
| **🖼️ Gallery** | Official pre-forged roster — browse, filter, inspect | ✅ Live |
| **📦 Inventory** | Materials, consumables, and equipment dropped from Adventure runs | ✅ Live |
| **🏪 Shop** | Card packs and resource bundles | 🔒 Planned |

---

## ⚔️ Combat System

**VEL-Initiative Engine** — every combatant, ally or enemy, gets exactly one action per round, resolved strictly by VEL (speed) descending and interleaved across both sides. No team blocks, no simultaneous clashes.

- **DEF as a shield:** incoming damage depletes DEF first; once it's gone, the remainder hits HP.
- **Guaranteed wear:** every hit deals at least 10 HP of damage — no fight stalls out on pure mitigation.
- **Fervor & Ultimates:** every fighter builds Fervor (0–10) by taking a turn, attacking, and getting hit. At 10, their Ultimate fires automatically — one of 7 distinct effects (nova damage, piercing, poison, healing, stat theft, shielding).
- **27 passive abilities** across 8 families — Genesis (round-one setups), Nemesis (matchup counters), Progression (per-round scaling), Reactive, Post-Damage, Phoenix (death-defying thresholds), boss-exclusive, and run-exclusive passives found only in Adventure.

### The 7,400 Balance Rule

Every player card is capped at **`HP + DEF + ATQ + (VEL × 2) ≤ 7,400`**, with VEL clamped between 50 and 500. Push one stat, sacrifice another — there's no way to max everything. Bosses are the deliberate exception.

---

## 🧬 Elements & Classes

| Elements | Classes |
|----------|---------|
| Fuego 🔥 · Agua 💧 · Rayo ⚡ · Naturaleza 🌿 · Oscuridad 🌑 · Luz ☀️ | Human · Robot · Dragon · Spectre · Monster · Viking · Pirate · Beast · Alien · Neutral |

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/harmondez/easy_hit.git
cd easy_hit

# 2. Serve locally — ES6 modules need a real HTTP server, file:// won't work
python -m http.server 8765

# 3. Open in browser
start http://localhost:8765
```

> No build step, no `npm install` required to play. Node.js + Playwright/Puppeteer are only needed if you want to run the test suite.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Core** | Vanilla JavaScript (ES6 Modules) — no framework, no bundler |
| **Animation** | GSAP |
| **Image handling** | Cropper.js |
| **Layout** | HTML5 + CSS3 (Grid, Flexbox, Custom Properties, glassmorphism) |
| **Storage** | Browser `localStorage`, no backend |
| **Testing** | Node.js unit tests + Puppeteer/Playwright integration suites |
| **Hosting** | GitHub Pages (static, zero infrastructure) |

---

## 🧠 AI Design Assistant (Developer Tool)

```bash
python ai_assistant.py --help
```

A senior game-design advisor with RAG over `engine.js` (ChromaDB + OpenAI), used for brainstorming balance and mechanics during development. Not part of the shipped game.

> ⚠️ ~50% accuracy — treat as a brainstorming partner, never as the final word on balance.

---

## 📜 Proprietary Notice

⚠️ **Easy Hit is a commercial project by Harmondez.** The code and assets in this repository are for **demonstration purposes only**. This is not an open-source project — no contributions, forks-for-redistribution, or commercial reuse are permitted. All rights reserved.

<div align="center">

*Built for the next generation of TCG players.*

[▶ Play Easy Hit Now](https://harmondez.github.io/easy_hit/)

</div>
