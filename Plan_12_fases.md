# ⚔️ Plan de Implementación — Easy Hit: Architect Harmondez Edition (12 Fases)

> **Visión**: Juego de cartas táctico y RPG web Vanilla de alta densidad, enfocado en latencia cero, arquitectura modular desacoplada y un equilibrio matemático estricto basado en el manual de diseño.
> **Público**: Jugadores de TCG estratégicos y RPG de progresión clásica (*Heroes of Camelot* style).
> **Stack**: Vanilla JavaScript (ES6 Modules) · HTML5 Semántico · CSS3 (Custom Properties + Grid) · Inferencia Local (Ollama / OpenCode) · Despliegue en GitHub Pages.

---

## 🚀 Ley Universal de GitHub Pages — Fronteras del Despliegue

Easy Hit vive en GitHub Pages: servidor estático gratuito con **reglas duras automáticas**. Violarlas = sitio suspendido o repo bloqueado. Este plan las respeta desde la Fase 01.

### Límites de Servidor

| Límite | Valor | Riesgo | Mitigación en el Plan |
|--------|:-----:|--------|-----------------------|
| **Ancho de banda** | 100 GB/mes | ~50,000 sesiones si el sitio pesa 2 MB. Viral → corte automático. | Fase 12: presupuesto ≤ 500 KB totales. WebP, sin MP3, minificación. |
| **Tamaño repo + site** | 1 GB c/u | Assets generados por IA no se almacenan en el repo. JSON de cartas es texto plano. | Sin riesgo real. Verificar en Fase 12. |
| **Archivo individual** | 100 MB | Ningún asset se acerca. | Irrelevante. |
| **Despliegues (builds)** | 10/hora | **Peligro directo**: agentes automáticos commitando seguido saturan la cola. | Regla: mínimo 2 cambios significativos por commit. Batching obligatorio (Fase 12). |

### Techos de Arquitectura Cliente

| Techo | Valor | Riesgo | Mitigación en el Plan |
|-------|:-----:|--------|-----------------------|
| **localStorage** | 5 MB/dominio | ~200 cartas con claves largas (`attack`, `defense`) saturan. `QuotaExceededError` rompe el juego. | Fase 05: esquema compacto (`hp`/`atq`/`def`/`vel`). Fase 06: `navigator.storage.estimate()`. |
| **Código visible (F12)** | Ilimitado | Stats, oro, pasivas editables desde consola. Inherente a cliente web. | Aceptado (single-player). Minificación sube la barrera (Fase 12). |
| **Rendimiento DOM** | CPU/GPU usuario | 10 cartas 5v5 + GSAP + partículas = jank en móviles gama baja. | Fase 09: ≤ 50ms/frame, gating por `hardwareConcurrency`. |

### 📜 Reglas de Oro de la Fábrica (Refuerzo)

Las reglas de AGENTS.md se amplían con:

- **Tasa de Deploys Controlada:** No más de **8 pushes por hora** de trabajo agente. Los cambios deben acumularse en lotes antes de commitear. Un agente nunca hará más de 1 push cada 7.5 minutos.
- **Presupuesto de Almacenamiento:** Toda persistencia en localStorage debe usar claves cortas (≤ 4 chars) y verificar cuota restante antes de escribir. Si la cuota supera el 80%, se debe emitir advertencia visual al usuario.
- **Silencio de Consola:** Cero errores/warnings en producción. `console.log` de debug se elimina en el despliegue (minificación tree-shake).
- **Audio Sintetizado:** Prohibido MP3/WAV. Todo sonido se genera con Web Audio API (< 1 KB por efecto).

---

## Resumen de Fases

| # | Fase | Área | Horas est. | Dependencias |
|---|------|------|-----------|-------------|
| 01 | Core Engine V2 — VEL/Fervor/Ultimate | Lógica/UI | 35h ✅ | — |
| 02 | Visual Combat UI — Turn Bar, Animaciones, Recompensas | UI/CSS | 20h ✅ | Fase 01 |
| 03 | Loot Tables, Story Panels, Inventario & Stage Polish | Full Stack | 16h ← | Fase 02 |
| 04 | Altar de Jefes & Combate Táctico | Lógica/UI/Content | 32h | Fase 03 |
| 05 | Inventario Táctico, Mochila & Persistencia Compacta | UI/Grid/Storage | 24h | Fase 02 |
| 06 | Card Forge System (Fusión + Forja) | Lógica/UI | 25h | Fase 05 |
| 07 | Tienda del Mercader & Economía | Full Stack | 16h | Fase 02, 06 |
| 08 | PvP Multijugador Local (Hotseat) | Lógica/UI | 18h | Fase 01 |
| 09 | Pulido UX, Sonido Web & Performance Budget | UI/CSS/Audio | 24h | Fase 04, 05 |
| 10 | IA de Balanceo de Datos Automático | IA/QA | 30h | Fase 04, 05 |
| 11 | QA Defensivo, Hardening DOM & Límites Reales | QA/Seguridad | 22h | Todas |
| 12 | Minificación, Assets & Despliegue Definitivo | DevOps | 16h | Fase 09, 11 |
| | **Total** | | **~268h** | |

---

## Fase 01: Core Engine V2 — VEL/Fervor/Ultimate ✅ (Completada)

**Objetivo**: Refactorizar el motor de combate simultáneo a un sistema por turnos basado en iniciativa (VEL), con recurso de Fervor para habilidades definitivas y 6 ultimates únicos.

### Tareas realizadas
- Arquitectura modular de 3 capas: `engine.js` (matemáticas puras + persistencia), `ui.js` (DOM + procesamiento de imágenes), `main.js` (orquestador global).
- Sistema de turnos por VEL descendente (`buildTurnOrder()`) con orden intercalado (no bloques por equipo).
- Recurso **Fervor 🔥** (0–10): gana +1 al iniciar turno, +1 al atacar, +1 al recibir daño (aplica al turno siguiente).
- 6 ultimates en `ULTIMATE_DB` con multiplicadores, piercing y veneno.
- **Regla de Oro**: `HP + DEF + ATQ + (VEL × 2) ≤ 7400`, VEL 50–500.
- 18 pasivas portadas al pipeline de turnos (`applyRoundStartPassives`, `processPostDamagePassives`).
- Pasiva `fen_revive` funcional en ambos modos; previene bucles infinitos con flag `_revived`.
- Sanitización XSS: función `esc()` para entidades HTML en todos los inserts `innerHTML`.
- `saveCard()` valida estadísticas con VEL incluidas.
- 34 tests unitarios en Node.js — motor puro (constantes, orden de turno, combate, fervor, veneno, piercing, pasivas, persistencia).

### Entregable
Motor de combate por turnos completo con 1v1 (Coliseo) y 5v5 (Aventura), validación de balance, persistencia en localStorage y suite de tests.

---

## Fase 02: Visual Combat UI — Turn Bar, Animaciones, Recompensas ✅ (Completada)

**Objetivo**: Construir la interfaz visual del combate con barra de orden de turno, barras de fervor, animaciones, números flotantes de daño, modal de recompensas y diseño responsive.

### Tareas realizadas

| # | Tarea | Estado |
|---|-------|--------|
| 2A | **Turn Order Bar** (`renderTurnBar`) — muestra el orden de acción con clases ally/enemy/active/dead | ✅ |
| 2B | **Fervor Bars** — indicadores 🔥 sobre cada carta en combate (Coliseo y PvE) | ✅ |
| 2C | **Active Turn Highlight** (`setActiveHighlight`/`clearActiveHighlight`) — resalta el combatiente activo | ✅ |
| 2D | **Floating Damage Numbers** (`spawnDmgFloat`) — números GSAP que flotan y se desvanecen | ✅ |
| 2E | **Animaciones** — destello/banner de Ultimate, fade de muerte, hit shake, tweens de HP | ✅ |
| 2F | **Reward Modal** (`showRewardModal`) — oro/XP/items; evento `rewardsClaimed` → overlay de victoria | ✅ |
| 2G | **Responsive CSS** — media queries a 768px y 480px; glassmorphism, animaciones keyframes | ✅ |

### Bugs corregidos durante auditoría
- Veneno (Verdant Wrath) se aplicaba al atacante → corregido a `def._poisonApplied`.
- Storm's Judgment retornaba antes de `fen_revive` → ahora cae en pasivas defensivas.
- `gen_block_heal` usaba `def.maxHp || def.hp * 2` inseguro → `def.maxHp || def.hp`.
- `validateCardStats(null)` crasheaba → guarda añadida.
- `double_strike`/`life_leech` causaban recursión infinita → flag `skipPassives`.
- XSS en `<img src>` y `background-image: url()` — `esc()` aplicado a todos.
- Cálculo Mythic omitía VEL → corregido en `displayCards()` y `openCardPicker()`.

### Entregable
Interfaz de combate visual completa con animaciones, feedback de daño, barras de recurso y modal de recompensas. Suite de 58 tests (57 pasan, 1 caso conocido pendiente de revisión).

---

## Fase 03: Loot Tables, Story Panels, Inventario & Stage Polish ← (Actual)

**Objetivo**: Cerrar el Modo Aventura con motor de loot ponderado por enemigo, persistencia de inventario compacta, paneles narrativos Visual Novel y pulido de recompensas post-combate. **El combate táctico (target selection manual + menú Atacar/Ultimate) se difiere a Fase 04.** **Consciencia de deploys**: ningún micro-commit; los cambios se agrupan en lotes.

### Estado actual (~80% completado en refactor anterior)
- ✅ Mapa de aventura con nodos (1-1 a 1-5) y `#worldMapCanvas`.
- ✅ Selección de equipo (5 slots) con overlay `#teamSelectionOverlay`.
- ✅ Combate PvE 5v5 por turnos con `#btnPvENextTurn` (auto-targeting).
- ✅ Consumo de energía por intento.
- ✅ Progresión de stages: desbloqueo secuencial (1-1 → 1-2 → ... → 1-5).
- ✅ Boss (Orc Inmortal) en stage 1-5 con stats sobredimensionados.
- ✅ `showRewardModal()` con oro/XP/items al vencer.

### Tareas pendientes

| # | Tarea | Horas | Agente | Depende de |
|---|-------|-------|--------|------------|
| **3.1** | **Story Panels** — Prosa y lore por el gamedata-generator. Pantallas Visual Novel entre stages clave (1-1 intro, 1-3 midpoint, 1-5 pre-boss). Fondo estático + retrato + texto con fade GSAP. Sin modificar engine.js. | 5h | `@gamedata-generator` (lore) + `@ui-gamefeel-engineer` (HTML/CSS/JS) | — |
| **3.2** | **Loot Tables & weightedRandomSelect** — Función pura en engine.js. `LOOT_TABLES` con pools por stage normal (1-1 a 1-4) y pool especial boss (1-5). Drop por enemigo individual. Pesos: 30% nada, 45% común, 20% poción, 3% raro, 2% mítico (fragmento/material, no carta completa). Conectar a `verifyPartyVictory()` sin tocar `resolveCombatTurn()`. | 5h | `@gamedata-generator` (datos JSON) + `@mechanics-engineer` (`weightedRandomSelect`, integración) | — |
| **3.3** | **Persistencia de Inventario Compacta** — Crear `gameState.inventory` como array de items. Serializar en localStorage bajo clave `inv` usando schema compacto (`hp`/`atq`/`def`/`vel`/`el`/`cls`/`pid` para cartas; `id`/`qty` para consumibles). Toda escritura con try/catch + `QuotaExceededError`. Sin migración futura: el schema compacto se usa desde el vamos. | 4h | `@mechanics-engineer` | 3.2 |
| **3.4** | **Stage Polish & Reward Feedback** — Modificar `showRewardModal()` para mostrar múltiples drops secuenciales (GSAP stagger). Si hay carta rara/mítica, animación de volteo. Combinar con el sistema de estrellas 1-3 según aliados sobrevivientes. Sin tocar la máquina de estados del combate. | 2h | `@ui-gamefeel-engineer` | 3.2 |

### Entregable
Campaña PvE completa con loot ponderado por enemigo, persistencia de inventario en schema compacto, narrativa Visual Novel entre stages clave y reward modal animado. Progresión satisfactoria de 1-1 a 1-5.

### Dependencias: Fase 02 | Estimación: 16h

---

## Fase 04: Altar de Jefes & Combate Táctico

**Objetivo**: Implementar el combate táctico manual (target selection + menú Atacar/Ultimate) diferido de Fase 03, más la pantalla de jefes con IA de fases, habilidades exclusivas y drops especiales.

### Tareas clave

#### 4.A — Combate Táctico (diferido de Fase 03, 10h)
- **4.1 Interactive Tactical Input (6h, @mechanics-engineer + @lead-architect)**: Refactorizar el flujo síncrono de `executePartyTurn()` a event-driven preservando la cola de VEL intercalada. Cuando el turno VEL corresponde a un aliado, `main.js` pausa y emite estado `WAITING_FOR_TARGET`. El jugador hace clic en una carta enemiga del DOM para seleccionar target. Cuando el turno es enemigo, se auto-resuelve con `findTarget()` (sin pausa). Timeout de 15s por selección → caída automática a `findTarget()`. Mutex `_inputLock` en `gameState` para evitar race conditions por multi-click. Logging diferido: el mensaje `[Ally N] → [Enemy M]` se genera en el momento del click, no antes. Re-validación de target vivo antes de ejecutar daño.
- **4.2 Action Selector UI (4h, @ui-gamefeel-engineer)**: Menú emergente sobre la carta aliada activa. Si Fervor < 10, solo botón "Atacar". Si Fervor = 10, botón "ULTIMATE" con glow. Animación GSAP de aparición del menú. Integrar CSS classes `.action-selector`, `.btn-attack`, `.btn-ultimate`, `.target-selectable`, `.target-hover`. Event listeners con `safeListener`.

#### 4.B — Altar de Jefes (12h)
- **4.3 Base de datos de Jefes** — inyectar 3 jefes (ej. *Malphas, El Señor de las Sombras*; *Hydra de Fango*; *Araña de Cristal*). Cada uno con pool de loot exclusivo.
- **4.4 IA de jefe con fases** — comportamiento diferente al 50% y 25% HP. Transición con animación de transformación.
- **4.5 Mecánica "Escalada de Dificultad"** — el jefe gana +5% ATQ y +5% DEF por cada aliado caído.
- **4.6 Habilidad ultimate única por jefe** — no de la ULTIMATE_DB estándar.
- **4.7 Ventana de recompensas especial** — items exclusivos (materiales de Ascensión) con animación de revelación.
- **4.8 Logs de combate coloreados** — eventos críticos del jefe en color dorado.
- **4.9 Performance gate** — animaciones de fase con gating GPU (`hardwareConcurrency < 4` → 50% de partículas).

### Dependencias: Fase 03 | Estimación: 32h

---

## Fase 05: Inventario Táctico, Mochila & Persistencia Compacta

**Objetivo**: Desbloquear la pestaña `#tab-inventory` con un grid de mochila, filtros por elemento/rareza/clase y gestión de ítems. **Migrar toda la persistencia a esquema compacto** para exprimir los 5 MB de localStorage.

### Tareas clave
- Grid modular de slots (`display: grid`) con efectos hover glassmorphism.
- Renderizado masivo del inventario en `ui.js` mapeando persistencia.
- Filtros rápidos: por Elemento (🔥💧⚡🌿), Rareza (Common/Epic/Legendary) o Clase.
- Vista de detalle de carta clickeable con opciones: equipar/vender/forjar.
- Animación de entrada para ítems nuevos (GSAP stagger).
- Slots vacíos con placeholder visual (sin errores).
- **5.7 Compactación de esquema de persistencia** — migrar claves largas a cortas (`hp`/`atq`/`def`/`vel`/`el`/`cls`/`pid`/`img`), serializar a array plano en lugar de objeto anidado. Módulo `storage.js` con funciones `save(key, data)` / `load(key)` que verifican cuota con `navigator.storage.estimate()` antes de escribir. Si cuota ≥ 80%, emitir advertencia visual al usuario (banner amarillo en HUD). Toda escritura envuelta en try/catch con `QuotaExceededError` capturado específicamente.

### Dependencias: Fase 02 | Estimación: 24h

---

## Fase 06: Card Forge System (La Forja)

**Objetivo**: Sistema de fusión y evolución de cartas — sacrifica copias para subir rango y ampliar límite de stats.

### Tareas clave
- Interfaz de forja: ranura de carta base + copias sacrificadas + coste de oro.
- Lógica en `engine.js`: cálculo de incremento de stats sin romper límites por nivel.
- Escalado de límite: 7400 → 8800 → 10000 según nivel de forja.
- Upgrade de ultimate: mejorar nivel del ultimate en la forja.
- Renderizado instantáneo tras fusión con animación de éxito/fracaso.
- Validación de seguridad: bloqueo si faltan recursos.
- **Validación de cuota localStorage**: antes de cada fusión, verificar espacio disponible. Si cuota ≥ 80%, mostrar advertencia: "Almacenamiento casi lleno — fusiona con cuidado". Si la fusión excede la cuota, cancelar con mensaje claro.

### Dependencias: Fase 05 | Estimación: 25h

---

## Fase 07: Tienda del Mercader & Economía

**Objetivo**: Ciclo económico completo — compra de sobres de cartas, paquetes de energía y consumibles con ofertas rotativas.

### Tareas clave
- Catálogo de ofertas rotativas con precios en Oro/Gemas.
- Algoritmo de apertura de sobres (Gacha balanceado con rarezas ponderadas).
- Regeneración pasiva de energía basada en `Date.now()`.
- Blindaje atómico: toda transacción resta y suma de forma indivisible.
- Animación de apertura de sobre (GSAP flip/reveal).

### Dependencias: Fase 02, 06 | Estimación: 16h

---

## Fase 08: PvP Multijugador Local (Hotseat)

**Objetivo**: Permitir combates 1v1 entre dos jugadores locales, turnándose en el mismo navegador.

### Tareas clave
- Panel de selección de carta para Jugador 1 y Jugador 2 en Coliseo.
- Ocultamiento de la mano del oponente durante su turno (flip card / blur).
- Temporizador por turno para evitar partidas infinitas.
- Historial de partidas PvP con resultado (Victorias/Derrotas locales).

### Dependencias: Fase 01 | Estimación: 18h

---

## Fase 09: Pulido UX, Sonido Web & Performance Budget

**Objetivo**: Elevar la calidad visual con micro-interacciones, partículas CSS y feedback háptico simulado. **Sintetizar todo el audio con Web Audio API** (0 MP3, 0 WAV). **Establecer un performance budget** para garantizar 60 fps en 5v5.

### Tareas clave
- **9.1 Impacto visual** — keyframes de sacudida de pantalla, destello rojo en daño crítico.
- **9.2 Codificación de colores** en Adventure Log (Verde = curación, Amarillo = mitigación, Morado = veneno).
- **9.3 Efecto de partículas** en rarezas Legendarias/Míticas (GSAP stagger limitado por CPU).
- **9.4 Optimización de transiciones** con `setTimeout` controlados para legibilidad.
- **9.5 Performance budget 50ms/frame** — gating de animaciones según CPU del dispositivo:
  - `navigator.hardwareConcurrency ≥ 4` → animaciones completas (partículas, hit shake, float numbers, glow pulsante)
  - `hardwareConcurrency < 4` → modo ligero: solo fade de HP y barras de vida. Sin partículas ni shake.
  - `hardwareConcurrency < 2` → modo texto: sin animaciones GSAP, solo actualización de números.
  - Detección al cargar la página y al iniciar combate. Almacenar en `gameState.performanceTier`.
- **9.6 Web Audio API — Síntesis completa de SFX** (prohibido MP3/WAV):
  - Crear módulo `sfx.js` con funciones: `playHit()`, `playCrit()`, `playHeal()`, `playUltimate()`, `playVictory()`, `playUIClick()`, `playCoinDrop()`.
  - Cada función genera el sonido con `AudioContext.createOscillator()` + `GainNode` para volumen y duración.
  - Ejemplo: `playHit()` = noise buffer de 50ms con decay exponencial. `playCrit()` = doble tono ascendente. `playHeal()` = sinusoide suave 440→660 Hz.
  - Cargar `AudioContext` lazy (primera interacción del usuario, respetando autoplay policy).
  - Caché de buffers: precargar los 7 sonidos al activar AudioContext. Peso total < 1 KB (código) + 0 KB (assets).
  - Volumen ajustable desde configuración (almacenado en localStorage con clave `vol`).
- **9.7 Budget de assets sonoros** — verificar que `sfx.js` minificado no supere 2 KB.

### Dependencias: Fase 04, 05 | Estimación: 24h

---

## Fase 10: IA de Balanceo de Datos Automático

**Objetivo**: Usar LLMs locales para simular combates masivos y detectar combinaciones rotas.

### Tareas clave
- Script de simulación headless (sin DOM) para enfrentar combinaciones de cartas.
- Análisis de tasas de victoria y detección de combos OP.
- Ajuste fino de coeficientes de daño, veneno y escalado.
- Reportes de balance en Markdown.
- **Simulación con datos reales** — usar el esquema compacto de persistencia (Fase 05) para alimentar las simulaciones con cartas reales del jugador.

### Dependencias: Fase 04, 05 | Estimación: 30h

---

## Fase 11: QA Defensivo, Hardening DOM & Límites Reales

**Objetivo**: Blindar la app contra excepciones no controladas y **verificar que respeta los límites de GitHub Pages y cliente**.

### Tareas clave
- Validación Vanguard en todos los selectores del DOM (`if (!el) return`).
- `safeListener` en todos los eventos del ciclo de vida.
- **11.3 Pruebas de corrupción de localStorage** — inyectar JSON malicioso, verificar que `try/catch` recupera sin crash.
- **11.4 Stress test de cuota localStorage** — llenar almacenamiento hasta el 95%, verificar que `saveCard()` y fusión lanzan advertencia visual (no crash). Script de prueba `test_quota.mjs` que mide:
  - Cuántas cartas caben con esquema compacto vs esquema largo.
  - Tiempo de serialización/deserialización de 200 cartas.
  - Umbral exacto donde salta `QuotaExceededError`.
- **11.5 Auditoría de referencias nulas** post-refactor.
- **11.6 Verificación de silencio de consola** — lanzar juego en Puppeteer headless, capturar todos los `console.error/warn`, tolerancia cero en modo producción.

### Dependencias: Todas las fases lógicas | Estimación: 22h

---

## Fase 12: Minificación, Assets & Despliegue Definitivo

**Objetivo**: Publicar en GitHub Pages con velocidad extrema, **cero warnings y blindado contra los límites de la plataforma**.

### Tareas clave

| # | Tarea | Herramienta | Detalle |
|---|-------|-------------|---------|
| 12.1 | **Conversión de arte a WebP** | `sharp` / `squoosh` CLI | Todo asset de carta, fondo e icono convertido a WebP 80% calidad, dimensiones homogéneas (300×420 cartas, 80×80 iconos). Peso máximo por imagen: 40 KB. |
| 12.2 | **Minificación de JS y CSS** | Terser + CSSO | `npx terser engine.js -o engine.min.js --compress --mangle`. Todos los módulos ES6 fusionados en 3 archivos: `app.min.js`, `style.min.css`, `sfx.min.js`. Tree-shake elimina `console.log` de debug. |
| 12.3 | **Auditoría de consola** | Puppeteer script | Navegar todas las secciones, simular combate 5v5, abrir forja. Cero `console.error/warn`. Si hay errores, la fase no se cierra. |
| 12.4 | **Presupuesto de ancho de banda** | Script `check_budget.mjs` | Sumar pesos de todos los assets servidos: `app.min.js` + `style.min.css` + `index.html` + imágenes. Si total > 500 KB, la fase no se cierra. |
| 12.5 | **Batching de deploys** | `deploy.sh` script | Script que: (1) ejecuta minificación, (2) corre auditoría de consola, (3) corre verificación de presupuesto, (4) hace un solo commit con todos los cambios, (5) pushea a `gh-pages`. **Nunca más de 1 push cada 10 minutos.** |
| 12.6 | **GitHub Actions CI opcional** | `.github/workflows/deploy.yml` | Workflow que corre los pasos 12.2–12.5 automáticamente al pushear a `main`. Incluye rate-limit: si ya hubo 9 builds en la última hora, cancela el deploy y encola para la siguiente hora. |
| 12.7 | **Medición post-despliegue** | `performance.mark()` + Report | Medir `DOMContentLoaded`, `First Meaningful Paint`, `Time to Interactive`. Publicar métricas en consola del navegador. |

### Dependencias: Fase 09, 11 | Estimación: 16h

---

## Mapa de Modos de Juego vs Fases de Desarrollo

| Fase | Modo Coliseo (1v1) | Modo Aventura | Forja | Tienda | PvP Hotseat |
|------|:------------------:|:-------------:|:----:|:-----:|:-----------:|
| 01 Core Engine V2 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 02 Visual Combat UI | ✅ | ✅ | ❌ | ❌ | ❌ |
| 03 Story + Loot | ❌ | ✅ | ❌ | ❌ | ❌ |
| 04 Boss Altar | ❌ | ✅ | ❌ | ❌ | ❌ |
| 05 Inventory + Storage | ✅ | ❌ | ❌ | ❌ | ❌ |
| 06 Forge System | ❌ | ❌ | ✅ | ❌ | ❌ |
| 07 Mercader Shop | ❌ | ❌ | ❌ | ✅ | ❌ |
| 08 PvP Hotseat | ✅ | ❌ | ❌ | ❌ | ✅ |
| 09 UX + Audio + Perf | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10-12 Balance/QA/Deploy | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Dependencias entre Fases de Construcción

```
01 [Core Engine V2] ──→ 02 [Visual Combat UI] ──→ 03 [Loot + Story + Inventory]
 │                                                     │
 │   ┌─────────────────────────────────────────────────┘
 │   ▼
 │   04 [Combate Táctico + Boss Altar] ──→ 09 [UX + Audio + Perf]
 │
 ├──→ 05 [Inventory Grid] ──→ 06 [Forge System] ──→ 07 [Mercader Shop]
 │
 └──→ 08 [PvP Hotseat]
│
11 [QA + Límites] ──→ 09 ──→ 10 [IA Balance] ──→ 12 [Deploy Final]
                         │
                         └──→ 05 [storage grid] ──→ 06 [quota validation]

Nota: Fase 04 hereda el combate táctico (target selection + action selector)
diferido de Fase 03, por eso depende de ella.
```

---

## Estimación de Recursos en la Factoría Card Forge

| Rol del Agente | Fases de Asignación Principal | Enfoque de Entrega |
|----------------|------------------------------|--------------------|
| `@lead-architect` | 02, 03, 04, 08, 11, 12 | Orquestación de archivos, máquina de estados, FSM asíncrona de combate, CI/CD y batching de deploys |
| `@mechanics-engineer` | 01, 03, 04, 06, 10, 11 | Matemáticas puras de combate en `engine.js`, persistencia compacta, validación de cuota, refactor event-driven de executePartyTurn |
| `@ui-gamefeel-engineer` | 02, 03, 05, 07, 09 | Interfaz HTML, grids CSS, logs dinámicos, Web Audio API SFX, performance budget |
| `@gamedata-generator` | 03, 04, 07 | Forja de archivos JSON, balance base de datos, tablas de botín |
| `@qa-balance-auditor` | 02, 10, 11, 12 | Caza de bucles infinitos, validación de 7400 pts, stress test de cuota, auditoría de consola |

**Tiempo estimado total de desarrollo asistido:** ~268 horas de ejecución en factoría local.

---

## Checklist de Límites GitHub Pages (Verificación Final)

Antes de marcar la Fase 12 como completa, verificar todos estos puntos:

- [ ] **Bandwidth ≤ 500 KB**: suma de `index.html` + `app.min.js` + `style.min.css` + imágenes ≤ 500 KB
- [ ] **Cero errores en consola**: Puppeteer test recorriendo todas las secciones
- [ ] **Cuota localStorage ≥ 20% libre**: después de cargar 100 cartas de prueba
- [ ] **Tasa de deploys ≤ 8/hora**: verificado en el histórico de commits
- [ ] **Audio sintetizado (sin MP3/WAV)**: `sfx.js` < 2 KB, usa exclusivamente `AudioContext`
- [ ] **Performance tier detectado**: `gameState.performanceTier` se setea al cargar la página
- [ ] **WebP en todos los assets**: sin PNG/JPG en producción
- [ ] **Minificación activa**: `app.min.js` generado por Terser, `style.min.css` por CSSO
