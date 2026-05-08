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
            gsap.to('.tab-content', { 
                opacity: 0, 
                y: 10, 
                duration: 0.2, 
                onComplete: () => {
                    UI.showSection(section);
                    // Si entramos a la biblioteca, refrescamos la lista
                    if (section === 'library') UI.displayCards();
                    
                    gsap.to(`#${section}`, { 
                        opacity: 1, 
                        y: 0, 
                        duration: 0.4, 
                        ease: "back.out(1.7)" 
                    });
                }
            });
        });
    });

    // --- ✍️ CREADOR: FEEDBACK EN TIEMPO REAL ---
    const creatorInputs = ['cardName', 'cardElement', 'cardClass', 'inputHP', 'inputDEF', 'inputATQ', 'cardPassive'];
    creatorInputs.forEach(id => {
        safeListener(id, 'input', () => {
            // updateRemainingPoints ya llama internamente a updatePreview(TCG Style)
            UI.updateRemainingPoints();
            
            // Pequeño pulso visual en la carta al editar para dar sensación de "forja"
            gsap.fromTo('#cardVisual', { scale: 1.01 }, { scale: 1, duration: 0.2 });
        });
    });

    // --- 🖼️ MANEJO DE IMÁGENES ---
    safeListener('cardImgFile', 'change', (e) => UI.handleFileSelect(e));
    
    safeListener('cropImageBtn', 'click', () => {
        UI.applyCrop((img) => {
            UI.updatePreview(img);
            // Efecto de destello al aplicar el recorte
            gsap.fromTo('#previewArt', { filter: "brightness(3)" }, { filter: "brightness(1)", duration: 0.5 });
        });
    });

    safeListener('saveCardBtn', 'click', () => {
        const nameInput = document.getElementById('cardName');
        if (!nameInput?.value) return alert("¡Tu héroe necesita un nombre!");
        if (!UI.updateRemainingPoints()) return alert("¡Demasiado poder! El límite es 7400 puntos.");

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
        UI.renderSelector(); // Actualiza los dropdowns del coliseo
        
        if (UI.resetCropperData) UI.resetCropperData(); 
        
        UI.logConsole(`✨ ${card.name} ha sido forjado con éxito.`, 'system');
        alert("¡Héroe guardado en la biblioteca!");
    });

    // --- 🏛️ COLISEO: PREPARACIÓN DE BATALLA ---
    ['1', '2'].forEach(num => {
        safeListener(`selectF${num}`, 'change', (e) => {
            const card = Engine.cards.find(c => c.id === e.target.value);
            
            // Clonación profunda para no alterar la carta original de la biblioteca
            if (num === '1') fighter1 = card ? JSON.parse(JSON.stringify(card)) : null;
            if (num === '2') fighter2 = card ? JSON.parse(JSON.stringify(card)) : null;

            UI.updateFighterPreview(card, num);

            const name = card ? card.name : `Luchador ${num}`;
            UI.logConsole(`${name} se prepara para la arena.`, 'system');
        });
    });

    // --- ⚔️ BOTONES DE ACCIÓN (INICIO Y RONDA) ---
    safeListener('btnInitCombat', 'click', () => {
        if (!fighter1 || !fighter2) return alert("La arena requiere dos contendientes.");
        
        const btnInit = document.getElementById('btnInitCombat');
        const btnNext = document.getElementById('btnNextRound');

        gsap.to(btnInit, { scale: 0, duration: 0.2, onComplete: () => {
            btnInit.style.display = 'none';
            btnNext.style.display = 'block';
            btnNext.dataset.mode = 'next';
            gsap.fromTo(btnNext, { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
            UI.setColiseumButtonMode('next');
        }});
        
        UI.logConsole(`🔥 ¡QUE COMIENCE EL COMBATE! 🔥`, 'system');
    });

    safeListener('btnNextRound', 'click', (e) => {
        const btnNext = e.currentTarget;
        const btnInit = document.getElementById('btnInitCombat');

        // MODO FINALIZAR: Resetea el coliseo y devuelve el botón de inicio
        if (btnNext.dataset.mode === 'finish') {
            UI.resetColiseum(); 
            fighter1 = null; 
            fighter2 = null;

            gsap.to(btnNext, { scale: 0, duration: 0.2, onComplete: () => {
                btnNext.style.display = 'none';
                btnInit.style.display = 'block';
                gsap.fromTo(btnInit, { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
            }});
            return;
        }

        // MODO RONDA: Ataque simultáneo
        if (!fighter1 || !fighter2) return;

        // 1. Fase de Pasivas (Inicio de ronda)
        Engine.applyRoundStartPassives(fighter1, fighter2);
        Engine.applyRoundStartPassives(fighter2, fighter1);
        
        UI.refreshFighterStats(fighter1, 1);
        UI.refreshFighterStats(fighter2, 2);

        // 2. Fase de Choque (Animación simultánea)
        UI.animateCombatHit(true); // Fighter 1
        setTimeout(() => UI.animateCombatHit(false), 120); // Fighter 2 (casi instantáneo)

        // 3. Procesamiento simultáneo (Lógica Easy Hit)
        // No hay overkill potenciado, solo daño puro que puede ser negativo
        Engine.procesarRondaSimultanea(fighter1, fighter2);

        // 4. Actualización Visual
        UI.refreshFighterStats(fighter1, 1);
        UI.refreshFighterStats(fighter2, 2);

        // 5. Verificación de Victoria Negativa
        // El ganador es el que tiene el HP más alto (aunque sea negativo)
        Engine.verifyVictory(fighter1, fighter2);
    });

    // --- 🔍 BIBLIOTECA: BUSCADOR ---
    safeListener('librarySearch', 'input', (e) => {
        UI.displayCards(e.target.value.toLowerCase());
    });
}

