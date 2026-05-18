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
    raidAttempts: 0,
    adventure: {
        currentStage: null,
        selectedTeam: [],
        activeSquad: [],
        inCombat: false,
        turnCount: 0,
        stageProgress: {
            '1-1': 'available',
            '1-2': 'locked',
            '1-3': 'locked',
            '1-4': 'locked',
            '1-5': 'locked'
        }
    }
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
const ACTIVE_SECTIONS = ['library', 'creator', 'coliseo', 'adventure'];
const LOCKED_SECTIONS = ['inventory', 'shop'];

const onSectionEnter = {
    library: () => { UI.displayCards(); },
    creator: () => {},
    coliseo: () => { UI.renderSelector(); },
    adventure: () => {
        UI.cleanAdventureOverlays();
        UI.initTeamSlots();
        gameState.adventure.inCombat = false;
        gameState.adventure.currentStage = null;
        gameState.adventure.selectedTeam = [];
        gameState.adventure.activeSquad = [];
        gameState.adventure.turnCount = 0;
        UI.renderCodex();
        UI.renderMapNodes(gameState.adventure);
    },
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

    // =============================================
    // 🌍 DELEGACIÓN GLOBAL (Adventure dinámico)
    // =============================================
    document.addEventListener('click', (e) => {
        const adv = gameState.adventure;

        // Map node click (available node)
        const node = e.target.closest('.map-node');
        if (node && node.dataset.stage && !node.classList.contains('locked')) {
            const stageId = node.dataset.stage;
            const status = adv.stageProgress[stageId];
            if (status === 'available') {
                adv.currentStage = stageId;
                UI.renderTeamSelection(stageId);
            }
            return;
        }

        // Party slot click (empty)
        const slot = e.target.closest('.party-slot:not(.filled)');
        if (slot && slot.dataset.slotIndex !== undefined) {
            UI.openCardPicker(parseInt(slot.dataset.slotIndex));
            e.stopPropagation();
            return;
        }

        // Card picker item click
        const pickerItem = e.target.closest('.card-picker-item:not(.disabled)');
        if (pickerItem && pickerItem.dataset.cardId) {
            const cardId = pickerItem.dataset.cardId;
            const card = Engine.cards.find(c => c.id === cardId);
            if (card) {
                const modal = document.getElementById('cardPickerModal');
                const slotIndex = modal ? parseInt(modal.dataset.targetSlot) : -1;
                if (slotIndex >= 0 && slotIndex < 5) {
                    UI.fillTeamSlot(slotIndex, card);
                }
            }
            const picker = document.getElementById('cardPickerModal');
            if (picker) picker.remove();
            return;
        }

        // Card picker close button
        if (e.target.closest('.card-picker-close')) {
            const picker = document.getElementById('cardPickerModal');
            if (picker) picker.remove();
            return;
        }

        // Close picker by clicking backdrop
        if (e.target.closest('.card-picker-modal') && !e.target.closest('.card-picker-panel')) {
            const picker = document.getElementById('cardPickerModal');
            if (picker) picker.remove();
            return;
        }

        // Confirm team button
        if (e.target.id === 'btnConfirmTeam') {
            const team = UI.getSelectedTeam();
            if (team && team.length === 5 && adv.currentStage) {
                UI.closeTeamSelection();
                adv.selectedTeam = team;
                adv.activeSquad = Engine.getSquadForStage(adv.currentStage);
                adv.turnCount = 0;
                adv.inCombat = true;
                const squadSize = adv.activeSquad.length;
                const stageLabel = adv.currentStage === '1-5' ? 'BOSS' : `${squadSize}v5`;
                UI.pveLogConsole(`🔥 ¡QUE COMIENCE EL COMBATE EN ${adv.currentStage} (${stageLabel})! 🔥`, 'system');
                UI.renderPvEArena(team, adv.activeSquad, adv.turnCount);
            }
            return;
        }

        // Cancel team button
        if (e.target.id === 'btnCancelTeam') {
            UI.closeTeamSelection();
            adv.currentStage = null;
            return;
        }

        // PvE Next Turn button
        if (e.target.id === 'btnPvENextTurn') {
            if (!adv.inCombat || !adv.activeSquad.length || !adv.selectedTeam.length) return;
            if (adv.turnCount >= 100) return;

            adv.turnCount++;
            UI.pveLogConsole(`⚔️ TURN ${adv.turnCount} — Party assaults!`, 'round-header', adv.turnCount);

            Engine.executePartyTurn(adv.selectedTeam, adv.activeSquad);
            UI.updatePvEArena(adv.selectedTeam, adv.activeSquad, adv.turnCount);

            const v = Engine.verifyPartyVictory(adv.selectedTeam, adv.activeSquad);
            if (v.victory) {
                UI.pveLogConsole(`🏆 ¡VICTORIA! Escuadrón enemigo derrotado.`, 'victory');
                adv.inCombat = false;
                adv.stageProgress[adv.currentStage] = 'completed';
                const stages = ['1-1','1-2','1-3','1-4','1-5'];
                const idx = stages.indexOf(adv.currentStage);
                if (idx >= 0 && idx < stages.length - 1) {
                    const next = stages[idx + 1];
                    if (adv.stageProgress[next] === 'locked') {
                        adv.stageProgress[next] = 'available';
                    }
                }
                setTimeout(() => { UI.showPvEResult('victory'); }, 500);
            } else if (v.defeat) {
                UI.pveLogConsole(`💀 DERROTA — Todos los héroes han caído.`, 'victory');
                adv.inCombat = false;
                setTimeout(() => { UI.showPvEResult('defeat'); }, 500);
            }
            return;
        }

        // PvE Retreat button
        if (e.target.id === 'btnPvERetreat') {
            adv.inCombat = false;
            adv.currentStage = null;
            adv.selectedTeam = [];
            adv.activeSquad = [];
            adv.turnCount = 0;
            UI.cleanAdventureOverlays();
            UI.renderMapNodes(adv);
            return;
        }

        // Result overlay: Continue (victory)
        if (e.target.id === 'btnPvEResultContinue') {
            adv.inCombat = false;
            adv.currentStage = null;
            adv.selectedTeam = [];
            adv.activeSquad = [];
            adv.turnCount = 0;
            UI.cleanAdventureOverlays();
            UI.renderMapNodes(adv);
            return;
        }

        // Result overlay: Retry (defeat)
        if (e.target.id === 'btnPvEResultRetry') {
            const stageId = adv.currentStage;
            UI.cleanAdventureOverlays();
            UI.renderTeamSelection(stageId);
            return;
        }

        // Result overlay: Back to Map (defeat)
        if (e.target.id === 'btnPvEBackToMap') {
            adv.inCombat = false;
            adv.currentStage = null;
            adv.selectedTeam = [];
            adv.activeSquad = [];
            adv.turnCount = 0;
            UI.cleanAdventureOverlays();
            UI.renderMapNodes(adv);
            return;
        }
    });

    // Restaurar última pestaña desde localStorage (solo activas)
    try {
        const lastTab = localStorage.getItem('easyHitLastTab');
        if (lastTab && ACTIVE_SECTIONS.includes(lastTab)) {
            transitionState(lastTab);
        }
    } catch (e) {}
}
