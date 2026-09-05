# 💡 Ideas de posibles compañeros (agentes especializados)

> Esto no es un pipeline obligatorio ni una directiva de proceso — son solo ideas de roles que podrían ser útiles como subagentes especializados más adelante, si el proyecto crece lo suficiente como para justificarlo. Nacieron de una configuración anterior pensada para otra herramienta (OpenCode), pero los conceptos de fondo (qué haría cada uno, qué se le pediría) siguen siendo relevantes como referencia de "quién podría ayudar con qué".

Ninguno de estos roles es vinculante. Si en el futuro se usa alguno como subagente real, se define su alcance en ese momento — esto es solo el banco de ideas.

---

## Arquitecto / Orquestador
**Qué haría:** Diseño de la arquitectura modular global (`main.js`/`engine.js`/`ui.js`), la máquina de estados del juego, transiciones entre secciones, y la integración final de cambios grandes que tocan varios módulos a la vez.
**Cuándo tendría sentido invocarlo:** Al añadir una sección/pestaña nueva completa, al expandir la máquina de estados, o al resolver conflictos de integración entre lógica de combate y renderizado.

## Ingeniero de Mecánicas
**Qué haría:** Matemáticas puras de combate en `engine.js` — daño, mitigación, pasivas, efectos de estado (veneno, aturdimiento), condiciones de victoria. Sin tocar el DOM nunca.
**Cuándo tendría sentido invocarlo:** Nueva pasiva o ultimate, bug matemático, bucle infinito en el flujo de turnos, ajuste de fórmulas de daño.

## Ingeniero de UI / Game Feel
**Qué haría:** Renderizado DOM (`ui.js`), maquetación CSS, animaciones, HUD, grids de inventario, pulido visual. Solo "pinta" resultados que ya calculó el motor, nunca calcula daño ni decide victoria/derrota.
**Cuándo tendría sentido invocarlo:** Nueva pantalla o modal, animación de impacto/loot, reestructurar cómo se ve algo, arreglar desalineaciones CSS.

## Auditor de QA / Balance
**Qué haría:** Cazar bucles infinitos (sobre todo en resurrecciones tipo Fénix), validar que ninguna carta rompa el límite de stats, revisar limpieza de listeners y accesos DOM/localStorage inseguros.
**Cuándo tendría sentido invocarlo:** Antes de fusionar una mecánica compleja, al investigar un bug reportado, al auditar una base de datos de cartas nueva.

## Generador de Contenido / Datos de Juego
**Qué haría:** Bases de datos de cartas/enemigos/jefes, tablas de loot, tasas de rareza, descripciones de pasivas, lore y narrativa de Adventure Log.
**Cuándo tendría sentido invocarlo:** Añadir héroes/monstruos/jefes nuevos, balancear estadísticas base de un elemento, redactar texto de pasivas o eventos narrativos.

---

## Nota sobre el límite de 7400 puntos y demás reglas duras
Estas ideas de agentes traían implícitas reglas de proceso bastante rígidas (ritmo de commits, prohibición de ciertos formatos de audio/imagen, límites de caracteres en claves de localStorage, etc.). Esas reglas de producto siguen vivas donde tengan sentido real (ver `CLAUDE.md`), pero no vienen empaquetadas con estos roles — son decisiones del proyecto, no del agente.
