# Easy Hit — Tactical Card RPG

## Qué es esto

Juego de cartas táctico 2D, 100% cliente (sin backend), pensado para GitHub Pages. Vanilla JS (ES6 Modules), GSAP para animación, Cropper.js para el arte de las cartas, CSS3 (Grid/Flexbox/glassmorphism). Sin build step.

## Arquitectura: 4 módulos, sin dependencias circulares

- **`engine.js`** (~1400 líneas) — matemáticas puras de combate: rondas simultáneas 1v1, Fervor/Ultimates, pasivas, validación de cartas, persistencia en `localStorage`, datos de contenido (cartas oficiales, loot, ítems, mejoras, torneo). No toca el DOM.
- **`ui.js`** (~2100 líneas) — capa de presentación: renderizado DOM, cropping de imágenes, barras de fervor, animaciones, modales de recompensa, inventario, torneo, y todo el roguelike de Aventura. Sanitiza HTML dinámico con `esc()`.
- **`main.js`** (~1300 líneas) — orquestador: máquina de estados (`transitionState`), delegación de eventos, y los tres flujos de combate (Coliseo, Torneo, Aventura).
- **`narrator.js`** (204 líneas) — capa de flavor text: traduce eventos de combate (`engine.js` los invoca vía `import * as narrate`) a frases del battle log, sin saber nada de DOM.

Si algo en este documento choca con lo que ves en el código al momento de trabajar, el código manda — avísame y lo corregimos juntos en vez de asumir que la doc tiene razón.

## Los modos de juego (estado real, no aspiracional)

`main.js` define qué pestañas existen y cuáles se muestran en la navegación:
```js
SECTION_WHITELIST = ['library','creator','coliseo','adventure','gallery','tournament','inventory','shop']
ACTIVE_SECTIONS   = ['library','coliseo','tournament']
LOCKED_SECTIONS   = []
```
`creator`, `gallery`, `adventure` e `inventory` siguen en `SECTION_WHITELIST` — el código, las secciones y sus tabs en `index.html` existen tal cual, solo que los botones de tab llevan `style="display:none" hidden` y no están en `ACTIVE_SECTIONS`, así que no reciben listener de navegación. Nada se borró; es una ocultación reversible (`git blame`/buscar `hidden` en `index.html` para reactivarlos).

| Modo | Qué es | Visible en nav |
|------|--------|:---:|
| **Library** | Página de entrada de la app. Muestra los 22 campeones oficiales jugables (`OFFICIAL_CARDS`), cada uno con una pasiva distinta — ya no la colección personal vacía. | ✅ (es el estado inicial) |
| **Coliseo** ("Duelos" en la UI) | 1v1 simultáneo (ambos golpean cada ronda), Fervor/Ultimate, pasivas completas. | ✅ |
| **Torneo** | Bracket de 16 luchadores, siembra aleatoria, eliminación simple. | ✅ |
| **Creator** | Formulario para forjar cartas propias. | 🚫 oculto |
| **Gallery** | Roster de solo lectura de `OFFICIAL_CARDS` — redundante ahora que Library lo absorbió. | 🚫 oculto |
| **Aventura** | Roguelike de héroe único (ver abajo). Código intacto y funcional, solo sin entrada de navegación. | 🚫 oculto |
| **Inventory** | Grid de ítems/materiales con filtros. | 🚫 oculto |
| **Shop** | Paquetes de cartas y recursos. | 🚫 oculto |

### Library como onboarding
`displayCards()`/`selectLibraryCard()`/`handleDeleteCard()` (`ui.js`) ahora leen de `Engine.getAllPlayableCards()` (cartas personales + los 22 oficiales) en vez de solo `Engine.cards`. Las cartas oficiales (`card._official === true`) no se pueden borrar — `renderCardDetail()` muestra un badge "Official Champion" en vez del botón `DISMANTLE HERO`, y `handleDeleteCard()` rechaza el borrado igual por si se invoca directo.

## Aventura = roguelike de héroe único

Esto **reemplazó** un diseño anterior de campaña de equipo 5v5 con mapa de nodos y story panels. Ese código fue retirado (ver "Historia reciente" abajo) — si buscas `renderMapNodes`, `showStoryPanel`, `renderTeamSelection`, etc., ya no existen.

Flujo real (`main.js`, bloque "🎯 Roguelike Run — State Machine"):
1. **Lobby** (`UI.renderAdventureLobby`) → botón `#btnSelectHero` → `UI.renderHeroPicker` para elegir una carta de la biblioteca como héroe.
2. **Organigrama** (`UI.renderOrganigrama`) — muestra los nodos del run actual (`Engine.RUN_TEMPLATES['run-1']`: 6 nodos — combate/combate/upgrade/combate/combate/boss).
3. Nodo de **combate** → `Engine.getEnemyForRunNode` + `Engine.resolveAdventureRound(hero, enemy, action)` — héroe y enemigo se golpean en la misma ronda (el jugador elige Attack/Ultimate por botón, el enemigo decide solo), pociones de curación/fervor (`healPotions`/`fervorPotions`), pasivas de run (`Engine.RUN_PASSIVE_DB`: `bloodthirst`, `thornmail`, `precision`, `second_wind`, `poison_strikes`).
4. Nodo de **upgrade** → `Engine.getUpgradeChoices`/`applyUpgrade` (pool: `atk_up`, `def_up`, `hp_up`, más las 5 pasivas de run, más `new_ultimate` — 9 entradas).
5. Victoria de nodo → `Engine.getItemDrop`/`ITEM_DB` (armas y armaduras por rareza: common/rare/epic) → equipar con `equipItem`.
6. Fin del run → `UI.renderRunComplete` o, si el héroe muere sin `second_wind` disponible, `UI.renderRunGameOver`.

`Engine.getRunNode`/`getRunProgress` existen y tienen test propio (`tests/run-sim.mjs`) pero **no están conectados a la UI todavía** — candidatos naturales para un indicador "nodo X de Y" en `renderOrganigrama`, si se quiere en el futuro.

## Combate: reglas que no cambian sin querer

1. **Balance de 7400**: `HP + DEF + ATQ ≤ 7400`. `validateCardStats()`/`saveCard()` rechazan el guardado si se excede. Los jefes están exentos por diseño. No hay stat de velocidad — se quitó del juego (ver "Historia reciente").
2. **Umbral Mítico**: cualquier carta con stats totales ≥ 7400 recibe el CSS premium (glow dorado, borde mítico).
3. **Daño**: golpea DEF primero (escudo); al llegar a 0, el resto va a HP. Mínimo garantizado de 10 HP de desgaste por golpe.
4. **Combate simultáneo 1v1**: Coliseo, Torneo y cada nodo de combate de Aventura resuelven la ronda con ambos combatientes golpeando a la vez (`Engine.resolveSimultaneousRound`/`resolveAdventureRound`) — no hay cola de turnos ni orden de iniciativa. No existe combate de equipos (5v5); todo es 1v1.
5. **Fervor**: `MAX_FERVOR = 10`. +1 al iniciar ronda, +1 al atacar, +1 al ser golpeado (se aplica al inicio de la ronda siguiente vía flag `_wasHit`, antes del choque). Al llegar a 10, la Ultimate se dispara sola en esa misma ronda.
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

## Cache-busting en GitHub Pages (IMPORTANTE al deployar)

GitHub Pages/los navegadores cachean `main.js`/`ui.js`/`engine.js`/`narrator.js` de forma agresiva y por separado del `index.html`. Ya pasó dos veces en la misma sesión: el usuario veía pestañas viejas o `Library` mostrando solo cartas personales porque su navegador tenía un `ui.js` cacheado de antes del cambio, aunque el `index.html` sí se hubiera actualizado.

Mitigación: todos los `import`/`<script src>` entre módulos llevan un query string de versión compartido (hoy `?v=20260906a`) —
```
index.html:  <script type="module" src="main.js?v=20260906a"></script>
main.js:     import * as UI from './ui.js?v=20260906a';
             import * as Engine from './engine.js?v=20260906a';
             import * as Narrator from './narrator.js?v=20260906a';
ui.js:       import { cards } from './engine.js?v=20260906a';
             import * as Engine from './engine.js?v=20260906a';
engine.js:   import * as narrate from './narrator.js?v=20260906a';
```
**Regla:** cada vez que se deploye un cambio real en `engine.js`/`ui.js`/`main.js`/`narrator.js`, bump el string de versión en los 6 lugares de una vez (deben ser todos idénticos — si `main.js` y `ui.js` importan `engine.js` con versiones distintas, ES modules los trata como dos instancias separadas del módulo con estado duplicado, lo cual rompe `Engine.cards`/`gallery`). Los tests con servidor propio (`uifixes.test.mjs`, `inventory.test.mjs`) ya recortan el query string al resolver el archivo (`req.url.split('?')[0]`) — si se agrega otro test con su propio mini-servidor HTTP, hay que hacer lo mismo o los `import` con `?v=` van a fallar con "Engine is not defined".

Además hay un botón de Settings (⚙️, en el HUD superior) que borra `localStorage` (`easyHitLibrary`, `easyHitLastTab`, `eh_save`, `inv`, `easyHitGallery`) y recarga — sirve para datos de juego corruptos/viejos, pero **no** sustituye el cache-busting de arriba (no puede forzar al navegador a re-descargar los `.js` ya cacheados).

## Tests (`tests/`, todos en Node)

| Archivo | Qué prueba |
|---------|-----------|
| `engine.unit.mjs` | Motor puro: constantes, `resolveSimultaneousRound`/`resolveAdventureRound`, Fervor, pasivas, veneno, piercing, persistencia (~78 tests). |
| `run-sim.mjs` | Datos y lógica del roguelike (nodos, pasivas de run, drops, simulación completa de un run vía `resolveAdventureRound`). |
| `tournament-sim.mjs` | Lógica de bracket + combate simultáneo end-to-end. |
| `inventory.test.mjs` | Persistencia e interfaz de inventario (Puppeteer). |
| `uifixes.test.mjs` | Torneo (abrir picker), Aventura (elegir héroe), filtros de inventario (Puppeteer). |
| `browser.test.mjs` | Flujo completo end-to-end (Playwright): creación de carta, Coliseo, Aventura (hero picker → nodo de combate → ataque real), recompensas, XSS. |

`run-sim.mjs`/`engine.unit.mjs` mockean temporalmente `narrator.js` con stubs vacíos (para simulaciones headless rápidas) y lo restauran en un bloque `finally` — no lo edites a mano si ves el mock ahí, es esperado y transitorio.

Los tests con Puppeteer necesitan el servidor local corriendo (`python -m http.server 8765`) antes de ejecutarlos.

## Historia reciente (para no repetir la confusión)

Este archivo describía hasta hace poco una campaña de equipo 5v5 con mapa de nodos (1-1 a 1-5) y story panels — ese diseño fue abandonado a mitad de camino por una sesión anterior, que empezó a construir el roguelike de héroe único sin terminar de retirar el código viejo ni actualizar esta doc. Se limpiaron ~25 funciones muertas de `ui.js`/`engine.js`/`index.html` (mapa, story panels, selección de equipo de 5 cartas, action sheet de targeting) y se restauró `narrator.js`, que había quedado vaciado a funciones vacías por una edición sin terminar. El roguelike es ahora la dirección confirmada del modo Aventura.

Después de eso se quitó el stat VEL de todo el juego y se volvió al combate simultáneo 1v1 original de Easy Hit (recuperado del historial de git, commit `3779a84`, de antes de que VEL/turnos llegaran en `06b6821`) — pero conservando Fervor y las Ultimates, que el diseño original no tenía. `buildTurnOrder`, `resolveCombatTurn`, `resolveEnemyTurn` y `findTarget` se eliminaron de `engine.js`; los reemplazan `resolveSimultaneousRound` (Coliseo/Torneo) y `resolveAdventureRound` (Aventura). La barra de orden de turno (`renderTurnBar`) y los highlights de turno activo (`setActiveHighlight`) se retiraron de `ui.js` por quedar sin uso. De paso se encontró y arregló un bug real que había quedado de la limpieza anterior: `clearPvETurnHighlights` usaba una variable `_dimmed` que se había borrado sin querer junto a código muerto — lanzaba `ReferenceError` cada vez que se llamaba en combate de Aventura.

Después de eso se decidió volver a enfocar el juego en su identidad original: duelos 1v1 entre campeones ya hechos, no creación de cartas propias. Se ocultó `Creator` (y `Gallery`, que quedó redundante), Library pasó a mostrar el roster completo de campeones oficiales como pantalla de bienvenida, y se completó el roster de 19 a 32 campeones (`OFFICIAL_CARDS`, ver `cartas-ideas.md` para el criterio de diseño de las piezas nuevas). De paso se ocultaron también `Adventure`/`Inventory`/`Shop` — solo quedan visibles Library, Coliseo (etiqueta de UI "Duelos") y Torneo (etiqueta de UI "Torneo"). Nada de este código se borró, solo se quitó de `ACTIVE_SECTIONS` y se ocultaron los botones de tab — reactivar cualquiera de estos modos es tan simple como revertir esos dos puntos.

Más tarde el roster se recortó a **22 campeones**: cada una de las 22 pasivas de carta (`passiveNames` en `ui.js`) quedó asignada a exactamente un héroe, sin duplicados y sin ningún héroe sin pasiva. Se retiraron 10 cartas que repetían una pasiva ya usada por otra (Ashenclaw, Riptide, Circuit, Halcyon, Ferrox, Nerezza, Skarn, Coralynn, Thistle, Aurelian); Krondor pasó de `prog_scale_stats` (duplicada) a `orc_warlord` (la única pasiva que no tenía carta asignada). Library, Coliseo y Torneo ahora reflejan ese roster de 22 — si se quiere volver a 32 o rediseñar la asignación, el historial de git conserva la versión anterior de `OFFICIAL_CARDS`.

`ideas-agents.md` tiene conceptos de posibles roles de agentes especializados para el futuro (no un pipeline obligatorio, solo ideas). `ideas-easyhit.md` tiene observaciones de auditoría (qué reutilizar/quitar/añadir). `cartas-ideas.md` tiene 10 diseños de cartas especiales con prompts de imagen. `Plan_12_fases.md` tiene el roadmap de fases con más detalle de lo que falta.
