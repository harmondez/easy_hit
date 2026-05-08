import * as UI from './ui.js';
import * as Engine from './engine.js';

let fighter1 = null, fighter2 = null;

// ⚠️ VANGUARD FIX: Ejecución directa. 
// Eliminamos el 'DOMContentLoaded' porque los módulos (type="module") 
// ya se ejecutan automáticamente cuando el HTML está listo.
console.log("🔥 Vanguard System: Conectando cables en tiempo real...");

// 1. Inicializamos eventos
initEvents();

// 2. FORZAMOS EL INICIO EN EL CREADOR (Añade esta línea aquí)
UI.showSection('creator');

// 3. Cargamos el resto de datos
UI.displayCards();
UI.updateRemainingPoints();

if (typeof UI.renderSelector === 'function') {
    UI.renderSelector();
}

// ---------------------------------------------------------

function safeListener(id, eventType, callback) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(eventType, callback);
    } else {
        console.warn(`Vanguard Warning: No se encontró el ID '${id}'. El evento no se asignó, pero el juego sigue funcionando.`);
    }
}

function initEvents() {
    // --- 🚀 NAVEGACIÓN CON EFECTO DE TRANSICIÓN ---
    
    ['library', 'creator', 'coliseo'].forEach(section => {
        safeListener(`tab-${section}`, 'click', () => {
            gsap.to('.tab-content', { opacity: 0, y: 10, duration: 0.2, onComplete: () => {
                UI.showSection(section);
                gsap.to(`#${section}`, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" });
            }});
        });
    });

    // --- ✍️ CREADOR: FEEDBACK EN TIEMPO REAL ---
    const creatorInputs = ['cardName', 'cardElement', 'cardClass', 'inputHP', 'inputDEF', 'inputATQ', 'cardPassive'];
    creatorInputs.forEach(id => {
        safeListener(id, 'input', () => {
            UI.updateRemainingPoints();
            UI.updatePreview(UI.croppedImageBase64);
            // Pequeño pulso visual en la carta al editar
            gsap.fromTo('#cardVisual', { scale: 1.02 }, { scale: 1, duration: 0.2 });
        });
    });

    // --- 🖼️ MANEJO DE IMÁGENES ---
    safeListener('cardImgFile', 'change', (e) => UI.handleFileSelect(e));
    
    safeListener('cropImageBtn', 'click', () => {
        UI.applyCrop((img) => {
            UI.updatePreview(img);
            gsap.from('#previewArt', { filter: "brightness(3)", duration: 0.5 });
        });
    });

    safeListener('saveCardBtn', 'click', () => {
        const nameInput = document.getElementById('cardName');
        if (!nameInput?.value) return alert("¡Tu héroe necesita un nombre!");
        if (!UI.updateRemainingPoints()) return alert("¡Demasiado poder! Ajusta los puntos.");

        const card = {
            id: Date.now().toString(),
            name: nameInput.value,
            element: document.getElementById('cardElement')?.value || 'Neutral',
            cardClass: document.getElementById('cardClass')?.value || 'Human',
            hp: parseInt(document.getElementById('inputHP')?.value) || 1,
            def: parseInt(document.getElementById('inputDEF')?.value) || 1,
            atq: parseInt(document.getElementById('inputATQ')?.value) || 1,
            maxHp: parseInt(document.getElementById('inputHP')?.value) || 1,
            passiveId: document.getElementById('cardPassive')?.value || '',
            image: UI.croppedImageBase64
        };

        Engine.saveCard(card);
        UI.displayCards();
        UI.renderSelector();
        if (UI.resetCropperData) UI.resetCropperData(); 
        
        // Efecto de "Carta forjada"
        UI.logConsole(`✨ ${card.name} ha sido forjado con éxito.`, 'system');
        alert("¡Héroe guardado en la biblioteca!");
    });

    // --- 🏛️ COLISEO: PREPARACIÓN DE BATALLA ---
    // Dentro de initEvents, en la parte de COLISEO
    ['1', '2'].forEach(num => {
        safeListener(`selectF${num}`, 'change', (e) => {
            const card = Engine.cards.find(c => c.id === e.target.value);
            
            // Guardamos el luchador (clonado para no romper la biblioteca)
            if (num === '1') fighter1 = card ? JSON.parse(JSON.stringify(card)) : null;
            if (num === '2') fighter2 = card ? JSON.parse(JSON.stringify(card)) : null;

            // ¡ACTUALIZAMOS LA IMAGEN ABAJO!
            UI.updateFighterPreview(card, num);

            const name = card ? card.name : `Luchador ${num}`;
            UI.logConsole(`${name} se prepara.`, 'system');
        });
    });

    // --- ⚔️ EL BOTÓN DE ACCIÓN (EL CORAZÓN DEL COMBATE) ---
    safeListener('btnInitCombat', 'click', () => {
        if (!fighter1 || !fighter2) return alert("La arena requiere dos contendientes.");
        
        gsap.to('#btnInitCombat', { scale: 0, duration: 0.2, onComplete: () => {
            document.getElementById('btnInitCombat').style.display = 'none';
            const nextBtn = document.getElementById('btnNextRound');
            nextBtn.style.display = 'block';
            gsap.fromTo(nextBtn, { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
            UI.setColiseumButtonMode('next');
        }});
        
        UI.logConsole(`🔥 ¡QUE COMIENCE EL COMBATE! 🔥`, 'system');
    });

    safeListener('btnNextRound', 'click', (e) => {
        if (e.target.dataset.mode === 'finish') {
            UI.resetColiseum();
            // Limpiamos los combatientes locales
            fighter1 = null; 
            fighter2 = null;
            return;
        }

        if (!fighter1 || !fighter2) return;

        // 1. PASIVAS DE INICIO (Simultáneas)
        Engine.applyRoundStartPassives(fighter1, fighter2);
        Engine.applyRoundStartPassives(fighter2, fighter1);
        
        // Actualizamos UI tras pasivas (Veneno, Escudos, etc.)
        UI.refreshFighterStats(fighter1, 1);
        UI.refreshFighterStats(fighter2, 2);

        // 2. INTERCAMBIO DE GOLPES (Simultáneo Visualmente)
        // Lanzamos las dos animaciones de choque casi a la vez
        UI.animateCombatHit(true); // F1 embiste
        setTimeout(() => UI.animateCombatHit(false), 150); // F2 responde casi al instante

        // El motor procesa el daño simultáneo con Victoria Negativa (+200% overkill)
        Engine.procesarRondaSimultanea(fighter1, fighter2);

        // 3. ACTUALIZACIÓN DE ESTADÍSTICAS
        // Aquí es donde verás los números bajar a cifras negativas brutales
        UI.refreshFighterStats(fighter1, 1);
        UI.refreshFighterStats(fighter2, 2);

        // 4. VERIFICACIÓN DE VICTORIA NEGATIVA
        // Solo verificamos al final de la ronda para que ambos hayan podido golpear
        Engine.verifyVictory(fighter1, fighter2);
    });
}

