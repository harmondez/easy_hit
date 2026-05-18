# ⚔️ Plan de Implementación — Easy Hit: Architect Harmondez Edition (12 Fases)

> **Visión**: Juego de cartas táctico y RPG web Vanilla de alta densidad, enfocado en latencia cero, arquitectura modular desacoplada y un equilibrio matemático estricto basado en el manual de diseño.
> **Público**: Jugadores de TCG estratégicos y RPG de progresión clásica (*Heroes of Camelot* style).
> **Stack**: Vanilla JavaScript (ES6 Modules) · HTML5 Semántico · CSS3 (Custom Properties + Grid) · Inferencia Local (Ollama / OpenCode) · Despliegue en GitHub Pages.

---

## Resumen de Fases

| # | Fase | Área | Horas est. | Dependencias |
|---|------|------|-----------|-------------|
| 01 | Core Engine & 1v1 Arena | Lógica/UI | 35h ✅ | — |
| 02 | Infraestructura HTML Masiva & HUD | Estructura | 20h ← | Fase 01 |
| 03 | Motor del Modo Aventura | Lógica | 24h | Fase 02 |
| 04 | Sistema de Loot & Tablas de Botín | Gamedata | 18h | Fase 03 |
| 05 | Altar de Jefes (Boss Altar) | Lógica/Content| 22h | Fase 03, 04 |
| 06 | Inventario Táctico & Mochila | UI/Grid | 20h | Fase 02 |
| 07 | Card Forge System (Fusión) | Lógica/UI | 25h | Fase 06 |
| 08 | Tienda del Mercader & Economía | Full Stack | 16h | Fase 02, 07 |
| 09 | Pulido de UX & Game Feel Avanzado | UI/CSS | 18h | Fase 05, 06 |
| 10 | IA de Balanceo de Datos Automático | IA/QA | 30h | Fase 04, 05 |
| 11 | QA Defensivo & Hardening del DOM | QA/Seguridad | 20h | Todas |
| 12 | Optimización de Assets & Despliegue| DevOps | 12h | Fase 09, 11 |
| | **Total** | | **~260h** | |

---

## Fase 01: Core Engine & 1v1 Arena ✅ (Completada)

**Objetivo**: Establecer las bases matemáticas del combate, desacoplamiento estricto de archivos y el bucle principal de duelos 1v1.

### Tareas realizadas
- Arquitectura modular pura establecida: `engine.js` (cálculos), `ui.js` (renderizado) y `main.js` (máquina de estados).
- Implementación de la **Regla de Oro de Balanceo**: Límite estricto de **7400 puntos** (HP + DEF + ATK) por carta estándar.
- Motor de daño real programado: Mitigación de defensa nativa (`DEF > HP`) y lógica de desgaste.
- Sistema de estados alterados dinámicos (`Poison` con daño por turno, `Stun` con pérdida de acción).
- Persistencia base estructurada en `localStorage` con codificación JSON.
- Pulido de marca final aplicado en la interfaz (`<p class="header-tagline">Architect Harmondez Edition</p>`).

### Entregable
Simulador 1v1 completamente jugable, libre de dependencias externas, con logs funcionales y persistencia estable.

---

## Fase 02: Infraestructura HTML Masiva & HUD ← (Actual)

**Objetivo**: Reconstruir estructuralmente el archivo `index.html` y las variables globales de `style.css` para soportar la expansión RPG sin romper los módulos existentes.

### Tareas
| # | Tarea | Horas | Agente Responsable |
|---|-------|-------|--------------------|
| 2.1 | Inyección del HUD Global Superior persistente (Oro, Gemas, Energía, Cuenta) | 3h | `@ui-gamefeel-engineer` |
| 2.2 | Creación del sistema de pestañas de navegación (`tab-adventure`, `tab-inventory`, `tab-shop`) | 3h | `@lead-architect` |
| 2.3 | Maquetación de la sección contenedora oculta `#adventure` (World Map Canvas) | 4h | `@ui-gamefeel-engineer` |
| 2.4 | Definición estructural de los modales de recompensa para aperturas de cofres | 3h | `@gamedata-generator` |
| 2.5 | Preparación de variables de entorno CSS `:root` para consistencia del Dark Mode RPG | 2h | `@ui-gamefeel-engineer` |
| 2.6 | Auditoría de colisiones de IDs y preparación de anclajes seguros (`safeListener`) | 5h | `@qa-balance-auditor` |

### Entregable
Estructura HTML masiva completa con barra de navegación operativa que alterna pantallas sin errores de consola. Además aquí ha de haber una fuerte influencia de creación, dando poder de decisión al agente @gamedata-generator cuya misión ha de ser crear un juego de cartas adictivo, similar a  un Apartado Visual y UX "Heroes of Camelot Style"
Efectos de Rareza: Animaciones CSS (brillos, partículas) para cartas de alto nivel.

Interfaz de Evolución: Una pantalla dedicada a la "Fusión" donde se vea el crecimiento de los stats visualmente.

Ejemplo de lo que se podría añadir al Manual (Sección Futuro):
Hoja de Ruta: El Camino del Héroe

Reforja de Cartas: Las cartas podrán ser mejoradas sacrificando cartas menores. Cada nivel otorga +50 puntos de atributo adicionales para repartir, permitiendo que una carta "Common" bien entrenada pueda competir con una "Rare".

Incursiones de Boss: Eventos temporales donde los jugadores enfrentan a entidades con habilidades pasivas duales. Derrotarlos garantiza materiales de "Ascensión Estelar".

El Códice de Dropeo: Cada enemigo derrotado en el modo campaña tiene un % de probabilidad de unirse a tu mazo, fomentando el "Grind" estratégico.
---

## Fase 03: Motor del Modo Aventura

**Objetivo**: Desarrollar el orquestador de mapas, gestión de energía por nodo de combate y control de la progresión de niveles en `main.js`.

### Tareas clave
- Programación de la función de transición de niveles de mapa en `main.js`.
- Sistema de consumo de Energía por intento de nodo (Bloqueo de entrada si Energía < Requisito).
- Mapeo lógico de "Nodos de Combate" secuenciales (Niveles 1-10) en un objeto de estado global.
- Conexión de variables de estado entre el mapa de aventura y la inicialización de la arena de batalla.

### Dependencias: Fase 02 | Estimación: 24h

---

## Fase 04: Sistema de Loot & Tablas de Botín

**Objetivo**: Diseñar las bases de datos de recompensas y la lógica de asignación aleatoria basada en pesos porcentuales.

### Tareas clave
- Generación del archivo estructurado JSON con tablas de drops por rareza (Común, Raro, Épico, Jefe).
- Implementación matemática en `engine.js` del selector aleatorio por peso (*Weighted Random Selector*).
- Integración en `ui.js` del renderizador dinámico de recompensas post-combate (Animación de cartas obtenidas y materiales).
- Rutina de guardado automático en `localStorage` de los nuevos ítems recolectados mediante bloques `try/catch`.

### Dependencias: Fase 03 | Estimación: 18h

---

## Fase 05: Altar de Jefes (Boss Altar)

**Objetivo**: Implementar combates contra jefes con IA de comportamiento avanzado y solucionar los puntos ciegos de pasivas complejas.

### Tareas clave
- Inyección de la base de datos de Jefes en formato JSON (Ej. *Malphas, El Señor de las Sombras*).
- Desarrollo defensivo en `engine.js` de la función `checkDeathPrevention` para controlar flags de uso único por combate (Evitar bucles infinitos de la pasiva Fénix).
- Programación de la función global `resetCombatFlags` en `main.js` para limpiar el estado de resurrección entre rondas.
- Creación de logs personalizados en la interfaz para eventos críticos de Bosses (`ui.logCombatEvent('REFLECTION', ...)`).

### Dependencias: Fase 03, 04 | Estimación: 22h

---

## Fase 06: Inventario Táctico & Mochila

**Objetivo**: Maquetar y conectar visualmente la colección de cartas del jugador y los materiales acumulados en una cuadrícula responsive.

### Tareas clave
- Diseño en `style.css` de un grid modular estricto de slots (`display: grid`) con efectos de *hover* estilizados.
- Función de renderizado masivo de la mochila del jugador en `ui.js` mapeando los datos de la persistencia.
- Implementación de filtros rápidos de cartas en el cliente (Filtro por Elemento, Rareza o Clase).
- Cláusulas de guarda en la UI para evitar renderizar slots vacíos con errores visuales.

### Dependencias: Fase 02 | Estimación: 20h

---

## Fase 07: Card Forge System (La Forja)

**Objetivo**: Desarrollar la lógica de progresión horizontal del juego permitiendo fusionar cartas repetidas para escalar estadísticas.

### Tareas clave
- Interfaz visual de la ranura de forja (Carta Base + Copias Sacrificadas + Coste de Oro).
- Lógica en `engine.js` para calcular el incremento de estadísticas sin romper los límites matemáticos permitidos por nivel.
- Actualización en tiempo real del objeto JSON del jugador y re-renderizado instantáneo de la mochila tras la fusión.
- Validación de seguridad: Bloquear fusiones si el jugador no cuenta con el Oro o las copias requeridas.

### Dependencias: Fase 06 | Estimación: 25h

---

## Fase 08: Tienda del Mercader & Economía

**Objetivo**: Cerrar el ciclo económico del juego permitiendo la compra de sobres de cartas y consumibles de energía.

### Tareas clave
- Objeto de datos con las ofertas rotativas del mercader y precios en Oro/Gemas.
- Algoritmo de apertura de sobres en el motor (Simulación de "Gacha" equilibrado).
- Sistema de regeneración pasiva de Energía en el cliente basado en marcas de tiempo (`Date.now()`).
- Blindaje contra exploits: Toda transacción económica debe restar y sumar valores de forma atómica.

### Dependencias: Fase 02, 07 | Estimación: 16h

---

## Fase 09: Pulido de UX & Game Feel Avanzado

**Objetivo**: Elevar la calidad visual del juego mediante micro-interacciones CSS y feedback de combate inmersivo.

### Tareas clave
- Creación de animaciones de impacto mediante Keyframes CSS (Sacudida de pantalla, destello rojo de daño crítico).
- Codificación de colores dinámicos en el *Adventure Log* según el tipo de acción resuelta (Verde = Curación/Bufo, Amarillo = Mitigación, Morado = Veneno).
- Optimización de las transiciones de estados mediante retrasos asíncronos (`setTimeout` controlados) para dar tiempo al jugador de leer los eventos en pantalla.

### Dependencias: Fase 05, 06 | Estimación: 18h

---

## Fase 10: IA de Balanceo de Datos Automático

**Objetivo**: Utilizar tus LLMs locales para simular miles de combates automáticos en el entorno de OpenCode y pulir las estadísticas numéricas.

### Tareas clave
- Desarrollo de un script de simulación sin renderizado de DOM para enfrentar combinaciones de cartas a máxima velocidad en local.
- Análisis de tasas de victoria de las cartas y detección de combinaciones rotas (*overpowered*).
- Ajuste fino asistido por IA de los coeficientes de daño por desgaste y escalados de veneno.
- Generación automatizada de reportes de balance en formato Markdown para actualización del manual core.

### Dependencias: Fase 04, 05 | Estimación: 30h

---

## Fase 11: QA Defensivo & Hardening del DOM

**Objetivo**: Blindar la aplicación web contra excepciones no controladas mediante auditoría estricta de código.

### Tareas clave
- Refactorización de todos los selectores del DOM añadiendo la validación de seguridad de Vanguard (`if (!elemento) return;`).
- Encapsulación de todos los eventos del ciclo de vida del juego mediante la función protectora `safeListener`.
- Pruebas de destrucción de memoria local: Comprobar la resiliencia del motor si el archivo JSON en `localStorage` se encuentra corrupto o modificado maliciosamente.

### Dependencias: Todas las fases lógicas | Estimación: 20h

---

## Fase 12: Optimización de Assets & Despliegue

**Objetivo**: Preparar el proyecto para su publicación definitiva en la nube con un rendimiento y velocidad de carga instantáneos.

### Tareas clave
- Compresión de todo el arte y placeholders de cartas al formato de alto rendimiento `WebP` con dimensiones homogéneas fijas.
- Minificación limpia de las variables CSS y ordenamiento de importaciones modulares de JS.
- Auditoría final en la consola de desarrollo del navegador para asegurar un log limpio y latencia cero.
- Despliegue final automatizado en la rama de producción para su visualización en GitHub Pages.

### Dependencias: Fase 09, 11 | Estimación: 12h

---

## Mapa de Modos de Juego vs Fases de Desarrollo

| Fase | Modo Coliseo (1v1) | Modo Aventura | Sistema de Forja | Economía y Tienda |
|------|:------------------:|:-------------:|:----------------:|:-----------------:|
| 01 Engine Core | ✅ | ❌ | ❌ | ❌ |
| 02 HTML & HUD Expansion | ✅ | ✅ | ✅ | ✅ |
| 03-05 Adventure & Bosses | ❌ | ✅ | ❌ | ❌ |
| 06-07 Grids & Upgrades | ❌ | ❌ | ✅ | ❌ |
| 08 Mercader Framework | ❌ | ❌ | ❌ | ✅ |
| 09 UX Pulido Visual | ✅ | ✅ | ✅ | ✅ |
| 10-12 Balance & Deploy | ✅ | ✅ | ✅ | ✅ |

---

## Dependencias entre Fases de Construcción
01 [Core Engine] ──→ 02 [HTML Masivo] ──→ 03 [Adventure Motor] ──→ 04 [Loot Tables]
│                                              │
├──→ 06 [Mochila Grid] ──→ 07 [Forge System]   │
│                                   │          │
└──→ 08 [Mercader Shop]             ▼          ▼
05 [Altar de Jefes]
│
11 [QA Hardening] ──→ 09 [Game Feel UX] ──→ 10 [IA Balance] ──→ 12 [GitHub Pages]

---

## Estimación de Recursos en la Factoría Card Forge

| Rol del Agente | Fases de Asignación Principal | Enfoque de Entrega |
|----------------|------------------------------|--------------------|
| `@lead-architect` | 02, 03, 11, 12 | Orquestación de archivos y máquina de estados |
| `@mechanics-engineer` | 01, 03, 05, 07, 10 | Matemáticas puras de combate en `engine.js` |
| `@ui-gamefeel-engineer` | 02, 06, 08, 09 | Interfaz HTML, grids CSS y logs dinámicos |
| `@gamedata-generator` | 04, 05, 08 | Forja de archivos JSON y balance base de datos |
| `@qa-balance-auditor` | 02, 10, 11 | Caza de bucles infinitos y validación de 7400 pts |

**Tiempo estimado total de desarrollo asistido:** ~260 horas de ejecución en factoría local.


