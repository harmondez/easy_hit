import * as narrate from './narrator.js';

// =============================================
// ⚙️ CONSTANTES DEL SISTEMA
// =============================================
export const MAX_FERVOR = 10;
export const FERVOR_PER_TURN = 1;
export const FERVOR_PER_ATTACK = 1;
export const FERVOR_PER_HIT = 1;
export const STAT_LIMIT = 7400;
export const VEL_WEIGHT = 2;
export const VEL_MIN = 50;
export const VEL_MAX = 500;

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
function calcularDetalleDaño(atk, def) {
    if (typeof atk.atq !== 'number' || isNaN(atk.atq)) atk.atq = 0;
    let rawDmg = atk.atq;
    let hpDamage = 0;
    let defDamage = 0;
    let piercing = 0;
    let ultimateUsed = false;

    const ult = getUltimateForCard(atk);
    if (atk.fervor >= MAX_FERVOR && !atk.ultimateCooldown && ult) {
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

export function procesarAtaque(atk, def, atkLabel, defLabel, skipPassives) {
    if (!atk || !def || atk.hp <= 0 || def.hp <= 0) return { defDamage: 0, hpDamage: 0, ultimateUsed: false, blocked: false };
    if (_passiveDepth > MAX_PASSIVE_DEPTH) return { defDamage: 0, hpDamage: 0, ultimateUsed: false, blocked: false };

    const aName = atkLabel || atk.name;
    const dName = defLabel || def.name;
    narrate.narrateAttack(aName, dName);

    if (!skipPassives) {
        _passiveDepth++;
        if (applyRoundStartPassives(atk, def)) {
            return { defDamage: 0, hpDamage: 0, ultimateUsed: false };
        }
    }

    const dmg = calcularDetalleDaño(atk, def);

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
    if (!skipPassives) _passiveDepth--;

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
// 📋 CONSTRUIR ORDEN DE TURNO
// =============================================
export function buildTurnOrder(party, squad) {
    const entries = [];

    (party || []).forEach((actor, i) => {
        if (actor && actor.hp > 0) {
            entries.push({ actor, isAlly: true, slotIndex: i, vel: actor.vel || 100 });
        }
    });

    (squad || []).forEach((actor, i) => {
        if (actor && actor.hp > 0) {
            entries.push({ actor, isAlly: false, slotIndex: i, vel: actor.vel || 80 });
        }
    });

    entries.sort((a, b) => b.vel - a.vel || (a.isAlly === b.isAlly ? a.slotIndex - b.slotIndex : a.isAlly ? -1 : 1));
    return entries;
}

// =============================================
// 🔄 RESOLVER UN TURNO INDIVIDUAL
// =============================================
export function resolveCombatTurn(turnEntry, allEntries) {
    if (!turnEntry || !turnEntry.actor || turnEntry.actor.hp <= 0) {
        return { acted: false, targetKilled: false, ultimateUsed: false, actor: null };
    }

    const actor = turnEntry.actor;

    if (actor.ultimateCooldown > 0) actor.ultimateCooldown--;

    gainFervor(actor, FERVOR_PER_TURN);

    if (actor._poisonApplied > 0) {
        const poisonDmg = Math.floor(actor.maxHp * 0.05);
        actor.hp = Math.max(0, actor.hp - poisonDmg);
        narrate.narratePoisonDamage(actor.name, poisonDmg);
        actor._poisonApplied--;
    }

    if (actor._wasHit) {
        gainFervor(actor, FERVOR_PER_HIT);
        actor._wasHit = false;
    }

    const target = findTarget(turnEntry, allEntries);
    if (!target) return { acted: false, targetKilled: false, ultimateUsed: false, actor };

    const actLabel = turnEntry.isAlly ? `[${actor.name}]` : `[Enemy] ${actor.name}`;
    const defLabel = target.isAlly ? `[${target.actor.name}]` : `[Enemy] ${target.actor.name}`;

    const result = procesarAtaque(actor, target.actor, actLabel, defLabel);

    if (target.actor && target.actor.hp <= 0) {
        narrate.narrateDeath(target.actor.name);
        return { acted: true, targetKilled: true, ultimateUsed: result.ultimateUsed, actor, target: target.actor, hpDamage: result.hpDamage, defDamage: result.defDamage };
    }

    return { acted: true, targetKilled: false, ultimateUsed: result.ultimateUsed, actor, target: target.actor, hpDamage: result.hpDamage, defDamage: result.defDamage };
}

function findTarget(turnEntry, allEntries) {
    const enemies = allEntries.filter(e =>
        e.actor && e.actor.hp > 0 && e.isAlly !== turnEntry.isAlly
    );
    if (enemies.length === 0) return null;

    const bossUltraAggro = turnEntry.actor.passiveId === 'orc_warlord';
    if (bossUltraAggro) {
        const lowestHp = enemies.reduce((min, e) => e.actor.hp < min.actor.hp ? e : min, enemies[0]);
        return lowestHp;
    }

    return enemies[0];
}

// =============================================
// 🏆 VERIFICAR VICTORIA
// =============================================
export function verifyVictory(c1, c2) {
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
            let regen = Math.floor((f.maxHp || f.hp || 1) * 0.1);
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
    const total = (card.hp || 0) + (card.atq || 0) + (card.def || 0) + ((card.vel || 0) * VEL_WEIGHT);
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

    card.vel = Math.max(VEL_MIN, Math.min(VEL_MAX, card.vel || 100));
    card.ultimateLevel = card.ultimateLevel || 1;

    if (!validateCardStats(card)) {
        const total = (card.hp || 0) + (card.atq || 0) + (card.def || 0) + ((card.vel || 0) * VEL_WEIGHT);
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
    cards = cards.filter(c => c.id !== id);
    syncStorage();
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
        hp: 2000, def: 1200, atq: 1800, vel: 100,
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
        hp: 2500, def: 1600, atq: 1100, vel: 80,
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
        hp: 1700, def: 900, atq: 1900, vel: 200,
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
        hp: 2300, def: 1400, atq: 1300, vel: 120,
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
        hp: 1800, def: 1300, atq: 1600, vel: 150,
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
        hp: 2200, def: 1300, atq: 1500, vel: 110,
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
        hp: 2000, def: 1400, atq: 1500, vel: 120,
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
        hp: 1800, def: 1600, atq: 1500, vel: 130,
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
        hp: 1900, def: 1200, atq: 1700, vel: 140,
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
        hp: 1600, def: 1000, atq: 2000, vel: 180,
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
        hp: 2400, def: 1500, atq: 1000, vel: 90,
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
        hp: 2200, def: 1800, atq: 1200, vel: 70,
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
        hp: 2600, def: 1400, atq: 1100, vel: 100,
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
        hp: 1900, def: 1100, atq: 1800, vel: 150,
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
        hp: 1800, def: 1200, atq: 1700, vel: 150,
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
        hp: 1700, def: 1300, atq: 1800, vel: 140,
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
        hp: 1900, def: 1100, atq: 1900, vel: 100,
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
        hp: 1800, def: 1200, atq: 1700, vel: 160,
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
        hp: 2200, def: 1500, atq: 1600, vel: 90,
        maxHp: 2200,
        passiveId: 'nem_dragon_slayer',
        ultimateId: 'cataclysm_nova',
        ultimateLevel: 1,
        image: 'https://via.placeholder.com/300x200?text=Siegfried+☀️',
        _official: true,
        description: 'Legendario cazador de dragones bañado en luz. Sus golpes atraviesan las escamas más duras.'
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
// 👾 ENEMY ROSTER (Zona 1 — 5v5, con VEL)
// =============================================
const ENEMY_ROSTER = {
    orc_boss: {
        id: 'orc_boss',
        name: 'Orc Warlord',
        element: 'Earth',
        cardClass: 'Orc',
        hp: 40000, def: 5000, atq: 3500, vel: 150,
        maxHp: 40000,
        passiveId: 'orc_warlord',
        ultimateId: 'void_rend',
        image: 'https://via.placeholder.com/300x200?text=Orc+Warlord+BOSS'
    }
};

const ENEMY_SQUAD_ROSTER = {
    goblin_shieldbearer: {
        id: 'goblin_shield', name: 'Goblin Shieldbearer', element: 'Neutral',
        cardClass: 'Goblin', hp: 3500, def: 2500, atq: 1400, vel: 60, maxHp: 3500,
        passiveId: '', ultimateId: '', image: 'https://via.placeholder.com/120x80?text=Shield'
    },
    goblin_piker: {
        id: 'goblin_piker', name: 'Goblin Piker', element: 'Neutral',
        cardClass: 'Goblin', hp: 2800, def: 1500, atq: 2100, vel: 90, maxHp: 2800,
        passiveId: '', ultimateId: '', image: 'https://via.placeholder.com/120x80?text=Piker'
    },
    goblin_sapper: {
        id: 'goblin_sapper', name: 'Goblin Sapper', element: 'Darkness',
        cardClass: 'Goblin', hp: 2500, def: 1200, atq: 2200, vel: 100, maxHp: 2500,
        passiveId: 'prog_venom', ultimateId: '', image: 'https://via.placeholder.com/120x80?text=Sapper'
    },
    goblin_scout: {
        id: 'goblin_scout', name: 'Goblin Scout', element: 'Wind',
        cardClass: 'Goblin', hp: 2200, def: 1000, atq: 2700, vel: 130, maxHp: 2200,
        passiveId: '', ultimateId: '', image: 'https://via.placeholder.com/120x80?text=Scout'
    },
    goblin_shaman: {
        id: 'goblin_shaman', name: 'Goblin Shaman', element: 'Nature',
        cardClass: 'Goblin', hp: 2000, def: 1500, atq: 1800, vel: 80, maxHp: 2000,
        passiveId: 'shield_recharge', ultimateId: 'verdant_wrath',
        image: 'https://via.placeholder.com/120x80?text=Shaman'
    }
};

export function getSquadForStage(stageId) {
    if (!stageId || !/^\d+-\d+$/.test(stageId)) return [];
    if (stageId === '1-5') {
        const boss = JSON.parse(JSON.stringify(ENEMY_ROSTER.orc_boss));
        boss._uid = 'orc_boss';
        return [boss];
    }
    const stageNum = parseInt(stageId.split('-')[1]);
    const mult = 1.0 + (stageNum - 1) * 0.05;
    const squad = Object.values(ENEMY_SQUAD_ROSTER).map((e, i) => {
        const clone = JSON.parse(JSON.stringify(e));
        clone.hp = Math.floor(clone.hp * mult);
        clone.maxHp = clone.hp;
        clone.def = Math.floor(clone.def * mult);
        clone.atq = Math.floor(clone.atq * mult);
        clone._uid = `enemy_slot_${i}`;
        return clone;
    });
    return squad;
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
