# Fase 05 — Motor del Modo Aventura (Zona 1)

## 1. Campaña de la Zona 1 Activada

### Mapa Lineal
- 5 nodos conectados visualmente mediante SVG `<line>` con `stroke-dasharray="6,4"`
- `1-1` (35%,80%) → `1-2` (25%,55%) → `1-3` (50%,35%) → `1-4` (75%,55%) → `1-5 BOSS` (85%,80%)
- 3 estados por nodo: `available` (gold pulse CSS), `completed` (verde), `locked` (gris, `cursor:not-allowed`)
- Desbloqueo secuencial: vencer un nodo marca `completed` y el siguiente pasa de `locked` a `available`

### Navegación
- Click en nodo `available` → panel flotante `renderTeamSelection(stageId)`
- Click en nodo `locked` → ignorado (clase CSS `locked` + `pointer-events` no personalizada, controlado por JS)
- Pestaña `Inventory` y `Shop` aún bloqueadas con toast `🔒 — Coming in Phase 5`

## 2. Mecánica de Despliegue de Equipo

### Team Selection Overlay
- Panel `.team-selection-overlay` con 5 slots (`.party-slot`) dispuestos en fila
- Click en slot vacío → `openCardPicker(slotIndex)` abre un modal con las cartas de la Library
- Las cartas ya seleccionadas se filtran del picker (no duplicados)
- Slot lleno muestra: miniatura, nombre, stats (❤️⚔️🛡️)
- Botón **CONFIRM TEAM** se habilita solo cuando los 5 slots están ocupados
- Botón **CANCEL** cierra el panel sin efecto

### Protección Anti-Duplicados
```js
const available = library.filter(c => !_teamSlots.some(s => s && s.id === c.id));
```
Validación adicional en `getSelectedTeam()`:
```js
if (_teamSlots.every(s => s !== null)) { ... }
```

## 3. Combate PvE por Turnos (Party vs Enemigo)

### Flujo de Combate
1. **CONFIRM TEAM** → clona las 5 cartas + obtiene enemigo vía `Engine.getEnemyForStage()` → renderiza `renderPvEArena()`
2. **NEXT TURN** (cada clic):
   - Incrementa `turnCount`
   - `Engine.executePartyTurn(party, enemy)`:
     - Cada miembro vivo activa `applyRoundStartPassives(member, enemy)`
     - Cada miembro vivo ejecuta `procesarAtaque(member, enemy)`
     - Si el enemigo sigue vivo, contraataca al primer miembro vivo
   - `Engine.verifyPartyVictory(party, enemy)` verifica estado
3. **Victoria** → overlay dorado 🏆, nodo marcado `completed`, siguiente nodo desbloqueado
4. **Derrota** → overlay rojo 💀, opciones: RETRY (vuelve a team selection) o BACK TO MAP

### Límites de Seguridad
- `turnCount ≥ 100` → corta el combate (anti-bucle)
- `if (!adv.inCombat)` → ignora clics en NEXT TURN
- Todos los accesos DOM precedidos por `if (el)`
- Cartas clonadas con `JSON.parse(JSON.stringify())` para no mutar la Library original

### Battle Log en Vivo
- `#pveLogContent` separado del log del Coliseo
- `pveLogConsole(msg, type, turn)` → wrappea `logConsole` con `containerId='pveLogContent'`
- Tipos: `system`, `round-header`, `attack`, `damage`, `passive`, `victory`
- Turnos etiquetados como `T{n}` para distinguirlos de las rondas `R{n}` del Coliseo

## 4. Códice de Enemigos

| Enemigo | HP | DEF | ATQ | Total | Pasiva | Fases |
|---------|----|-----|-----|-------|--------|-------|
| Goblin Raider | 3500 | 2000 | 1900 | **7400** | — | 1-1 a 1-4 |
| Orc Warlord (BOSS) | 8000 | 4000 | 3000 | **15000** | `gen_block_heal` | 1-5 |

El Orc Warlord rompe la regla de los 7400 puntos (15,000 total) para forzar al jugador a explotar las pasivas de su equipo de 5 cartas. Su pasiva `gen_block_heal` absorbe el primer golpe de la ronda y lo convierte en curación (50% ATQ).

## 5. Resumen de Cambios

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `index.html` | 1 | `locked` removido de `#tab-adventure` |
| `main.js` | +110 | `gameState.adventure`, `ACTIVE_SECTIONS` ampliado, delegación global de eventos, flujo de combate PvE |
| `ui.js` | +280 | `renderMapNodes()` reescrito (Zona 1 lineal + SVG conectores), `logConsole()` extendido con `containerId`, 8 nuevas funciones para team selection, PvE arena y resultados |
| `engine.js` | +70 | `ENEMY_ROSTER` (Goblin + Orc), `getEnemyForStage()`, `executePartyTurn()`, `verifyPartyVictory()` |
| `style.css` | +140 | Estilos para team selection, card picker, PvE arena, battle log, result overlays y responsivo |

### Test Puppeteer — Resultados
```
1. Adventure tab locked? false                    ✅
2. Adventure display:block active:true nodes:5    ✅
3. Node statuses: 1-1 active, 1-2/3/4 locked, 1-5 boss locked ✅
4. Locked node click → no overlay                ✅
5. Available node click → overlay + 5 slots      ✅
6. Cancel button → overlay removed               ✅
7. Inventory/Shop → "Coming in Phase 5" toast    ✅
8. Library still functional                      ✅
```

## 6. Próximos Pasos (Fase 6)

- **Sistema de Evolución y Fusión de Cartas:** Combinar 2 cartas del mismo elemento para subir de rango, incrementando el límite de 7400 puntos (ej. 7400 → 8800 → 10000).
- **Sistema de Runas:** Modificadores equipables que otorgan pasivas adicionales o bonificaciones de stat porcentuales a cartas individuales.
- **Persistencia del Mapa:** Guardar `stageProgress` en localStorage para mantener el progreso entre sesiones.
