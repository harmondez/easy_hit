import * as UI from './ui.js';
import * as Engine from './engine.js';
import * as Narrator from './narrator.js';

// Expose for debugging / browser tests
window.Engine = Engine;
window.UI = UI;

// =============================================
// 🎮 GAME STATE GLOBAL
// =============================================
const gameState = {
    fighter1: null,
    fighter2: null,
    coliseumCombat: null,
    adventureCombat: null,
    round: 0,
    lastSection: null,
    currentSection: null,
    resources: {
        gold: 0
    },
    player: {
        level: 1,
        xp: 0,
        xpToNext: 100
    },
    inventory: [],
    codex: [],
    raidAttempts: 0,
    tournament: {
        bracket: null,
        currentRound: 0,
        currentMatch: 0,
        matchF1: null,
        matchF2: null,
        tournamentCombat: null,
        status: 'idle'
    },
    adventure: {
        hero: null,
        heroBaseSnapshot: null,
        currentRun: 'run-1',
        currentNode: 0,
        inCombat: false,
        turnCount: 0,
        weapon: null,
        armor: null,
        runPassives: [],
        completed: false,
        runProgress: { 'run-1': 'available' },
        healPotions: 3,
        fervorPotions: 1
    }
};

window.gameState = gameState;

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
const SECTION_WHITELIST = ['library', 'creator', 'coliseo', 'adventure', 'gallery', 'tournament', 'inventory', 'shop'];
const ACTIVE_SECTIONS = ['library', 'creator', 'coliseo', 'adventure', 'gallery', 'tournament', 'inventory'];
const LOCKED_SECTIONS = ['shop'];

const onSectionEnter = {
    library: () => { UI.displayCards(); },
    creator: () => {},
    coliseo: () => { UI.renderSelector(); },
    adventure: () => {
        const adv = gameState.adventure;
        UI.cleanAdventureOverlays();
        gameState.adventureCombat = null;
        adv.inCombat = false;
        adv.turnCount = 0;
        UI.renderCodex();
        if (adv.hero) {
            const run = Engine.RUN_TEMPLATES[adv.currentRun];
            if (run) {
                UI.renderOrganigrama(run, adv.currentNode);
                return;
            }
        }
        const run = Engine.RUN_TEMPLATES[adv.currentRun];
        if (run) UI.renderAdventureLobby(run);
    },
    gallery: () => {},
    tournament: () => {
        const t = gameState.tournament;
        t.bracket = null;
        t.currentRound = 0;
        t.currentMatch = 0;
        t.matchF1 = null;
        t.matchF2 = null;
        t.tournamentCombat = null;
        t.status = 'idle';
        UI.toggleTournamentView('tournamentSetupView');
        UI.resetTournamentSlots();
        UI.renderTournamentSetup();
    },
    inventory: () => { UI.renderInventory(gameState.inventory); UI.initInventoryFilters(); },
    shop: () => {}
};

const onSectionExit = {
    library: () => {},
    creator: () => {},
    coliseo: () => {
        gameState.coliseumCombat = null;
        gameState.fighter1 = null;
        gameState.fighter2 = null;
        gameState.round = 0;
        Narrator.resetLogContainer();
    },
    adventure: () => {
        const adv = gameState.adventure;
        adv.inCombat = false;
        adv.turnCount = 0;
        gameState.adventureCombat = null;
        Narrator.resetLogContainer();
    },
    gallery: () => {},
    tournament: () => {
        const overlay = document.getElementById('tournamentChampionOverlay');
        if (overlay) overlay.style.display = 'none';
    },
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
    const levelEl = document.getElementById('hudLevel');
    const xpEl = document.getElementById('hudXpFill');
    if (goldEl) goldEl.innerText = r.gold;
    if (levelEl) levelEl.innerText = `LVL ${p.level}`;
    if (xpEl) xpEl.style.width = `${Math.min(100, (p.xp / p.xpToNext) * 100)}%`;
}

function addXP(amount) {
    const p = gameState.player;
    p.xp += amount;
    while (p.xp >= p.xpToNext) {
        p.xp -= p.xpToNext;
        p.level++;
        UI.pveLogConsole(`🎉 Level Up! You are now LVL ${p.level}!`, 'victory');
    }
    _savePlayerData();
    updateHUD();
}

function _savePlayerData() {
    try {
        const data = {
            gold: gameState.resources.gold,
            level: gameState.player.level,
            xp: gameState.player.xp,
            xpToNext: gameState.player.xpToNext,
            inventory: gameState.inventory,
            hpPots: gameState.adventure.healPotions,
            fvPots: gameState.adventure.fervorPotions
        };
        localStorage.setItem('eh_save', JSON.stringify(data));
    } catch (e) {}
}

function _loadPlayerData() {
    try {
        const raw = localStorage.getItem('eh_save');
        if (!raw) return;
        const data = JSON.parse(raw);
        if (data.gold !== undefined) gameState.resources.gold = data.gold;
        if (data.level !== undefined) gameState.player.level = data.level;
        if (data.xp !== undefined) gameState.player.xp = data.xp;
        if (data.xpToNext !== undefined) gameState.player.xpToNext = data.xpToNext;
        if (Array.isArray(data.inventory)) gameState.inventory = data.inventory;
        if (data.hpPots !== undefined) gameState.adventure.healPotions = data.hpPots;
        if (data.fvPots !== undefined) gameState.adventure.fervorPotions = data.fvPots;
    } catch (e) {}
}

// =============================================
// 📌 INIT EVENTS
// =============================================
function initEvents() {
    if (window._easyHitEventsInitialized) return;
    window._easyHitEventsInitialized = true;

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
    const creatorInputs = ['cardName', 'cardElement', 'cardClass', 'inputHP', 'inputDEF', 'inputATQ', 'inputVEL', 'cardPassive', 'cardUltimate'];
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
            vel: parseInt(document.getElementById('inputVEL')?.value) || 100,
            maxHp: parseInt(document.getElementById('inputHP')?.value) || 1,
            passiveId: document.getElementById('cardPassive')?.value || '',
            ultimateId: document.getElementById('cardUltimate')?.value || '',
            ultimateLevel: 1,
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
            const card = Engine.getAllPlayableCards().find(c => c.id === e.target.value);

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

        const f1 = Engine.initializeCard(gameState.fighter1);
        const f2 = Engine.initializeCard(gameState.fighter2);
        gameState.fighter1 = f1;
        gameState.fighter2 = f2;

        const turnQueue = Engine.buildTurnOrder([f1], [f2]);
        gameState.coliseumCombat = {
            turnQueue,
            currentIndex: 0,
            turnNumber: 0,
            activeF1: f1,
            activeF2: f2
        };
        gameState.round = 0;

        UI.resetTurnGroups('logContent');
        UI.logConsole(`🔥 ¡QUE COMIENCE EL COMBATE POR INICIATIVA! 🔥`, 'system');
        UI.logConsole(`📋 Orden: ${turnQueue.map(e => e.actor.name + (e.isAlly ? ' (Tú)' : ' (Enemy)')).join(' → ')}`, 'system');

        UI.refreshFighterStats(f1, 1);
        UI.refreshFighterStats(f2, 2);
        UI.renderTurnBar(turnQueue, 0, 'coliseumTurnBar');

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

    function processColiseumTurn() {
        const cc = gameState.coliseumCombat;
        if (!cc) return;

        if (cc.turnQueue.length === 0) return;

        const entry = cc.turnQueue[cc.currentIndex];

        if (!entry.actor || entry.actor.hp <= 0) {
            cc.turnQueue.splice(cc.currentIndex, 1);
            if (cc.currentIndex >= cc.turnQueue.length) cc.currentIndex = 0;
            UI.refreshFighterStats(cc.activeF1, 1);
            UI.refreshFighterStats(cc.activeF2, 2);
            UI.renderTurnBar(cc.turnQueue, cc.currentIndex);
            const v = Engine.verifyVictory(cc.activeF1, cc.activeF2);
            if (!v.victory) processColiseumTurn();
            return;
        }

        const isF1 = entry.isAlly;
        cc.turnNumber++;

        UI.setActiveHighlight(true, entry.isAlly, entry.slotIndex);
        UI.renderTurnBar(cc.turnQueue, cc.currentIndex);
        UI.logConsole(`🎯 Turno de ${entry.actor.name}`, 'round-header', cc.turnNumber);

        const result = Engine.resolveCombatTurn(entry, cc.turnQueue);

        // Damage floats
        const targetNum = result.target === cc.activeF1 ? '1' : '2';
        const targetSelector = `#boxF${targetNum}`;
        if (result.hpDamage > 0) UI.spawnDmgFloat(targetSelector, 'hp', result.hpDamage);
        if (result.defDamage > 0) UI.spawnDmgFloat(targetSelector, 'def', result.defDamage);

        // Ultimate animation
        if (result.ultimateUsed) {
            const ult = Engine.ULTIMATE_DB[entry.actor.ultimateId];
            if (ult) UI.playUltimateAnimation(entry.actor.name, ult.name);
        }

        // Death animation
        if (result.targetKilled && result.target) {
            UI.playDeathAnimation(`#boxF${targetNum}`);
        }

        UI.animateCombatHit(isF1);
        setTimeout(() => UI.animateCombatHit(!isF1), 120);

        UI.refreshFighterStats(cc.activeF1, 1);
        UI.refreshFighterStats(cc.activeF2, 2);

        cc.currentIndex++;
        if (cc.currentIndex >= cc.turnQueue.length) cc.currentIndex = 0;

        UI.clearActiveHighlight();
        UI.renderTurnBar(cc.turnQueue, cc.currentIndex);

        const v = Engine.verifyVictory(cc.activeF1, cc.activeF2);
        if (v.victory) {
            UI.setColiseumButtonMode('finish');
        }
    }

    safeListener('btnNextRound', 'click', (e) => {
        const btnNext = e.currentTarget;
        const btnInit = document.getElementById('btnInitCombat');

        if (btnNext.dataset.mode === 'finish') {
            gameState.coliseumCombat = null;
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

        if (!gameState.coliseumCombat) return;

        processColiseumTurn();
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
    // 🏆 TORNEO — EVENTOS
    // =============================================
    function _resetTournament() {
        const t = gameState.tournament;
        t.bracket = null;
        t.currentRound = 0;
        t.currentMatch = 0;
        t.matchF1 = null;
        t.matchF2 = null;
        t.tournamentCombat = null;
        t.status = 'idle';
        UI.resetTournamentSlots();
    }

    function _processTournamentTurn() {
        const t = gameState.tournament;
        const tc = t.tournamentCombat;
        if (!tc) return;

        if (tc.turnQueue.length === 0) return;

        const entry = tc.turnQueue[tc.currentIndex];

        if (!entry.actor || entry.actor.hp <= 0) {
            tc.turnQueue.splice(tc.currentIndex, 1);
            if (tc.currentIndex >= tc.turnQueue.length) tc.currentIndex = 0;
            UI.updateTournamentMatchUI(t.matchF1, t.matchF2);
            const v = Engine.verifyVictory(t.matchF1, t.matchF2);
            if (!v.victory) _processTournamentTurn();
            return;
        }

        tc.turnNumber++;
        Narrator.setLogContainer('tournamentLogContentMatch');
        UI.setActiveHighlight(true, entry.isAlly, entry.slotIndex);
        UI.renderTurnBar(tc.turnQueue, tc.currentIndex, 'tournamentTurnBar');
        UI.logConsole(`🎯 Turno de ${entry.actor.name}`, 'round-header', tc.turnNumber, 'tournamentLogContentMatch');

        const result = Engine.resolveCombatTurn(entry, tc.turnQueue);

        // Damage floats
        const isF1 = entry.isAlly;
        const dmgTargetSel = result.target === t.matchF1 ? '#tBox-1' : '#tBox-2';
        if (result.hpDamage > 0) UI.spawnDmgFloat(dmgTargetSel, 'hp', result.hpDamage);
        if (result.defDamage > 0) UI.spawnDmgFloat(dmgTargetSel, 'def', result.defDamage);

        if (result.ultimateUsed) {
            const ult = Engine.ULTIMATE_DB[entry.actor.ultimateId];
            if (ult) UI.playUltimateAnimation(entry.actor.name, ult.name);
        }

        if (result.targetKilled && result.target) {
            UI.playDeathAnimation(dmgTargetSel);
        }

        UI.updateTournamentMatchUI(t.matchF1, t.matchF2);

        tc.currentIndex++;
        if (tc.currentIndex >= tc.turnQueue.length) tc.currentIndex = 0;

        UI.clearActiveHighlight();
        UI.renderTurnBar(tc.turnQueue, tc.currentIndex, 'tournamentTurnBar');

        const v = Engine.verifyVictory(t.matchF1, t.matchF2);
        if (!v.victory) {
            return;
        }
    }

    safeListener('btnStartDraw', 'click', () => {
        const contestants = UI.getTournamentContestants();
        if (contestants.length !== 16) return;

        const bracket = Engine.generateBracket(contestants);
        if (!bracket) return;

        const t = gameState.tournament;
        t.bracket = bracket;
        t.currentRound = 0;
        t.currentMatch = 0;
        t.status = 'bracket';

        UI.toggleTournamentView('tournamentBracketView');
        UI.renderTournamentBracket(bracket);
        UI.addTournamentLog('🎲 Draw completed! 8 matches generated.', 'system');
    });

    safeListener('btnResetTournamentSetup', 'click', () => {
        _resetTournament();
        UI.renderTournamentSetup();
    });

    safeListener('btnBackToSetup', 'click', () => {
        _resetTournament();
        UI.toggleTournamentView('tournamentSetupView');
        UI.renderTournamentSetup();
    });

    safeListener('btnNextMatch', 'click', () => {
        const t = gameState.tournament;
        if (!t.bracket) return;

        const next = Engine.getNextMatch(t.bracket);
        if (!next) {
            if (Engine.isTournamentOver(t.bracket)) {
                const champ = t.bracket[3][0].winner;
                if (champ) UI.showTournamentChampion(champ);
            }
            return;
        }

        t.currentRound = next.round;
        t.currentMatch = next.match;

        const f1 = Engine.initializeCard(next.f1);
        const f2 = Engine.initializeCard(next.f2);
        t.matchF1 = f1;
        t.matchF2 = f2;

        const turnQueue = Engine.buildTurnOrder([f1], [f2]);
        t.tournamentCombat = {
            turnQueue,
            currentIndex: 0,
            turnNumber: 0,
            activeF1: f1,
            activeF2: f2
        };
        t.status = 'match';

        UI.toggleTournamentView('tournamentMatchView');
        UI.renderTournamentMatch(f1, f2, next.round, next.match);
        UI.renderTurnBar(turnQueue, 0, 'tournamentTurnBar');
        UI.addTournamentLog(`⚔️ Match ${next.match+1} Round ${next.round+1}: ${f1.name} vs ${f2.name}`, 'system');
    });

    safeListener('btnTournamentNextTurn', 'click', () => {
        const t = gameState.tournament;
        if (!t.tournamentCombat || t.status !== 'match') return;

        _processTournamentTurn();

        const f1 = t.matchF1;
        const f2 = t.matchF2;

        if (f1.hp <= 0 || f2.hp <= 0) {
            const winner = f1.hp > 0 ? f1 : f2;
            const loser = f1.hp <= 0 ? f1 : f2;

            UI.addTournamentLog(`🏆 ${winner.name} defeats ${loser.name}!`, 'victory');

            Engine.advanceBracket(t.bracket, t.currentRound, t.currentMatch, winner);
            UI.renderTournamentBracket(t.bracket);

            t.tournamentCombat = null;
            t.matchF1 = null;
            t.matchF2 = null;
            t.status = 'bracket';

            if (Engine.isTournamentOver(t.bracket)) {
                const champ = t.bracket[3][0].winner;
                if (champ) {
                    UI.addTournamentLog(`🏆🏆🏆 CHAMPION: ${champ.name}!!!`, 'victory');
                    UI.toggleTournamentView('tournamentBracketView');
                    UI.showTournamentChampion(champ);
                }
                const btn = document.getElementById('btnTournamentNextTurn');
                if (btn) btn.style.display = 'none';
                return;
            }

            UI.toggleTournamentView('tournamentBracketView');
            const btn = document.getElementById('btnTournamentNextTurn');
            if (btn) btn.style.display = 'none';
        }

        UI.updateTournamentMatchUI(f1, f2);
    });

    safeListener('btnForfeitMatch', 'click', () => {
        const t = gameState.tournament;
        if (!t.matchF1 || !t.matchF2 || t.status !== 'match') return;

        const loser = t.matchF1;
        const winner = t.matchF2;

        UI.logConsole(`🚩 ${winner.name} wins by forfeit!`, 'victory', null, 'tournamentLogContentMatch');
        UI.addTournamentLog(`🚩 ${winner.name} advances (forfeit)`, 'system');

        Engine.advanceBracket(t.bracket, t.currentRound, t.currentMatch, winner);
        UI.renderTournamentBracket(t.bracket);

        t.tournamentCombat = null;
        t.matchF1 = null;
        t.matchF2 = null;
        t.status = 'bracket';

        if (Engine.isTournamentOver(t.bracket)) {
            const champ = t.bracket[3][0].winner;
            if (champ) {
                UI.addTournamentLog(`🏆🏆🏆 CHAMPION: ${champ.name}!!!`, 'victory');
                UI.showTournamentChampion(champ);
            }
        } else {
            UI.toggleTournamentView('tournamentBracketView');
        }
        const btn = document.getElementById('btnTournamentNextTurn');
        if (btn) btn.style.display = 'none';
    });

    // =============================================
    // 🌍 DELEGACIÓN GLOBAL (Roguelike Run Flow)
    // =============================================
    document.addEventListener('click', (e) => {
        const adv = gameState.adventure;

        // Select Hero button → open hero picker
        if (e.target.id === 'btnSelectHero') {
            UI.renderHeroPicker((hero) => {
                adv.hero = hero;
                adv.heroBaseSnapshot = JSON.parse(JSON.stringify(hero));
                adv.weapon = null;
                adv.armor = null;
                adv.runPassives = [];
                adv.currentNode = 0;
                adv.completed = false;
                adv.healPotions = 3;
                adv.fervorPotions = 1;
                const run = Engine.RUN_TEMPLATES[adv.currentRun];
                if (run) UI.renderOrganigrama(run, 0);
            });
            return;
        }

        // Click on current organigrama phase → enter node
        const phaseEl = e.target.closest('.og-phase.current');
        if (phaseEl) {
            _enterRunNode();
            return;
        }

        // Single-hero arena: Attack button
        if (e.target.id === 'btnSingleAttack') {
            if (adv.inCombat && gameState.adventureCombat) {
                _runPvEAttack('attack');
            }
            return;
        }

        // Single-hero arena: Ultimate button
        if (e.target.id === 'btnSingleUltimate') {
            if (adv.inCombat && gameState.adventureCombat) {
                _runPvEAttack('ultimate');
            }
            return;
        }

        // Potion: Heal
        if (e.target.id === 'btnHealPotion') {
            if (adv.inCombat && adv.healPotions > 0 && adv.hero) {
                _useHealPotion();
            }
            return;
        }

        // Potion: Fervor
        if (e.target.id === 'btnFervorPotion') {
            if (adv.inCombat && adv.fervorPotions > 0 && adv.hero) {
                _useFervorPotion();
            }
            return;
        }
    });

    // =============================================
    // 🎯 Roguelike Run — State Machine
    // =============================================

    let _runProcessing = false;

    function _enterRunNode() {
        const adv = gameState.adventure;
        const run = Engine.RUN_TEMPLATES[adv.currentRun];
        if (!run || !run.nodes[adv.currentNode]) return;

        const node = run.nodes[adv.currentNode];
        adv.inCombat = false;
        adv.turnCount = 0;

        if (node.type === 'combat') {
            _startRunCombat(run, node);
        } else if (node.type === 'upgrade') {
            _enterRunUpgrade();
        }
    }

    function _startRunCombat(run, node) {
        const adv = gameState.adventure;
        const enemy = Engine.getEnemyForRunNode(adv.currentRun, adv.currentNode);
        if (!enemy || !adv.hero) return;

        const hero = adv.hero;
        adv.inCombat = true;
        adv.turnCount = 0;

        // Apply run passives on combat start (thornmail doesn't need init, but secondWind flag persists)
        // Regen for Phoenix Aegis if equipped
        if (adv.armor && adv.armor.id === 'phoenix_aegis') {
            const regen = Math.floor(hero.maxHp * 0.05);
            hero.hp = Math.min(hero.maxHp, hero.hp + regen);
        }

        const turnQueue = Engine.buildTurnOrder([hero], [enemy]);
        gameState.adventureCombat = {
            turnQueue,
            currentIndex: 0,
            turnNumber: 0,
            party: [hero],
            squad: [enemy],
            isRunCombat: true,
            nodeEnemyId: node.enemyId,
            nodeIsBoss: node.isBoss
        };

        UI.removeSingleHeroActions();
        UI.renderSingleHeroArena(hero, enemy, adv.turnCount);
        UI.renderPotionBar(adv.healPotions, adv.fervorPotions);
        Narrator.setLogContainer('pveLogContent');
        UI.pveLogConsole(`🔥 ${hero.name} vs ${enemy.name}! 🔥`, 'system');
        UI.pveLogConsole(`📋 Order: ${turnQueue.map(e => e.actor.name).join(' → ')}`, 'system');

        setTimeout(() => _runAdvanceTurn(), 300);
    }

    function _useHealPotion() {
        const adv = gameState.adventure;
        const hero = adv.hero;
        if (!hero || adv.healPotions <= 0) return;
        hero.hp = hero.maxHp;
        adv.healPotions--;
        _savePlayerData();
        UI.pveLogConsole(`🧪 ${hero.name} fully healed!`, 'system');
        UI.renderPotionBar(adv.healPotions, adv.fervorPotions);
        UI.updateSingleHeroArena(hero, gameState.adventureCombat?.squad?.[0]);
    }

    function _useFervorPotion() {
        const adv = gameState.adventure;
        const hero = adv.hero;
        if (!hero || adv.fervorPotions <= 0) return;
        hero.fervor = 10;
        adv.fervorPotions--;
        _savePlayerData();
        UI.pveLogConsole(`🟡 ${hero.name} gains full fervor!`, 'system');
        UI.renderPotionBar(adv.healPotions, adv.fervorPotions);
        UI.updateSingleHeroArena(hero, gameState.adventureCombat?.squad?.[0]);
        UI.removeSingleHeroActions();
        UI.showSingleHeroActions(hero, () => _runPvEAttack('attack'), () => _runPvEAttack('ultimate'));
    }

    function _runAdvanceTurn() {
        if (_runProcessing) return;
        _runProcessing = true;

        const ac = gameState.adventureCombat;
        const adv = gameState.adventure;
        if (!ac || !adv || !adv.inCombat) { _runProcessing = false; return; }
        if (adv.turnCount >= 200) { _runProcessing = false; return; }

        // Skip dead entries
        while (ac.turnQueue.length > 0) {
            const e = ac.turnQueue[0];
            if (e && e.actor && e.actor.hp > 0) break;
            ac.turnQueue.splice(0, 1);
        }

        if (ac.turnQueue.length === 0) {
            ac.turnQueue = Engine.buildTurnOrder(ac.party, ac.squad);
            if (ac.turnQueue.length === 0) {
                adv.inCombat = false;
                gameState.adventureCombat = null;
                _runProcessing = false;
                return;
            }
        }

        // Check victory/defeat
        const v = Engine.verifyPartyVictory(ac.party, ac.squad);
        if (_handleRunOutcome(v)) { _runProcessing = false; return; }

        const entry = ac.turnQueue[0];

        if (entry.isAlly) {
            UI.clearPvETurnHighlights();
            UI.updateSingleHeroArena(adv.hero, ac.squad[0]);
            UI.showSingleHeroActions(entry.actor,
                () => { _runPvEAttack('attack'); },
                () => { _runPvEAttack('ultimate'); }
            );
            _runProcessing = false;
            return;
        }

        // Enemy turn — auto-resolve
        adv.turnCount++;
        ac.turnNumber++;

        UI.clearPvETurnHighlights();
        UI.pveLogConsole(`🎯 ${entry.actor.name}'s turn`, 'round-header', ac.turnNumber);
        Narrator.setLogContainer('pveLogContent');

        const allTargets = [{ actor: adv.hero, isAlly: true, slotIndex: 0, vel: adv.hero.vel || 100 }];
        const result = Engine.resolveEnemyTurn(entry, allTargets);

        // Apply run passives: thornmail (reflect)
        if (result.hpDamage > 0 && result.target) {
            const reflect = Engine.applyRunPassivesOnDamaged(result.target, adv.runPassives, result.hpDamage, entry.actor);
            if (reflect.reflected > 0 && entry.actor.hp > 0) {
                UI.pveLogConsole(`🌵 Thornmail reflects ${reflect.reflected} damage!`, 'system');
            }
        }

        // Check if reflect killed enemy
        const vMid = Engine.verifyPartyVictory(ac.party, ac.squad);
        if (vMid.victory || vMid.defeat) {
            UI.updateSingleHeroArena(adv.hero, ac.squad[0]);
            if (result.hpDamage > 0) UI.spawnDmgFloat('#singleArena .enemy-card', 'hp', result.hpDamage);
            if (result.defDamage > 0) UI.spawnDmgFloat('#singleArena .enemy-card', 'def', result.defDamage);
            if (result.acted) UI.animatePvEHit('#singleArena .enemy-card', '#singleArena .hero-card');
            if (result.ultimateUsed) {
                const ult = Engine.ULTIMATE_DB[entry.actor.ultimateId];
                if (ult) UI.playUltimateAnimation(entry.actor.name, ult.name);
            }
            ac.turnQueue.splice(0, 1);
            _handleRunOutcome(vMid);
            _runProcessing = false;
            return;
        }

        // Damage float & animation
        if (result.hpDamage > 0) UI.spawnDmgFloat('#singleArena .hero-card', 'hp', result.hpDamage);
        if (result.defDamage > 0) UI.spawnDmgFloat('#singleArena .hero-card', 'def', result.defDamage);

        if (result.acted) {
            UI.animatePvEHit('#singleArena .enemy-card', '#singleArena .hero-card');
        }

        if (result.ultimateUsed) {
            const ult = Engine.ULTIMATE_DB[entry.actor.ultimateId];
            if (ult) UI.playUltimateAnimation(entry.actor.name, ult.name);
        }

        if (result.targetKilled) {
            UI.playDeathAnimation('#singleArena .hero-card');
        }

        ac.turnQueue.splice(0, 1);
        UI.updateSingleHeroArena(adv.hero, ac.squad[0]);

        const v2 = Engine.verifyPartyVictory(ac.party, ac.squad);
        if (_handleRunOutcome(v2)) { _runProcessing = false; return; }

        _runProcessing = false;
        setTimeout(() => _runAdvanceTurn(), 400);
    }

    function _runPvEAttack(action) {
        if (_runProcessing) return;
        _runProcessing = true;

        const ac = gameState.adventureCombat;
        const adv = gameState.adventure;
        if (!ac || !adv || !adv.inCombat) { _runProcessing = false; return; }

        const entry = ac.turnQueue[0];
        if (!entry || !entry.isAlly) { _runProcessing = false; return; }

        const hero = entry.actor;
        const target = ac.squad[0];
        if (!target || target.hp <= 0) { _runProcessing = false; return; }

        adv.turnCount++;
        ac.turnNumber++;

        UI.removeSingleHeroActions();
        UI.clearPvETurnHighlights();
        Narrator.setLogContainer('pveLogContent');

        let result;
        let doubleStrike = false;

        if (action === 'ultimate') {
            result = Engine.executeUltimateAttack(hero, target, hero.name, target.name);
            if (!result) {
                _runProcessing = false;
                setTimeout(() => _runAdvanceTurn(), 100);
                return;
            }
        } else {
            result = Engine.executeNormalAttack(hero, target, hero.name, target.name);
            // Check for Precision double strike
            if (Engine.checkPrecisionDoubleStrike(adv.runPassives) && target.hp > 0) {
                doubleStrike = true;
            }
        }

        const actionLabel = action === 'ultimate' ? 'ULTIMATE' : 'attacks';
        UI.pveLogConsole(`🎯 ${hero.name} ${actionLabel} ${target.name}!`, 'round-header', ac.turnNumber);

        // Apply passives: Bloodthirst (heal on hit)
        const bh = Engine.applyRunPassivesOnHit(hero, adv.runPassives, result.hpDamage);
        if (bh.healed > 0) {
            UI.pveLogConsole(`🩸 Bloodthirst heals ${bh.healed} HP!`, 'system');
        }

        // Damage float & animation
        const tSel = '#singleArena .enemy-card';
        const aSel = '#singleArena .hero-card';
        if (result.hpDamage > 0) UI.spawnDmgFloat(tSel, 'hp', result.hpDamage);
        if (result.defDamage > 0) UI.spawnDmgFloat(tSel, 'def', result.defDamage);
        UI.animatePvEHit(aSel, tSel);

        if (result.ultimateUsed) {
            const ult = Engine.ULTIMATE_DB[hero.ultimateId];
            if (ult) UI.playUltimateAnimation(hero.name, ult.name);
        }

        if (result.targetKilled) {
            UI.playDeathAnimation(tSel);
        }

        ac.turnQueue.splice(0, 1);
        UI.updateSingleHeroArena(hero, target);

        // Check if enemy died
        const v = Engine.verifyPartyVictory(ac.party, ac.squad);
        if (v.victory || v.defeat) {
            _handleRunOutcome(v);
            _runProcessing = false;
            return;
        }

        // Double strike from Precision
        if (doubleStrike && target.hp > 0) {
            UI.pveLogConsole(`🎯 Precision! ${hero.name} strikes again!`, 'system');
            const result2 = Engine.executeNormalAttack(hero, target, hero.name, target.name);
            if (result2.hpDamage > 0) UI.spawnDmgFloat(tSel, 'hp', result2.hpDamage);
            if (result2.defDamage > 0) UI.spawnDmgFloat(tSel, 'def', result2.defDamage);
            if (result2.hpDamage > 0 || result2.defDamage > 0) {
                UI.animatePvEHit(aSel, tSel);
            }
            if (result2.targetKilled) {
                UI.playDeathAnimation(tSel);
            }
            const bh2 = Engine.applyRunPassivesOnHit(hero, adv.runPassives, result2.hpDamage);
            if (bh2.healed > 0) {
                UI.pveLogConsole(`🩸 Bloodthirst heals ${bh2.healed} HP!`, 'system');
            }
            const v2 = Engine.verifyPartyVictory(ac.party, ac.squad);
            if (v2.victory || v2.defeat) {
                _handleRunOutcome(v2);
                _runProcessing = false;
                return;
            }
        }

        UI.updateSingleHeroArena(hero, target);

        _runProcessing = false;
        setTimeout(() => _runAdvanceTurn(), 500);
    }

    function _handleRunOutcome(result) {
        const adv = gameState.adventure;
        const ac = gameState.adventureCombat;
        if (!adv) return false;

        if (result.victory) {
            adv.inCombat = false;
            const enemy = ac ? ac.squad[0] : null;
            const enemyId = (ac && ac.nodeEnemyId) || '';
            const isBoss = ac && ac.nodeIsBoss;

            gameState.adventureCombat = null;
            UI.removeSingleHeroActions();

            UI.pveLogConsole(`🏆 ${adv.hero.name} defeats ${enemy ? enemy.name : 'the enemy'}!`, 'victory');

            // XP and gold reward
            const xpReward = isBoss ? 50 : 30;
            const goldReward = isBoss ? 100 : 50;
            gameState.resources.gold += goldReward;
            UI.pveLogConsole(`🪙 +${goldReward} gold`, 'system');
            addXP(xpReward);

            // Check for item drop — always goes to inventory
            const drop = Engine.getItemDrop(enemyId);
            if (drop) {
                const itemDef = Engine.ITEM_DB[drop.id];
                if (itemDef) {
                    return _showItemDrop(itemDef, () => {
                        _advanceRunAfterCombat(isBoss);
                    }, () => {
                        _advanceRunAfterCombat(isBoss);
                    });
                }
            }

            setTimeout(() => _advanceRunAfterCombat(isBoss), 400);
            return true;

        } else if (result.defeat) {
            adv.inCombat = false;
            gameState.adventureCombat = null;
            UI.removeSingleHeroActions();

            // Check Second Wind
            if (Engine.applyRunPassivesOnDeath(adv.hero, adv.runPassives)) {
                UI.pveLogConsole(`🔄 Second Wind! ${adv.hero.name} revives with 25% HP!`, 'system');
                const enemy = ac ? ac.squad[0] : null;
                if (enemy && enemy.hp > 0) {
                    adv.inCombat = true;
                    const turnQueue = Engine.buildTurnOrder([adv.hero], [enemy]);
                    gameState.adventureCombat = {
                        turnQueue, currentIndex: 0, turnNumber: 0,
                        party: [adv.hero], squad: [enemy],
                        isRunCombat: true, nodeEnemyId: ac.nodeEnemyId, nodeIsBoss: ac.nodeIsBoss
                    };
                    UI.updateSingleHeroArena(adv.hero, enemy);
                    setTimeout(() => _runAdvanceTurn(), 300);
                    return true;
                }
            }

            UI.pveLogConsole(`💀 ${adv.hero.name} has fallen.`, 'victory');
            adv.hero._runNodeReached = adv.currentNode;
            const run = Engine.RUN_TEMPLATES[adv.currentRun];
            setTimeout(() => {
                UI.renderRunGameOver(adv.hero, run ? run.name : adv.currentRun,
                    () => {
                        adv.hero = null;
                        adv.weapon = null;
                        adv.armor = null;
                        adv.runPassives = [];
                        adv.currentNode = 0;
                        adv.completed = false;
                        if (run) UI.renderAdventureLobby(run);
                    },
                    () => {
                        adv.hero = null;
                        adv.weapon = null;
                        adv.armor = null;
                        adv.runPassives = [];
                        adv.currentNode = 0;
                        adv.completed = false;
                        transitionState('library');
                    }
                );
            }, 500);
            return true;
        }
        return false;
    }

    function _showItemDrop(itemDef, onEquip, onSkip) {
        UI.renderItemDrop(itemDef, () => {
            const adv = gameState.adventure;
            const slot = itemDef.slot;
            const result = Engine.equipItem(adv.hero, adv.weapon, adv.armor, itemDef, slot);
            adv.weapon = result.weapon;
            adv.armor = result.armor;
            gameState.inventory.push(itemDef);
            _savePlayerData();
            UI.pveLogConsole(`⚡ Equipped ${itemDef.name}!`, 'system');
            if (onEquip) onEquip();
        }, () => {
            gameState.inventory.push(itemDef);
            _savePlayerData();
            UI.pveLogConsole(`📦 ${itemDef.name} stored in inventory.`, 'system');
            if (onSkip) onSkip();
        });
    }

    function _advanceRunAfterCombat(isBoss) {
        const adv = gameState.adventure;
        const run = Engine.RUN_TEMPLATES[adv.currentRun];
        if (!run) return;

        adv.currentNode++;
        adv.completed = adv.currentNode >= run.nodes.length;

        if (adv.completed) {
            // Run complete!
            adv.runProgress['run-1'] = 'completed';
            adv.runProgress['run-2'] = 'available';
            gameState.resources.gold += 100;
            _savePlayerData();
            updateHUD();
            UI.renderRunComplete(run.name, adv.hero, adv.weapon, adv.armor, () => {
                UI.cleanAdventureOverlays();
                transitionState('library');
            });
            return;
        }

        // Show organigrama with updated state
        UI.cleanAdventureOverlays();
        UI.renderOrganigrama(run, adv.currentNode);
    }

    function _enterRunUpgrade() {
        const adv = gameState.adventure;
        const choices = Engine.getUpgradeChoices(adv.hero, adv.runPassives);
        UI.renderUpgradeModal(choices, (idx) => {
            const chosen = choices[idx];
            if (chosen) {
                adv.runPassives = Engine.applyUpgrade(adv.hero, chosen, adv.runPassives);
                UI.pveLogConsole(`⭐ Upgraded: ${chosen.name}!`, 'system');

                // If full restore, animate
                if (chosen.id === 'full_restore') {
                    UI.pveLogConsole(`💚 ${adv.hero.name} fully restored!`, 'system');
                }
            }
            adv.currentNode++;
            const run = Engine.RUN_TEMPLATES[adv.currentRun];
            if (!run) return;
            adv.completed = adv.currentNode >= run.nodes.length;
            if (adv.completed) {
                adv.runProgress['run-1'] = 'completed';
                adv.runProgress['run-2'] = 'available';
                gameState.resources.gold += 100;
                _savePlayerData();
                updateHUD();
                UI.renderRunComplete(run.name, adv.hero, adv.weapon, adv.armor, () => {
                    UI.cleanAdventureOverlays();
                    transitionState('library');
                });
                return;
            }
            UI.cleanAdventureOverlays();
            UI.renderOrganigrama(run, adv.currentNode);
        });
    }

    // Cargar datos de jugador desde localStorage
    _loadPlayerData();
    updateHUD();

    // Restaurar última pestaña desde localStorage (solo activas)
    try {
        const lastTab = localStorage.getItem('easyHitLastTab');
        if (lastTab && ACTIVE_SECTIONS.includes(lastTab)) {
            transitionState(lastTab);
        }
    } catch (e) {}
}
