# 🏗️ PROJECT: EASY HIT (Architect Harmondez Edition)

## 🎯 VISION & ARCHITECTURE
- **Goal:** High-fidelity 2D tactical card RPG with client-side zero latency, turn-based combat (VEL initiative), Fervor/Ultimate resource system, and addictive PvE campaign progression inspired by *Heroes of Camelot*.
- **Environment:** 100% static client deployment compatible with **GitHub Pages**. No backend dependencies.
- **Tech Stack:** Vanilla JS (ES6 Modules), GSAP (Animation Engine), Cropper.js (Image handling), CSS3 (Flexbox/Grid/Glassmorphism).
- **System Architecture:** 3-module structural separation — no circular dependencies:
  - `engine.js`: Pure mathematics, turn order/resolution, 18 passive abilities, 6 ultimates, squad calculations, victory conditions, enemy rosters, localStorage persistence + validation.
  - `ui.js`: Presentation layer, DOM manipulation, card preview, image cropping, turn bar, fervor bars, damage floats, animations, reward modal, library/inventory rendering, XSS sanitization (`esc()`).
  - `main.js`: System initialization, global state machine (`transitionState`), event delegation, tab navigation, coliseum combat handler, PvE adventure handler, reward flow.

---

## ⚔️ COMBAT FLOWS (Step-by-Step)

### 1. Arena Mode (1v1 Coliseum)
1. **Initiation:** Two fighters selected from `#selectF1`/`#selectF2`. Cards deep-cloned via `JSON.parse(JSON.stringify())`. `buildTurnOrder()` creates queue sorted by VEL descending.
2. **Turn Loop** (via `#btnNextRound`):
   - **Step A:** Dequeue next combatant from turn queue.
   - **Step B:** `applyRoundStartPassives()` triggers (double_strike, shield_recharge, init_poison, etc.).
   - **Step C:** `procesarAtaque(attacker, defender)` calculates damage via `calcularDetalleDaño()` — DEF absorbs first, remaining goes to HP. Minimum 10 HP damage guaranteed.
   - **Step D:** Fervor gain: attacker gets `FERVOR_PER_ATTACK` (1), defender flagged with `_wasHit` → gets `FERVOR_PER_HIT` (1) on their OWN next turn start.
   - **Step E:** If attacker Fervor = 10 → Ultimate fires (piercing/poison/multiplier).
   - **Step F:** `processPostDamagePassives()` handles reflect, block_heal, hp_convert, def_convert.
   - **Step G:** `verifyVictory()` checks if either fighter HP ≤ 0 (including revived case).
3. **Resolution:** Winner declared. `showRewardModal()` in PvE mode.

### 2. Campaign Mode (5v5 PvE)
1. **Map:** Canvas with nodes 1-1 through 1-5. Sequential unlock progression. Energy cost per attempt.
2. **Team Selection:** `#teamSelectionOverlay` — pick up to 5 cards from library.
3. **Combat** (via `#btnPvENextTurn`):
   - Same `resolveCombatTurn()` function handles both Coliseum and PvE.
   - Turn queue includes 5 allies + up to 5 enemies (interleaved by VEL).
   - Allies target by `findFirstAliveIndex(enemies)`, enemies target by `findFirstAliveIndex(party)`.
   - `verifyPartyVictory()` checks all enemies dead (victory) or all allies dead (defeat).
4. **Post-Combat:** `showRewardModal()` with gold/XP/items. `CustomEvent('rewardsClaimed')` triggers result overlay.

---

## 📜 THE GOLDEN RULES (NEVER BREAK)

1. **The 7400 Balance:** `HP + DEF + ATQ + (VEL × 2) ≤ 7400`. VEL range 50–500 with `VEL_WEIGHT = 2`. `validateCardStats()` and `saveCard()` enforce hard reject (blocks saving, shake error, alert). Bosses are structurally exempt.
2. **Mythic Threshold:** Any card with total stats ≥ 7400 gets premium CSS visual effects (gold glow, mythic border).
3. **Combat Math:** Damage reduces DEF first (shield). Once DEF ≤ 0, remaining damage reduces HP. Guaranteed minimum 10 HP damage per hit (desgaste). Supports overkill tracking via negative HP.
4. **Turn Order:** Strictly sorted by VEL descending. Interleaved (not team blocks). All combatants get exactly one action per round.
5. **Fervor Economy:** MAX_FERVOR=10. +1 on turn start, +1 on attacking, +1 when attacked (applied on defender's NEXT turn via `_wasHit` flag). Ultimate auto-fires at 10.
6. **Defensive DOM:** Every DOM lookup guarded: `if (element) { ... }`. All events via `safeListener()`. All innerHTML via `esc()` sanitizer.
7. **No Placeholders:** Deliver complete functions ready for integration, never `// the rest remains the same`.

---

## 🌐 LOCAL DEVELOPMENT PROTOCOL (CORS BYPASS)

ES6 Modules require a local HTTP server — `file://` protocol breaks CORS.
- **Staging:** `python -m http.server 8765 --directory "I:\easy_hit"` or `npx http-server -p 8765`.
- **Tests:** Point Playwright to `http://localhost:8765/index.html`.
- **Verification:** `Get-Process -Name "python" -ErrorAction SilentlyContinue`

---

## 🧠 CONTEXT SKILLS (Workflow Commands)
- `skill:update_root`: Read all 3 modules and update this CLAUDE.md status.
- `skill:forge_check`: Validate that a new card or passive doesn't break the 7400 balance.
- `skill:combat_test`: Run a mental simulation of a combat log to verify math accuracy.

---

## 📂 MODULE MAP

### `engine.js` (~666 lines)
- **System Constants:** `MAX_FERVOR=10`, `STAT_LIMIT=7400`, `VEL_WEIGHT=2`, `VEL_MIN=50`, `VEL_MAX=500`, `FERVOR_PER_TURN/ATTACK/HIT`.
- **ULTIMATE_DB:** 6 entries — cataclysm_nova (×3.0 Fuego), storm_judgment (piercing + ×2.5), verdant_wrath (poison), temporal_vortex (×2.0 disable), celestial_barrier (×0.8 team shield), nether_strike (×2.5 true damage).
- **Combat Engine:** `buildTurnOrder(party, enemies)`, `resolveCombatTurn(state)`, `procesarAtaque(atk, def, ...)`, `calcularDetalleDaño()`, `verifyVictory()`, `verifyPartyVictory()`.
- **Passive System:** `applyRoundStartPassives()` — 8 round-start passives (prog_drain_def, double_strike, shield_recharge, init_poison, gen_steal_stats, prog_scale_stats, fen_revive, nem_element_ward). `processPostDamagePassives()` — 6 post-damage passives (abs_reflect, abs_def_convert, abs_hp_convert, gen_block_heal, life_leech, void_void).
- **Card Lifecycle:** `initializeCard()`, `validateCardStats()`, `saveCard()`, `deleteCard()`, `importCards()`, `loadLibrary()`, `syncStorage()`.
- **Rosters:** `ENEMY_ROSTER` (coliseum opponents), `ENEMY_SQUAD_ROSTER` (5v5 squads with VEL), `getSquadForStage()`.

### `ui.js` (~1590 lines)
- **Sanitization:** `esc(s)` — replaces `&<>"'` with HTML entities.
- **Dictionaries:** `elementConfigs` (Fire/Water/Lightning/Nature), `classIcons` (6 classes), `passiveNames` (18 passives).
- **Navigation:** `showSection(section)` — hides/shows sections via `ALL_SECTION_IDS`, tab active states.
- **Card Preview:** `updatePreview(img)`, `updateRemainingPoints()` — real-time stat feedback with VEL.
- **Library:** `displayCards(searchTerm)`, `renderCardDetail(card)`, `window.selectLibraryCard(id)`.
- **Coliseum:** `renderSelector()`, `renderArenaFighters()`, `refreshFighterStats()`, `setActiveHighlight()`, `clearActiveHighlight()`.
- **Combat UI:** `renderTurnBar(queue, currentIdx)` (2A), fervor bars (2B), `spawnDmgFloat()` (2D), `playUltimateAnimation()` (2E), `playDeathAnimation()` (2E), `animateCombatHit()` (2E).
- **PvE:** `renderPvEArena(arena)`, `fillTeamSlot()`, `openCardPicker()`, `closeCardPicker()`.
- **Rewards:** `showRewardModal(rewards)` (2F) — `CustomEvent('rewardsClaimed')`.
- **Image:** `handleFileSelect(e)`, `applyCrop(callback)`, `resetCropperData()`.
- **Export/Import:** `exportarBiblioteca()`, `importarBiblioteca()`.
- **Utilities:** `logConsole()`, `updateHUD()`, `showComingSoon()`.
- **Known issue:** `fen_antimatter` passive is listed in HTML `<select>` but has no engine logic.

### `main.js` (~746 lines)
- **State:** `gameState` — resources (gold/gems/energy), currentSection, coliseumCombat, adventureCombat, adventure progress.
- **Navigation:** `ACTIVE_SECTIONS = ['library', 'creator', 'coliseo', 'adventure']`, `LOCKED_SECTIONS = ['inventory', 'shop']`.
- **Transition:** `transitionState(target)` — GSAP fade, section switch, enter/exit hooks.
- **Creator:** `saveCardBtn` click handler — validates name, stats (7400), saves via Engine.
- **Coliseum:** `processColiseumTurn()` — draws from turn queue, resolves combat, checks victory.
- **Adventure:** `startPvE()` — loads squad, builds turn queue, `processPvETurn()` — resolves combat, checks party victory, shows reward modal.
- **Hooks:** `onSectionEnter['adventure']` renders map, `onSectionEnter['library']` refreshes cards.

---

## 🚀 CURRENT FOCUS: FASE 03 — Story Panels + Loot Tables

**Next Milestones:**
- Phase 03: Story panels between stages, loot table drops, stage polish
- Phase 04: Boss Altar dedicated UI
- Phase 05: Inventory grid (unlock `#tab-inventory`)
- Phase 06: Card Forge (fusion + upgrade)

See `Plan_12_fases.md` for full roadmap.

---

## 🛠️ ENGINEERING STANDARDS (Quality & Efficiency)
- **DRY:** Only output specific functions/lines that changed. Use search/replace edits.
- **Defensive Programming:** Always validate inputs. Clone combat cards via `JSON.parse(JSON.stringify())`. Guard DOM with `if (el)`.
- **Pure Functions:** `engine.js` math is DOM-independent. Takes inputs, returns values.
- **Concise Code:** Prefer ternary operators and arrow functions.
- **No Hallucinations:** If a variable isn't in scope, ASK before inventing.

## 📉 TOKEN SAVING PROTOCOLS
1. **Brief Responses:** Skip conversational fluff. Go straight to code or technical explanation.
2. **Context Awareness:** Do not re-explain the 7400 rule unless logic changes.
3. **Diffs over Full Rewrites:** Search/replace format for code updates.
4. **Selective Context:** Read `ui.js` for visual tasks, `engine.js` for mathematical tasks.

---

## 📂 APPLICATION STATE & ROUTING (SPA)

### Navigation Matrix
```javascript
ACTIVE_SECTIONS = ['library', 'creator', 'coliseo', 'adventure']
LOCKED_SECTIONS = ['inventory', 'shop']
ALL_SECTION_IDS = ['section-library', 'creatorMainGroup', 'section-coliseo',
                   'section-adventure', 'section-inventory', 'section-shop']
```

- **Locked sections** (`inventory`, `shop`) show `showComingSoon()` toast.
- `transitionState()` uses GSAP fade transitions via `onSectionEnter`/`onSectionExit` hooks.

### Adventure Campaign State
```javascript
gameState.adventure = {
  currentStage: '1-1',
  selectedTeam: [],      // max 5 cards
  activeEnemySquad: [],  // enemies from getSquadForStage()
  stageProgress: { '1-1': 'available', '1-2': 'locked', ... '1-5': 'locked' },
  turnCount: 0
}
```

### Test Suite
- `tests/engine.unit.mjs` — 58 Node.js unit tests (pure engine logic, injects to globalThis).
- `tests/browser.test.mjs` — Playwright integration tests (requires `python -m http.server 8765`).
- Run with: `node tests/engine.unit.mjs` / `node tests/browser.test.mjs`.
