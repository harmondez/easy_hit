import * as UI from './ui.js';
import * as Engine from './engine.js';

// =============================================
// 🎮 GAME STATE GLOBAL
// =============================================
const gameState = {
    fighter1: null,
    fighter2: null,
    round: 0,
    lastSection: null,
    currentSection: null,
    resources: {
        gold: 1250,
        gems: 80,
        energy: 45,
        maxEnergy: 100
    },
    player: {
        level: 7,
        xp: 70,
        xpToNext: 100
    },
    inventory: [],
    codex: [],
    raidAttempts: 0
};

console.log("🔥 Vanguard System: Conectando cables en tiempo real...");

// =============================================
// 🛡️ SAFE HELPERS
// =============================================
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

// =============================================
// 🔀 TRANSITION STATE MACHINE
// =============================================
const SECTION_WHITELIST = ['library', 'creator', 'coliseo', 'adventure', 'inventory', 'shop'];
const ACTIVE_SECTIONS = ['library', 'creator', 'coliseo'];
const LOCKED_SECTIONS = ['adventure', 'inventory', 'shop'];

const onSectionEnter = {
    library: () => { UI.displayCards(); },
    creator: () => {},
    coliseo: () => { UI.renderSelector(); },
    adventure: () => { UI.renderCodex(); UI.renderMapNodes(); },
    inventory: () => {},
    shop: () => {}
};

const onSectionExit = {
    library: () => {},
    creator: () => {},
    coliseo: () => {},
    adventure: () => {},
    inventory: () => {},
    shop: () => {}
};

// =============================================
// 🚀 INIT (después de todas las declaraciones const)
// =============================================
initEvents();
transitionState('creator');
UI.updateRemainingPoints();

function transitionState(target) {
    // VALIDATE
    if (!SECTION_WHITELIST.includes(target)) {
        console.warn(`Vanguard: Estado '${target}' no reconocido.`);
        return;
    }

    const prev = gameState.currentSection;

    // EXIT hook
    if (prev && onSectionExit[prev]) {
        onSectionExit[prev]();
    }

    // GSAP fade out
    const prevEl = prev ? document.getElementById(`section-${prev}`) : null;
    const doFade = prevEl && typeof gsap !== 'undefined';

    const completeTransition = () => {
        // CALL UI
        UI.showSection(target);

        // ENTER hook
        if (onSectionEnter[target]) {
            onSectionEnter[target]();
        }

        // GSAP fade in
        const targetEl = document.getElementById(`section-${target}`);
        if (targetEl && typeof gsap !== 'undefined') {
            try {
                gsap.fromTo(targetEl,
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
                );
            } catch (e) {}
        }

        // UPDATE state
        gameState.lastSection = prev;
        gameState.currentSection = target;

        // PERSIST
        try { localStorage.setItem('easyHitLastTab', target); } catch (e) {}

        // HUD update
        updateHUD();
    };

    if (doFade) {
        try {
            gsap.to(prevEl, {
                opacity: 0,
                y: 10,
                duration: 0.15,
                onComplete: completeTransition
            });
        } catch (e) {
            completeTransition();
        }
    } else {
        completeTransition();
    }
}

// =============================================
// 💰 HUD ACTUALIZACIÓN
// =============================================
function updateHUD() {
    const r = gameState.resources;
    const p = gameState.player;

    const goldEl = document.getElementById('hudGold');
    const gemsEl = document.getElementById('hudGems');
    const energyEl = document.getElementById('hudEnergy');
    const levelEl = document.getElementById('hudLevel');
    const xpEl = document.getElementById('hudXpFill');

    if (goldEl) goldEl.innerText = r.gold;
    if (gemsEl) gemsEl.innerText = r.gems;
    if (energyEl) energyEl.innerText = r.energy;
    if (levelEl) levelEl.innerText = `LVL ${p.level}`;
    if (xpEl) xpEl.style.width = `${(p.xp / p.xpToNext) * 100}%`;
}

// =============================================
// 📌 INIT EVENTS
// =============================================
function initEvents() {
    // --- 🚀 NAVEGACIÓN (activas + bloqueadas) ---
    ACTIVE_SECTIONS.forEach(section => {
        safeListener(`tab-${section}`, 'click', () => {
            transitionState(section);
        });
    });

    LOCKED_SECTIONS.forEach(section => {
        safeListener(`tab-${section}`, 'click', () => {
            UI.showComingSoon(section);
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

    safeListener('cancelCropBtn', 'click', () => {
        const modal = document.getElementById('cropperModal');
        if (modal) modal.style.display = 'none';
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
        if (!saved) {
            const btn = document.getElementById('saveCardBtn');
            if (btn) {
                btn.classList.add('shake-error', 'btn-forge-error');
                safeGsap(g => {
                    g.to(btn, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 3, ease: "power2.in" });
                });
                setTimeout(() => btn.classList.remove('shake-error', 'btn-forge-error'), 700);
            }
            return alert("❌ La carta excede el límite de 7400 puntos o tiene datos inválidos.");
        }

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

            if (num === '1') gameState.fighter1 = card ? JSON.parse(JSON.stringify(card)) : null;
            if (num === '2') gameState.fighter2 = card ? JSON.parse(JSON.stringify(card)) : null;

            UI.updateFighterPreview(card, num);

            const name = card ? card.name : `Luchador ${num}`;
            UI.logConsole(`${name} se prepara para la arena.`, 'system');
        });
    });

    // --- ⚔️ BOTONES DE ACCIÓN ---
    safeListener('btnInitCombat', 'click', () => {
        if (!gameState.fighter1 || !gameState.fighter2) return alert("La arena requiere dos contendientes.");

        gameState.round = 0;
        UI.logConsole(`🔥 ¡QUE COMIENCE EL COMBATE! 🔥`, 'system');

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
    });

    safeListener('btnNextRound', 'click', (e) => {
        const btnNext = e.currentTarget;
        const btnInit = document.getElementById('btnInitCombat');

        if (btnNext.dataset.mode === 'finish') {
            UI.resetColiseum();
            gameState.fighter1 = null;
            gameState.fighter2 = null;
            gameState.round = 0;

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

        if (!gameState.fighter1 || !gameState.fighter2) return;

        gameState.round++;
        UI.logConsole(`⚔️ ROUND ${gameState.round}`, 'round-header', gameState.round);

        Engine.applyRoundStartPassives(gameState.fighter1, gameState.fighter2);
        Engine.applyRoundStartPassives(gameState.fighter2, gameState.fighter1);

        UI.refreshFighterStats(gameState.fighter1, 1);
        UI.refreshFighterStats(gameState.fighter2, 2);

        UI.animateCombatHit(true);
        setTimeout(() => UI.animateCombatHit(false), 120);

        Engine.procesarRondaSimultanea(gameState.fighter1, gameState.fighter2);

        UI.refreshFighterStats(gameState.fighter1, 1);
        UI.refreshFighterStats(gameState.fighter2, 2);

        Engine.verifyVictory(gameState.fighter1, gameState.fighter2);
    });

    // --- 🔍 BIBLIOTECA: BUSCADOR ---
    safeListener('librarySearch', 'input', (e) => {
        const term = e.target.value ? e.target.value.toLowerCase() : '';
        UI.displayCards(term);
    });

    // --- 📤 EXPORTAR / IMPORTAR ---
    safeListener('btnExport', 'click', () => {
        if (typeof UI.exportarBiblioteca === 'function') UI.exportarBiblioteca();
    });

    safeListener('importJSON', 'change', (e) => {
        if (typeof UI.importarBiblioteca === 'function') {
            UI.importarBiblioteca(e, () => {
                UI.displayCards();
                UI.renderSelector();
            });
        }
    });

    // --- 🎴 CHEST MODAL (bloqueado hasta Phase 4) ---
    safeListener('btnChestOpen', 'click', () => {
        UI.showComingSoon('chest');
    });

    safeListener('btnChestOpen10', 'click', () => {
        UI.showComingSoon('chest');
    });

    safeListener('btnChestClose', 'click', () => {
        const modal = document.getElementById('chestModal');
        if (modal) modal.style.display = 'none';
    });

    // --- 🏪 SHOP BUY (bloqueado) ---
    document.querySelectorAll('.btn-buy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            UI.showComingSoon('shop');
        });
    });

    // --- 🛡️ REFORGE (bloqueado) ---
    safeListener('btnReforge', 'click', () => {
        UI.showComingSoon('reforge');
    });

    // Restaurar última pestaña desde localStorage (solo activas)
    try {
        const lastTab = localStorage.getItem('easyHitLastTab');
        if (lastTab && ACTIVE_SECTIONS.includes(lastTab)) {
            transitionState(lastTab);
        }
    } catch (e) {}
}
