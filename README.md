<div align="center">

# 🃏 Easy Hit — Tactical Card RPG

[![Play Now](https://img.shields.io/badge/▶_PLAY_NOW-Easy_Hit-FF6B35?style=for-the-badge&logo=github&logoColor=white)](https://harmondez.github.io/easy_hit/)
[![Status](https://img.shields.io/badge/Status-In_Development-22c55e?style=flat-square)](https://harmondez.github.io/easy_hit/)
[![Version](https://img.shields.io/badge/version-2.0.0-blue?style=flat-square)](https://harmondez.github.io/easy_hit/)
[![Platform](https://img.shields.io/badge/platform-Web-orange?style=flat-square)]()

**Unleash the hunt. Target your prey. Earn your power.**

Easy Hit is a 2D Card RPG that strips away gacha luck and replaces it with pure tactical grit. Strength isn't pulled from a pack—it's forged through strategy.

[▶ Play Now](https://harmondez.github.io/easy_hit/) · [Report Bug](https://github.com/harmondez/easy_hit/issues) · [Features](#-game-modes)

---

</div>

## ⚔️ Combat System

**Simultaneous Clash Engine** — cards attack and defend at the same time.

- **DEF as Shield:** ATQ damage hits DEF first. When DEF breaks, remaining damage strikes HP.
- **Minimum Wear:** Every hit deals at least 10 HP damage, keeping fights decisive.
- **Passive Abilities:** 30+ passives across 7 families (Genesis, Nemesis, Progression, Phoenix, Reactive, Post-Damage, Warlord).
- **Victory Condition:** First fighter at 0 HP loses.

### 7400 Balance Rule

Every player card is capped at **7400 total stats** (HP + ATQ + DEF). Distribute wisely—there's no second chance.

---

## 🎮 Game Modes

| Mode | Description | Status |
|------|-------------|--------|
| **🏗️ Forge** | Create custom cards with sliders, pick elements/classes/passives, and preview live | ✅ Live |
| **📚 Library** | Browse, search, and manage your entire card collection | ✅ Live |
| **🏟️ Coliseum** | 1v1 PvP arena with full passive processing, round-by-round combat log | ✅ Live |
| **🗺️ Adventure** | Single-hero roguelike run — combat/upgrade/boss nodes, item drops, potions | ✅ Live |
| **🏆 Tournament** | 16-fighter bracket with automated seeding, rounds, and champion crowning | ✅ Live |
| **🖼️ Gallery** | Official card roster with search, filter, and detail view | ✅ Live |
| **📦 Inventory** | Items, materials, and consumables — filterable grid | ✅ Live |
| **🏪 Shop** | Card packs and resource bundles | 🔒 Phase 7 |

---

## 🧬 Elements & Classes

| Elements | Classes |
|----------|---------|
| Fire, Water, Nature, Lightning, Wind, Light, Darkness | Robot, Dragon, Human, Spectre, Neutral |

---

## 🧠 AI Assistant (Developer Tool)

```bash
python ai_assistant.py --help
```

Senior game design advisor with RAG (ChromaDB + OpenAI). Indexes engine.js for semantic search, tracks API costs, maintains persistent memory.

> ⚠️ ~50% accuracy — use for brainstorming only. Never trust AI for balance decisions without human review.

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/harmondez/easy_hit.git

# 2. Serve locally
python -m http.server 8080

# 3. Open browser
start http://localhost:8080
```

> Requires Python 3.x for local server. No build step—vanilla JS with ES6 modules.

---

## 🛠️ Stack

| Layer | Technology |
|-------|-----------|
| **Core** | Vanilla JS (ES6 Modules) |
| **Layout** | HTML5 + CSS3 (Grid, Flexbox, Custom Properties) |
| **Storage** | Browser localStorage |
| **AI** | Python + ChromaDB + OpenAI API |
| **Assets** | WebP images, Cropper.js |

---

## 📜 Proprietary Notice

⚠️ **Easy Hit is a commercial project by Harmondez.** The code and assets in this repository are for **demonstration purposes only**. This is not an open-source project. All rights reserved. Commercial use, redistribution, or unauthorized modification is strictly prohibited.

<div align="center">

*Built for the next generation of TCG players. Prepared for Steam.*

[▶ Play Easy Hit Now](https://harmondez.github.io/easy_hit/)

</div>
