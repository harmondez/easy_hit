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
const ACTIVE_SECTIONS = ['library', 'coliseo', 'tournament'];
const LOCKED_SECTIONS = [];
// 'creator', 'gallery', 'adventure', 'inventory' y 'shop' siguen en SECTION_WHITELIST
// (el código y las secciones no se tocan, nada se borra) pero se quitaron de ACTIVE_SECTIONS
// y sus tabs están ocultos en index.html. Solo quedan visibles Library, Duelos (coliseo) y
// Torneo (tournament) — Library absorbió el rol de mostrar el roster de 32 campeones jugables.

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
transitionState('library');
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
    const creatorInputs = ['cardName', 'cardElement', 'cardClass', 'inputHP', 'inputDEF', 'inputATQ', 'cardPassive', 'cardUltimate'];
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

        gameState.coliseumCombat = {
            turnNumber: 0,
            activeF1: f1,
            activeF2: f2
        };
        gameState.round = 0;

        UI.resetTurnGroups('logContent');
        UI.logConsole(`🔥 ¡QUE COMIENCE EL COMBATE! ${f1.name} vs ${f2.name} 🔥`, 'system');

        UI.refreshFighterStats(f1, 1);
        UI.refreshFighterStats(f2, 2);

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

        cc.turnNumber++;
        UI.logConsole(`⚔️ RONDA ${cc.turnNumber}`, 'round-header', cc.turnNumber);

        const result = Engine.resolveSimultaneousRound(cc.activeF1, cc.activeF2);

        if (result.f1Result) {
            if (result.f1Result.hpDamage > 0) UI.spawnDmgFloat('#boxF2', 'hp', result.f1Result.hpDamage);
            if (result.f1Result.defDamage > 0) UI.spawnDmgFloat('#boxF2', 'def', result.f1Result.defDamage);
            if (result.f1Result.ultimateUsed) {
                const ult = Engine.ULTIMATE_DB[cc.activeF1.ultimateId];
                if (ult) UI.playUltimateAnimation(cc.activeF1.name, ult.name);
            }
        }
        if (result.f2Result) {
            if (result.f2Result.hpDamage > 0) UI.spawnDmgFloat('#boxF1', 'hp', result.f2Result.hpDamage);
            if (result.f2Result.defDamage > 0) UI.spawnDmgFloat('#boxF1', 'def', result.f2Result.defDamage);
            if (result.f2Result.ultimateUsed) {
                const ult = Engine.ULTIMATE_DB[cc.activeF2.ultimateId];
                if (ult) UI.playUltimateAnimation(cc.activeF2.name, ult.name);
            }
        }

        UI.animateCombatHit(true);
        setTimeout(() => UI.animateCombatHit(false), 120);

        UI.refreshFighterStats(cc.activeF1, 1);
        UI.refreshFighterStats(cc.activeF2, 2);

        if (cc.activeF1.hp <= 0) UI.playDeathAnimation('#boxF1');
        if (cc.activeF2.hp <= 0) UI.playDeathAnimation('#boxF2');

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

        tc.turnNumber++;
        Narrator.setLogContainer('tournamentLogContentMatch');
        UI.logConsole(`⚔️ RONDA ${tc.turnNumber}`, 'round-header', tc.turnNumber, 'tournamentLogContentMatch');

        const result = Engine.resolveSimultaneousRound(t.matchF1, t.matchF2);

        if (result.f1Result) {
            if (result.f1Result.hpDamage > 0) UI.spawnDmgFloat('#tBox-2', 'hp', result.f1Result.hpDamage);
            if (result.f1Result.defDamage > 0) UI.spawnDmgFloat('#tBox-2', 'def', result.f1Result.defDamage);
            if (result.f1Result.ultimateUsed) {
                const ult = Engine.ULTIMATE_DB[t.matchF1.ultimateId];
                if (ult) UI.playUltimateAnimation(t.matchF1.name, ult.name);
            }
        }
        if (result.f2Result) {
            if (result.f2Result.hpDamage > 0) UI.spawnDmgFloat('#tBox-1', 'hp', result.f2Result.hpDamage);
            if (result.f2Result.defDamage > 0) UI.spawnDmgFloat('#tBox-1', 'def', result.f2Result.defDamage);
            if (result.f2Result.ultimateUsed) {
                const ult = Engine.ULTIMATE_DB[t.matchF2.ultimateId];
                if (ult) UI.playUltimateAnimation(t.matchF2.name, ult.name);
            }
        }

        UI.updateTournamentMatchUI(t.matchF1, t.matchF2);

        if (t.matchF1.hp <= 0) UI.playDeathAnimation('#tBox-1');
        if (t.matchF2.hp <= 0) UI.playDeathAnimation('#tBox-2');
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

        t.tournamentCombat = {
            turnNumber: 0,
            activeF1: f1,
            activeF2: f2
        };
        t.status = 'match';

        UI.toggleTournamentView('tournamentMatchView');
        UI.renderTournamentMatch(f1, f2, next.round, next.match);
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

        gameState.adventureCombat = {
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

        setTimeout(() => _runShowHeroActions(), 300);
    }

    function _runShowHeroActions() {
        const ac = gameState.adventureCombat;
        const adv = gameState.adventure;
        if (!ac || !adv || !adv.inCombat) return;
        const hero = adv.hero;
        const enemy = ac.squad[0];
        if (!hero || hero.hp <= 0 || !enemy || enemy.hp <= 0) return;

        UI.clearPvETurnHighlights();
        UI.updateSingleHeroArena(hero, enemy);
        UI.showSingleHeroActions(hero,
            () => { _runPvEAttack('attack'); },
            () => { _runPvEAttack('ultimate'); }
        );
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

    function _runPvEAttack(action) {
        if (_runProcessing) return;
        _runProcessing = true;

        const ac = gameState.adventureCombat;
        const adv = gameState.adventure;
        if (!ac || !adv || !adv.inCombat) { _runProcessing = false; return; }

        const hero = adv.hero;
        const enemy = ac.squad[0];
        if (!hero || hero.hp <= 0 || !enemy || enemy.hp <= 0) { _runProcessing = false; return; }
        if (action === 'ultimate' && (hero.fervor < Engine.MAX_FERVOR || hero.ultimateCooldown > 0)) {
            _runProcessing = false;
            return;
        }

        adv.turnCount++;
        ac.turnNumber++;

        UI.removeSingleHeroActions();
        UI.clearPvETurnHighlights();
        Narrator.setLogContainer('pveLogContent');

        const actionLabel = action === 'ultimate' ? 'ULTIMATE' : 'attacks';
        UI.pveLogConsole(`🎯 ${hero.name} ${actionLabel} ${enemy.name}!`, 'round-header', ac.turnNumber);

        const result = Engine.resolveAdventureRound(hero, enemy, action);
        const heroSel = '#singleArena .hero-card';
        const enemySel = '#singleArena .enemy-card';

        if (result.heroResult) {
            const r = result.heroResult;
            if (r.hpDamage > 0) UI.spawnDmgFloat(enemySel, 'hp', r.hpDamage);
            if (r.defDamage > 0) UI.spawnDmgFloat(enemySel, 'def', r.defDamage);
            UI.animatePvEHit(heroSel, enemySel);
            if (r.ultimateUsed) {
                const ult = Engine.ULTIMATE_DB[hero.ultimateId];
                if (ult) UI.playUltimateAnimation(hero.name, ult.name);
            }
            const bh = Engine.applyRunPassivesOnHit(hero, adv.runPassives, r.hpDamage);
            if (bh.healed > 0) UI.pveLogConsole(`🩸 Bloodthirst heals ${bh.healed} HP!`, 'system');
        }

        if (result.enemyResult) {
            const r = result.enemyResult;
            if (r.hpDamage > 0) UI.spawnDmgFloat(heroSel, 'hp', r.hpDamage);
            if (r.defDamage > 0) UI.spawnDmgFloat(heroSel, 'def', r.defDamage);
            if (r.hpDamage > 0 || r.defDamage > 0) UI.animatePvEHit(enemySel, heroSel);
            if (r.ultimateUsed) {
                const ult = Engine.ULTIMATE_DB[enemy.ultimateId];
                if (ult) UI.playUltimateAnimation(enemy.name, ult.name);
            }
            if (r.hpDamage > 0) {
                const reflect = Engine.applyRunPassivesOnDamaged(hero, adv.runPassives, r.hpDamage, enemy);
                if (reflect.reflected > 0 && enemy.hp > 0) {
                    UI.pveLogConsole(`🌵 Thornmail reflects ${reflect.reflected} damage!`, 'system');
                }
            }
        }

        if (enemy.hp <= 0) UI.playDeathAnimation(enemySel);
        if (hero.hp <= 0) UI.playDeathAnimation(heroSel);

        UI.updateSingleHeroArena(hero, enemy);

        const v = Engine.verifyPartyVictory(ac.party, ac.squad);
        if (v.victory || v.defeat) {
            _handleRunOutcome(v);
            _runProcessing = false;
            return;
        }

        // Precision double strike (héroe únicamente, tras la ronda)
        if (action !== 'ultimate' && Engine.checkPrecisionDoubleStrike(adv.runPassives) && enemy.hp > 0) {
            UI.pveLogConsole(`🎯 Precision! ${hero.name} strikes again!`, 'system');
            const result2 = Engine.executeNormalAttack(hero, enemy, hero.name, enemy.name);
            if (result2.hpDamage > 0) UI.spawnDmgFloat(enemySel, 'hp', result2.hpDamage);
            if (result2.defDamage > 0) UI.spawnDmgFloat(enemySel, 'def', result2.defDamage);
            if (result2.hpDamage > 0 || result2.defDamage > 0) UI.animatePvEHit(heroSel, enemySel);
            if (result2.targetKilled) UI.playDeathAnimation(enemySel);
            const bh2 = Engine.applyRunPassivesOnHit(hero, adv.runPassives, result2.hpDamage);
            if (bh2.healed > 0) UI.pveLogConsole(`🩸 Bloodthirst heals ${bh2.healed} HP!`, 'system');
            UI.updateSingleHeroArena(hero, enemy);
            const v2 = Engine.verifyPartyVictory(ac.party, ac.squad);
            if (v2.victory || v2.defeat) {
                _handleRunOutcome(v2);
                _runProcessing = false;
                return;
            }
        }

        _runProcessing = false;
        setTimeout(() => _runShowHeroActions(), 400);
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
                    gameState.adventureCombat = {
                        turnNumber: 0,
                        party: [adv.hero], squad: [enemy],
                        isRunCombat: true, nodeEnemyId: ac.nodeEnemyId, nodeIsBoss: ac.nodeIsBoss
                    };
                    UI.updateSingleHeroArena(adv.hero, enemy);
                    setTimeout(() => _runShowHeroActions(), 300);
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
