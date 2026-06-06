# ⚔️ CARD FORGE FACTORY - Workflow de Agentes Web

## 👥 Agentes Especializados (Módulos TCG)

| Agente | Rol RPG / Técnico | Invocación |
|--------|-------------------|------------|
| `@lead-architect` | **Arquitecto Principal:** Diseña la máquina de estados global (`main.js`), orquesta el flujo entre pestañas y valida la integridad estructural. | `@lead-architect` o Tab |
| `@mechanics-engineer` | **Ingeniero de Motor:** Lógica pura y matemáticas de combate (`engine.js`). Procesa daño, aplica bufos/debufs, pasivas por turnos y condiciones de victoria. **Prohibido tocar el DOM.** | `@mechanics-engineer` o Tab |
| `@ui-gamefeel-engineer`| **Diseñador de Interfaz:** Renderizado del DOM (`ui.js`), maquetación CSS de las cartas, logs dinámicos de consola y efectos visuales de impacto (*Game Feel*). | `@ui-gamefeel-engineer` o Tab |
| `@qa-balance-auditor` | **Auditor de Balance:** Detecta bucles infinitos (ej. resurrecciones continuas), valida la regla de oro de distribución de stats y asegura programación defensiva. | `@qa-balance-auditor` o Tab |
| `@gamedata-generator` | **Creador de Contenido (IA):** Orquesta LLMs locales para generar archivos JSON con bases de datos de cartas balanceadas, descripciones de lore y tablas de botín (*Loot Tables*). | `@gamedata-generator` o Tab |

## 🔄 Flujo de Trabajo Táctico (Pipeline)

@lead-architect define la estructura del módulo, IDs necesarios del HTML y transiciones de estado.

@mechanics-engineer desarrolla las matemáticas lógicas mientras @ui-gamefeel-engineer levanta la vista del DOM.

@gamedata-generator inyecta las bases de datos de cartas, pasivas o items en formato estructurado (JSON).

@qa-balance-auditor ejecuta simulaciones lógicas, audita límites numéricos y caza referencias nulas.

@lead-architect libera y refactoriza el código definitivo listo para Git / GitHub Pages.



## 📜 Reglas de Oro de la Fábrica (Strict Laws)

- **Separación Absoluta de Capas:** La lógica matemática (`engine.js`) jamás debe saber qué es un `document.getElementById`. La presentación (`ui.js`) jamás altera variables de estado del juego sin pasar por el motor.
- **Programación Antibalas (Defensive Coding):** Todo acceso a nodos del HTML debe estar precedido por validaciones de existencia (`if (elemento)`). Los eventos del sistema deben enlazarse mediante encapsuladores seguros (`safeListener`).
- **Persistencia Acorazada:** Cualquier guardado o lectura de datos locales (`localStorage`) debe estar protegido obligatoriamente por bloques `try/catch` para evitar bloqueos por corrupción de memoria.
- **El Manual Manda (RAG Anchor):** Toda nueva mecánica, carta o pasiva debe ser analizada rigurosamente frente al manual de diseño adjunto antes de escribir una sola línea de código.
- **Protocolo de Snippets:** Al refactorizar, los agentes deben entregar únicamente las funciones modificadas completas, indicando explícitamente su punto de inserción para optimizar el contexto.
- **Optimización de Assets:** El código visual debe priorizar formatos de imagen performantes (`WebP`), dimensiones estandarizadas y ratios estricto para asegurar tiempos de carga ínfimos.
- **Tasa de Deploys Controlada:** No más de **8 pushes por hora** de trabajo agente. Los cambios deben acumularse en lotes antes de commitear. Un agente nunca hará más de 1 push cada 7.5 minutos.
- **Presupuesto de Almacenamiento:** Toda persistencia en localStorage debe usar claves cortas (≤ 4 chars, ej. `hp`/`atq`/`def`/`vel`/`el`/`cls`/`pid`) y verificar cuota restante antes de escribir (`navigator.storage.estimate()`). Si cuota ≥ 80%, emitir advertencia visual.
- **Silencio de Consola:** Cero errores/warnings en producción. `console.log` de debug se elimina en el despliegue (minificación tree-shake).
- **Audio Sintetizado:** Prohibido usar archivos MP3/WAV. Todo sonido se genera con Web Audio API (`AudioContext.createOscillator` + `GainNode`). Peso total del módulo `sfx.js` < 2 KB.

## 🛠️ Stack Tecnológico de Producción

- **Core Core Web:** Vanilla JavaScript Puro (ES6 Modules) sin frameworks pesados, garantizando latencia cero.
- **Capa Visual & Layout:** HTML5 Semántico + CSS3 Moderno (Custom Variables, CSS Grid para Inventarios, Flexbox para HUDs y animaciones de keyframes).
- **Procesamiento de Imagen:** Librerías ligeras en cliente (ej. Cropper.js) configuradas con ratios fijos para forjar arte de cartas homogéneo.
- **Cerebro e Inferencia Local:** Ollama / LM Studio sirviendo modelos optimizados para código (ej. DeepSeek-Coder, Llama 3) encargados del balanceo automatizado y QA en local.
- **Almacenamiento:** Estado del cliente serializado en JSON dentro del almacenamiento local del navegador, preparado para futuras integraciones Cloud (Firebase/Supabase).