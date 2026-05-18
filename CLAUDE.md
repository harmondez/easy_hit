# 🏗️ PROJECT: EASY HIT (Architect Harmondez Edition)

## 🎯 VISION & ARCHITECTURE
- **Goal:** High-fidelity 2D tactical card RPG with client-side zero latency, deep mathematical combat, and an addictive loop inspired by *Heroes of Camelot*. Supports 1v1 Coliseum matches and 5v5 PvE campaign progression.
- **Environment:** 100% static client deployment compatible with **GitHub Pages**. No backend dependencies.
- **Tech Stack:** Vanilla JS (ES6 Modules), GSAP (Animation Engine), Cropper.js (Image handling), CSS3 (Flexbox/Grid/Glassmorphism).
- **System Architecture:** 5-Module structural separation of concerns to avoid circular dependencies:
  - `engine.js`: Pure mathematics, 5v5 squad calculations, combat loops, state verification, rules validation.
  - `forge.js`: Image processing, cropper management, point distribution validation.
  - `ui.js`: Presentation layer, DOM manipulation, animations, indexed logs, visual dictionaries.
  - `storage.js`: LocalStorage handlers with try/catch blocks, JSON Export/Import verification.
  - `main.js`: System initialization, global state machine, event delegation, window bridge.

---

## ⚔️ COMBAT FLOWS (Step-by-Step)

### 1. Arena Mode (1v1 Coliseum)
1. **Initiation:** Load Fighter 1 & Fighter 2 stats. Reset `roundNum` to 0. Cards are deep-cloned via `JSON.parse(JSON.stringify())` to isolate flags.
2. **Pre-Combat Phase:** Trigger passives that modify base stats before any rounds (e.g., `gen_steal_stats`).
3. **Round Loop:**
   - **Step A (Start):** Trigger "Round Start" passives (e.g., `prog_drain_def`, `prog_scale_stats`).
   - **Step B (Simultaneous Strike):** Both fighters deal damage at the exact same time. Calculate `atk1 vs def2/hp2` AND `atk2 vs def1/hp1` BEFORE updating health values.
   - **Step C (Post-Strike):** Apply "On Damage" reactive passives (e.g., `abs_def_convert`, `abs_hp_convert`, `abs_reflect`).
   - **Step D (Verification):** Check for `Death Prevention` threshold passives (e.g., `fen_revive`).
4. **Resolution:** If any card HP $\le 0$, `verifyVictory()` declares the winner or an absolute draw (double K.O.).

### 2. Campaign Mode (5v5 Frontline Tactical Targeting)
1. **Engine Loop:** `executePartyTurn(party, squad)` operates via two separate consecutive phases per turn:
   - **Allied Phase:** Each living ally (index 0→4) targets the living enemy with the lowest index found via `findFirstAliveIndex()`. Triggers round-start passives and executes simultaneous attacks with indexed labels. If a target dies mid-phase, subsequent allies dynamically target the next living enemy.
   - **Enemy Phase:** Each living enemy (index 0→4) targets the lowest-index living ally using the exact same frontline mechanics.
2. **Safety Valves:** Implements an absolute hard cap of 100 turns in `main.js` to act as a safety valve anti-bucle. Arrays are safely managed upon unit death via `verifyPartyVictory()`.

---

## 📜 THE GOLDEN RULES (NEVER BREAK)
1. **The 7400 Balance:** Every standard player card must sum exactly $HP + DEF + ATK = 7400$. `Engine.saveCard()` applies a *hard reject* (blocks saving, triggers red glow, shake error animations, and an alert) if stats are invalid or exceed 7400.
2. **Boss Scaling Exception:** Campaign Bosses (e.g., Stage 1-5 Orc Inmortal) are structurally exempt from the 7400-point limit. They feature massive overtuned stat pools (e.g., 48,500 total stats) to challenge party synergy.
3. **Mythic Threshold:** Any card with total stats $\ge 7400$ is classified under the unified **Mythic** tier and receives premium CSS visual effects (glows/keyframes).
4. **Combat Math:** Damage reduces DEF first (acting as a shield). Once DEF is 0, the remaining damage reduces HP following the purified formula: `hpDamage = rawDmg - actualDefDmg`. Supports negative numbers for overkill tracking. Combates de desgaste garantizan un mínimo de 10 HP de daño.
5. **Defensive DOM Operations:** Every single DOM manipulation or element lookup in `ui.js` and `main.js` must be wrapped in strict defensive clauses: `if (element) { ... }`.
6. **No Placeholders:** When generating code, do not use `// the rest remains the same` or cutoffs. Deliver complete functions or modules ready for integration.

---

## 🌐 LOCAL DEVELOPMENT PROTOCOL (CORS BYPASS)
Due to the strict use of ES6 Modules, loading the project via the `file://` protocol will break due to CORS policy.
- **Staging Requirement:** Agents must launch a local background HTTP server (e.g., `python -m http.server 8080`) before declaring any frontend tasks complete.
- **Headless Testing:** Agents have full authorization to use Node.js (`"type": "module"`) to perform static syntax analysis (`node --check ui.js`) and run pure mathematical combat simulations with mock cards inside `engine.js`.
- **Environment Verification:** The server state can be verified via PowerShell:
  ```powershell
  Get-Process -Name "python" -ErrorAction SilentlyContinue
  Invoke-WebRequest -Uri "http://localhost:8080" -Method Head




## 🧠 CONTEXT SKILLS (Workflow Commands)
- `skill:update_root`: Read all 5 modules and update this CLAUDE.md status.
- `skill:forge_check`: Validate that a new card or passive doesn't break the 7400 balance.
- `skill:combat_test`: Run a mental simulation of a combat log to verify math accuracy.

## 📂 MODULE MAP
- `engine.js`: Combat loop (1v1/5v5), passive triggers lifecycles, squad scaling generation, victory conditions.
- `forge.js`: Image processing, cropper reset, point distribution validation, creation sandbox.
- `ui.js`: Dictionaries (Elements, Classes, Passives), indexed logging consoles (`[Ally N]` vs `[Enemy M]`), dynamic PvE arena rendering.
- `storage.js`: LocalStorage handlers wrap wrapped in try/catch blocks, JSON Export/Import verification, card collection persistence.
- `main.js`: Global state machine orchestrator, event listener mapping, multi-stage turn triggers, global window bridge.

## 🛠️ ENGINEERING STANDARDS (Quality & Efficiency)
- **DRY (Don't Repeat Yourself):** Never rewrite an entire file. Only output the specific functions or lines that changed using "Lazy Loading" comments (e.g., `// ... existing code ...`).
- **Defensive Programming:** Always validate inputs. Clone cards via `JSON.parse(JSON.stringify())` before combat loops to isolate passive internal flags (`_blockUsed`, `_reflected`, `_revived`, `_stolen`) per slot.
- **Pure Functions:** Keep math logic in `engine.js` independent of the DOM. Functions should take inputs and return values.
- **Concise Code:** Prefer Ternary Operators and Arrow Functions for simple logic to save tokens and improve readability.
- **No Hallucinations:** If a variable isn't in scope or current context, ASK before inventing it.

## 📉 TOKEN SAVING PROTOCOLS
1. **Brief Responses:** Skip conversational fluff. Go straight to the code or the technical explanation.
2. **Context Awareness:** Do not re-explain the 7400 balance rule unless a change in that logic is requested.
3. **Diffs over Full Rewrites:** Use search/replace format for code updates instead of outputting the whole file.
4. **Selective Context:** Only read `ui.js` if the task is visual; only read `engine.js` if the task is mathematical.

## 🚀 CURRENT FOCUS: NEXT MILESTONE (FASE 07)
- **Altar de Fusión y Evolución:** Subida de rango sacrificando copias del mismo elemento. Ampliación del límite de atributos (7400 → 8800 → 10000) e interfaz en `#section-forge`.
- **Sistema de Runas Equipables:** Ranuras de modificadores de estadísticas porcentuales y pasivas adicionales asociadas de forma persistente a las cartas.

# 📂 APPLICATION STATE & ROUTING (SPA)

El estado de la aplicación y el enrutamiento interno se gestionan completamente en el lado del cliente como una Single Page Application (SPA), centralizada a través de `main.js` y ejecutada mediante la función global `transitionState(target)`.

### 🛠️ Matriz de Navegación y Estados de Acceso
- **Secciones Activas:** Las únicas vistas completamente operativas son `ACTIVE_SECTIONS = ['creator', 'library', 'coliseo', 'adventure']`.
- **Secciones Bloqueadas:** Las vistas en desarrollo se definen en `LOCKED_SECTIONS = ['inventory', 'shop']`. Cualquier interacción del usuario mediante clics sobre estas pestañas interrumpe la navegación y dispara un toast interactivo de tipo glassmorphism con el mensaje `🔒 {Feature} — Coming in Phase 6+` procesado por `UI.showComingSoon()`.
- **Registro de Contenedores del DOM:** El control del árbol de nodos se realiza bajo la constante global `ALL_SECTION_IDS = ['creatorMainGroup', 'section-library', 'section-coliseo', 'adventure', 'inventory', 'shop']`. `UI.showSection()` itera sobre el registro aplicando de forma defensiva `display: none` para ocultar la interfaz previa, aplicando exclusivamente `display: block` o `display: flex` sobre el contenedor de destino.

### 🗺️ Estructura del Modo Aventura (Campaña PvE)
El estado de la campaña se rastrea de forma nativa a través de la sub-estructura del estado global:
```javascript
gameState.adventure = {
  currentStage: '1-1',   // Progresión lineal desde 1-1 hasta 1-5 (Boss)
  selectedTeam: [],      // Array limitado a exactamente 5 cartas desde la Library
  activeEnemySquad: []   // Array de hasta 5 instancias de enemigos en batalla
};