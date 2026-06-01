# ⚔️ Plan de Implementación — Easy Hit: Architect Harmondez Edition (12 Fases)

> **Visión**: Juego de cartas táctico y RPG web Vanilla de alta densidad, enfocado en latencia cero, arquitectura modular desacoplada y un equilibrio matemático estricto basado en el manual de diseño.
> **Público**: Jugadores de TCG estratégicos y RPG de progresión clásica (*Heroes of Camelot* style).
> **Stack**: Vanilla JavaScript (ES6 Modules) · HTML5 Semántico · CSS3 (Custom Properties + Grid) · Inferencia Local (Ollama / OpenCode) · Despliegue en GitHub Pages.

---

## Resumen de Fases

| # | Fase | Área | Horas est. | Dependencias |
|---|------|------|-----------|-------------|
| 01 | Core Engine V2 — VEL/Fervor/Ultimate | Lógica/UI | 35h ✅ | — |
| 02 | Visual Combat UI — Turn Bar, Animaciones, Recompensas | UI/CSS | 20h ✅ | Fase 01 |
| 03 | Modo Aventura — Story Panels, Loot Tables, Stage Polish | Full Stack | 20h ← | Fase 02 |
| 04 | Altar de Jefes (Boss Altar) | Lógica/UI/Content | 22h | Fase 03 |
| 05 | Inventario Táctico & Mochila | UI/Grid | 20h | Fase 02 |
| 06 | Card Forge System (Fusión + Forja) | Lógica/UI | 25h | Fase 05 |
| 07 | Tienda del Mercader & Economía | Full Stack | 16h | Fase 02, 06 |
| 08 | PvP Multijugador Local (Hotseat) | Lógica/UI | 18h | Fase 01 |
| 09 | Pulido de UX & Game Feel Avanzado | UI/CSS | 18h | Fase 04, 05 |
| 10 | IA de Balanceo de Datos Automático | IA/QA | 30h | Fase 04, 05 |
| 11 | QA Defensivo & Hardening del DOM | QA/Seguridad | 20h | Todas |
| 12 | Optimización de Assets & Despliegue | DevOps | 12h | Fase 09, 11 |
| | **Total** | | **~256h** | |

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

## Fase 03: Modo Aventura — Story Panels, Loot Tables, Stage Polish ← (Actual)

**Objetivo**: Finalizar el Modo Aventura con paneles narrativos (Visual Novel), tablas de botín con drops ponderados, animaciones de transición entre stages y pulido de la progresión 1-1 → 1-5.

### Estado actual (∼80% completado en refactor anterior)
- ✅ Mapa de aventura con nodos (1-1 a 1-5) y `#worldMapCanvas`.
- ✅ Selección de equipo (5 slots) con overlay `#teamSelectionOverlay`.
- ✅ Combate PvE 5v5 por turnos con `#btnPvENextTurn`.
- ✅ Consumo de energía por intento.
- ✅ Progresión de stages: desbloqueo secuencial (1-1 → 1-2 → ... → 1-5).
- ✅ Boss (Orc Inmortal) en stage 1-5 con stats sobredimensionados.
- ✅ `showRewardModal()` con oro/XP/items al vencer.

### Tareas pendientes

| # | Tarea | Horas | Agente |
|---|-------|-------|--------|
| 3.1 | **Story Panels** — pantallas de diálogo entre stages (Visual Novel style: fondo, retrato, texto con fade) | 6h | `@ui-gamefeel-engineer` |
| 3.2 | **Panel de Victoria** — animación de stage completado con estrellas/rating | 2h | `@ui-gamefeel-engineer` |
| 3.3 | **Loot Tables** — sistema de drops ponderados (`weightedRandomSelect`) en engine.js + JSON de tablas | 6h | `@gamedata-generator` |
| 3.4 | **Render dinámico de botín** — animación de cartas/materiales obtenidos post-combate | 4h | `@ui-gamefeel-engineer` |
| 3.5 | **Persistencia de inventario** — guardar ítems recolectados en localStorage con try/catch | 2h | `@mechanics-engineer` |

### Entregable
Campaña PvE completa con narrativa entre stages, tabla de botín funcional con drops aleatorios y progresión satisfactoria de 1-1 a 1-5 (Boss).

### Dependencias: Fase 02 | Estimación: 20h

---

## Fase 04: Altar de Jefes (Boss Altar)

**Objetivo**: Implementar una pantalla dedicada a combates contra jefes con IA de comportamiento, habilidades especiales y tabla de drops exclusiva.

### Tareas clave
- Inyección de la base de datos de Jefes (ej. *Malphas, El Señor de las Sombras*).
- IA de jefe con fases: comportamiento diferente al 50% y 25% HP.
- Mecánica de "Escalada de Dificultad": el jefe gana stats por ally caído.
- Habilidad ultimate única por jefe (no de la ULTIMATE_DB estándar).
- Ventana de recompensas especial con items exclusivos (materiales de Ascensión).
- Logs de combate coloreados para eventos críticos del jefe.

### Dependencias: Fase 03 | Estimación: 22h

---

## Fase 05: Inventario Táctico & Mochila

**Objetivo**: Desbloquear la pestaña `#tab-inventory` con un grid de mochila, filtros por elemento/rareza/clase y gestión de ítems.

### Tareas clave
- Grid modular de slots (`display: grid`) con efectos hover glassmorphism.
- Renderizado masivo del inventario en `ui.js` mapeando persistencia.
- Filtros rápidos: por Elemento (🔥💧⚡🌿), Rareza (Common/Epic/Legendary) o Clase.
- Vista de detalle de carta clickeable con opciones: equipar/vender/forjar.
- Animación de entrada para ítems nuevos (GSAP stagger).
- Slots vacíos con placeholder visual (sin errores).

### Dependencias: Fase 02 | Estimación: 20h

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

## Fase 09: Pulido de UX & Game Feel Avanzado

**Objetivo**: Elevar la calidad visual con micro-interacciones, partículas CSS y feedback háptico simulado.

### Tareas clave
- Animaciones de impacto: keyframes de sacudida de pantalla, destello rojo en daño crítico.
- Codificación de colores en Adventure Log (Verde = curación, Amarillo = mitigación, Morado = veneno).
- Efecto de partículas en rarezas Legendarias/Míticas.
- Optimización de transiciones con `setTimeout` controlados para legibilidad.

### Dependencias: Fase 04, 05 | Estimación: 18h

---

## Fase 10: IA de Balanceo de Datos Automático

**Objetivo**: Usar LLMs locales para simular combates masivos y detectar combinaciones rotas.

### Tareas clave
- Script de simulación headless (sin DOM) para enfrentar combinaciones de cartas.
- Análisis de tasas de victoria y detección de combos OP.
- Ajuste fino de coeficientes de daño, veneno y escalado.
- Reportes de balance en Markdown.

### Dependencias: Fase 04, 05 | Estimación: 30h

---

## Fase 11: QA Defensivo & Hardening del DOM

**Objetivo**: Blindar la app contra excepciones no controladas.

### Tareas clave
- Validación Vanguard en todos los selectores del DOM (`if (!el) return`).
- `safeListener` en todos los eventos del ciclo de vida.
- Pruebas de corrupción de localStorage (JSON malicioso).
- Auditoría de referencias nulas post-refactor.

### Dependencias: Todas las fases lógicas | Estimación: 20h

---

## Fase 12: Optimización de Assets & Despliegue

**Objetivo**: Publicar en GitHub Pages con rendimiento óptimo.

### Tareas clave
- Conversión de arte a WebP con dimensiones homogéneas.
- Minificación de CSS y JS.
- Auditoría de consola: cero warnings/errors.
- Despliegue automatizado a rama de producción.

### Dependencias: Fase 09, 11 | Estimación: 12h

---

## Mapa de Modos de Juego vs Fases de Desarrollo

| Fase | Modo Coliseo (1v1) | Modo Aventura | Forja | Tienda | PvP Hotseat |
|------|:------------------:|:-------------:|:----:|:-----:|:-----------:|
| 01 Core Engine V2 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 02 Visual Combat UI | ✅ | ✅ | ❌ | ❌ | ❌ |
| 03 Story + Loot | ❌ | ✅ | ❌ | ❌ | ❌ |
| 04 Boss Altar | ❌ | ✅ | ❌ | ❌ | ❌ |
| 05 Inventory Grid | ✅ | ❌ | ❌ | ❌ | ❌ |
| 06 Forge System | ❌ | ❌ | ✅ | ❌ | ❌ |
| 07 Mercader Shop | ❌ | ❌ | ❌ | ✅ | ❌ |
| 08 PvP Hotseat | ✅ | ❌ | ❌ | ❌ | ✅ |
| 09 UX Game Feel | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10-12 Balance/QA/Deploy | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Dependencias entre Fases de Construcción

```
01 [Core Engine V2] ──→ 02 [Visual Combat UI] ──→ 03 [Story + Loot] ──→ 04 [Boss Altar]
│
├──→ 05 [Inventory Grid] ──→ 06 [Forge System] ──→ 07 [Mercader Shop]
│
└──→ 08 [PvP Hotseat]
│
11 [QA Hardening] ──→ 09 [Game Feel UX] ──→ 10 [IA Balance] ──→ 12 [GitHub Pages]
```

---

## Estimación de Recursos en la Factoría Card Forge

| Rol del Agente | Fases de Asignación Principal | Enfoque de Entrega |
|----------------|------------------------------|--------------------|
| `@lead-architect` | 02, 03, 08, 11, 12 | Orquestación de archivos y máquina de estados |
| `@mechanics-engineer` | 01, 03, 04, 06, 10 | Matemáticas puras de combate en `engine.js` |
| `@ui-gamefeel-engineer` | 02, 03, 05, 07, 09 | Interfaz HTML, grids CSS y logs dinámicos |
| `@gamedata-generator` | 03, 04, 07 | Forja de archivos JSON y balance base de datos |
| `@qa-balance-auditor` | 02, 10, 11 | Caza de bucles infinitos y validación de 7400 pts |

**Tiempo estimado total de desarrollo asistido:** ~256 horas de ejecución en factoría local.
