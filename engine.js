import * as narrate from './narrator.js';

// =============================================
// ⚙️ CONSTANTES DEL SISTEMA
// =============================================
export const MAX_FERVOR = 10;
export const FERVOR_PER_TURN = 1;
export const FERVOR_PER_ATTACK = 1;
export const FERVOR_PER_HIT = 1;
export const STAT_LIMIT = 7400;

// =============================================
// 🔥 ULTIMATE DATABASE
// =============================================
export const ULTIMATE_DB = {
    cataclysm_nova: {
        id: 'cataclysm_nova', name: 'Cataclysm Nova', element: 'Fuego',
        desc: 'Desata una explosión ígnea que inflige 300% ATQ como daño.',
        multiplier: 3.0, cost: 10, cooldown: 3
    },
    tidal_reckoning: {
        id: 'tidal_reckoning', name: 'Tidal Reckoning', element: 'Agua',
        desc: 'Restaura 50% HP máximo y congela la DEF del enemigo.',
        healPct: 0.5, cost: 10, cooldown: 3
    },
    storm_judgment: {
        id: 'storm_judgment', name: "Storm's Judgment", element: 'Rayo',
        desc: 'Ataque relámpago que inflige 200% ATQ como daño perforante.',
        multiplier: 2.0, piercing: true, cost: 10, cooldown: 3
    },
    verdant_wrath: {
        id: 'verdant_wrath', name: 'Verdant Wrath', element: 'Naturaleza',
        desc: 'Lanza espinas venenosas: 150% ATQ + veneno por 3 turnos.',
        multiplier: 1.5, poisonTurns: 3, cost: 10, cooldown: 3
    },
    void_rend: {
        id: 'void_rend', name: 'Void Rend', element: 'Oscuridad',
        desc: 'Desgarro dimensional que roba 30% de los stats del enemigo.',
        stealPct: 0.3, cost: 10, cooldown: 3
    },
    radiance_purge: {
        id: 'radiance_purge', name: 'Radiance Purge', element: 'Luz',
        desc: 'Purga divina: cura 30% HP a todos los aliados y otorga escudo.',
        healPct: 0.3, shieldPct: 0.2, cost: 10, cooldown: 3
    },
    enemy_smash: {
        id: 'enemy_smash', name: 'Smash', element: 'Neutral',
        desc: 'Aplasta al enemigo infligiendo 200% ATQ como daño.',
        multiplier: 2.0, cost: 10, cooldown: 3
    }
};

function getUltimateForCard(card) {
    if (!card || !card.ultimateId) return null;
    const ult = ULTIMATE_DB[card.ultimateId];
    if (!ult) return null;
    const lvl = card.ultimateLevel || 1;
    return {
        ...ult,
        multiplier: ult.multiplier ? ult.multiplier + (lvl - 1) * 0.3 : undefined,
        healPct: ult.healPct ? Math.min(ult.healPct + (lvl - 1) * 0.05, 1) : undefined
    };
}

// =============================================
// 🧮 CÁLCULO DE DAÑO (núcleo unificado)
// =============================================
function calcularDetalleDaño(atk, def, options = {}) {
    if (typeof atk.atq !== 'number' || isNaN(atk.atq)) atk.atq = 0;
    let rawDmg = atk.atq;
    let hpDamage = 0;
    let defDamage = 0;
    let piercing = 0;
    let ultimateUsed = false;

    const ult = getUltimateForCard(atk);
    if (!options.forceNormal && atk.fervor >= MAX_FERVOR && !atk.ultimateCooldown && ult) {
        ultimateUsed = true;
        atk.fervor = 0;
        atk.ultimateCooldown = ult.cooldown || 3;

        if (ult.multiplier) {
            rawDmg = Math.floor(atk.atq * ult.multiplier);
            narrate.narrateUltimateMultiplier(atk.name, ult.name, rawDmg);
        }
        if (ult.piercing) {
            piercing = rawDmg;
            rawDmg = 0;
            hpDamage += piercing;
        }
        if (ult.healPct) {
            const heal = Math.floor(atk.maxHp * ult.healPct);
            atk.hp = Math.min(atk.maxHp, atk.hp + heal);
            narrate.narrateUltimateHeal(atk.name, ult.name, heal);
        }
        if (ult.stealPct) {
            const stolenAtq = Math.floor(def.atq * ult.stealPct);
            const stolenDef = Math.floor(def.def * ult.stealPct);
            atk.atq += stolenAtq;
            def.atq = Math.max(1, def.atq - stolenAtq);
            def.def = Math.max(0, def.def - stolenDef);
            narrate.narrateUltimateSteal(atk.name, ult.name, stolenAtq, stolenDef);
        }
        if (ult.shieldPct) {
            const shield = Math.floor(atk.maxHp * ult.shieldPct);
            atk.def += shield;
            narrate.narrateUltimateShield(atk.name, ult.name, shield);
        }
        if (ult.poisonTurns) {
            def._poisonApplied = ult.poisonTurns;
            narrate.narrateUltimatePoison(def.name, ult.name, ult.poisonTurns);
        }
    }

    if (!ultimateUsed) {
        if (atk.passiveId === 'anti_armor' && def.def > 0) {
            rawDmg = Math.floor(rawDmg * 1.5);
            narrate.narrateAntiArmor(atk.name, rawDmg);
        }
        if (atk.passiveId === 'armor_piercing' && def.def > 0) {
            piercing = Math.floor(rawDmg * 0.3);
            rawDmg -= piercing;
            hpDamage += piercing;
        }
    }

    let effectiveDef = def.def;
    if (atk.passiveId === 'nem_dragon_slayer' && def.cardClass === 'Dragon') {
        effectiveDef = Math.floor(effectiveDef * 0.5);
        narrate.narrateDragonSlayer(atk.name, def.name);
    }

    if (def.passiveId === 'nem_element_ward' && atk.element === 'Rayo') {
        let reduced = Math.floor(rawDmg * 0.5);
        rawDmg -= reduced;
        narrate.narrateLightningRod(def.name, reduced, atk.name);
    }

    if (def.passiveId === 'fen_revive' && !def._revived) {
        let incomingHpDmg = hpDamage;
        if (effectiveDef > 0) {
            let splitDmg = Math.floor(rawDmg / 2);
            let actualDefDmg = Math.min(effectiveDef, splitDmg);
            incomingHpDmg += rawDmg - actualDefDmg;
        } else {
            incomingHpDmg += rawDmg;
        }
        if ((def.hp - incomingHpDmg) <= 0) {
            def._revived = true;
            def.hp = Math.floor((def.maxHp || def.hp) * 0.3);
            narrate.narrateRevive(def.name, def.hp);
            return { hpDamage: 0, defDamage: 0, piercing: 0, reviveCounter: true, blocked: false, ultimateUsed };
        }
    }

    if (def.passiveId === 'gen_block_heal' && !def._blockUsed) {
        def._blockUsed = true;
        let healAmt = Math.floor(rawDmg * 0.5);
        def.hp = Math.min(def.maxHp || def.hp, def.hp + healAmt);
        narrate.narrateBlockHeal(def.name, healAmt);
        return { hpDamage: 0, defDamage: 0, piercing: 0, blocked: true, reviveCounter: false, ultimateUsed };
    }

    if (def.passiveId === 'orc_warlord' && !def._blockUsed) {
        def._blockUsed = true;
        let healAmt = Math.floor(rawDmg * 0.5);
        def.hp = Math.min(def.maxHp, def.hp + healAmt);
        narrate.narrateWarlordBlock(def.name, healAmt);
        return { hpDamage: 0, defDamage: 0, piercing: 0, blocked: true, reviveCounter: false, ultimateUsed };
    }

    if (effectiveDef > 0) {
        let splitDmg = Math.floor(rawDmg / 2);
        let actualDefDmg = Math.min(effectiveDef, splitDmg);
        defDamage += actualDefDmg;
        hpDamage += (rawDmg - actualDefDmg);
    } else {
        hpDamage += rawDmg;
    }

    if (hpDamage < 10 && piercing === 0 && !ultimateUsed) {
        hpDamage = 10;
    }

    return { hpDamage, defDamage, piercing, reviveCounter: false, blocked: false, ultimateUsed };
}

// =============================================
// 🔄 PASIVAS POST-DAÑO
// =============================================
function processPostDamagePassives(receiver, attacker, dmg) {
    if (!receiver || !attacker || receiver.hp <= 0) return;
    if (dmg.hpDamage <= 0 && dmg.defDamage <= 0) return;
    if (_passiveDepth > MAX_PASSIVE_DEPTH) return;

    const totalDmg = dmg.hpDamage + dmg.defDamage;

    if (receiver.passiveId === 'gen_reflect_full' && !receiver._reflected) {
        receiver._reflected = true;
        let reflectedDmg = Math.floor(totalDmg);
        attacker.hp = Math.max(0, attacker.hp - reflectedDmg);
        narrate.narrateReflectFull(receiver.name, reflectedDmg, attacker.name);
    }

    if (receiver.passiveId === 'abs_reflect') {
        let reflected = Math.floor(totalDmg * 0.2);
        if (reflected > 0) {
            attacker.hp = Math.max(0, attacker.hp - reflected);
            narrate.narrateThornArmor(receiver.name, reflected, attacker.name);
        }
    }

    if (receiver.passiveId === 'abs_def_convert') {
        let converted = Math.floor(totalDmg * 0.5);
        if (converted > 0) {
            receiver.def = Math.min(receiver.maxHp || 9999, (receiver.def || 0) + converted);
            narrate.narrateIronSkin(receiver.name, converted);
        }
    }

    if (receiver.passiveId === 'abs_hp_convert') {
        let healed = Math.floor(totalDmg * 0.3);
        if (healed > 0) {
            receiver.hp = Math.min(receiver.maxHp || receiver.hp, receiver.hp + healed);
            narrate.narrateLeechAbsorb(receiver.name, healed);
        }
    }
}

// =============================================
// ⚔️ PROCESAR ATAQUE (unificado, muta el defensor)
// =============================================
let _passiveDepth = 0;
const MAX_PASSIVE_DEPTH = 20;

export function procesarAtaque(atk, def, atkLabel, defLabel, skipPassives, options = {}) {
    if (!atk || !def || atk.hp <= 0 || def.hp <= 0) return { defDamage: 0, hpDamage: 0, ultimateUsed: false, blocked: false };
    if (_passiveDepth > MAX_PASSIVE_DEPTH) return { defDamage: 0, hpDamage: 0, ultimateUsed: false, blocked: false };

    const aName = atkLabel || atk.name;
    const dName = defLabel || def.name;
    narrate.narrateAttack(aName, dName);

    if (!skipPassives) {
        _passiveDepth++;
        try {
            if (applyRoundStartPassives(atk, def)) {
                return { defDamage: 0, hpDamage: 0, ultimateUsed: false };
            }
        } finally {
            _passiveDepth--;
        }
    }

    const dmg = calcularDetalleDaño(atk, def, options);

    const blocked = dmg.blocked || false;
    const revived = dmg.reviveCounter || false;

    if (!blocked && !revived) {
        if (dmg.piercing > 0) narrate.narrateArmorPiercing(aName, dmg.piercing);
        def.def = Math.max(0, def.def - dmg.defDamage);
        def.hp = Math.max(0, def.hp - dmg.hpDamage);
        if (dmg.hpDamage > 0 || dmg.defDamage > 0) {
            def._wasHit = true;
            narrate.narrateDamageSummary(dName, dmg.hpDamage, dmg.defDamage);
        }
    }

    processPostDamagePassives(def, atk, dmg);

    if (atk.fervor < MAX_FERVOR) {
        atk.fervor = Math.min(MAX_FERVOR, atk.fervor + FERVOR_PER_ATTACK);
    }

    if (dmg.ultimateUsed) {
        narrate.narrateUltimateActivation(aName, ULTIMATE_DB[atk.ultimateId]?.name || 'ULTIMATE');
    }

    if (def.hp <= 0 && def.passiveId === 'fen_antimatter') {
        const detonateDmg = Math.floor((def.maxHp || 1000) * 0.3);
        atk.hp = Math.max(0, atk.hp - detonateDmg);
        narrate.narrateAntimatterDetonation(def.name, atk.name, detonateDmg);
    }

    return { defDamage: dmg.defDamage, hpDamage: dmg.hpDamage, ultimateUsed: dmg.ultimateUsed };
}

// =============================================
// 🔥 SISTEMA DE FERVOR
// =============================================
export function gainFervor(fighter, amount) {
    if (!fighter || fighter.hp <= 0) return;
    const prev = fighter.fervor || 0;
    fighter.fervor = Math.min(MAX_FERVOR, prev + amount);
    if (fighter.fervor === MAX_FERVOR && prev < MAX_FERVOR) {
        narrate.narrateFervorMax(fighter.name);
    }
}

// =============================================
// 🃏 INICIALIZAR CARTA PARA COMBATE
// =============================================
export function initializeCard(card) {
    if (!card) return null;
    const c = JSON.parse(JSON.stringify(card));
    c.maxHp = c.maxHp || c.hp;
    c.fervor = 0;
    c.ultimateCooldown = 0;
    c._revived = false;
    c._blockUsed = false;
    c._reflected = false;
    c._stolen = false;
    c._wasHit = false;
    c._poisonApplied = 0;
    c._berserked = false;
    c._lastStand = false;
    c._fury = false;
    c._xenophobia = false;
    return c;
}

// =============================================
// 🔄 TICK DE INICIO DE RONDA (compartido)
// =============================================
function tickRoundStart(actor) {
    if (!actor || actor.hp <= 0) return { died: false };

    if (actor.ultimateCooldown > 0) actor.ultimateCooldown--;

    gainFervor(actor, FERVOR_PER_TURN);

    if (actor._poisonApplied > 0) {
        const poisonDmg = Math.floor(actor.maxHp * 0.05);
        actor.hp = Math.max(0, actor.hp - poisonDmg);
        narrate.narratePoisonDamage(actor.name, poisonDmg);
        actor._poisonApplied--;
        if (actor.hp <= 0) return { died: true };
    }

    if (actor._wasHit) {
        gainFervor(actor, FERVOR_PER_HIT);
        actor._wasHit = false;
    }

    return { died: false };
}

// =============================================
// ⚔️ RONDA SIMULTÁNEA 1v1 (Coliseo y Torneo)
// =============================================
export function resolveSimultaneousRound(f1, f2) {
    if (!f1 || !f2 || f1.hp <= 0 || f2.hp <= 0) {
        return { acted: false, f1Result: null, f2Result: null };
    }

    const t1 = tickRoundStart(f1);
    const t2 = tickRoundStart(f2);
    if (t1.died || t2.died) {
        return { acted: true, f1Result: null, f2Result: null, poisonKill: true };
    }

    const f1Result = procesarAtaque(f1, f2);
    const f2Result = (f2.hp > 0) ? procesarAtaque(f2, f1) : null;

    if (f2.hp <= 0) narrate.narrateDeath(f2.name);
    if (f1.hp <= 0) narrate.narrateDeath(f1.name);

    return { acted: true, f1Result, f2Result };
}

// =============================================
// 🎯 ATAQUE MANUAL (para input del jugador)
// =============================================
export function executeNormalAttack(actor, target, actLabel, defLabel) {
    if (!actor || !target || actor.hp <= 0 || target.hp <= 0) {
        return { acted: false, hpDamage: 0, defDamage: 0, ultimateUsed: false, targetKilled: false };
    }
    const result = procesarAtaque(actor, target, actLabel, defLabel, false, { forceNormal: true });
    return {
        acted: true,
        targetKilled: target.hp <= 0,
        ultimateUsed: false,
        actor, target: target,
        hpDamage: result.hpDamage,
        defDamage: result.defDamage
    };
}

export function executeUltimateAttack(actor, target, actLabel, defLabel) {
    if (!actor || !target || actor.hp <= 0 || target.hp <= 0) return null;
    const ult = getUltimateForCard(actor);
    if (!ult) return null;
    if (actor.fervor < MAX_FERVOR) return null;
    if (actor.ultimateCooldown > 0) return null;
    const result = procesarAtaque(actor, target, actLabel, defLabel, false, { forceNormal: false });
    return {
        acted: true,
        targetKilled: target.hp <= 0,
        ultimateUsed: result.ultimateUsed,
        actor, target: target,
        hpDamage: result.hpDamage,
        defDamage: result.defDamage
    };
}

// =============================================
// 🗺️ RONDA SIMULTÁNEA — Aventura (héroe vs 1 enemigo)
// =============================================
export function resolveAdventureRound(hero, enemy, heroAction) {
    if (!hero || !enemy || hero.hp <= 0 || enemy.hp <= 0) {
        return { acted: false, heroResult: null, enemyResult: null };
    }

    const tHero = tickRoundStart(hero);
    const tEnemy = tickRoundStart(enemy);
    if (tHero.died || tEnemy.died) {
        return { acted: true, heroResult: null, enemyResult: null, poisonKill: true };
    }

    const heroForceNormal = heroAction !== 'ultimate';
    const heroResult = procesarAtaque(hero, enemy, hero.name, enemy.name, false, { forceNormal: heroForceNormal });

    let enemyResult = null;
    if (enemy.hp > 0) {
        const ult = getUltimateForCard(enemy);
        const shouldUlt = enemy.fervor >= MAX_FERVOR && !enemy.ultimateCooldown && ult;
        enemyResult = procesarAtaque(enemy, hero, `[Enemy] ${enemy.name}`, hero.name, false, { forceNormal: !shouldUlt });
    }

    if (enemy.hp <= 0) narrate.narrateDeath(enemy.name);
    if (hero.hp <= 0) narrate.narrateDeath(hero.name);

    return { acted: true, heroResult, enemyResult };
}

// =============================================
// 🏆 VERIFICAR VICTORIA
// =============================================
export function verifyVictory(c1, c2) {
    if (!c1 || !c2) return { victory: false, winner: null, draw: false };
    if (c1.hp <= 0 || c2.hp <= 0) {
        let draw = false;
        if (c1.hp === c2.hp) {
            narrate.narrateDraw();
            draw = true;
        } else {
            const winner = c1.hp > c2.hp ? c1 : c2;
            narrate.narrateVictory(winner.name, Math.floor(winner.hp));
        }
        return { victory: true, winner: c1.hp > c2.hp ? c1 : c2, draw };
    }
    return { victory: false, winner: null, draw: false };
}

export function verifyPartyVictory(party, squad) {
    return {
        victory: squad && squad.length > 0 && squad.every(e => !e || e.hp <= 0),
        defeat: party && party.length > 0 && party.every(a => !a || a.hp <= 0)
    };
}

// =============================================
// 🔄 PASIVAS DE INICIO DE RONDA
// =============================================
export function applyRoundStartPassives(f, r) {
    if (!f || !r || !f.passiveId || f.hp <= 0) return false;

    switch (f.passiveId) {
        case 'gen_block_heal':
            if (!f._blockUsed) {
                narrate.narrateSacredVeilReady(f.name);
            }
            break;

        case 'gen_reflect_full':
            if (!f._reflected) {
                narrate.narrateBrokenMirrorReady(f.name);
            }
            break;

        case 'gen_steal_stats':
            if (!f._stolen) {
                f._stolen = true;
                let stolenAtq = Math.floor((r.atq || 0) * 0.4);
                let stolenDef = Math.floor((r.def || 0) * 0.4);
                f.atq += stolenAtq;
                r.atq = Math.max(1, (r.atq || 0) - stolenAtq);
                r.def = Math.max(0, (r.def || 0) - stolenDef);
                narrate.narrateSoulThief(f.name, stolenAtq, stolenDef, r.name);
            }
            break;

        case 'nem_xenophobia':
            if (f._xenophobia) break;
            if (r.cardClass !== 'Human') {
                f._xenophobia = true;
                let atkBoost = Math.floor(f.atq * 1.0);
                let defBoost = Math.floor(f.def * 1.0);
                f.atq += atkBoost;
                f.def += defBoost;
                narrate.narrateXenophobia(f.name, atkBoost, defBoost);
            }
            break;

        case 'nem_dragon_slayer':
            narrate.narrateDragonSlayerReady(f.name);
            break;

        case 'nem_element_ward':
            narrate.narrateLightningRodReady(f.name);
            break;

        case 'prog_scale_stats':
            f.atq = Math.min(9999, Math.floor((f.atq || 0) * 1.1));
            f.def = Math.min(9999, Math.floor((f.def || 0) * 1.1));
            narrate.narrateGrowth(f.name);
            break;

        case 'prog_venom':
            let venomDmg = Math.floor((f.maxHp || f.hp || 1) * 0.05);
            r.hp = Math.max(0, r.hp - venomDmg);
            narrate.narrateVenom(f.name, r.name, venomDmg);
            if (r.hp <= 0) return true;
            break;

        case 'prog_drain_def':
            let drain = Math.floor((r.def || 0) * 0.15);
            r.def = Math.max(0, (r.def || 0) - drain);
            narrate.narrateRust(f.name, drain, r.name);
            break;

        case 'double_strike':
            narrate.narrateDoubleStrike(f.name);
            procesarAtaque(f, r, f.name + ' [Extra]', r.name, true);
            if (r.hp <= 0) return true;
            break;

        case 'life_leech': {
            const { hpDamage } = procesarAtaque(f, r, f.name + ' [Leech]', r.name, true);
            let steal = Math.floor(hpDamage * 0.5);
            f.hp = Math.min(f.maxHp || f.hp, f.hp + steal);
            narrate.narrateLeechDrain(f.name, steal);
            if (r.hp <= 0) return true;
            break;
        }

        case 'shield_recharge':
            let regen = Math.floor((f.maxHp || f.hp || 1) * 0.05);
            f.def = Math.min(f.maxHp || 9999, f.def + regen);
            narrate.narrateShieldRecharge(f.name, regen);
            break;

        case 'fen_antimatter':
            narrate.narrateAntimatterReady(f.name);
            break;

        case 'fen_revive':
            narrate.narrateGracefulStrikeReady(f.name);
            break;

        case 'fen_berserker':
            if (f._berserked) break;
            if (f.hp <= Math.floor((f.maxHp || f.hp || 1) * 0.3)) {
                f._berserked = true;
                f.atq = Math.floor(f.atq * 3);
                narrate.narrateBerserker(f.name);
            }
            break;

        case 'fen_last_stand':
            if (f._lastStand) break;
            if (f.hp <= Math.floor((f.maxHp || f.hp || 1) * 0.2)) {
                f._lastStand = true;
                f.def = Math.floor(f.def * 4);
                narrate.narrateLastStand(f.name);
            }
            break;

        case 'orc_warlord':
            if (f.hp > 0 && f.hp < f.maxHp) {
                let regen = Math.floor(f.maxHp * 0.02);
                f.hp = Math.min(f.maxHp, f.hp + regen);
                narrate.narrateWarlordRegen(f.name, regen);
            }
            if (!f._fury && f.hp <= Math.floor((f.maxHp || f.hp || 1) * 0.3)) {
                f._fury = true;
                f.atq = Math.floor(f.atq * 3);
                narrate.narrateBerserkerFury(f.name);
            }
            break;
    }
    return false;
}

// =============================================
// 📚 GESTIÓN DE BIBLIOTECA
// =============================================
export let cards = [];

function loadLibrary() {
    try {
        if (typeof localStorage === 'undefined') { cards = []; return; }
        const savedData = localStorage.getItem('easyHitLibrary');
        cards = savedData ? JSON.parse(savedData) : [];
    } catch (error) {
        cards = [];
    }
}
loadLibrary();

export function validateCardStats(card) {
    if (!card) return false;
    const total = (card.hp || 0) + (card.atq || 0) + (card.def || 0);
    return total <= STAT_LIMIT;
}

export function saveCard(card) {
    if (!card.id || !card.name || typeof card.hp !== 'number') {
        console.error("Intento de guardar carta corrupta abortado.");
        return false;
    }
    if (typeof card.atq !== 'number' || typeof card.def !== 'number') {
        console.error("Carta corrupta: atq y def deben ser números.");
        return false;
    }

    card.ultimateLevel = card.ultimateLevel || 1;

    if (!validateCardStats(card)) {
        const total = (card.hp || 0) + (card.atq || 0) + (card.def || 0);
        console.error(`Carta '${card.name}' excede el límite de ${STAT_LIMIT} puntos (${total}).`);
        return false;
    }

    const index = cards.findIndex(c => c.id === card.id);
    if (index !== -1) {
        cards[index] = card;
        console.log(`🗃️ Carta '${card.name}' actualizada.`);
    } else {
        cards.push(card);
        console.log(`✨ Nueva carta '${card.name}' forjada.`);
    }

    syncStorage();
    return true;
}

export function deleteCard(id) {
    if (!id) return false;
    cards = cards.filter(c => c.id !== id);
    syncStorage();
    return true;
}

export function importCards(importedArray) {
    if (!Array.isArray(importedArray)) return false;
    const merged = [...cards];
    importedArray.forEach(newCard => {
        const exists = merged.findIndex(c => c.id === newCard.id);
        if (exists !== -1) merged[exists] = newCard;
        else merged.push(newCard);
    });
    cards.length = 0;
    cards.push(...merged);
    syncStorage();
    return true;
}

function syncStorage() {
    try {
        localStorage.setItem('easyHitLibrary', JSON.stringify(cards));
    } catch (e) {
        console.error("Vanguard Critico: El almacenamiento está lleno.");
    }
}

// =============================================
// 🏛️ GALERÍA OFICIAL — Héroes de prueba
// =============================================
export const OFFICIAL_CARDS = [
    {
        id: 'hero_ignis',
        name: 'Ignis',
        element: 'Fuego',
        cardClass: 'Viking',
        hp: 2000, def: 1200, atq: 1800,
        maxHp: 2000,
        passiveId: 'fen_berserker',
        ultimateId: 'cataclysm_nova',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Ignis+🔥',
        _official: true,
        description: 'Un coloso de magma cuya furia crece cuando su vida peligra.'
    },
    {
        id: 'hero_maren',
        name: 'Maren',
        element: 'Agua',
        cardClass: 'Human',
        hp: 2500, def: 1600, atq: 1100,
        maxHp: 2500,
        passiveId: 'shield_recharge',
        ultimateId: 'tidal_reckoning',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Maren+💧',
        _official: true,
        description: 'Guardiana de las mareas. Su escudo se regenera mientras protege.'
    },
    {
        id: 'hero_zephyros',
        name: 'Zephyros',
        element: 'Rayo',
        cardClass: 'Spectre',
        hp: 1700, def: 900, atq: 1900,
        maxHp: 1700,
        passiveId: 'double_strike',
        ultimateId: 'storm_judgment',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Zephyros+⚡',
        _official: true,
        description: 'Espectro de la tormenta. Ataca con la velocidad del rayo.'
    },
    {
        id: 'hero_sylva',
        name: 'Sylva',
        element: 'Naturaleza',
        cardClass: 'Beast',
        hp: 2300, def: 1400, atq: 1300,
        maxHp: 2300,
        passiveId: 'prog_venom',
        ultimateId: 'verdant_wrath',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Sylva+🌿',
        _official: true,
        description: 'Bestia del bosque que envenena a sus presas lentamente.'
    },
    {
        id: 'hero_vorath',
        name: 'Vorath',
        element: 'Oscuridad',
        cardClass: 'Dragon',
        hp: 1800, def: 1300, atq: 1600,
        maxHp: 1800,
        passiveId: 'gen_steal_stats',
        ultimateId: 'void_rend',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Vorath+🌑',
        _official: true,
        description: 'Abismo devorador. Roba poder de sus enemigos con cada golpe.'
    },
    {
        id: 'hero_cinder',
        name: 'Cinder',
        element: 'Fuego',
        cardClass: 'Pirate',
        hp: 2200, def: 1300, atq: 1500,
        maxHp: 2200,
        passiveId: 'gen_block_heal',
        ultimateId: 'radiance_purge',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Cinder+🔥',
        _official: true,
        description: 'Pirata ígneo que purifica con llamas divinas y se protege del primer golpe.'
    },
    {
        id: 'hero_tsunami',
        name: 'Tsunami',
        element: 'Agua',
        cardClass: 'Alien',
        hp: 2000, def: 1400, atq: 1500,
        maxHp: 2000,
        passiveId: 'nem_element_ward',
        ultimateId: 'storm_judgment',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Tsunami+💧',
        _official: true,
        description: 'Ente acuático de otro mundo. Resiste tormentas eléctricas con su escudo alienígena.'
    },
    {
        id: 'hero_volt',
        name: 'Volt',
        element: 'Rayo',
        cardClass: 'Robot',
        hp: 1800, def: 1600, atq: 1500,
        maxHp: 1800,
        passiveId: 'abs_def_convert',
        ultimateId: 'void_rend',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Volt+⚡',
        _official: true,
        description: 'Autómata de plasma. Convierte el daño recibido en armadura.'
    },
    {
        id: 'hero_thorn',
        name: 'Thorn',
        element: 'Naturaleza',
        cardClass: 'Monster',
        hp: 1900, def: 1200, atq: 1700,
        maxHp: 1900,
        passiveId: 'gen_reflect_full',
        ultimateId: 'verdant_wrath',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Thorn+🌿',
        _official: true,
        description: 'Monstruo de espinas. El primer golpe que recibe se refleja por completo.'
    },
    {
        id: 'hero_shadow',
        name: 'Shadow',
        element: 'Oscuridad',
        cardClass: 'Spectre',
        hp: 1600, def: 1000, atq: 2000,
        maxHp: 1600,
        passiveId: 'nem_xenophobia',
        ultimateId: 'void_rend',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Shadow+🌑',
        _official: true,
        description: 'Espectro de las sombras. Duplica su fuerza contra enemigos no humanos.'
    },
    {
        id: 'hero_lumina',
        name: 'Lumina',
        element: 'Luz',
        cardClass: 'Human',
        hp: 2400, def: 1500, atq: 1000,
        maxHp: 2400,
        passiveId: 'fen_last_stand',
        ultimateId: 'radiance_purge',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Lumina+☀️',
        _official: true,
        description: 'Sacerdosa de luz. Cuando su vida peligra, su fe la vuelve impenetrable.'
    },
    {
        id: 'hero_titan',
        name: 'Titan',
        element: 'Fuego',
        cardClass: 'Robot',
        hp: 2200, def: 1800, atq: 1200,
        maxHp: 2200,
        passiveId: 'abs_hp_convert',
        ultimateId: 'cataclysm_nova',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Titan+🔥',
        _official: true,
        description: 'Coloso robótico de magma. Absorbe el daño como combustible.'
    },
    {
        id: 'hero_glacius',
        name: 'Glacius',
        element: 'Agua',
        cardClass: 'Dragon',
        hp: 2600, def: 1400, atq: 1100,
        maxHp: 2600,
        passiveId: 'prog_drain_def',
        ultimateId: 'tidal_reckoning',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Glacius+💧',
        _official: true,
        description: 'Dragón de hielo. Corroe la armadura enemiga cada turno.'
    },
    {
        id: 'hero_zerker',
        name: 'Zerker',
        element: 'Rayo',
        cardClass: 'Viking',
        hp: 1900, def: 1100, atq: 1800,
        maxHp: 1900,
        passiveId: 'life_leech',
        ultimateId: 'storm_judgment',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Zerker+⚡',
        _official: true,
        description: 'Vikingo de la tormenta. Drena vida de cada golpe que asesta.'
    },
    {
        id: 'hero_verdant',
        name: 'Verdant',
        element: 'Naturaleza',
        cardClass: 'Alien',
        hp: 1800, def: 1200, atq: 1700,
        maxHp: 1800,
        passiveId: 'prog_scale_stats',
        ultimateId: 'verdant_wrath',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Verdant+🌿',
        _official: true,
        description: 'Ente alienígena del bosque. Crece en poder cada ronda.'
    },
    {
        id: 'hero_nyx',
        name: 'Nyx',
        element: 'Oscuridad',
        cardClass: 'Monster',
        hp: 1700, def: 1300, atq: 1800,
        maxHp: 1700,
        passiveId: 'abs_reflect',
        ultimateId: 'cataclysm_nova',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Nyx+🌑',
        _official: true,
        description: 'Monstruo de la noche. Refleja parte del daño que recibe.'
    },
    {
        id: 'hero_forge',
        name: 'Forge',
        element: 'Fuego',
        cardClass: 'Robot',
        hp: 1900, def: 1100, atq: 1900,
        maxHp: 1900,
        passiveId: 'anti_armor',
        ultimateId: 'void_rend',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Forge+🔥',
        _official: true,
        description: 'Autómata de guerra que funde armaduras enemigas. Su poder crece contra objetivos protegidos.'
    },
    {
        id: 'hero_shrapnel',
        name: 'Shrapnel',
        element: 'Rayo',
        cardClass: 'Spectre',
        hp: 1800, def: 1200, atq: 1700,
        maxHp: 1800,
        passiveId: 'armor_piercing',
        ultimateId: 'storm_judgment',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Shrapnel+⚡',
        _official: true,
        description: 'Espectro de metralla eléctrica. Sus ataques perforan cualquier defensa.'
    },
    {
        id: 'hero_siegfried',
        name: 'Siegfried',
        element: 'Luz',
        cardClass: 'Human',
        hp: 2200, def: 1500, atq: 1600,
        maxHp: 2200,
        passiveId: 'nem_dragon_slayer',
        ultimateId: 'cataclysm_nova',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Siegfried+☀️',
        _official: true,
        description: 'Legendario cazador de dragones bañado en luz. Sus golpes atraviesan las escamas más duras.'
    },
    {
        id: 'hero_solara',
        name: 'Solara',
        element: 'Luz',
        cardClass: 'Neutral',
        hp: 2300, def: 1400, atq: 1300,
        maxHp: 2300,
        passiveId: 'fen_revive',
        ultimateId: 'radiance_purge',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Solara+☀️',
        _official: true,
        description: 'Ángel caído que se negó a quedarse muerta. Un golpe letal no es más que una pausa para ella.'
    },
    {
        id: 'hero_ashenclaw',
        name: 'Ashenclaw',
        element: 'Fuego',
        cardClass: 'Dragon',
        hp: 1700, def: 900, atq: 2000,
        maxHp: 1700,
        passiveId: 'fen_berserker',
        ultimateId: 'cataclysm_nova',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Ashenclaw+🔥',
        _official: true,
        description: 'Cría de dragón demasiado joven para tener miedo. Cuanto más se hiere, más temeraria se vuelve.'
    },
    {
        id: 'hero_riptide',
        name: 'Riptide',
        element: 'Agua',
        cardClass: 'Pirate',
        hp: 2000, def: 1200, atq: 1600,
        maxHp: 2000,
        passiveId: 'double_strike',
        ultimateId: 'tidal_reckoning',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Riptide+💧',
        _official: true,
        description: 'Capitana fantasma de las profundidades. Sus dos cimitarras nunca golpean por separado.'
    },
    {
        id: 'hero_circuit',
        name: 'Circuit',
        element: 'Rayo',
        cardClass: 'Neutral',
        hp: 1800, def: 1100, atq: 1900,
        maxHp: 1800,
        passiveId: 'armor_piercing',
        ultimateId: 'storm_judgment',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Circuit+⚡',
        _official: true,
        description: 'Dron de combate fugado sin forma fija. Ninguna armadura fue diseñada para detenerlo.'
    },
    {
        id: 'hero_krondor',
        name: 'Krondor',
        element: 'Naturaleza',
        cardClass: 'Neutral',
        hp: 2400, def: 1600, atq: 900,
        maxHp: 2400,
        passiveId: 'prog_scale_stats',
        ultimateId: 'verdant_wrath',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Krondor+🌿',
        _official: true,
        description: 'Gólem de piedra y musgo que lleva creciendo desde antes de que existieran los reinos. Sigue creciendo.'
    },
    {
        id: 'hero_grimfang',
        name: 'Grimfang',
        element: 'Oscuridad',
        cardClass: 'Monster',
        hp: 1700, def: 1000, atq: 2000,
        maxHp: 1700,
        passiveId: 'fen_antimatter',
        ultimateId: 'void_rend',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Grimfang+🌑',
        _official: true,
        description: 'Lobo de sombra que caza incluso después de caer. Su muerte es la última mordida.'
    },
    {
        id: 'hero_halcyon',
        name: 'Halcyon',
        element: 'Luz',
        cardClass: 'Alien',
        hp: 2500, def: 1300, atq: 1100,
        maxHp: 2500,
        passiveId: 'abs_hp_convert',
        ultimateId: 'radiance_purge',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Halcyon+☀️',
        _official: true,
        description: 'Visitante celestial de un cielo que no es el nuestro. Convierte cada herida en luz curativa.'
    },
    {
        id: 'hero_ferrox',
        name: 'Ferrox',
        element: 'Fuego',
        cardClass: 'Beast',
        hp: 2000, def: 1300, atq: 1700,
        maxHp: 2000,
        passiveId: 'anti_armor',
        ultimateId: 'cataclysm_nova',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Ferrox+🔥',
        _official: true,
        description: 'Jabalí acorazado de colmillos incandescentes. Cuanto más blindado el rival, más fuerte el embiste.'
    },
    {
        id: 'hero_nerezza',
        name: 'Nerezza',
        element: 'Oscuridad',
        cardClass: 'Human',
        hp: 2100, def: 1400, atq: 1500,
        maxHp: 2100,
        passiveId: 'gen_reflect_full',
        ultimateId: 'void_rend',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Nerezza+🌑',
        _official: true,
        description: 'Noble maldita de una casa que ya nadie recuerda. El primer golpe que recibe vuelve multiplicado.'
    },
    {
        id: 'hero_skarn',
        name: 'Skarn',
        element: 'Rayo',
        cardClass: 'Viking',
        hp: 1900, def: 1000, atq: 1900,
        maxHp: 1900,
        passiveId: 'life_leech',
        ultimateId: 'storm_judgment',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Skarn+⚡',
        _official: true,
        description: 'Saqueador que adora a la tormenta. Cada golpe eléctrico le devuelve la vida que arrebata.'
    },
    {
        id: 'hero_coralynn',
        name: 'Coralynn',
        element: 'Agua',
        cardClass: 'Beast',
        hp: 2600, def: 1500, atq: 1000,
        maxHp: 2600,
        passiveId: 'nem_element_ward',
        ultimateId: 'tidal_reckoning',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Coralynn+💧',
        _official: true,
        description: 'Leviatán de las fosas abisales. Su piel de coral desvía la electricidad como si nada.'
    },
    {
        id: 'hero_thistle',
        name: 'Thistle',
        element: 'Naturaleza',
        cardClass: 'Pirate',
        hp: 2100, def: 1500, atq: 1300,
        maxHp: 2100,
        passiveId: 'abs_reflect',
        ultimateId: 'verdant_wrath',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Thistle+🌿',
        _official: true,
        description: 'Pirata de zarzas que abordó su propio barco hace tanto que ya es parte del casco. Espinas por toda armadura.'
    },
    {
        id: 'hero_aurelian',
        name: 'Aurelian',
        element: 'Luz',
        cardClass: 'Robot',
        hp: 2200, def: 1400, atq: 1400,
        maxHp: 2200,
        passiveId: 'gen_steal_stats',
        ultimateId: 'radiance_purge',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Aurelian+☀️',
        _official: true,
        description: 'Centinela forjado por un culto solar extinto. Absorbe el poder de su rival para alimentar su propia luz.'
    }
];

export let gallery = [];

function loadGallery() {
    try {
        gallery = OFFICIAL_CARDS.map(c => ({ ...c }));
        if (typeof localStorage !== 'undefined') {
            syncGallery();
        }
    } catch (e) {
        gallery = OFFICIAL_CARDS.map(c => ({ ...c }));
    }
}
loadGallery();

function syncGallery() {
    try {
        localStorage.setItem('easyHitGallery', JSON.stringify(gallery));
    } catch (e) {
        console.error("Vanguard Critico: No se pudo guardar la galería.");
    }
}

function resetGallery() {
    gallery = OFFICIAL_CARDS.map(c => ({ ...c }));
    syncGallery();
}

export function getAllPlayableCards() {
    return [...cards, ...gallery];
}

// =============================================
// 🎲 LOOT SYSTEM — weightedRandomSelect + Loot Tables
// =============================================

export function weightedRandomSelect(pool) {
    if (!pool || pool.length === 0) return null;
    const totalWeight = pool.reduce((sum, item) => sum + (item.weight || 0), 0);
    if (totalWeight <= 0) return null;
    let roll = Math.random() * totalWeight;
    for (const item of pool) {
        roll -= (item.weight || 0);
        if (roll <= 0) return item;
    }
    return pool[pool.length - 1];
}

export const LOOT_TABLES = {
    normal: {
        label: 'Stage Loot',
        drops: [
            { id: 'nothing', name: null, icon: null, rarity: null, type: null, weight: 30 },
            { id: 'health_potion_s', name: 'Health Potion', icon: '❤️', rarity: 'common', type: 'consumable', weight: 20 },
            { id: 'iron_ore', name: 'Iron Ore', icon: '🪨', rarity: 'common', type: 'material', weight: 15 },
            { id: 'silver_coin', name: 'Silver Coin', icon: '🪙', rarity: 'common', type: 'currency', weight: 10 },
            { id: 'bone_shard', name: 'Bone Shard', icon: '🦴', rarity: 'common', type: 'material', weight: 10 },
            { id: 'wooden_charm', name: 'Wooden Charm', icon: '🍀', rarity: 'common', type: 'material', weight: 10 },
            { id: 'magic_dust', name: 'Magic Dust', icon: '✨', rarity: 'rare', type: 'material', weight: 3 },
            { id: 'crown_fragment', name: 'Crown Fragment', icon: '👑', rarity: 'mythic', type: 'material', weight: 2 }
        ]
    },
    boss: {
        label: 'Boss Loot',
        drops: [
            { id: 'nothing', name: null, icon: null, rarity: null, type: null, weight: 15 },
            { id: 'dragon_scale', name: 'Dragon Scale', icon: '🐉', rarity: 'epic', type: 'material', weight: 25 },
            { id: 'crown_shard', name: 'Crown Shard', icon: '👑', rarity: 'legendary', type: 'material', weight: 15 },
            { id: 'warlord_essence', name: "Warlord's Essence", icon: '💀', rarity: 'legendary', type: 'material', weight: 10 },
            { id: 'gold_potion', name: 'Gold Potion', icon: '🧪', rarity: 'rare', type: 'consumable', weight: 20 },
            { id: 'phoenix_feather', name: 'Phoenix Feather', icon: '🪶', rarity: 'mythic', type: 'material', weight: 5 },
            { id: 'rune_fragment', name: 'Rune Fragment', icon: '🔮', rarity: 'mythic', type: 'material', weight: 10 }
        ]
    }
};

export function generateLoot(stageId, squad) {
    if (!stageId || !squad) return [];
    const isBoss = stageId === '1-5';
    const table = isBoss ? LOOT_TABLES.boss : LOOT_TABLES.normal;
    const loot = [];
    for (const enemy of squad) {
        if (enemy && enemy.hp <= 0) {
            const drop = weightedRandomSelect(table.drops);
            if (drop && drop.id !== 'nothing' && drop.name) {
                loot.push({ ...drop, weight: undefined });
            }
        }
    }
    return loot;
}

// =============================================
// 🏆 TORNEO — LÓGICA DE BRACKET
// =============================================
export function generateBracket(contestants) {
    if (!contestants || contestants.length !== 16) return null;

    const shuffled = [...contestants];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Deep clone pool for stat reset between rounds
    const pool = shuffled.map(c => JSON.parse(JSON.stringify(c)));

    const rounds = [];
    rounds._pool = pool;

    for (let r = 0; r < 4; r++) {
        const numMatches = 8 / Math.pow(2, r);
        const matches = [];
        for (let m = 0; m < numMatches; m++) {
            matches.push({ f1: null, f2: null, winner: null, completed: false });
        }
        rounds.push(matches);
    }

    for (let i = 0; i < 8; i++) {
        rounds[0][i].f1 = pool[i * 2];
        rounds[0][i].f2 = pool[i * 2 + 1];
    }

    return rounds;
}

export function getNextMatch(bracket) {
    if (!bracket) return null;
    for (let r = 0; r < bracket.length; r++) {
        for (let m = 0; m < bracket[r].length; m++) {
            const match = bracket[r][m];
            if (!match.completed && match.f1 && match.f2) {
                return { round: r, match: m, ...match };
            }
        }
    }
    return null;
}

export function advanceBracket(bracket, round, matchIndex, winnerCard) {
    if (!bracket || !bracket[round] || !bracket[round][matchIndex]) return false;
    const match = bracket[round][matchIndex];
    match.winner = winnerCard;
    match.completed = true;

    const isLastRound = round >= bracket.length - 1;
    if (isLastRound) return true;

    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextRound = bracket[round + 1];
    if (!nextRound || nextMatchIndex >= nextRound.length) return false;
    const nextMatch = nextRound[nextMatchIndex];
    // Use original stats from pool (before passive boosts) for fair tournament
    if (!winnerCard) return false;
    const originalCard = bracket._pool?.find(c => c.id === winnerCard.id);
    const nextCard = originalCard ? JSON.parse(JSON.stringify(originalCard)) : winnerCard;
    if (matchIndex % 2 === 0) {
        nextMatch.f1 = nextCard;
    } else {
        nextMatch.f2 = nextCard;
    }
    const isRoundComplete = bracket[round].every(m => m.completed);
    return isRoundComplete;
}

export function isTournamentOver(bracket) {
    if (!bracket) return false;
    const lastMatch = bracket[3] && bracket[3][0];
    return lastMatch && lastMatch.completed;
}

// =============================================
// 🎮 ROGUELIKE RUN SYSTEM
// =============================================

export const RARITY_COLORS = { common: '#888', rare: '#4ade80', epic: '#a855f7' };

export const ITEM_DB = {
    rusty_sword: { id: 'rusty_sword', name: 'Rusty Sword', slot: 'weapon', rarity: 'common', atq: 50, def: 0, hp: 0 },
    wooden_shield: { id: 'wooden_shield', name: 'Wooden Shield', slot: 'armor', rarity: 'common', atq: 0, def: 80, hp: 0 },
    bone_ring: { id: 'bone_ring', name: 'Bone Ring', slot: 'weapon', rarity: 'common', atq: 20, def: 20, hp: 0 },
    leather_vest: { id: 'leather_vest', name: 'Leather Vest', slot: 'armor', rarity: 'common', atq: 0, def: 50, hp: 100 },
    iron_claymore: { id: 'iron_claymore', name: 'Iron Claymore', slot: 'weapon', rarity: 'rare', atq: 150, def: 0, hp: 0 },
    steel_plate: { id: 'steel_plate', name: 'Steel Plate', slot: 'armor', rarity: 'rare', atq: 0, def: 200, hp: 0 },
    berserker_axe: { id: 'berserker_axe', name: "Berserker's Axe", slot: 'weapon', rarity: 'rare', atq: 200, def: -50, hp: 0 },
    phoenix_crown: { id: 'phoenix_crown', name: 'Phoenix Crown', slot: 'armor', rarity: 'rare', atq: 0, def: 0, hp: 300 },
    dragon_fang: { id: 'dragon_fang', name: 'Dragon Fang Blade', slot: 'weapon', rarity: 'epic', atq: 300, def: 0, hp: 0 },
    phoenix_aegis: { id: 'phoenix_aegis', name: 'Phoenix Aegis', slot: 'armor', rarity: 'epic', atq: 0, def: 250, hp: 200 },
};

export function getItemRarityColor(rarity) {
    return RARITY_COLORS[rarity] || '#fff';
}

export function applyItemStats(hero, item) {
    if (!hero || !item) return;
    hero.atq += (item.atq || 0);
    hero.def += (item.def || 0);
    hero.hp += (item.hp || 0);
    hero.maxHp += (item.hp || 0);
}

export function removeItemStats(hero, item) {
    if (!hero || !item) return;
    hero.atq -= (item.atq || 0);
    hero.def -= (item.def || 0);
    hero.hp = Math.max(1, hero.hp - (item.hp || 0));
    hero.maxHp -= (item.hp || 0);
}

export const RUN_PASSIVE_DB = {
    bloodthirst: {
        id: 'bloodthirst', name: 'Bloodthirst', icon: '🩸',
        desc: 'Cura 10% del daño infligido',
        onHit(hero, damageDealt) {
            const heal = Math.floor(damageDealt * 0.1);
            if (heal > 0) {
                hero.hp = Math.min(hero.maxHp, hero.hp + heal);
                return { healed: heal };
            }
            return { healed: 0 };
        }
    },
    thornmail: {
        id: 'thornmail', name: 'Thornmail', icon: '🌵',
        desc: 'Reflecta 15% del daño recibido',
        onDamaged(hero, damage, attacker) {
            const reflect = Math.floor(damage * 0.15);
            if (reflect > 0 && attacker && attacker.hp > 0) {
                attacker.hp = Math.max(0, (attacker.hp || 0) - reflect);
                return { reflected: reflect };
            }
            return { reflected: 0 };
        }
    },
    precision: {
        id: 'precision', name: 'Precision', icon: '🎯',
        desc: '20% de chance de golpe doble',
        onAttack() {
            return Math.random() < 0.2;
        }
    },
    second_wind: {
        id: 'second_wind', name: 'Second Wind', icon: '🔄',
        desc: '1 vez por run, revive con 25% HP',
        onDeath(hero) {
            if (!hero._secondWindUsed) {
                hero._secondWindUsed = true;
                hero.hp = Math.floor(hero.maxHp * 0.25);
                return true;
            }
            return false;
        }
    },
    poison_strikes: {
        id: 'poison_strikes', name: 'Poison Strikes', icon: '🧪',
        desc: 'Los ataques envenenan 2 turnos',
        onHit(hero, damageDealt, target) {
            if (target && target.hp > 0) {
                target._poisonApplied = 2;
                return { poisoned: true };
            }
            return { poisoned: false };
        }
    }
};

export const UPGRADE_POOL = [
    { id: 'atk_up', name: 'Power Surge', icon: '⚔️', desc: '+20% ATQ permanente', type: 'stat', apply(hero) { hero.atq = Math.floor(hero.atq * 1.2); } },
    { id: 'def_up', name: 'Iron Will', icon: '🛡️', desc: '+20% DEF permanente', type: 'stat', apply(hero) { hero.def = Math.floor(hero.def * 1.2); } },
    { id: 'hp_up', name: 'Vitality Core', icon: '❤️', desc: '+30% HP Máximo (cura esa cantidad)', type: 'stat', apply(hero) { const bonus = Math.floor(hero.maxHp * 0.3); hero.maxHp += bonus; hero.hp = Math.min(hero.maxHp, hero.hp + bonus); } },
    { id: 'bloodthirst', name: 'Bloodthirst', icon: '🩸', desc: 'Cura 10% del daño infligido', type: 'passive', passiveId: 'bloodthirst' },
    { id: 'thornmail', name: 'Thornmail', icon: '🌵', desc: 'Reflecta 15% daño recibido', type: 'passive', passiveId: 'thornmail' },
    { id: 'precision', name: 'Precision', icon: '🎯', desc: '20% chance de golpe doble', type: 'passive', passiveId: 'precision' },
    { id: 'second_wind', name: 'Second Wind', icon: '🔄', desc: '1 vez/run revive con 25% HP', type: 'passive', passiveId: 'second_wind' },
    { id: 'poison_strikes', name: 'Poison Strikes', icon: '🧪', desc: 'Ataques envenenan 2 turnos', type: 'passive', passiveId: 'poison_strikes' },
    { id: 'new_ultimate', name: 'Ultimate Awakening', icon: '🔥', desc: 'Reemplaza ultimate (+1 nivel si es la misma)', type: 'ultimate' },
];

const HEAL_UPGRADE = { id: 'full_restore', name: 'Full Restore', icon: '💚', desc: 'Cura 100% HP', type: 'heal', apply(hero) { hero.hp = hero.maxHp; } };

export function getUpgradeChoices(hero, runPassives = []) {
    const pool = UPGRADE_POOL.filter(u => {
        if (u.type === 'passive' && runPassives.includes(u.passiveId)) return false;
        if (u.type === 'ultimate' && runPassives.includes('new_ultimate')) return false;
        return true;
    });
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const choices = [HEAL_UPGRADE];
    for (let i = 0; i < 2 && i < shuffled.length; i++) {
        choices.push(shuffled[i]);
    }
    return choices;
}

export function applyUpgrade(hero, upgrade, runPassives) {
    if (!hero || !upgrade) return runPassives;
    if (upgrade.apply) upgrade.apply(hero);
    if (upgrade.type === 'passive' && upgrade.passiveId) {
        runPassives.push(upgrade.passiveId);
    }
    if (upgrade.type === 'ultimate') {
        const allUltIds = Object.keys(ULTIMATE_DB).filter(id => id !== 'enemy_smash');
        const currentUlt = hero.ultimateId;
        const available = allUltIds.filter(id => id !== currentUlt);
        if (available.length > 0) {
            const newUlt = available[Math.floor(Math.random() * available.length)];
            hero.ultimateId = newUlt;
            hero.ultimateLevel = 1;
        } else if (currentUlt) {
            hero.ultimateLevel = (hero.ultimateLevel || 1) + 1;
        }
    }
    return runPassives;
}

export const RUN_ENEMIES_1V1 = {
    goblin_scout: {
        id: 'goblin_scout', name: 'Goblin Scout', element: 'Wind',
        cardClass: 'Goblin', hp: 1500, def: 700, atq: 1200, maxHp: 1500,
        passiveId: '', ultimateId: 'enemy_smash',
        image: 'https://via.placeholder.com/240x160?text=Scout'
    },
    goblin_piker: {
        id: 'goblin_piker', name: 'Goblin Piker', element: 'Neutral',
        cardClass: 'Goblin', hp: 1700, def: 800, atq: 1300, maxHp: 1700,
        passiveId: '', ultimateId: 'enemy_smash',
        image: 'https://via.placeholder.com/240x160?text=Piker'
    },
    goblin_shieldbearer: {
        id: 'goblin_shield', name: 'Goblin Shieldbearer', element: 'Neutral',
        cardClass: 'Goblin', hp: 2200, def: 1400, atq: 1100, maxHp: 2200,
        passiveId: '', ultimateId: 'enemy_smash',
        image: 'https://via.placeholder.com/240x160?text=Shield'
    },
    goblin_shaman_boss: {
        id: 'goblin_shaman', name: 'Goblin Shaman', element: 'Nature',
        cardClass: 'Goblin', hp: 2500, def: 1500, atq: 1600, maxHp: 2500,
        passiveId: 'shield_recharge', ultimateId: 'verdant_wrath',
        image: 'https://via.placeholder.com/240x160?text=Shaman+BOSS',
        isBoss: true
    }
};

export const RUN_TEMPLATES = {
    'run-1': {
        name: 'The Awakening',
        desc: 'Un héroe solitario debe demostrar su valía contra la horda goblin.',
        nodes: [
            { type: 'combat', enemyId: 'goblin_scout', isBoss: false },
            { type: 'combat', enemyId: 'goblin_piker', isBoss: false },
            { type: 'upgrade' },
            { type: 'combat', enemyId: 'goblin_shieldbearer', isBoss: false },
            { type: 'combat', enemyId: 'goblin_piker', isBoss: false },
            { type: 'combat', enemyId: 'goblin_shaman_boss', isBoss: true },
        ]
    }
};

export function getEnemyForRunNode(runId, nodeIndex) {
    const run = RUN_TEMPLATES[runId];
    if (!run || !run.nodes[nodeIndex]) return null;
    const node = run.nodes[nodeIndex];
    if (node.type !== 'combat' || !node.enemyId) return null;
    const template = RUN_ENEMIES_1V1[node.enemyId];
    if (!template) return null;
    const clone = JSON.parse(JSON.stringify(template));
    clone._uid = `run_enemy_${nodeIndex}_${node.enemyId}`;
    clone.fervor = 0;
    clone.ultimateCooldown = 0;
    return clone;
}

export function getRunNode(runId, nodeIndex) {
    const run = RUN_TEMPLATES[runId];
    if (!run || !run.nodes[nodeIndex]) return null;
    return { ...run.nodes[nodeIndex], index: nodeIndex, total: run.nodes.length };
}

export function getRunProgress(runId, nodeIndex) {
    const run = RUN_TEMPLATES[runId];
    if (!run) return { current: 0, total: 0 };
    return { current: nodeIndex + 1, total: run.nodes.length };
}

const ITEM_DROP_TABLES = {
    goblin_scout: {
        weight: 40,
        items: [
            { id: 'rusty_sword', weight: 30 },
            { id: 'wooden_shield', weight: 30 },
            { id: 'bone_ring', weight: 20 },
            { id: 'leather_vest', weight: 20 },
        ]
    },
    goblin_piker: {
        weight: 40,
        items: [
            { id: 'rusty_sword', weight: 20 },
            { id: 'wooden_shield', weight: 20 },
            { id: 'bone_ring', weight: 15 },
            { id: 'leather_vest', weight: 15 },
            { id: 'iron_claymore', weight: 10 },
            { id: 'steel_plate', weight: 10 },
            { id: 'berserker_axe', weight: 5 },
            { id: 'phoenix_crown', weight: 5 },
        ]
    },
    goblin_shieldbearer: {
        weight: 50,
        items: [
            { id: 'rusty_sword', weight: 10 },
            { id: 'wooden_shield', weight: 10 },
            { id: 'iron_claymore', weight: 25 },
            { id: 'steel_plate', weight: 25 },
            { id: 'berserker_axe', weight: 15 },
            { id: 'phoenix_crown', weight: 15 },
        ]
    },
    goblin_shaman_boss: {
        weight: 100,
        items: [
            { id: 'iron_claymore', weight: 15 },
            { id: 'steel_plate', weight: 15 },
            { id: 'berserker_axe', weight: 15 },
            { id: 'phoenix_crown', weight: 15 },
            { id: 'dragon_fang', weight: 20 },
            { id: 'phoenix_aegis', weight: 20 },
        ]
    }
};

export function getItemDrop(enemyId) {
    const table = ITEM_DROP_TABLES[enemyId];
    if (!table) return null;
    if (Math.random() * 100 > table.weight) return null;
    return weightedRandomSelect(table.items);
}

export function applyRunPassivesOnHit(hero, runPassives, damageDealt) {
    let totalHealed = 0;
    for (const pid of runPassives) {
        const p = RUN_PASSIVE_DB[pid];
        if (p && p.onHit) {
            const r = p.onHit(hero, damageDealt);
            if (r) totalHealed += r.healed || 0;
        }
    }
    return { healed: totalHealed };
}

export function applyRunPassivesOnDamaged(hero, runPassives, damage, attacker) {
    let totalReflected = 0;
    for (const pid of runPassives) {
        const p = RUN_PASSIVE_DB[pid];
        if (p && p.onDamaged) {
            const r = p.onDamaged(hero, damage, attacker);
            if (r) totalReflected += r.reflected || 0;
        }
    }
    return { reflected: totalReflected };
}

export function applyRunPassivesOnDeath(hero, runPassives) {
    for (const pid of runPassives) {
        const p = RUN_PASSIVE_DB[pid];
        if (p && p.onDeath) {
            if (p.onDeath(hero)) return true;
        }
    }
    return false;
}

export function checkPrecisionDoubleStrike(runPassives) {
    for (const pid of runPassives) {
        const p = RUN_PASSIVE_DB[pid];
        if (p && p.id === 'precision' && p.onAttack) {
            if (p.onAttack()) return true;
        }
    }
    return false;
}

export function equipItem(hero, weapon, armor, newItem, slot) {
    if (!hero || !newItem) return { weapon, armor };
    const itemDef = ITEM_DB[newItem.id || newItem];
    if (!itemDef) return { weapon, armor };
    if (slot === 'weapon') {
        if (weapon) removeItemStats(hero, weapon);
        weapon = itemDef;
        applyItemStats(hero, weapon);
    } else {
        if (armor) removeItemStats(hero, armor);
        armor = itemDef;
        applyItemStats(hero, armor);
    }
    return { weapon, armor };
}
