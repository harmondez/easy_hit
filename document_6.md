# Fase 06 — Refinamiento Matemático y Balanceo PvE (Adventure Core)

## 1. Auditoría Matemática 5v5

### Sistema de Targeting por Frontline

El motor `executePartyTurn(party, squad)` opera en dos fases por turno:

**Fase Aliada:** Cada aliado vivo (índice 0→4) busca al enemigo vivo de menor índice (`findFirstAliveIndex`), activa sus pasivas de inicio de ronda y ejecuta `procesarAtaque` con etiquetas indexadas (`[Ally N]` vs `[Enemy M]`). Si el objetivo muere durante la fase, el siguiente aliado ataca al siguiente enemigo vivo.

**Fase Enemiga:** Cada enemigo vivo (índice 0→4) busca al aliado vivo de menor índice y contraataca con el mismo mecanismo.

```
Turno 1:
  [Ally 1] Ace → [Enemy 1] Shieldbearer (2500 ATQ vs 2500 DEF = 1250 HP)
  [Ally 2] Blade → [Enemy 1] Shieldbearer (2600 ATQ vs 1250 DEF = 1925 HP) → ¡Muere!
  [Ally 3] Cinder → [Enemy 2] Piker (2200 ATQ vs 1500 DEF = 1450 HP)
  [Ally 4] Dusk → [Enemy 2] Piker (2300 ATQ vs 1350 DEF = 1625 HP) → ¡Muere!
  [Ally 5] Ember → [Enemy 3] Sapper (2100 ATQ vs 1200 DEF = 1500 HP)
  ── Contraataque enemigo ──
  [Enemy 3] Sapper → [Ally 1] Ace (2200 ATQ vs 2400 DEF = 1100 HP)
  [Enemy 4] Scout → [Ally 1] Ace (2700 ATQ vs 2300 DEF = 1550 HP)
  [Enemy 5] Shaman → [Ally 1] Ace (1800 ATQ vs 2050 DEF = 875 HP)
```

Resultado simulado (Stage 1-1): Victoria en 3 turnos, 4 aliados sobreviven.

### Funciones clave añadidas/modificadas

| Función | Cambio |
|---------|--------|
| `findFirstAliveIndex(arr)` | Nueva — retorna el índice del primer combatiente vivo en un array |
| `procesarAtaque(atk, def, atkLabel?, defLabel?)` | Modificada — parámetros opcionales para logging indexado |
| `getSquadForStage(stageId)` | Nueva — retorna array de 5 enemigos (o 1 boss) con escalado por fase |
| `executePartyTurn(party, squad)` | Reescribita — loop 5v5 con fases aliada y enemiga |
| `verifyPartyVictory(party, squad)` | Reescribita — array-based con guards null |

### Logging Indexado

Todos los mensajes del engine ahora usan etiquetas como `[Ally 1] HeroName` y `[Enemy 3] EnemyName` para identificar claramente qué slot atacó a cuál:

```
⚔️ [Ally 2] Blade strikes [Enemy 1] Shieldbearer!
💥 [Ally 2] Blade inflige 1925 HP y destroza 1250 DEF.
...
⚔️ [Enemy 4] Scout retaliates against [Ally 1] Ace!
💥 Ace recibe 1550 HP de daño total.
```

## 2. Ficha de Balanceo del Boss (Orco Inmortal)

### Estadísticas Finales

| Stat | Valor | Justificación |
|------|-------|---------------|
| **HP** | 40,000 | 5 aliados causan ~8,000–10,000 HP netos por turno. El boss sobrevive 4–6 turnos. |
| **DEF** | 5,000 | Los primeros 1–2 ataques se consumen en la DEF. Los restantes 3–4 ataques van al HP. |
| **ATQ** | 3,500 | ~1,750 HP por golpe contra un aliado de 2,000 DEF. Un aliado típico muere en 2 golpes. |
| **Pasiva** | `orc_warlord` | Triple efecto: bloqueo (1 vez) + regeneración 2% por turno + Berserker (ATK x3 al 30% HP) |
| **Total** | 40k+5k+3.5k = **48,500** | ~6.5× el límite de 7,400 |

### Comportamiento de la Pasiva `orc_warlord`

1. **Warlord's Bulwark** (en `calcularDetalleDaño`): El primer golpe recibido en el combate es bloqueado y convierte el 50% del ATQ del atacante en curación para el Orco.
2. **Warlord's Vitality** (en `applyRoundStartPassives`): Cada inicio de turno, el Orco regenera 2% de su HP máximo (800 HP por turno).
3. **Berserker Fury** (en `applyRoundStartPassives`): Cuando el HP del Orco cae por debajo del 30% (≈12,000 HP), su ATQ se triplica (3500 → 10500), permitiéndole eliminar aliados en un solo golpe.

### Resultado de la Simulación Headless

```
Boss Simulation (1-5):
  Turn 3: Boss drops below 30% HP → ATK x3!
  Turn 5: Boss defeated (3 allies survived, boss had 40000 HP)
  ✅ Boss lasts 4-10 turns (balanced): 5 turns ✓
```

## 3. Control de Recursión de Pasivas

### Aislamiento de Flags

| Riesgo | Mitigación | Estado |
|--------|------------|--------|
| Dos Goblins Sapper con `prog_venom` se solapan | Cada enemigo es clonado con `JSON.parse(JSON.stringify())` — objetos independientes | ✅ A salvo |
| `_revived` compartido entre 5 Fenix aliados | Cada aliado del equipo seleccionado también es clonado al inicio del combate | ✅ A salvo |
| `_blockUsed` del Orco se reinicia entre turnos | El flag persiste en el objeto clonado del boss, no hay reinicio | ✅ Correcto (1 vez) |
| `_stolen` de `gen_steal_stats` se activa por cada enemigo | Cada enemigo tiene su propio `_stolen` flag | ✅ A salvo |

### Cortafuegos Adicionales

- `findFirstAliveIndex` verifica `arr[i] && arr[i].hp > 0` antes de seleccionar objetivo
- `verifyPartyVictory` usa guards: `squad && squad.length > 0 && squad.every(e => !e || e.hp <= 0)`
- Límite de 100 turnos en `main.js` como safety valve anti-bucle
- Cada enemigo recibe un `_uid` único (`enemy_slot_0` a `enemy_slot_4`) para depuración

### Resultado de la Simulación

```
14/14 tests passed:
  ✅ Squad generation (4 tests)
  ✅ Combat flow (5 tests)
  ✅ Stage 1-1 victory in 3 turns
  ✅ Boss lasts 5 turns (balanced)
  ✅ Null/invalid safety guards (2 tests)
```

## 4. Resumen de Cambios

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `engine.js` | +180 | Squad roster 5 variantes de Goblin + Orco 40k HP; `getSquadForStage()`; `executePartyTurn` 5v5; `verifyPartyVictory` array-based; `findFirstAliveIndex`; `procesarAtaque` labels; orc_warlord passive (block+regen+berserk); guard `localStorage` |
| `main.js` | +15 | `activeEnemy` → `activeSquad[]`; `getSquadForStage`; log de squad size |
| `ui.js` | +50 | `renderPvEArena` con 5 squad cards + boss card; `updatePvEArena` con loop squad; [Ally N] / [Enemy M] en logs |
| `style.css` | +50 | `.pve-squad-side`; `.squad-member-card` (rojo); `.squad-member-card.boss-card` (grande, glow); `.squad-hp-bar-container/fill/text/stats-row` |

## 5. Próximos Pasos (Fase 7)

- **Altar de Fusión y Evolución:** Combinar 2 cartas del mismo elemento para subir de rango. Límite de stats: 7400 → 8800 → 10000 según rarity. Nueva interfaz en `#section-forge` con slots de fusión y vista previa de stats resultantes.
- **Sistema de Runas Equipables:** Modificadores de stat % y pasivas adicionales que se asignan a ranuras de carta individuales. Persistencia en localStorage.
