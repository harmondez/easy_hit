# 💭 Ideas sobre Easy Hit — qué reutilizar, qué quitar, qué añadir

> Observaciones honestas tras auditar el código completo (no es un roadmap comprometido, son ideas para discutir).

---

## ✅ Qué reutilizaría (esto ya está bien hecho)

**El motor de combate puro (`engine.js`).** Está totalmente desacoplado del DOM, es testeable de verdad (78+142+tournament-sim tests corriendo sin navegador), y el pivote a combate simultáneo 1v1 lo simplificó bastante. Es la pieza más sólida de todo el proyecto — cualquier modo nuevo (PvP hotseat, un segundo tipo de torneo, lo que sea) puede apoyarse en `resolveSimultaneousRound`/`procesarAtaque` sin reinventar nada.

**El patrón de flags de una sola vez para pasivas** (`_blockUsed`, `_revived`, `_reflected`, `_stolen`...). Es simple, evita bucles infinitos, y escala bien — cada pasiva nueva solo necesita su propio flag. Buen patrón para seguir usando en pasivas futuras.

**Fervor + Ultimates.** Es la mecánica más distintiva del juego y funciona en los tres modos de combate ahora. Vale la pena protegerla en cualquier rediseño futuro — es lo que separa a Easy Hit de "dos números restándose".

**El roguelike de héroe único.** De todos los modos, es el que tiene más profundidad real: nodos, ítems equipables, mejoras, pasivas de run, pociones. Es el corazón de lo que el juego podría ser si se le sigue invirtiendo.

**La suite de tests en Node.** Motor puro + simulaciones + Puppeteer/Playwright, todo corriendo sin build step. Es raro encontrar esto en un proyecto vanilla JS de este tamaño, y es lo que hizo posible tocar el motor de combate hoy sin miedo a romper todo a ciegas. Seguir escribiendo tests así cada vez que se toque `engine.js`.

**`esc()` + `safeListener()` como hábito consistente.** Sanitización XSS y guards de DOM aplicados en casi todos los `innerHTML` dinámicos. Mantenerlo como estándar no negociable en código nuevo.

---

## 🗑️ Qué quitaría (y por qué)

**`ai_assistant.py` — o al menos separarlo claramente del "juego".** Es una herramienta de desarrollo (RAG con ChromaDB + OpenAI) con ~50% de precisión declarada en el propio README, que necesita una API key de pago. El proyecto se vende como "100% cliente, sin backend" pero incluye un componente Python que depende de una API externa — eso confunde la identidad del proyecto de cara a quien lo lea por primera vez. No hace falta borrarlo (puede seguir siendo útil para brainstorming), pero merece vivir claramente fuera del "stack de producción" en la documentación, no mezclado con el resto del stack técnico.

**Duplicación entre Coliseo y Torneo en `main.js`.** `processColiseumTurn` y `_processTournamentTurn` ahora son casi idénticas — ambas llaman `Engine.resolveSimultaneousRound` y hacen básicamente el mismo trabajo de animación/UI con IDs de DOM distintos. Se podría unificar en una función `_processSimultaneousMatch(f1, f2, domIds)` y ahorrar ~50-60 líneas duplicadas, reduciendo el riesgo de que un bugfix se aplique en un lado y se olvide en el otro (ya pasó una vez con el botón de cerrar del picker de Torneo).

**El "Códice de Dropeo" (`renderCodex`, sección Aventura).** Tiene 6 entradas hardcodeadas (Forest Wisp, Stone Golem, Shadow Stalker, Fire Drake, Abyssal Mage, Colossal Warden) que no corresponden a ningún enemigo real del roguelike — `RUN_ENEMIES_1V1` solo tiene goblins. Es un remanente visual de un diseño más viejo, sigue renderizándose pero está totalmente desconectado de los datos reales del juego. O se conecta a los enemigos reales, o se retira.

**Estilos inline masivos en `ui.js`.** Buena parte del HTML generado desde JS trae `style="..."` completo en vez de clases CSS (se ve claro en `renderCardDetail`, `updatePreview`, los overlays de Aventura). Funciona, pero hace que cualquier retoque visual futuro tenga que tocar JavaScript en vez de CSS. No es urgente, pero es la deuda técnica más visible del proyecto si algún día se quiere iterar rápido en diseño.

**Placeholders "Unlock in Phase X" sueltos por el HTML.** Ya retiré el de Raid Altar en Aventura esta sesión — vale la pena una pasada completa buscando otros similares (Shop bloqueado es intencional y está bien documentado, pero conviene confirmar que no queden más "cascarones" a medio construir en otras secciones).

---

## 💡 Qué añadiría (y por qué)

**Progresión persistente entre runs del roguelike.** Hoy, morir o completar un run no deja nada permanente más allá del oro/XP acumulados — el héroe, equipo y pasivas de run se resetean. Es la razón #1 por la que roguelikes como Hades o Slay the Spire enganchan: cada muerte deja algo. Sin esto, "Adventure" es solo un combate difícil, no un loop de progresión.

**Más de un run.** `RUN_TEMPLATES` solo tiene `run-1` ("The Awakening"). El esquema de datos ya soporta añadir más (nodos + enemigos), así que es una mejora de alto impacto y bajo esfuerzo técnico — principalmente trabajo de diseño/contenido, no de ingeniería.

**Sonido sintetizado (Web Audio API, sin assets).** El plan lo tenía anotado desde hace tiempo (Fase 09) y nunca se implementó. Un juego de combate sin ningún feedback sonoro — ni un "hit", ni un "ultimate" — pierde mucho game feel. Es barato de hacer (osciladores + gain nodes, cero KB de assets) y el impacto perceptivo es alto.

**Recompensas de Torneo.** Ganar el Torneo hoy no otorga oro ni XP, a diferencia de Aventura. Es una inconsistencia fácil de resolver y le da sentido a jugar el modo más allá de la corona cosmética.

**Un mínimo de onboarding.** El juego tiene mecánicas no triviales (Fervor, Ultimates, 27 pasivas) sin ninguna explicación visible para quien entra por primera vez — aterriza directo en el Creator. Ni falta un tutorial elaborado, pero un tooltip o panel de "cómo funciona el combate" ayudaría mucho a que la profundidad del sistema no se pierda.

**Revisar el balance de `fen_berserker`/`fen_last_stand` bajo el nuevo modelo simultáneo.** Estas pasivas se activan cuando el HP del portador cae por debajo de un umbral, evaluado dentro de `procesarAtaque` en el momento en que a ese fighter le toca "golpear" dentro de la ronda. Como en `resolveSimultaneousRound` se resuelve primero el golpe de F1→F2 y después F2→F1, quien golpea segundo evalúa sus propios umbrales ya con el daño del primer golpe aplicado — una asimetría sutil que no existía en el modelo por turnos. Vale la pena una pasada de balance específica ahora que cambió el motor de resolución.

**Conectar `Engine.getRunNode`/`getRunProgress` a la UI.** Ya están escritos y testeados (`tests/run-sim.mjs`) pero nadie los llama — encajarían naturalmente como un indicador "Nodo X de Y" en `renderOrganigrama`. Bajo esfuerzo, ya identificado, solo falta hacerlo.
