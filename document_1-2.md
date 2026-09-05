# 🏗️ Card Forge Factory — Resumen Unificado de Desarrollo

> Documento consolidado con todo el progreso del proyecto: desde la infraestructura base hasta el bugfixing post-auditoría.

---

## 📦 Fase 2 — Infraestructura HTML Masiva & HUD

### Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `style.css` | +80 líneas: variables `:root` (--gold, --text-dim, --rarity-*, --hud-height); layout grid; HUD sticky; tabs responsivas; modal cofre con animaciones; rarity shimmer/glow; forge upgrade panel |
| `index.html` | +210 líneas: HUD global (oro/gemas/energía/XP); 3 nuevas pestañas (Adventure, Inventory, Shop); secciones adventure (mapa, raid, codex), inventory (categorías), shop (packs); modal cofre; forge upgrade panel |
| `main.js` | +146 líneas: `gameState` global (fighters/resources/player/inventory); `transitionState()` con whitelist, hooks enter/exit, GSAP fade, persistencia localStorage; `updateHUD()`; listeners para chest modal, buy, tabs, reforge |
| `ui.js` | +80 líneas: `showSection()` refactorizada a switch con 6 casos; `renderMapNodes()` (6 nodos); `renderCodex()` (bestiario); `openChest()` con animación y recompensas |

### Auditoría de integración
- ✅ 6 tab IDs en HTML coinciden con `SECTION_WHITELIST` en main.js
- ✅ 6 section IDs en HTML coinciden con `ALL_SECTION_IDS` en ui.js
- ✅ 13 `safeListener` calls en main.js con IDs existentes en HTML
- ✅ 0 referencias a IDs antiguos (#library, #coliseo) en JS
- ✅ Variables CSS --gold, --text-dim, --rarity-* definidas en `:root`
- ✅ `transitionState()` preserva `gameState.fighter1/fighter2` al cambiar de pestaña

---

## ⚔️ Fase 3 — Activación del Core: Creator & Library

### Enrutamiento SPA
- Arranque siempre en Creator: `transitionState('creator')`
- Transición entre pestañas: `onSectionExit → UI.showSection → onSectionEnter → GSAP fade → localStorage`
- Pestañas bloqueadas (Coliseum, Adventure, Inventory, Shop) muestran toast `🔒 — Coming in Phase 4`

### Flujo Creator → localStorage → Library
1. Ajuste de sliders → `updateRemainingPoints()` → `updatePreview()` (TCG card en vivo)
2. **FORGE CARD**: recolecta campos → `Engine.saveCard(card)` valida `totalStats > 7400` → `cards.push()` → `syncStorage()` → `UI.displayCards()` → `resetCropperData()`
3. Library: `onSectionEnter.library` → `UI.displayCards()` renderiza todas las cartas

### Regla de Oro: 7400 puntos
- `engine.js` (saveCard): `totalStats = hp + atq + def` → si `> 7400`, retorna `false`
- `ui.js` (updateRemainingPoints): `remaining = 7400 - total` → si negativo, contador rojo + shake + `btn-forge-error`
- Stats invariantes: `{ id, name, element, cardClass, hp, def, atq, maxHp, passiveId, image }`

### Persistencia blindada
- `syncStorage()` con `try/catch` en `localStorage.setItem()`
- `loadLibrary()` con `try/catch` en `getItem()` y `JSON.parse()`
- `importarBiblioteca()` valida que el JSON sea `Array` y cada elemento tenga `id` y `name`

---

## 🏟️ Fase 4 — Activación de la Arena: Coliseum

### Selección de Luchadores
- `renderSelector()` agrupa cartas por clase (Human, Dragon, Robot, etc.) en `<optgroup>`
- Cambio de selector → busca carta por `card.id`, clona (JSON.parse), asigna a `gameState.fighter1/fighter2`
- `updateFighterPreview(card, num)` con GSAP fade-in

### Ciclo de Combate
1. **START FIGHT** → `gameState.round = 0`, oculta START, muestra NEXT ROUND
2. **NEXT ROUND** → incrementa round → `applyRoundStartPassives` mutuo → refresh stats → `animateCombatHit` → `Engine.procesarRondaSimultanea(f1, f2)` (daño detallado con Anti-Armor, Armor Piercing, Dragon Slayer, Element Ward, Sacred Veil, Graceful Strike; reparto 50/50 DEF/HP; mínimo 10 HP de desgaste; pasivas post-daño: Broken Mirror, Thorn Armor, Iron Skin, Leech) → `verifyVictory()` → si hay ganador, muestra FINALIZAR COMBATE
3. **FINALIZAR COMBATE** → `resetColiseum()` → limpia log, restaura selectores

### Battle Log
- Tipos CSS: `.system` (gris), `.round-header` (dorado), `.attack` (rojo), `.damage` (rojo claro), `.passive` (púrpura), `.victory` (verde)
- Scroll automático, borde izquierdo de 4px coloreado

### Pasivas verificadas
| Familia | Pasivas |
|---------|---------|
| Genesis (1 vez, R1) | `gen_block_heal`, `gen_reflect_full`, `gen_steal_stats` |
| Nemesis (condicional) | `nem_xenophobia`, `nem_dragon_slayer`, `nem_element_ward` |
| Progression (escalado) | `prog_scale_stats`, `prog_venom`, `prog_drain_def` |
| Reactivas | `double_strike`, `life_leech`, `shield_recharge` |
| Post-daño | `abs_def_convert`, `abs_hp_convert`, `abs_reflect` |
| Phoenix (umbrales) | `fen_revive`, `fen_berserker`, `fen_last_stand` |

### Cortafuegos Anti-Bucle
- Flags one-time: `_blockUsed`, `_reflected`, `_revived`, `_stolen`
- `procesarAtaque()` NO llama a `procesarRondaSimultanea` — sin recursión
- `processPostDamagePassives()` solo reacciona si `dmg.hpDamage + dmg.defDamage > 0`

---

## 🗺️ Fase 5 — Motor del Modo Aventura (Zona 1)

### Mapa Lineal (5 nodos)
- `1-1` (35%,80%) → `1-2` (25%,55%) → `1-3` (50%,35%) → `1-4` (75%,55%) → `1-5 BOSS` (85%,80%)
- 3 estados: `available` (gold pulse), `completed` (verde), `locked` (gris, `cursor:not-allowed`)
- Desbloqueo secuencial

### Team Selection Overlay
- 5 slots (`.party-slot`), click en vacío → `openCardPicker(slotIndex)`
- Sin duplicados: `library.filter(c => !_teamSlots.some(s => s && s.id === c.id))`
- **CONFIRM TEAM** habilitado solo con 5 slots ocupados

### Combate PvE por Turnos
- **NEXT TURN**: `Engine.executePartyTurn(party, enemy)` → cada aliado vivo ataca → enemigo contraataca → `Engine.verifyPartyVictory()`
- **Victoria**: overlay dorado, nodo `completed`, siguiente desbloqueado
- **Derrota**: overlay rojo, opciones RETRY o BACK TO MAP

### Límites de Seguridad
- `turnCount ≥ 100` → corta combate
- `if (!adv.inCombat)` → ignora clics extra
- Todos los accesos DOM con `if (el)`
- Cartas clonadas con `JSON.parse(JSON.stringify())`

### Battle Log PvE
- `#pveLogContent` separado del log del Coliseo
- `pveLogConsole(msg, type, turn)` → wrappea `logConsole` con `containerId='pveLogContent'`
- Turnos etiquetados `T{n}` (vs `R{n}` del Coliseo)

### Códice de Enemigos
| Enemigo | HP | DEF | ATQ | Total | Pasiva | Fases |
|---------|----|-----|-----|-------|--------|-------|
| Goblin Raider | 3500 | 2000 | 1900 | **7400** | — | 1-1 a 1-4 |
| Orc Warlord (BOSS) | 8000 | 4000 | 3000 | **15000** | `gen_block_heal` | 1-5 |

---

## 🔬 Fase 6 — Refinamiento Matemático y Balanceo PvE

### Sistema de Targeting por Frontline
- `executePartyTurn(party, squad)` en dos fases:
  1. **Fase Aliada**: cada aliado vivo (0→4) ataca al enemigo vivo de menor índice (`findFirstAliveIndex`)
  2. **Fase Enemiga**: cada enemigo vivo contraataca al aliado vivo de menor índice
- Objetivo muerto durante la fase → siguiente combatiente ataca al siguiente enemigo vivo

### Boss Orco Inmortal (1-5) — Stats finales
| Stat | Valor | Justificación |
|------|-------|---------------|
| HP | 40,000 | Sobrevive 4–6 turnos (5 aliados ~8,000–10,000 HP netos/turno) |
| DEF | 5,000 | Consume 1–2 ataques antes de llegar al HP |
| ATQ | 3,500 | ~1,750 HP/golpe contra 2,000 DEF; aliado muere en 2 golpes |
| Pasiva | `orc_warlord` | Bulwark (block 1 vez) + Vitality (regen 2%/turno) + Berserker (ATK x3 al 30% HP) |
| Total | **48,500** | ~6.5× el límite de 7,400 |

### Control de Recursión
- Cada enemigo es clonado (`JSON.parse(JSON.stringify())`) — objetos independientes
- Flags one-time (`_revived`, `_blockUsed`, `_stolen`) por instancia
- `findFirstAliveIndex` verifica `hp > 0`
- `verifyPartyVictory` con guards: `squad.every(e => !e || e.hp <= 0)`
- Límite de 100 turnos en main.js
- `_uid` único por enemigo para depuración

### Simulación Headless
```
14/14 tests passed:
  ✅ Squad generation (4 tests)
  ✅ Combat flow (5 tests)
  ✅ Stage 1-1 victory in 3 turns
  ✅ Boss lasts 5 turns (balanced)
  ✅ Null/invalid safety guards (2 tests)
```

---

## 🤖 Herramienta AI Assistant

### Conversión `ai_assistant.py`
- Clase: `EasyHitAssistant` (hereda de AquaHotel → Easy Hit)
- System prompts en español
- ChromaDB en `~/.easyhit/chroma_db/`
- RAG con engine.js indexado (16 chunks)
- Cost tracking, caché, memoria persistente
- **⚠️ Precisión ~50%**: útil para brainstorming, NO para decisiones de balance sin supervisión humana
- 7400 propuestas de distribución de stats RECHAZADAS por ignorar `VEL_WEIGHT=2`

---

## 🐛 Auditoría y Bugfixing (Post-Fase 6)

### Fase 1 — Critical (9 bugs)
| Bug | Archivo | Fix |
|-----|---------|-----|
| Layer import violation (setColiseumButtonMode) | `engine.js` | Removida llamada a UI; engine puro |
| XSS en renderCardDetail | `ui.js` | `esc()` en todos los campos dinámicos |
| XSS en selectLibraryCard | `ui.js` | `esc()` en nombre de carta |
| life_leech sobre-curación | `engine.js` | Cap at `Math.min(heal, f.maxHp - f.hp)` |
| fen_revive daño incorrecto | `engine.js` | `dmg.hpDamage - (dmg.defDamage || 0)` |
| HP clamp post-daño (4 lugares) | `engine.js` | `Math.max(0, Math.min(f.hp, f.maxHp))` |
| getSquadForStage validación | `engine.js` | `Array.isArray` + `null` check |
| advanceBracket lookup | `engine.js` | `brackets[bracketIndex]` safe access |
| Tournament log routing | `narrator.js` | Wrapper `logConsole` con `_logContainerId` |
| verifyVictory impuro → puro | `engine.js` + `main.js` | Retorna objeto, no llama a UI |

### Fase 2 — High (14 bugs)
| Bug | Archivo | Fix |
|-----|---------|-----|
| Passive loop infinito | `engine.js` | Depth counter `_passiveDepth` |
| NaN propagation en cálculos | `engine.js` | `Number()` + `isNaN` guards |
| saveCard sin validación completa | `engine.js` | `validateCard` con checks |
| Unbounded stat limits (HP/DEF/ATQ) | `engine.js` | Caps en 9999/9999/9999 |
| fen_antimatter no implementada | `engine.js` | Resta 15% ATQ enemigo por ronda |
| advanceBracket out-of-bounds | `engine.js` | `bracketIndex < brackets.length` |
| Hardcoded constants en ui.js | `ui.js` | Import `BASE_STATS`, `VEL_WEIGHT` desde engine |
| Section state dirty en main.js | `main.js` | Cleanup en `onSectionExit` |
| Tournament turn bar no actualizada | `main.js` | `renderTurnBar` en loop de torneo |
| Event listener leak | `main.js` | `if (!e.target.closest)` guard |
| CSS .fighter-select.dead faltante | `style.css` | Regla añadida (opacidad 0.5 + escala 0.9) |

### Fase 3 — Medium (19 bugs)
- NaN propagation adicional en cálculos de daño
- Stat overflow caps (HP/DEF/ATQ > 9999/9999/9999)
- Constantes hardcodeadas reemplazadas por imports (MAX_STAT, STAGE_REWARDS, ENEMY_ROSTER)
- Null guards en party loop, tournament rendering, champion
- Duplicate keys en elementConfigs y rarityConfigs
- Tournament picker onclick delegado correctamente
- GSAP timing con null checks
- PvE dead-skip while-loop con safety counter
- Section enter/exit handlers con cleanup
- resetLogContainer resetTurnGroups llamado correctamente

### Fase 4 — Low (11 bugs)
| Bug | Archivo | Fix |
|-----|---------|-----|
| Return shape inconsistente | `engine.js` | `blocked: false` añadido |
| resetGallery export muerto | `engine.js` | `export` → internal |
| syncStorage export muerto | `engine.js` | `export` → internal |
| Fervor antes que veneno | `engine.js` | Poison check antes de hit-fervor |
| spawnDmgFloat NaN | `ui.js` | `Number(value)` + `isNaN` guard |
| onerror URL encoding | `ui.js` | `esc()` → `encodeURIComponent()` |
| openChest parámetro muerto | `ui.js` | `gameState` eliminado |
| GSAP timing incorrecto | `ui.js` | `onComplete` en tween individual |
| Victory log duplicado (torneo) | `main.js` | `UI.logConsole` redundante eliminado |
| setLogContainer duplicado | `main.js` | Rama dead-entry ya no lo llama |
| PvE victory blocks duplicados | `main.js` | Extraído a `handlePvEOutcome()` |

### Total: 53 bugs corregidos en 5 archivos

---

## 📐 Stack Tecnológico

- **Core:** Vanilla JS (ES6 Modules) — sin frameworks
- **Layout:** HTML5 + CSS3 (Custom Variables, Grid, Flexbox, keyframes)
- **Imagen:** Cropper.js con ratios fijos
- **IA Local:** Ollama / LM Studio (DeepSeek-Coder, Llama 3) para balanceo automatizado
- **Almacenamiento:** localStorage con serialización JSON
- **Asistente:** Python + ChromaDB + OpenAI API (cost tracking, RAG)

## 📁 Archivos del Proyecto

| Archivo | Líneas | Rol |
|---------|--------|-----|
| `engine.js` | ~1083 | Motor de juego: combate, pasivas, squads, torneo |
| `ui.js` | ~1942 | Renderizado DOM, animaciones, HUD, log |
| `main.js` | ~1014 | Orquestador, máquina de estados, eventos |
| `narrator.js` | ~203 | Capa narrativa, routing de logs de torneo |
| `style.css` | ~1300 | Estilos visuales, animaciones, responsividad |
| `index.html` | ~500 | Estructura DOM, HUD, tabs, modales |
| `ai_assistant.py` | ~997 | Asistente AI con RAG (ChromaDB + OpenAI) |

## 🔒 Seguridad Post-Auditoría

- ✅ `esc()` implementada y usada en todo `innerHTML` con datos dinámicos
- ✅ `eval()` / `new Function()`: 0 ocurrencias
- ✅ `.env` en `.gitignore` (API key protegida)
- ✅ Sin hardcodeo de claves en archivos fuente
- ✅ ChromaDB almacena fuera del repo (`~/.easyhit/chroma_db/`)
- ⚠️ `localStorage` parcialmente sin `try/catch` (engine.js:563,630,913,924; main.js:988-990)

## ⏭️ Próximos Pasos

1. **Commit** de todas las correcciones (5 archivos modificados + 2 nuevos)
2. **Play-test** coliseo, adventure, torneo, library
3. **Fusión y Evolución** (Fase 7): combinar cartas del mismo elemento, límite 7400 → 8800 → 10000
4. **Sistema de Runas**: modificadores equipables con stats % y pasivas adicionales

---

## 🔄 Pivote de Aventura y llegada de Claude Code (post-Fase 6)

Entre esta auditoría y la siguiente sesión de trabajo, el modo Aventura fue rediseñado de la campaña de equipo 5v5 descrita en la Fase 5 a un **roguelike de héroe único** (`Engine.RUN_TEMPLATES`, nodos de combate/upgrade/boss, ítems equipables, pociones). El cambio nunca se documentó ni se completó del todo: el código viejo (mapa de nodos, story panels, selección de equipo de 5 cartas) quedó en los archivos sin usarse, y `narrator.js` quedó vaciado a 44 funciones sin efecto por una edición interrumpida.

Al retomar el proyecto con Claude Code se hizo una auditoría completa y, con confirmación del usuario en cada decisión:
- Se confirmó el roguelike como dirección oficial de Aventura y se retiraron ~25 funciones muertas del diseño viejo (`renderMapNodes`, `showStoryPanel`/`STORY_DATA`, `renderTeamSelection`, `openCardPicker`, `fillTeamSlot`, `renderPvEArena`, el cluster de action-sheet/targeting, y sus equivalentes en `engine.js`/`index.html`).
- Se restauró `narrator.js` desde la última versión commiteada — mismas firmas de función, sin tocar call sites.
- Se corrigieron los tests que ejercitaban el flujo muerto (`story.test.mjs` se eliminó, `uifixes.test.mjs` se reescribió sobre el flujo real del hero picker) y de paso se encontró y arregló un bug real: el botón de cerrar del picker de Torneo no tenía listener.
- Se limpiaron artefactos de herramientas anteriores (`.opencode/`, `.continue/`, `AGENTS.md` → ideas reformuladas en `ideas-agents.md`).
- `CLAUDE.md` y `Plan_12_fases.md` se reescribieron para reflejar el estado real del código en vez de un diseño abandonado.
