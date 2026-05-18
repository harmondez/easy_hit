Actuad como el Comité de Arquitectura de la Card Forge Factory. Vamos a indexar de forma permanente una nueva Ley de Oro en nuestro Markdown de contexto principal para que todos los agentes tengáis esta directriz grabada en vuestro sistema.

Por favor, editad el archivo de contexto central (CLAUDE.md / Manual de Contexto) e introducid la siguiente regla estricta:

---

### 🌐 REGLA DE ORO DE ENTORNO LOCAL: PROTOCOLO DE TESTEO CON PYTHON Y NODE.JS

Debido al uso de Vanilla JS con Módulos ES6 (import/export), queda estrictamente prohibido validar código visual de forma estática abriendo los archivos mediante el protocolo `file://`. Todos los agentes disponéis de **total acceso y autorización** para ejecutar herramientas de entorno local bajo las siguientes directrices:

1. **Autosuficiencia en Staging (Python HTTP Server):**
   - Es obligatorio levantar un servidor HTTP local en segundo plano antes de dar cualquier tarea de interfaz por finalizada (ej. `python -m http.server 8080`).
   - El código visual debe ser testeado bajo entornos `http://localhost` para replicar con un 100% de fidelidad el comportamiento asíncrono, las peticiones CORS y la persistencia en `localStorage` de GitHub Pages.

2. **Análisis Estático y Sintaxis (Node.js Engine):**
   - Tenéis acceso absoluto a Node.js para realizar comprobaciones de sintaxis previas al guardado de archivos mediante comandos como `node --check ui.js` o `node --check engine.js`. No se admitirá código con llaves rotas o errores de importación.
   - El agente `@mechanics-engineer` puede y debe utilizar Node.js (configurando `"type": "module"`) como un banco de pruebas *headless* (sin interfaz) para ejecutar y estresar las matemáticas puras de `engine.js` inyectando datos mock directos en la terminal.

3. **Verificación Defensiva del Entorno:**
   - Antes de dar por completada una fase, el `@lead-architect` debe comprobar la salud y persistencia de los procesos del servidor local ejecutando comandos de verificación en la terminal:

```powershell
# Verificar si el servidor sigue activo en el sistema
Get-Process -Name "python" -ErrorAction SilentlyContinue
# Validar la respuesta HTTP del entorno local
Invoke-WebRequest -Uri "http://localhost:8080" -Method Head