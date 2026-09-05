# ⚔️ Plan de Implementación — Easy Hit

> **Visión**: Juego de cartas táctico y RPG web Vanilla de alta densidad, enfocado en latencia cero, arquitectura modular desacoplada y un equilibrio matemático estricto.
> **Stack**: Vanilla JavaScript (ES6 Modules) · HTML5 Semántico · CSS3 (Custom Properties + Grid) · Despliegue en GitHub Pages.

Este documento se reescribió por completo tras descubrir que el modo Aventura había sido rediseñado a mitad de camino (de una campaña de equipo 5v5 a un roguelike de héroe único) sin que el roadmap se actualizara. Ver `CLAUDE.md` → "Historia reciente" para el detalle de esa limpieza. Lo de abajo refleja el estado real del código, no un plan aspiracional.

---

## 🚀 Ley Universal de GitHub Pages — Fronteras del Despliegue

Easy Hit vive en GitHub Pages: servidor estático gratuito con reglas duras automáticas. Violarlas = sitio suspendido o repo bloqueado.

### Límites de Servidor

| Límite | Valor | Riesgo | Mitigación |
|--------|:-----:|--------|-----------|
| **Ancho de banda** | 100 GB/mes | ~50,000 sesiones si el sitio pesa 2 MB. | Presupuesto ≤ 500 KB totales (Fase 12). WebP, sin MP3, minificación. |
| **Tamaño repo + site** | 1 GB c/u | Sin riesgo real hoy — JSON de cartas es texto plano, sin assets pesados en el repo. | Verificar en Fase 12. |
| **Archivo individual** | 100 MB | Ningún asset se acerca. | Irrelevante. |
| **Despliegues (builds)** | 10/hora | Commits muy seguidos saturan la cola. | Batch de cambios significativos por commit. |

### Techos de Arquitectura Cliente

| Techo | Valor | Riesgo | Mitigación |
|-------|:-----:|--------|-----------|
| **localStorage** | 5 MB/dominio | Muchas cartas con claves largas saturan la cuota. | Esquema compacto para inventario ya en uso (`inv`); pendiente extenderlo a biblioteca de cartas. |
| **Código visible (F12)** | Ilimitado | Stats/oro editables desde consola. Inherente a cliente web sin backend. | Aceptado — es single-player. |
| **Rendimiento DOM** | CPU/GPU del usuario | GSAP + partículas puede generar jank en gama baja. | Pendiente: performance budget con gating por `hardwareConcurrency` (ver Fase 09). |

### Reglas de producto que se mantienen

- **Ritmo de deploys:** agrupar cambios en commits significativos, no micro-commits.
- **Persistencia acorazada:** toda lectura/escritura de `localStorage` envuelta en `try/catch`.
- **Silencio de consola:** cero errores/warnings en producción.
- **Audio sintetizado (si se implementa):** nada de MP3/WAV, todo con Web Audio API.

---

## Estado real por fase

| # | Fase | Estado |
|---|------|--------|
| 01 | Core Engine — Combate simultáneo/Fervor/Ultimates/Pasivas | ✅ Hecho |
| 02 | Visual Combat UI — turn bar, animaciones, recompensas | ✅ Hecho |
| 03 | Roguelike de Aventura — nodos, loot, upgrades, ítems | ✅ Hecho (reemplazó el plan original de campaña 5v5 + story panels) |
| 04 | Torneo (bracket de 16) | ✅ Hecho — no estaba en el plan original, se construyó en paralelo |
| 05 | Inventario (grid + filtros) | ✅ Hecho — falta "equipar desde la mochila" fuera de un run activo |
| 06 | Progresión del héroe entre runs / Card Forge | ⬜ Pendiente |
| 07 | Tienda del Mercader & Economía | ⬜ Pendiente (pestaña bloqueada hoy) |
| 08 | PvP Multijugador Local (Hotseat) | ⬜ Pendiente |
| 09 | Pulido UX, Sonido Web & Performance Budget | ⬜ Pendiente |
| 10 | IA de Balanceo de Datos Automático | ⬜ Pendiente |
| 11 | QA Defensivo, Hardening DOM & Límites Reales | 🔶 Parcial (ver auditoría en `document_1-2.md`) |
| 12 | Minificación, Assets & Despliegue Definitivo | ⬜ Pendiente |

---

## Fase 01-02: Core Engine + Visual Combat UI ✅

Combate simultáneo 1v1 (sin VEL, sin cola de turnos — se quitó VEL del juego completo tras la Fase 03), Fervor (0-10, +1 ronda/+1 ataque/+1 al ser golpeado), 7 Ultimates (`ULTIMATE_DB`), 22 pasivas de carta, fervor bars, floating damage numbers, reward modal. Ver `CLAUDE.md` para la lista exacta actual de IDs (cambió un poco desde entonces: los ultimates ya no son los 6 originales, son 7 con nombres distintos).

## Fase 03: Roguelike de Aventura ✅ (reemplaza el plan de campaña 5v5)

El plan original proponía una campaña de equipo 5v5 con mapa de nodos 1-1 a 1-5, paneles narrativos tipo Visual Novel entre stages, y loot tables conectadas a `verifyPartyVictory()`. Ese trabajo se abandonó a mitad de camino a favor de un roguelike de héroe único, que es lo que existe hoy:

- **Nodos de run** (`Engine.RUN_TEMPLATES`): secuencia de nodos combate/upgrade/boss por run. Hoy solo existe `run-1` ("The Awakening", 6 nodos).
- **Loot ponderado**: `Engine.getItemDrop`/`ITEM_DB` — armas y armaduras por rareza (common/rare/epic), equipadas automáticamente al dropear (`equipItem`).
- **Upgrades**: `Engine.getUpgradeChoices`/`UPGRADE_POOL` — mejoras de stat plano o pasivas de run (`bloodthirst`, `thornmail`, `precision`, `second_wind`, `poison_strikes`) o un ultimate nuevo.
- **Pociones**: curación y fervor, consumibles limitados por run.
- **Story panels**: se retiraron (`showStoryPanel`/`STORY_DATA` existían pero nunca se conectaron a esta versión del modo Aventura). **Pregunta abierta, no decidida:** si se quiere narrativa entre nodos del roguelike, hay que diseñarla de nuevo — no es un simple "reconectar" porque el flujo de nodos es distinto al de stages secuenciales.

### Pendiente dentro de esta fase
- `Engine.getRunNode`/`getRunProgress` están escritos y testeados (`tests/run-sim.mjs`) pero no consumidos por la UI — candidatos para un indicador "nodo X de Y" en `renderOrganigrama`.
- Solo hay un run definido (`run-1`). Añadir más runs es solo agregar entradas a `RUN_TEMPLATES` + enemigos a `RUN_ENEMIES_1V1`.
- No hay progresión persistente entre runs más allá del héroe elegido y el oro/XP acumulado — al terminar o morir, no está claro qué se conserva de un run al siguiente (revisar `_handleRunOutcome`/`renderRunComplete`/`renderRunGameOver` si se quiere definir esto).

### Adenda: se quitó VEL de todo el juego (post-Fase 03)
El stat VEL y el sistema de turnos por iniciativa se retiraron por completo — Coliseo, Torneo y cada nodo de combate de Aventura son ahora 1v1 simultáneo (ambos golpean la misma ronda), recuperando el diseño original de Easy Hit de antes de que VEL existiera, pero conservando Fervor y Ultimates. Ver `CLAUDE.md` → "Historia reciente" para el detalle técnico.

## Fase 04: Torneo ✅ (no estaba en el plan original)

Bracket de 16 luchadores con siembra aleatoria (`generateBracket`, exige exactamente 16 contendientes), eliminación simple, progresión de rondas (`getNextMatch`/`advanceBracket`/`isTournamentOver`). UI completa: selección de 16 slots, picker de cartas, vista de bracket, corona de campeón. Se construyó en paralelo al roguelike y llegó a producción sin pasar por este roadmap — de ahí que no apareciera documentado hasta ahora.

## Fase 05: Inventario 🔶 (grid hecho, falta "equipar desde la mochila")

Grid con filtros por categoría (`renderInventory`/`initInventoryFilters`), persistencia en esquema compacto bajo la clave `inv`. Lo que falta: hoy `Engine.equipItem` solo se invoca automáticamente cuando un ítem dropea durante un run (`main.js:1233`) — no hay manera de equipar/cambiar equipo manualmente desde la pestaña Inventory fuera de combate. Si se quiere eso, es la próxima pieza natural de esta fase.

## Fase 06: Progresión entre runs / Card Forge ⬜

Pendiente de diseño. Preguntas abiertas antes de construir nada:
- ¿El héroe conserva equipo/pasivas de run entre partidas, o cada run arranca desde cero con la carta base?
- ¿Existe fusión de cartas (idea original de "Card Forge") o la progresión es solo vía ítems del roguelike?

## Fase 07: Tienda del Mercader & Economía ⬜

Pestaña bloqueada hoy (`LOCKED_SECTIONS` en `main.js`). Sin trabajo iniciado.

## Fase 08: PvP Hotseat ⬜

Sin trabajo iniciado. El Coliseo 1v1 ya tiene toda la lógica de combate necesaria (`Engine.resolveSimultaneousRound`); falta la UI de "dos jugadores en el mismo navegador" (ocultar mano del rival, timer por ronda).

## Fase 09: Pulido UX, Sonido & Performance Budget ⬜

Ideas del plan original que siguen vigentes si se quiere profundizar: screen shake en crítico, colores por tipo de evento en el log, partículas limitadas por `hardwareConcurrency`, SFX sintetizados con Web Audio API (sin MP3/WAV) si se decide añadir sonido.

## Fase 10: IA de Balanceo Automático ⬜

Sin trabajo iniciado. `ai_assistant.py` (Python + ChromaDB + OpenAI) existe como asistente de diseño con RAG sobre `engine.js`, pero es una herramienta de consulta, no un simulador de balance automático — son cosas distintas.

## Fase 11: QA Defensivo & Límites Reales 🔶

Hecho hasta ahora (ver auditoría completa en `document_1-2.md`): 53+ bugs corregidos en rondas previas, sanitización XSS con `esc()`, guards de null en los puntos críticos, tests que cubren motor puro + simulaciones de PvE/torneo/roguelike + flujo de UI en Puppeteer. Pendiente: stress test de cuota de `localStorage`, auditoría de consola en producción con Puppeteer headless recorriendo todas las secciones.

## Fase 12: Minificación & Despliegue Definitivo ⬜

Sin trabajo iniciado. Ideas del plan original siguen vigentes si se llega a esa etapa: conversión de arte a WebP, minificación con Terser/CSSO, script de presupuesto de ancho de banda, CI opcional en GitHub Actions.

---

## Checklist de Límites GitHub Pages (para cuando se acerque el deploy final)

- [ ] Bandwidth ≤ 500 KB: suma de `index.html` + JS + CSS + imágenes
- [ ] Cero errores en consola (Puppeteer recorriendo todas las secciones)
- [ ] Cuota de `localStorage` con margen tras cargar una biblioteca grande de prueba
- [ ] Audio sintetizado si se añade (sin MP3/WAV)
- [ ] Assets en WebP, sin PNG/JPG de producción
- [ ] JS/CSS minificados
