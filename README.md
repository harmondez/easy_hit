<div align="center">

# 🃏 Easy Hit — Tactical Card RPG

[![Play Now](https://img.shields.io/badge/▶_PLAY_NOW-Easy_Hit-FF6B35?style=for-the-badge&logo=github&logoColor=white)](https://harmondez.github.io/easy_hit/)
[![Status](https://img.shields.io/badge/Status-In_Development-22c55e?style=flat-square)](https://harmondez.github.io/easy_hit/)
[![Platform](https://img.shields.io/badge/platform-Web-orange?style=flat-square)]()
[![Stack](https://img.shields.io/badge/stack-Vanilla_JS_%2F_ES6-f7df1e?style=flat-square&logo=javascript&logoColor=black)]()
[![No Backend](https://img.shields.io/badge/backend-none_(100%25_client)-blue?style=flat-square)]()
[![License](https://img.shields.io/badge/license-Proprietary-lightgrey?style=flat-square)](#-proprietary-notice)

**No packs. No pulls. No luck. Just simultaneous clashes, Fervor, and the champion you picked.**

Easy Hit is a simultaneous-combat tactical card RPG that runs entirely in your browser — no server, no build step, no gacha. Pick any of the 22 official champions and every fighter's power comes from how its stats were distributed across a hard budget and which passive it was paired with — never from luck.

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
- **A stat budget, not a card pool.** Every card you forge is capped at a hard **7,400-point budget** across HP, DEF, and ATQ. Skill is in the distribution, not the drop rate.
- **Simultaneous combat, always 1v1.** Every round, both fighters land their hit at the same time — no turn queue, no initiative stat to game. Coliseum, Tournament, and every Adventure encounter are all one hero against one foe.
- **A resource you have to earn mid-fight.** Fervor builds from taking a round, attacking, and getting hit. Hit 10 and your Ultimate fires that same round — no cooldowns, no cast bar, just pressure.

---

## 🎮 Game Modes

Easy Hit currently ships as a focused 1v1 experience: pick a champion, fight. The card-forging and roguelike systems still exist in the codebase and can come back later, they're just not part of the current front door.

| Mode | Description | Status |
|------|-------------|:------:|
| **📚 Library** | Landing page — browse all 22 official champions, full stats, passive, and ultimate for each | ✅ Live (default screen) |
| **⚔️ Duelos** (Coliseum) | 1v1 arena — simultaneous rounds, full passive resolution, live combat log | ✅ Live |
| **🏆 Torneo** (Tournament) | 16-fighter bracket, randomized seeding, single elimination, champion crowning | ✅ Live |
| **🏗️ Forge** | Build custom cards with live stat sliders, elements, classes, passives, and image cropping | 🚧 Hidden — code intact |
| **🗺️ Adventure** | Single-hero roguelike run: combat, upgrade, and boss nodes, item drops, potions | 🚧 Hidden — code intact |
| **📦 Inventory** | Materials, consumables, and equipment | 🚧 Hidden — code intact |
| **🏪 Shop** | Card packs and resource bundles | 🚧 Hidden — code intact |

---

## ⚔️ Combat System

**Simultaneous Clash Engine** — every fight is 1v1. Each round, both fighters resolve their hit at the same time — no turn queue, no speed stat, no waiting your turn.

- **DEF as a shield:** incoming damage depletes DEF first; once it's gone, the remainder hits HP.
- **Guaranteed wear:** every hit deals at least 10 HP of damage — no fight stalls out on pure mitigation.
- **Fervor & Ultimates:** every fighter builds Fervor (0–10) by taking a round, attacking, and getting hit. At 10, their Ultimate fires that same round — one of 7 distinct effects (nova damage, piercing, poison, healing, stat theft, shielding).
- **27 passive abilities** across 8 families — Genesis (round-one setups), Nemesis (matchup counters), Progression (per-round scaling), Reactive, Post-Damage, Phoenix (death-defying thresholds), boss-exclusive, and run-exclusive passives found only in Adventure.

### The 7,400 Balance Rule

Every player card is capped at **`HP + DEF + ATQ ≤ 7,400`**. Push one stat, sacrifice another — there's no way to max everything. Bosses are the deliberate exception.

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
