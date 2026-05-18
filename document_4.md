# Fase 04 — Activación de la Arena: Coliseum

## 1. Arena de Combate Operativa

### Selección de Luchadores
- Al hacer clic en la pestaña **Coliseum**, `showSection('coliseo')` activa `#section-coliseo` y ejecuta `renderSelector()`.
- `renderSelector()` agrupa las cartas de `Engine.cards` por clase (Human, Dragon, Robot, etc.), genera `<optgroup>` para cada clase y puebla los `<select id="selectF1">` y `<select id="selectF2">`.
- Al cambiar un selector, el listener en `main.js` busca la carta por `card.id`, la clona (JSON.parse(JSON.stringify)) y la asigna a `gameState.fighter1` o `gameState.fighter2`.
- `updateFighterPreview(card, num)` muestra la imagen, la barra de HP y los spans de stats (`#statNameF{num}`, `#statHP-{num}`, `#statATQ-{num}`, `#statDEF-{num}`) con animación GSAP fade-in.

### Ciclo de Combate
1. **START FIGHT** → `gameState.round = 0`, oculta el botón START, muestra NEXT ROUND, logea `🔥 ¡QUE COMIENCE EL COMBATE!`
2. **NEXT ROUND** (click):
   - Incrementa `gameState.round`
   - Logea `⚔️ ROUND {n}` con etiqueta dorada `round-header`
   - Ejecuta `applyRoundStartPassives(f1, f2)` y `applyRoundStartPassives(f2, f1)` — activa Genesis, Nemesis, Progression, Double Strike, Life Leech, Shield Recharge, Berserker, Last Stand
   - Refresca stats vía `refreshFighterStats()`
   - Anima impacto con `animateCombatHit(true/false)` + GSAP timeline (desplazamiento + boxShadow rojo)
   - Procesa la ronda simultánea: `Engine.procesarRondaSimultanea(f1, f2)`
     - Calcula daño detallado (`calcularDetalleDaño`) con Anti-Armor, Armor Piercing, Dragon Slayer, Element Ward, Sacred Veil (block), Graceful Strike (revive)
     - Reparto equitativo DEF/HP (50/50)
     - Mínimo 10 HP de desgaste garantizado
     - Aplica daño simultáneamente
     - Procesa pasivas post-daño: Broken Mirror (reflect 100%), Thorn Armor (20%), Iron Skin (DEF convert), Leech (HP absorb)
   - Refresca stats post-choque
   - Verifica victoria: `Engine.verifyVictory()` → si algún luchador tiene HP ≤ 0, cambia botón a **FINALIZAR COMBATE** y logea el ganador
3. **FINALIZAR COMBATE** → `resetColiseum()` limpia el log, restaura los selectores, oculta NEXT ROUND, muestra START FIGHT

### Battle Log en Vivo
- `logConsole(msg, type, round)` inserta entradas en `#logContent` con clases CSS:
  - `.system` → gris (información general)
  - `.round-header` → dorado (encabezado de ronda)
  - `.attack` → rojo (anuncio de ataque)
  - `.damage` → rojo claro (daño numérico)
  - `.passive` → púrpura (activación de pasiva)
  - `.victory` → verde (resultado del combate)
- Cada entrada lleva borde izquierdo de 4px coloreado según tipo
- Scroll automático al final del log

## 2. Reporte de Ejecución de Pasivas

### Familia Genesis (1 vez, Ronda 1)
| Pasiva | Comportamiento | Verificado |
|--------|---------------|------------|
| `gen_block_heal` | Bloquea 1er golpe, convierte 50% ATQ en HP | `_blockUsed` flag |
| `gen_reflect_full` | Refleja 100% daño 1 vez | `_reflected` flag |
| `gen_steal_stats` | Roba 40% ATQ/DEF del rival | `_stolen` flag |

### Familia Nemesis (Condicional por matchup)
| Pasiva | Comportamiento | Verificado |
|--------|---------------|------------|
| `nem_xenophobia` | Duplica ATQ/DEF si rival NO es Human | Dentro de `applyRoundStartPassives` |
| `nem_dragon_slayer` | Ignora 50% DEF vs Dragon | Dentro de `calcularDetalleDaño` |
| `nem_element_ward` | Reduce 50% ATQ si rival es Rayo | Dentro de `calcularDetalleDaño` |

### Familia Progression (Escalado por ronda)
| Pasiva | Comportamiento | Verificado |
|--------|---------------|------------|
| `prog_scale_stats` | +10% ATK/DEF por ronda | Multiplica por 1.1 |
| `prog_venom` | Drena 5% maxHP del rival | `Math.floor(f.maxHp * 0.05)` |
| `prog_drain_def` | Corroe 15% DEF del rival por ronda | `Math.floor(r.def * 0.15)` |

### Pasivas Reactivas
| Pasiva | Comportamiento | Verificado |
|--------|---------------|------------|
| `double_strike` | Ataque extra rápido | `procesarAtaque(f, r)` |
| `life_leech` | Ataque + 50% daño como curación | `Math.floor(hpDamage * 0.5)` |
| `shield_recharge` | Regenera 10% maxHP como escudo | `Math.floor(f.maxHp * 0.1)` |

### Absorción y Reflejo (Post-daño)
| Pasiva | Comportamiento | Verificado |
|--------|---------------|------------|
| `abs_def_convert` | Convierte 50% daño en DEF | `Math.floor(totalDmg * 0.5)` |
| `abs_hp_convert` | Absorbe 30% daño como HP | `Math.floor(totalDmg * 0.3)` |
| `abs_reflect` | Refleja 20% daño recibido | `Math.floor(totalDmg * 0.2)` |

### Familia Phoenix (Umbrales de vida)
| Pasiva | Comportamiento | Verificado |
|--------|---------------|------------|
| `fen_revive` | Revive con 30% HP si el golpe es letal | `_revived` flag (1 vez) |
| `fen_berserker` | ATK x3 si HP < 30% | `Math.floor(f.maxHp * 0.3)` |
| `fen_last_stand` | DEF x4 si HP < 20% | `Math.floor(f.maxHp * 0.2)` |

### Cortafuegos Anti-Bucle Infinito
- Todas las pasivas one-time usan flags (`_blockUsed`, `_reflected`, `_revived`, `_stolen`)
- `procesarAtaque()` es una función plana que NO llama a `procesarRondaSimultanea` — no hay recursión
- `processPostDamagePassives()` solo reacciona a `dmg.hpDamage + dmg.defDamage > 0`, no se auto-dispara
- **Riesgo cero de bucle infinito**

## 3. Próximos Pasos (Fase 5)

- **Motor del Modo Aventura:** Mapa de nodos por etapas (renderMapNodes ya existe), consumo de energía del HUD, generación de enemigos procedurales con stats escalados, recompensas por etapa (oro, gemas, cartas).
- **Persistencia de Progreso:** Guardar el estado del mapa (etapas completadas) y los recursos del jugador en localStorage.
- **Sistema de Energía:** Limitar incursiones por recarga de energía, timer de regeneración o consumibles.
- **Raid Altar:** Jefe semanal con loot table, party de 3 luchadores, y reward track.
