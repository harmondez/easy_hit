# Fase 03 — Activación del Core: Creator & Library

## 1. Funcionalidad Núcleo Activada

### Enrutamiento SPA (main.js)
- **La aplicación arranca siempre en Creator:** `transitionState('creator')` activa el flujo de entrada que oculta todas las secciones y muestra `#creatorMainGroup` con `display: flex`.
- **Transición entre pestañas activas:** Los listeners de `#tab-library` y `#tab-creator` llaman a `transitionState()` que:
  1. Ejecuta `onSectionExit[prev]()` (gancho de salida)
  2. Llama `UI.showSection(target)` que oculta todos los contenedores vía `ALL_SECTION_IDS` y revela el destino
  3. Ejecuta `onSectionEnter[target]()` — para Library, ejecuta `UI.displayCards()` automáticamente
  4. Aplica fade-in GSAP sobre el contenedor destino
  5. Persiste la última pestaña en localStorage
- **Pestañas bloqueadas** (Coliseum, Adventure, Inventory, Shop): los clics muestran un toast animado `🔒 {Nombre} — Coming in Phase 4` sin cambiar de sección.

### Visibilidad de Contenedores (ui.js + index.html)
- `ALL_SECTION_IDS = ['section-library', 'creatorMainGroup', 'section-coliseo', 'adventure', 'inventory', 'shop']` — array que `showSection()` itera para ocultar todo (`el.style.display = 'none'`), luego activa solo el destino.
- Library: `#section-library` pasa de `display: none` a `display: block`.
- Creator: `#creatorMainGroup` pasa de `display: none` a `display: flex`.

### Flujo Creator → localStorage → Library
1. Usuario ajusta sliders/inputs → `updateRemainingPoints()` → `updatePreview()` renderiza TCG card en vivo
2. Usuario hace clic en **FORGE CARD**:
   - Se recolectan todos los campos: name, element, class, hp, def, atq, passiveId, image
   - Se valida con `Engine.saveCard(card)`: rechaza si `totalStats > 7400` o datos inválidos
   - Si válido: `cards.push()`, `syncStorage()` persiste en localStorage
   - `UI.displayCards()` refresca el roster de la biblioteca
   - `resetCropperData()` limpia el formulario
3. Al cambiar a la pestaña Library, `onSectionEnter.library` ejecuta `UI.displayCards()` que renderiza todas las cartas guardadas.

## 2. Auditoría de Balanceo

### Regla de Oro: 7400 puntos
- **Validación en engine.js (saveCard):** `const totalStats = (hp + atq + def)` → si `> 7400`, retorna `false` y no guarda.
- **Validación en ui.js (updateRemainingPoints):** `remaining = 7400 - total` → si `remaining < 0`, el contador se pinta rojo, GSAP sacude el número, y `saveCardBtn` recibe:
  - Clase `.shake-error` (animación shake X)
  - Clase `.btn-forge-error` (fondo rojo + glow)
  - GSAP pulse de escala (`scale: 0.95` con yoyo)
  - `alert()` con mensaje de rechazo
- **Registro de stats invariante:** Cada carta registra obligatoriamente `{ id, name, element, cardClass, hp, def, atq, maxHp, passiveId, image }`.

### Persistencia blindada
- `syncStorage()` en engine.js envuelve `localStorage.setItem()` en `try/catch`
- `loadLibrary()` envuelve `localStorage.getItem()` y `JSON.parse()` en `try/catch`
- `importarBiblioteca()` valida que el JSON importado sea `Array` y cada elemento tenga `id` y `name`

## 3. Próximos Pasos (Fase 4)

- **Coliseum (Arena PvP):** Reactivar la sección con selección de luchadores, combate por rondas, procesamiento de pasivas y condiciones de victoria (código ya existe en engine.js y ui.js, solo falta desbloquear el tab).
- **Sistema Económico:** Activar el HUD de recursos (oro/gemas/energía) con persistencia, tienda de paquetes (`btn-buy`) con descuento real de recursos, y cofre de botín (`openChest`) con recompensas consumibles.
- **Forja y Refogue:** Habilitar el panel de mejora de cartas con sacrificio, barras de XP por nivel, y bonus de stats por nivel.
- **Inventario:** Renderizar ítems coleccionables, materiales y consumibles con filtro por categoría.
- **Mapa de Aventura y Raid:** Mapa de nodos por etapas, altar de incursiones con jefe semanal y códice de dropeo completo.
