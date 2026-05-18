import * as UI from './ui.js';
import * as Engine from './engine.js';

let fighter1 = null, fighter2 = null;

console.log("🔥 Vanguard System: Conectando cables en tiempo real...");

initEvents();

UI.showSection('creator');
UI.displayCards();
UI.updateRemainingPoints();

if (typeof UI.renderSelector === 'function') {
    UI.renderSelector();
}

function safeListener(id, eventType, callback) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(eventType, callback);
    } else {
        console.warn(`Vanguard Warning: No se encontró el ID '${id}'.`);
    }
}

function safeGsap(callback) {
    if (typeof gsap !== 'undefined') {
        try { callback(gsap); } catch (e) {}
    }
}

function initEvents() {
    // --- 🚀 NAVEGACIÓN CON EFECTO DE TRANSICIÓN ---
    ['library', 'creator', 'coliseo'].forEach(section => {
        safeListener(`tab-${section}`, 'click', () => {
            safeGsap(g => {
                g.to('.tab-content', {
                    opacity: 0,
                    y: 10,
                    duration: 0.2,
                    onComplete: () => {
                        UI.showSection(section);
                        if (section === 'library') UI.displayCards();

                        g.to(`#${section}`, {
                            opacity: 1,
                            y: 0,
                            duration: 0.4,
                            ease: "back.out(1.7)"
                        });
                    }
                });
            });
        });
    });

    // --- ✍️ CREADOR: FEEDBACK EN TIEMPO REAL ---
    const creatorInputs = ['cardName', 'cardElement', 'cardClass', 'inputHP', 'inputDEF', 'inputATQ', 'cardPassive'];
    creatorInputs.forEach(id => {
        safeListener(id, 'input', () => {
            UI.updateRemainingPoints();
            safeGsap(g => {
                g.fromTo('#cardVisual', { scale: 1.01 }, { scale: 1, duration: 0.2 });
            });
        });
    });

    // --- 🖼️ MANEJO DE IMÁGENES ---
    safeListener('cardImgFile', 'change', (e) => UI.handleFileSelect(e));

    safeListener('cropImageBtn', 'click', () => {
        UI.applyCrop((img) => {
            UI.updatePreview(img);
            safeGsap(g => {
                g.fromTo('#previewArt', { filter: "brightness(3)" }, { filter: "brightness(1)", duration: 0.5 });
            });
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

        const saved = Engine.saveCard(card);
        if (!saved) return alert("❌ La carta excede el límite de 7400 puntos o tiene datos inválidos.");

        UI.displayCards();
        UI.renderSelector();

        if (UI.resetCropperData) UI.resetCropperData();

        UI.logConsole(`✨ ${card.name} ha sido forjado con éxito.`, 'system');
        alert("¡Héroe guardado en la biblioteca!");
    });

    // --- 🏛️ COLISEO: PREPARACIÓN DE BATALLA ---
    ['1', '2'].forEach(num => {
        safeListener(`selectF${num}`, 'change', (e) => {
            const card = Engine.cards.find(c => c.id === e.target.value);

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

        safeGsap(g => {
            g.to(btnInit, { scale: 0, duration: 0.2, onComplete: () => {
                if (btnInit) btnInit.style.display = 'none';
                if (btnNext) {
                    btnNext.style.display = 'block';
                    btnNext.dataset.mode = 'next';
                    g.fromTo(btnNext, { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
                }
                UI.setColiseumButtonMode('next');
            }});
        });

        UI.logConsole(`🔥 ¡QUE COMIENCE EL COMBATE! 🔥`, 'system');
    });

    safeListener('btnNextRound', 'click', (e) => {
        const btnNext = e.currentTarget;
        const btnInit = document.getElementById('btnInitCombat');

        if (btnNext.dataset.mode === 'finish') {
            UI.resetColiseum();
            fighter1 = null;
            fighter2 = null;

            safeGsap(g => {
                g.to(btnNext, { scale: 0, duration: 0.2, onComplete: () => {
                    if (btnNext) btnNext.style.display = 'none';
                    if (btnInit) {
                        btnInit.style.display = 'block';
                        g.fromTo(btnInit, { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
                    }
                }});
            });
            return;
        }

        if (!fighter1 || !fighter2) return;

        // 1. Fase de Pasivas (Inicio de ronda)
        Engine.applyRoundStartPassives(fighter1, fighter2);
        Engine.applyRoundStartPassives(fighter2, fighter1);

        UI.refreshFighterStats(fighter1, 1);
        UI.refreshFighterStats(fighter2, 2);

        // 2. Fase de Choque (Animación simultánea)
        UI.animateCombatHit(true);
        setTimeout(() => UI.animateCombatHit(false), 120);

        // 3. Procesamiento simultáneo
        Engine.procesarRondaSimultanea(fighter1, fighter2);

        // 4. Actualización Visual
        UI.refreshFighterStats(fighter1, 1);
        UI.refreshFighterStats(fighter2, 2);

        // 5. Verificación de Victoria Negativa
        Engine.verifyVictory(fighter1, fighter2);
    });

    // --- 🔍 BIBLIOTECA: BUSCADOR ---
    safeListener('librarySearch', 'input', (e) => {
        const term = e.target.value ? e.target.value.toLowerCase() : '';
        UI.displayCards(term);
    });

    // --- 📤 EXPORTAR / IMPORTAR BIBLIOTECA ---
    safeListener('btnExport', 'click', () => {
        if (typeof UI.exportarBiblioteca === 'function') {
            UI.exportarBiblioteca();
        }
    });

    safeListener('importJSON', 'change', (e) => {
        if (typeof UI.importarBiblioteca === 'function') {
            UI.importarBiblioteca(e, () => {
                UI.displayCards();
                UI.renderSelector();
            });
        }
    });
}
