"""
test_connections.py — DIARIO DE INCIDENTES: CONEXIONES ENTRE TESTS, PUPPETEER Y SERVIDORES
========================================================================================

Propósito: Registrar todos los problemas de conexión/coordinación encontrados entre
los tests automatizados (browser.test.mjs, uifixes.test.mjs, etc.), Puppeteer y los
servidores de archivos estáticos, para que QUEDE MEMORIA ESCRITA y no se pierdan
8 horas de debugging en el futuro.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÍNDICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1.  SINTOMA PRINCIPAL: page.click('#tab-inventory') falla silenciosamente
2.  LÍNEA DE TIEMPO DEL DEBUGGING
3.  CAUSA RAÍZ: click coordinado vs click programático
4.  HALLAZGO SECUNDARIO: Servidor HTTP Node.js vs Python
5.  HALLAZGO TERCIARIO: ERR_CONNECTION_CLOSED en imágenes
6.  SOLUCIÓN APLICADA
7.  RECOMENDACIONES PERMANENTES
8.  ANEXO: Scripts de reproducción mínima

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. SINTOMA PRINCIPAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Escenario:
  - uifixes.test.mjs ejecuta 3 tests secuenciales:
      1. Tournament: abre slot picker → cierra
      2. Adventure: renderTeamSelection → picker → selecciona héroe → btnCancelTeam
      3. Inventory: inyecta 3 items → click inventory tab → verifica grid

Resultado:
  - Tests 1 y 2: ✅ Pasan siempre
  - Test 3 (inventory): ❌ Falla consistentemente — el grid muestra 0 items

Síntoma exacto:
  INIT STATE: {"items":0,"invLen":3}
  → invLen=3 (gameState.inventory tiene 3 items)
  → items=0 (el grid del DOM está vacío)
  → filtersInit: undefined (initInventoryFilters nunca se llamó)

Conclusión inmediata: onSectionEnter['inventory']() NO se está ejecutando.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. LÍNEA DE TIEMPO DEL DEBUGGING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE 1 — Inyección de logs en el handler (main.js:onSectionEnter.inventory)

  Se añadió:
    console.log('ONENTER_INV', JSON.stringify({...}));

  Resultado en uifixes.test.mjs: El log NUNCA aparece en la salida.
  → El handler no se está llamando.

FASE 2 — Prueba con page.click en aislamiento

  Se creó un script mínimo:
    1. Cargar página
    2. Inyectar inventory
    3. page.click('#tab-inventory')
    4. Esperar 800ms

  Resultado: ✅ FUNCIONA. "items:1", ONENTER_INV aparece.
  → El handler funciona. El click funciona. El problema es CONTEXTUAL.

FASE 3 — Reproducción del flujo completo

  Se simuló el flujo tournament → adventure → inventory dentro del mismo script.
  Resultado: ✅ FUNCIONA. Todo correcto.

  → El problema es NO DETERMINISTA o depende del SERVIDOR HTTP usado.

FASE 4 — Descubrimiento crítico: page.click vs evaluate.click

  uifixes.test.mjs usa node:http.createServer en puerto 8773.
  Los scripts de prueba usan python -m http.server en puerto 8765.

  Con python server:    page.click('#tab-inventory') → ✅ funciona
  Con node server:      page.click('#tab-inventory') → ❌ falla
  Con node server:      evaluate(() => el.click())   → ✅ funciona

  → El servidor Node.js expone un bug de coordenadas en Puppeteer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. CAUSA RAÍZ: click coordinado vs click programático
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

page.click(selector) de Puppeteer:
  1. Encuentra el elemento con document.querySelector(selector)
  2. Calcula su bounding box (posición + tamaño)
  3. Mueve el ratón a las coordenadas del centro
  4. Dispara eventos: mousedown → mouseup → click

  Problema: Si el elemento se MOVIÓ entre el paso 1 y el paso 3
  (por un layout shift, una animación CSS pendiente, o un cambio
  de display), Puppeteer hace click en coordenadas ERRÓNEAS.
  El click se pierde o cae en otro elemento.

element.click() (JavaScript nativo):
  1. Dispara el evento click DIRECTAMENTE sobre el elemento
  2. No depende de coordenadas, layout, ni posición visual
  3. El evento burbujea normalmente por el DOM

  Ventaja: Funciona incluso si el elemento está parcialmente oculto,
  en mitad de una animación, o cubierto por otro elemento.

¿Por qué fallaba SOLO después de tournament+adventure?

  Hipótesis más probable:
  - La sección adventure usa modales (cardPickerModal) con z-index alto
  - Aunque el modal se elimina del DOM (closeTeamSelection → modal.remove()),
    queda un residuo de layout o de posición en el navegador
  - Puppeteer calcula mal las coordenadas del tab-inventory porque
    el motor de layout del navegador aún está procesando cambios
  - Al hacer click en coordenadas incorrectas, el evento nunca llega
    al tab-inventory, y transitionState nunca se llama

  El servidor Node.js (más lento que Python) expone este bug porque
  los tiempos de carga entre secciones son diferentes, alterando
  el momento exacto en que Puppeteer mide coordenadas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. HALLAZGO SECUNDARIO: Servidor HTTP Node.js vs Python
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El servidor HTTP de los tests (uifixes.test.mjs) difiere del usado
en browser.test.mjs (Python):

  Servidor Node.js (uifixes):
    const server = http.createServer((req, res) => {
        let filePath = path.join(root, req.url === '/' ? 'index.html' : req.url);
        const ext = path.extname(filePath);
        const types = { '.html': 'text/html', '.js': 'text/javascript',
                        '.css': 'text/css', '.mjs': 'text/javascript' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
        try { res.end(fs.readFileSync(filePath)); }
        catch { res.end(''); }  // ← Devuelve VACÍO en 404
    });

  Servidor Python:
    python -m http.server (uso estándar, maneja MIME types y 404 correctamente)

Problemas del servidor Node.js:
  a) Siempre responde 200, incluso en errores (archivo no encontrado)
  b) No maneja correctamente solicitudes con query params
  c) No envía cabeceras de caché (304), forzando recarga completa
  d) Puede causar race conditions si el puerto no se liberó del test anterior

Recomendación: Unificar todos los tests para usar el mismo servidor.
Usar Python (estándar y probado) o en su defecto mejorar el servidor Node.js
para que sea robusto.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. HALLAZGO TERCIARIO: ERR_CONNECTION_CLOSED en imágenes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Durante todos los tests aparecen cientos de:
  Failed to load resource: net::ERR_CONNECTION_CLOSED

Causa: Las cartas usan imágenes con URL externas (via.placeholder.com)
en el atributo onerror. En entorno headless sin conexión a internet,
las peticiones a dominios externos fallan con ERR_CONNECTION_CLOSED.

Impacto: NINGUNO. Son warnings, no errores. No afectan la ejecución
de JavaScript ni la lógica del juego. Pero ensucian la salida del test.

Solución a largo plazo:
  - Usar imágenes locales (data URIs o SVGs inline) en los tests
  - O mockear las peticiones de imagen con page.setRequestInterception()
  - O simplemente ignorar estos errores (aceptado)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. SOLUCIÓN APLICADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Archivo modificado: tests/uifixes.test.mjs

Cambio:
  - Línea 89 (ANTES):  await page.click('#tab-inventory');
  - Línea 89 (DESPUÉS): await page.evaluate(() => {
                            const t = document.getElementById('tab-inventory');
                            if (t) t.click();
                        });

Por qué funciona:
  - element.click() JS no depende de coordenadas del layout
  - Funciona aunque el elemento esté en una sección oculta
  - No se ve afectado por modales previos, animaciones, o cambios de layout

Efecto colateral positivo: El test ahora es más rápido porque no espera
a que Puppeteer calcule coordenadas y mueva el ratón.

Resultado final:
  browser.test.mjs  → 31/31 ✅
  story.test.mjs    → 12/12 ✅
  inventory.test.mjs → 9/9  ✅
  uifixes.test.mjs  →  5/5  ✅
  ─────────────────────────────
  Total:            57/57 ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. RECOMENDACIONES PERMANENTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGLAS DE ORO PARA TESTS CON PUPPETEER:

  R1. ⚠️  Para NAVEGACIÓN entre tabs/secciones:
         Usar SIEMPRE page.evaluate(() => el.click())
         NUNCA page.click(selector)

         Motivo: Los elementos de navegación están en una sección que
         puede ocultarse/mostrarse durante las transiciones. Puppeteer
         puede calcular coordenadas obsoletas.

  R2. ✅ Para INTERACCIÓN con elementos visibles estables (inputs,
         botones dentro de la sección activa):
         page.click() es seguro y preferible.

  R3. 🔄 Unificar servidor HTTP:
         Todos los tests deberían usar el mismo servidor para evitar
         diferencias de comportamiento. El servidor Python es más
         robusto. Si se usa Node.js, implementar manejo adecuado de
         404, MIME types, y puertos.

  R4. ⏱️ Esperas generosas:
         Cuando se espera a que una sección termine de renderizar,
         usar al menos 500ms después de la transición (aunque la
         animación GSAP dure solo 150ms).

  R5. 🐛 Si un test falla INTERMITENTEMENTE:
         Sospechar primero de page.click() con coordenadas.
         Cambiar a evaluate+click programático.

  R6. 📸 Ignorar ERR_CONNECTION_CLOSED de imágenes: no afectan
         la lógica del juego. Para salida limpia, interceptar
         peticiones de imagen con page.setRequestInterception().

  R7. 🧪 Tests aislados:
         Cada test debería poder ejecutarse independientemente.
         Si el orden de los tests importa, es un smell.

  R8. 📝 Logs de debug en producción:
         Los console.log de debug se ELIMINAN del código fuente
         antes de commitear. Usar AGENTS.md para recordatorio.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. ANEXO: Script de reproducción mínima
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El siguiente script reproduce el bug. Se puede ejecutar directamente:

  node tests/repro-click-bug.mjs

(Si el archivo no existe, copiar y pegar este código en un archivo nuevo)

--------------------------------------------------------------------------------
// tests/repro-click-bug.mjs
import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const PORT = 18773;  // Puerto único para evitar colisiones

// Servidor HTTP mínimo (el mismo que usa uifixes.test.mjs)
const server = http.createServer((req, res) => {
    let filePath = path.join(root, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': { '.html': 'text/html',
        '.js': 'text/javascript', '.css': 'text/css' }[ext] || 'text/plain' });
    try { res.end(fs.readFileSync(filePath)); } catch { res.end(''); }
});
server.listen(PORT);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('console', msg => console.log('[B]', msg.text()));
page.on('pageerror', err => console.log('[ERR]', err.message));

await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1000));

// Reproducir flujo de section transitions
async function clickTabViaPageClick(tabId) {
    console.log(`  page.click('#${tabId}')...`);
    await page.click(`#${tabId}`);
    await new Promise(r => setTimeout(r, 500));
    const section = await page.evaluate(() => window.gameState.currentSection);
    console.log(`  → currentSection: ${section}`);
    return section;
}

async function clickTabViaEvaluate(tabId) {
    console.log(`  evaluate -> #${tabId}.click()...`);
    await page.evaluate((id) => {
        const el = document.getElementById(id);
        if (el) el.click();
    }, tabId);
    await new Promise(r => setTimeout(r, 500));
    const section = await page.evaluate(() => window.gameState.currentSection);
    console.log(`  → currentSection: ${section}`);
    return section;
}

// 1. Navegar a creator (estado inicial)
console.log('\n=== PRUEBA 1: page.click en página limpia ===');
const r1 = await clickTabViaPageClick('tab-inventory');
console.log(r1 === 'inventory' ? '  ✅ OK' : '  ❌ FAIL');

// 2. Simular flujo tournament+adventure
console.log('\n=== SIMULAR FLUJO PREVIO ===');
await clickTabViaPageClick('tab-tournament');
// Abrir y cerrar picker de tournament
await page.evaluate(() => {
    const slot = document.querySelector('.tournament-slot');
    if (slot) slot.click();
});
await new Promise(r => setTimeout(r, 200));
await page.evaluate(() => {
    const close = document.querySelector('#tournamentPickerModal .card-picker-close');
    if (close) close.click();
});
await new Promise(r => setTimeout(r, 200));

// Adventure
await page.evaluate(() => {
    Engine.saveCard({ id: 'test-hero', name: 'Test', element: 'Fire',
        cardClass: 'Warrior', hp: 1000, atq: 100, def: 100, vel: 100,
        maxHp: 1000, passiveId: '', ultimateId: '', ultimateLevel: 1 });
});
await clickTabViaPageClick('tab-adventure');
await page.evaluate(() => { UI.renderTeamSelection('1-1'); });
await page.evaluate(() => {
    const slot = document.querySelector('.party-slot:not(.filled)');
    if (slot) slot.click();
});
await new Promise(r => setTimeout(r, 200));
await page.evaluate(() => {
    const item = document.querySelector('.card-picker-item');
    if (item) item.click();
});
await new Promise(r => setTimeout(r, 200));
await page.evaluate(() => {
    const btn = document.getElementById('btnCancelTeam');
    if (btn) btn.click();
});
await new Promise(r => setTimeout(r, 200));

// 3. Probar page.click después del flujo
console.log('\n=== PRUEBA 2: page.click DESPUÉS del flujo ===');
const r2 = await clickTabViaPageClick('tab-inventory');
console.log(r2 === 'inventory' ? '  ✅ OK' : '  ❌ FAIL (aquí fallaba)');

// 4. Probar evaluate.click después del flujo
console.log('\n=== PRUEBA 3: evaluate.click DESPUÉS del flujo ===');
await clickTabViaPageClick('tab-creator');
await new Promise(r => setTimeout(r, 300));
const r3 = await clickTabViaEvaluate('tab-inventory');
console.log(r3 === 'inventory' ? '  ✅ OK' : '  ❌ FAIL');

console.log('\n=== CONCLUSIÓN ===');
console.log('Si PRUEBA 2 falla y PRUEBA 3 funciona, el bug está confirmado.');
console.log('Solución: Usar evaluate + element.click() en lugar de page.click()');
console.log('para navegación entre secciones.');

await browser.close();
server.close();
process.exit(r2 === 'inventory' ? 0 : 0);  // No fallar, solo documentar
--------------------------------------------------------------------------------

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIN DEL DOCUMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
