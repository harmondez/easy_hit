# Easy Hit — Tactical Card RPG

## Qué es esto

Juego de cartas táctico 2D, 100% cliente (sin backend), pensado para GitHub Pages. Vanilla JS (ES6 Modules), GSAP para animación, Cropper.js para el arte de las cartas, CSS3 (Grid/Flexbox/glassmorphism). Sin build step.

## Arquitectura: 4 módulos, sin dependencias circulares

- **`engine.js`** (~1500 líneas) — matemáticas puras de combate: turnos por VEL, Fervor/Ultimates, pasivas, validación de cartas, persistencia en `localStorage`, datos de contenido (cartas oficiales, loot, ítems, mejoras, torneo). No toca el DOM.
- **`ui.js`** (~2100 líneas) — capa de presentación: renderizado DOM, cropping de imágenes, barras de turno/fervor, animaciones, modales de recompensa, inventario, torneo, y todo el roguelike de Aventura. Sanitiza HTML dinámico con `esc()`.
- **`main.js`** (~1300 líneas) — orquestador: máquina de estados (`transitionState`), delegación de eventos, y los tres flujos de combate (Coliseo, Torneo, Aventura).
- **`narrator.js`** (204 líneas) — capa de flavor text: traduce eventos de combate (`engine.js` los invoca vía `import * as narrate`) a frases del battle log, sin saber nada de DOM.

Si algo en este documento choca con lo que ves en el código al momento de trabajar, el código manda — avísame y lo corregimos juntos en vez de asumir que la doc tiene razón.

## Los modos de juego (estado real, no aspiracional)

`main.js` define qué pestañas existen y cuáles están bloqueadas:
```js
SECTION_WHITELIST = ['library','creator','coliseo','adventure','gallery','tournament','inventory','shop']
ACTIVE_SECTIONS   = ['library','creator','coliseo','adventure','gallery','tournament','inventory']
LOCKED_SECTIONS   = ['shop']   // toast "Coming soon" al hacer click
```

| Modo | Qué es | Estado |
|------|--------|--------|
| **Creator** | Formulario para forjar cartas: sliders de HP/DEF/ATQ/VEL, elemento, clase, pasiva, recorte de imagen. | Activo |
| **Library** | Buscar/gestionar la biblioteca de cartas propias. | Activo |
| **Gallery** | Roster de cartas oficiales pre-forjadas (`OFFICIAL_CARDS`). | Activo |
| **Coliseo** | 1v1 con turnos por VEL, Fervor/Ultimate, pasivas completas. | Activo |
| **Torneo** | Bracket de 16 luchadores, siembra aleatoria, eliminación simple. | Activo |
| **Aventura** | Roguelike de héroe único (ver abajo). | Activo — es la dirección oficial del modo Aventura |
| **Inventory** | Grid de ítems/materiales con filtros por categoría. | Activo |
| **Shop** | Paquetes de cartas y recursos. | Bloqueado |

## Aventura = roguelike de héroe único

Esto **reemplazó** un diseño anterior de campaña de equipo 5v5 con mapa de nodos y story panels. Ese código fue retirado (ver "Historia reciente" abajo) — si buscas `renderMapNodes`, `showStoryPanel`, `renderTeamSelection`, etc., ya no existen.

Flujo real (`main.js`, bloque "🎯 Roguelike Run — State Machine"):
1. **Lobby** (`UI.renderAdventureLobby`) → botón `#btnSelectHero` → `UI.renderHeroPicker` para elegir una carta de la biblioteca como héroe.
2. **Organigrama** (`UI.renderOrganigrama`) — muestra los nodos del run actual (`Engine.RUN_TEMPLATES['run-1']`: 6 nodos — combate/combate/upgrade/combate/combate/boss).
3. Nodo de **combate** → `Engine.getEnemyForRunNode` + `buildTurnOrder` → turnos con `executeNormalAttack`/`executeUltimateAttack`/`resolveEnemyTurn`, pociones de curación/fervor (`healPotions`/`fervorPotions`), pasivas de run (`Engine.RUN_PASSIVE_DB`: `bloodthirst`, `thornmail`, `precision`, `second_wind`, `poison_strikes`).
4. Nodo de **upgrade** → `Engine.getUpgradeChoices`/`applyUpgrade` (pool: `atk_up`, `def_up`, `hp_up`, `vel_up`, más las 5 pasivas de run, más `new_ultimate`).
5. Victoria de nodo → `Engine.getItemDrop`/`ITEM_DB` (armas y armaduras por rareza: common/rare/epic) → equipar con `equipItem`.
6. Fin del run → `UI.renderRunComplete` o, si el héroe muere sin `second_wind` disponible, `UI.renderRunGameOver`.

`Engine.getRunNode`/`getRunProgress` existen y tienen test propio (`tests/run-sim.mjs`) pero **no están conectados a la UI todavía** — candidatos naturales para un indicador "nodo X de Y" en `renderOrganigrama`, si se quiere en el futuro.

## Combate: reglas que no cambian sin querer

1. **Balance de 7400**: `HP + DEF + ATQ + (VEL × 2) ≤ 7400`. `VEL` entre 50 y 500, `VEL_WEIGHT = 2`. `validateCardStats()`/`saveCard()` rechazan el guardado si se excede. Los jefes están exentos por diseño.
2. **Umbral Mítico**: cualquier carta con stats totales ≥ 7400 recibe el CSS premium (glow dorado, borde mítico).
3. **Daño**: golpea DEF primero (escudo); al llegar a 0, el resto va a HP. Mínimo garantizado de 10 HP de desgaste por golpe.
4. **Turnos**: orden estricto por VEL descendente, intercalado (no por equipos).
5. **Fervor**: `MAX_FERVOR = 10`. +1 al iniciar turno, +1 al atacar, +1 al ser atacado (se aplica en el turno propio siguiente vía flag `_wasHit`). Al llegar a 10, la Ultimate se dispara sola.
6. **DOM defensivo**: todo lookup con `if (el) {...}`, eventos vía `safeListener()`, todo `innerHTML` dinámico pasa por `esc()`.
7. **Sin placeholders**: entregar funciones completas, nunca `// resto sigue igual`.

### Ultimates (`ULTIMATE_DB`, 7 entradas)
`cataclysm_nova`, `tidal_reckoning`, `storm_judgment`, `verdant_wrath`, `void_rend`, `radiance_purge` (jugables) + `enemy_smash` (solo enemigos del roguelike).

### Pasivas de carta (`passiveNames` en `ui.js`, 22 entradas)
Familias: Génesis (`gen_block_heal`, `gen_reflect_full`, `gen_steal_stats`), Némesis (`nem_xenophobia`, `nem_dragon_slayer`, `nem_element_ward`), Progresión (`prog_scale_stats`, `prog_venom`, `prog_drain_def`), Reactivas (`double_strike`, `life_leech`, `shield_recharge`), Post-daño (`abs_def_convert`, `abs_hp_convert`, `abs_reflect`), Fénix (`fen_revive`, `fen_berserker`, `fen_last_stand`, `fen_antimatter`), especiales (`anti_armor`, `armor_piercing`, `orc_warlord`). Todas tienen lógica real en `engine.js` — no hay pasivas fantasma pendientes.

## Persistencia

`localStorage`, todo protegido con `try/catch`:
- `easyHitLibrary` — biblioteca de cartas del jugador.
- `easyHitLastTab` — última pestaña visitada.
- `eh_save` — oro, nivel, XP, inventario, pociones de run (`_savePlayerData`/`_loadPlayerData`).
- `inv` — inventario en esquema compacto (`UI.saveInventory`/`loadInventory`).

## Local dev (bypass de CORS para ES Modules)

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory "I:\easy_hit"
```
`npm run dev` / `npm run start` ya lo hacen. Los ES6 modules rompen bajo `file://`.

## Tests (`tests/`, todos en Node)

| Archivo | Qué prueba |
|---------|-----------|
| `engine.unit.mjs` | Motor puro: constantes, turnos, Fervor, pasivas, veneno, piercing, persistencia (90 tests). |
| `run-sim.mjs` | Datos y lógica del roguelike (nodos, pasivas de run, drops, simulación completa). |
| `pve-sim.mjs` | Flujo de turnos del combate PvE (sin freeze, targeting, input lock). |
| `tournament-sim.mjs` | Lógica de bracket + combate end-to-end. |
| `inventory.test.mjs` | Persistencia e interfaz de inventario (Puppeteer). |
| `uifixes.test.mjs` | Torneo (abrir picker), Aventura (elegir héroe), filtros de inventario (Puppeteer). |

`pve-sim.mjs`/`run-sim.mjs` mockean temporalmente `narrator.js` con stubs vacíos (para simulaciones headless rápidas) y lo restauran en un bloque `finally` — no lo edites a mano si ves el mock ahí, es esperado y transitorio.

Los tests con Puppeteer necesitan el servidor local corriendo (`python -m http.server 8765`) antes de ejecutarlos.

## Historia reciente (para no repetir la confusión)

Este archivo describía hasta hace poco una campaña de equipo 5v5 con mapa de nodos (1-1 a 1-5) y story panels — ese diseño fue abandonado a mitad de camino por una sesión anterior, que empezó a construir el roguelike de héroe único sin terminar de retirar el código viejo ni actualizar esta doc. Se limpiaron ~25 funciones muertas de `ui.js`/`engine.js`/`index.html` (mapa, story panels, selección de equipo de 5 cartas, action sheet de targeting) y se restauró `narrator.js`, que había quedado vaciado a funciones vacías por una edición sin terminar. El roguelike es ahora la dirección confirmada del modo Aventura.

`ideas-agents.md` tiene conceptos de posibles roles de agentes especializados para el futuro (no un pipeline obligatorio, solo ideas). `Plan_12_fases.md` tiene el roadmap de fases con más detalle de lo que falta.
