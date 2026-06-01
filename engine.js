import { logConsole, setColiseumButtonMode } from './ui.js';

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
    let rawDmg = atk.atq;
    let hpDamage = 0;
    let defDamage = 0;
    let piercing = 0;
    let ultimateUsed = false;

    const ult = getUltimateForCard(atk);
    if (atk.fervor >= MAX_FERVOR && ult) {
        ultimateUsed = true;
        atk.fervor = 0;
        atk.ultimateCooldown = ult.cooldown || 3;

        if (ult.multiplier) {
            rawDmg = Math.floor(atk.atq * ult.multiplier);
            logConsole(`🔥 ${atk.name} [${ult.name}]: ¡Daño potenciado a ${rawDmg}!`, 'passive');
        }
        if (ult.piercing) {
            piercing = rawDmg;
            rawDmg = 0;
            hpDamage += piercing;
        }
        if (ult.healPct) {
            const heal = Math.floor(atk.maxHp * ult.healPct);
            atk.hp = Math.min(atk.maxHp, atk.hp + heal);
            logConsole(`💚 ${atk.name} [${ult.name}]: Recupera ${heal} HP.`, 'passive');
        }
        if (ult.stealPct) {
            const stolenAtq = Math.floor(def.atq * ult.stealPct);
            const stolenDef = Math.floor(def.def * ult.stealPct);
            atk.atq += stolenAtq;
            def.atq = Math.max(1, def.atq - stolenAtq);
            def.def = Math.max(0, def.def - stolenDef);
            logConsole(`👻 ${atk.name} [${ult.name}]: Roba ${stolenAtq} ATQ y ${stolenDef} DEF.`, 'passive');
        }
        if (ult.shieldPct) {
            const shield = Math.floor(atk.maxHp * ult.shieldPct);
            atk.def += shield;
            logConsole(`🛡️ ${atk.name} [${ult.name}]: +${shield} escudo.`, 'passive');
        }
        if (ult.poisonTurns) {
            def._poisonApplied = ult.poisonTurns;
            logConsole(`☠️ ${def.name} [${ult.name}]: Envenenado por ${ult.poisonTurns} turnos.`, 'passive');
        }
    }

    if (!ultimateUsed) {
        if (atk.passiveId === 'anti_armor' && def.def > 0) {
            rawDmg = Math.floor(rawDmg * 1.5);
            logConsole(`🎯 ${atk.name} [Anti-Armor]: Daño sube a ${rawDmg}!`, 'passive');
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
        logConsole(`🐉 ${atk.name} [Dragon Slayer]: Ignora 50% DEF de ${def.name}!`, 'passive');
    }

    if (def.passiveId === 'nem_element_ward' && atk.element === 'Rayo') {
        let reduced = Math.floor(rawDmg * 0.5);
        rawDmg -= reduced;
        logConsole(`⚡ ${def.name} [Lightning Rod]: Reduce ${reduced} ATK de ${atk.name}!`, 'passive');
    }

    if (def.passiveId === 'fen_revive' && def._revived === undefined) {
        let incomingHpDmg = 0;
        if (effectiveDef > 0) {
            let splitDmg = Math.floor(rawDmg / 2);
            let actualDefDmg = Math.min(effectiveDef, splitDmg);
            let excessDefDmg = splitDmg - actualDefDmg;
            incomingHpDmg = splitDmg + excessDefDmg;
            defDamage += actualDefDmg;
        } else {
            incomingHpDmg = rawDmg;
        }
        incomingHpDmg += hpDamage;
        if ((def.hp - incomingHpDmg) <= 0) {
            def._revived = true;
            def.hp = Math.floor((def.maxHp || def.hp) * 0.3);
            logConsole(`✨ ${def.name} [Graceful Strike]: Absorbe el golpe letal y renace con ${def.hp} HP!`, 'passive');
            return { hpDamage: 0, defDamage: 0, piercing: 0, reviveCounter: true, blocked: false, ultimateUsed };
        }
    }

    if (def.passiveId === 'gen_block_heal' && def._blockUsed === undefined) {
        def._blockUsed = true;
        let healAmt = Math.floor(rawDmg * 0.5);
        def.hp = Math.min(def.maxHp || def.hp, def.hp + healAmt);
        logConsole(`🛡️ ${def.name} [Sacred Veil]: Bloquea el ataque y recupera ${healAmt} HP!`, 'passive');
        return { hpDamage: 0, defDamage: 0, piercing: 0, blocked: true, reviveCounter: false, ultimateUsed };
    }

    if (def.passiveId === 'orc_warlord' && def._blockUsed === undefined) {
        def._blockUsed = true;
        let healAmt = Math.floor(rawDmg * 0.5);
        def.hp = Math.min(def.maxHp, def.hp + healAmt);
        logConsole(`🛡️ ${def.name} [Warlord's Bulwark]: Bloquea el ataque y recupera ${healAmt} HP!`, 'passive');
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

    const totalDmg = dmg.hpDamage + dmg.defDamage;

    if (receiver.passiveId === 'gen_reflect_full' && receiver._reflected === undefined) {
        receiver._reflected = true;
        let reflectedDmg = Math.floor(totalDmg);
        attacker.hp -= reflectedDmg;
        logConsole(`🪞 ${receiver.name} [Broken Mirror]: Refleja ${reflectedDmg} a ${attacker.name}!`, 'passive');
    }

    if (receiver.passiveId === 'abs_reflect') {
        let reflected = Math.floor(totalDmg * 0.2);
        if (reflected > 0) {
            attacker.hp -= reflected;
            logConsole(`🌵 ${receiver.name} [Thorn Armor]: Refleja ${reflected} a ${attacker.name}!`, 'passive');
        }
    }

    if (receiver.passiveId === 'abs_def_convert') {
        let converted = Math.floor(totalDmg * 0.5);
        if (converted > 0) {
            receiver.def += converted;
            logConsole(`🛡️ ${receiver.name} [Iron Skin]: Convierte ${converted} en DEF!`, 'passive');
        }
    }

    if (receiver.passiveId === 'abs_hp_convert') {
        let healed = Math.floor(totalDmg * 0.3);
        if (healed > 0) {
            receiver.hp = Math.min(receiver.maxHp || receiver.hp + healed * 2, receiver.hp + healed);
            logConsole(`🧛 ${receiver.name} [Leech]: Absorbe ${healed} HP del impacto!`, 'passive');
        }
    }
}

// =============================================
// ⚔️ PROCESAR ATAQUE (unificado, muta el defensor)
// =============================================
export function procesarAtaque(atk, def, atkLabel, defLabel, skipPassives) {
    if (!atk || !def || atk.hp <= 0 || def.hp <= 0) return { defDamage: 0, hpDamage: 0, ultimateUsed: false };

    const aName = atkLabel || atk.name;
    const dName = defLabel || def.name;
    logConsole(`⚔️ ${aName} ataca a ${dName}!`, 'attack');

    if (!skipPassives) {
        applyRoundStartPassives(atk, def);
    }

    const dmg = calcularDetalleDaño(atk, def);

    const blocked = dmg.blocked || false;
    const revived = dmg.reviveCounter || false;

    if (!blocked && !revived) {
        if (dmg.piercing > 0) logConsole(`💉 ${aName} [Armor Piercing]: ${dmg.piercing} directo al HP!`, 'passive');
        def.def = Math.max(0, def.def - dmg.defDamage);
        def.hp -= dmg.hpDamage;
        if (dmg.hpDamage > 0 || dmg.defDamage > 0) {
            def._wasHit = true;
            logConsole(`💥 ${dName}: -${dmg.hpDamage} HP / -${dmg.defDamage} DEF.`, 'damage');
        }
    }

    processPostDamagePassives(def, atk, dmg);

    if (atk.fervor < MAX_FERVOR) {
        atk.fervor = Math.min(MAX_FERVOR, atk.fervor + FERVOR_PER_ATTACK);
    }

    if (dmg.ultimateUsed) {
        logConsole(`🔥¡${aName} desata ${ULTIMATE_DB[atk.ultimateId]?.name || 'ULTIMATE'}!`, 'victory');
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
        logConsole(`🔥 ${fighter.name}: ¡FERVOR AL MÁXIMO!`, 'victory');
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
    c._revived = undefined;
    c._blockUsed = undefined;
    c._reflected = undefined;
    c._stolen = undefined;
    c._wasHit = false;
    c._poisonApplied = 0;
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

    entries.sort((a, b) => b.vel - a.vel || (a.isAlly ? -1 : 1));
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

    gainFervor(actor, FERVOR_PER_TURN);

    if (actor._wasHit) {
        gainFervor(actor, FERVOR_PER_HIT);
        actor._wasHit = false;
    }

    if (actor._poisonApplied > 0) {
        const poisonDmg = Math.floor(actor.maxHp * 0.05);
        actor.hp -= poisonDmg;
        logConsole(`☠️ ${actor.name} sufre ${poisonDmg} de daño por veneno.`, 'passive');
        actor._poisonApplied--;
    }

    const target = findTarget(turnEntry, allEntries);
    if (!target) return { acted: false, targetKilled: false, ultimateUsed: false, actor };

    const actLabel = turnEntry.isAlly ? `[${actor.name}]` : `[Enemy] ${actor.name}`;
    const defLabel = target.isAlly ? `[${target.actor.name}]` : `[Enemy] ${target.actor.name}`;

    const result = procesarAtaque(actor, target.actor, actLabel, defLabel);

    if (target.actor && target.actor.hp <= 0) {
        logConsole(`💀 ${target.actor.name} ha caído!`, 'victory');
        return { acted: true, targetKilled: true, ultimateUsed: result.ultimateUsed, actor, target: target.actor, hpDamage: result.hpDamage, defDamage: result.defDamage };
    }

    return { acted: true, targetKilled: false, ultimateUsed: result.ultimateUsed, actor, target: target.actor, hpDamage: result.hpDamage, defDamage: result.defDamage };
}

function findTarget(turnEntry, allEntries) {
    const actor = turnEntry.actor;
    const enemies = allEntries.filter(e =>
        e.actor && e.actor.hp > 0 && e.isAlly !== turnEntry.isAlly
    );
    if (enemies.length === 0) return null;

    const bossUltraAggro = actor.passiveId === 'orc_warlord';
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
        if (c1.hp === c2.hp) {
            logConsole("⚖️ ¡EMPATE ABSOLUTO!", "victory");
        } else {
            const winner = c1.hp > c2.hp ? c1 : c2;
            logConsole(`🏆 ${winner.name} VICTORIOSO (${Math.floor(winner.hp)} HP)!`, "victory");
        }
        setColiseumButtonMode('finish');
        return true;
    }
    return false;
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
            if (f._blockUsed === undefined) {
                logConsole(`🛡️ ${f.name} [Sacred Veil]: Preparado para bloquear.`, 'passive');
            }
            break;

        case 'gen_reflect_full':
            if (f._reflected === undefined) {
                logConsole(`🪞 ${f.name} [Broken Mirror]: Escudo reflectante activo.`, 'passive');
            }
            break;

        case 'gen_steal_stats':
            if (f._stolen === undefined) {
                f._stolen = true;
                let stolenAtq = Math.floor(r.atq * 0.4);
                let stolenDef = Math.floor(r.def * 0.4);
                f.atq += stolenAtq;
                r.atq = Math.max(1, r.atq - stolenAtq);
                r.def = Math.max(0, r.def - stolenDef);
                logConsole(`👻 ${f.name} [Soul Thief]: Roba ${stolenAtq} ATQ y ${stolenDef} DEF de ${r.name}!`, 'passive');
            }
            break;

        case 'nem_xenophobia':
            if (r.cardClass !== 'Human') {
                let atkBoost = Math.floor(f.atq * 1.0);
                let defBoost = Math.floor(f.def * 1.0);
                f.atq += atkBoost;
                f.def += defBoost;
                logConsole(`👁️ ${f.name} [Xenophobia]: +${atkBoost} ATQ y +${defBoost} DEF contra no-humano!`, 'passive');
            }
            break;

        case 'nem_dragon_slayer':
            logConsole(`🐉 ${f.name} [Dragon Slayer]: Preparado para dragones.`, 'passive');
            break;

        case 'nem_element_ward':
            logConsole(`⚡ ${f.name} [Lightning Rod]: Protección elemental activa.`, 'passive');
            break;

        case 'prog_scale_stats':
            f.atq = Math.floor(f.atq * 1.1);
            f.def = Math.floor(f.def * 1.1);
            logConsole(`📈 ${f.name} [Growth]: Stats +10%.`, 'passive');
            break;

        case 'prog_venom':
            let venomDmg = Math.floor((f.maxHp || f.hp || 1) * 0.05);
            r.hp = Math.max(0, r.hp - venomDmg);
            logConsole(`☠️ ${f.name} [Venom]: ${r.name} pierde ${venomDmg} HP.`, 'passive');
            if (r.hp <= 0) return true;
            break;

        case 'prog_drain_def':
            let drain = Math.floor(r.def * 0.15);
            r.def = Math.max(0, r.def - drain);
            logConsole(`⚙️ ${f.name} [Rust]: Corroe ${drain} DEF de ${r.name}.`, 'passive');
            break;

        case 'double_strike':
            logConsole(`⚡ ${f.name} [Double Strike]: Ataque extra!`, 'passive');
            procesarAtaque(f, r, f.name + ' [Extra]', r.name, true);
            if (r.hp <= 0) return true;
            break;

        case 'life_leech': {
            const { hpDamage } = procesarAtaque(f, r, f.name + ' [Leech]', r.name, true);
            let steal = Math.floor(hpDamage * 0.5);
            f.hp = Math.min(f.maxHp || f.hp * 2, f.hp + steal);
            logConsole(`🧛 ${f.name} [Leech]: Drena ${steal} HP.`, 'passive');
            if (r.hp <= 0) return true;
            break;
        }

        case 'shield_recharge':
            let regen = Math.floor((f.maxHp || f.hp || 1) * 0.1);
            f.def += regen;
            logConsole(`🛡️ ${f.name} [Recharge]: Regenera ${regen} de Escudo.`, 'passive');
            break;

        case 'fen_revive':
            logConsole(`✨ ${f.name} [Graceful Strike]: Esencia vital protegida.`, 'passive');
            break;

        case 'fen_berserker':
            if (f.hp <= Math.floor((f.maxHp || f.hp || 1) * 0.3)) {
                f.atq = Math.floor(f.atq * 3);
                logConsole(`🔥 ${f.name} [Berserker]: ATK x3!`, 'passive');
            }
            break;

        case 'fen_last_stand':
            if (f.hp <= Math.floor((f.maxHp || f.hp || 1) * 0.2)) {
                f.def = Math.floor(f.def * 4);
                logConsole(`🏛️ ${f.name} [Last Stand]: DEF x4!`, 'passive');
            }
            break;

        case 'orc_warlord':
            if (f.hp > 0 && f.hp < f.maxHp) {
                let regen = Math.floor(f.maxHp * 0.02);
                f.hp = Math.min(f.maxHp, f.hp + regen);
                logConsole(`🩸 ${f.name} [Warlord's Vitality]: Regenera ${regen} HP!`, 'passive');
            }
            if (f.hp <= Math.floor((f.maxHp || f.hp || 1) * 0.3)) {
                f.atq = Math.floor(f.atq * 3);
                logConsole(`🔥 ${f.name} [Berserker Fury]: ATK x3!`, 'passive');
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
    if (!card.id || !card.name || !card.hp) {
        console.error("Intento de guardar carta corrupta abortado.");
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

export function syncStorage() {
    try {
        localStorage.setItem('easyHitLibrary', JSON.stringify(cards));
    } catch (e) {
        console.error("Vanguard Critico: El almacenamiento está lleno.");
    }
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
