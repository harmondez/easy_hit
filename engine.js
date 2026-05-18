import { logConsole, setColiseumButtonMode } from './ui.js';

/**
 * Calcula el daño detallado de un ataque individual.
 * Reparto equitativo DEF/HP sin duplicación de exceso.
 */
function calcularDetalleDaño(atk, def) {
    let rawDmg = atk.atq;
    let hpDamage = 0;
    let defDamage = 0;
    let piercing = 0;

    // Pasiva: Anti-Armor
    if (atk.passiveId === 'anti_armor' && def.def > 0) {
        rawDmg = Math.floor(rawDmg * 1.5);
        logConsole(`🎯 ${atk.name} [Anti-Armor]: ¡Detecta armadura y el daño sube a ${rawDmg}!`, 'passive');
    }

    // Pasiva: Armor Piercing
    if (atk.passiveId === 'armor_piercing' && def.def > 0) {
        piercing = Math.floor(rawDmg * 0.3);
        rawDmg -= piercing;
        hpDamage += piercing;
    }

    // Pasiva: Dragon Slayer — ignora 50% DEF contra Dragones
    let effectiveDef = def.def;
    if (atk.passiveId === 'nem_dragon_slayer' && def.cardClass === 'Dragon') {
        effectiveDef = Math.floor(effectiveDef * 0.5);
        logConsole(`🐉 ${atk.name} [Dragon Slayer]: Ignora 50% de la DEF de ${def.name}!`, 'passive');
    }

    // Pasiva: Element Ward — reduce ATQ si rival es Rayo
    if (def.passiveId === 'nem_element_ward' && atk.element === 'Rayo') {
        let reduced = Math.floor(rawDmg * 0.5);
        rawDmg -= reduced;
        hpDamage += reduced;
        logConsole(`⚡ ${def.name} [Lightning Rod]: Reduce ${reduced} ATK de ${atk.name}!`, 'passive');
    }

    // Pasiva: Graceful Strike (fen_revive) — si el portador recibe golpe letal sobrevive
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
            logConsole(`✨ ${def.name} [Graceful Strike]: ¡Absorbe el golpe letal y renace con ${def.hp} HP!`, 'passive');
            return { hpDamage: 0, defDamage: 0, piercing: 0, reviveCounter: true };
        }
    }

    // Pasiva: Sacred Veil (gen_block_heal) — bloquea 1er ataque y lo convierte en HP
    if (def.passiveId === 'gen_block_heal' && def._blockUsed === undefined) {
        def._blockUsed = true;
        let healAmt = Math.floor(rawDmg * 0.5);
        def.hp = Math.min(def.maxHp || def.hp * 2, def.hp + healAmt);
        logConsole(`🛡️ ${def.name} [Sacred Veil]: ¡Bloquea el ataque y recupera ${healAmt} HP!`, 'passive');
        return { hpDamage: 0, defDamage: 0, piercing: 0, blocked: true };
    }

    // Pasiva: Orc Warlord (orc_warlord) — bloquea 1er golpe + cura
    if (def.passiveId === 'orc_warlord' && def._blockUsed === undefined) {
        def._blockUsed = true;
        let healAmt = Math.floor(rawDmg * 0.5);
        def.hp = Math.min(def.maxHp, def.hp + healAmt);
        logConsole(`🛡️ ${def.name} [Warlord's Bulwark]: ¡Bloquea el ataque y recupera ${healAmt} HP!`, 'passive');
        return { hpDamage: 0, defDamage: 0, piercing: 0, blocked: true };
    }

    // Reparto de daño (Equitativo)
    if (effectiveDef > 0) {
        let splitDmg = Math.floor(rawDmg / 2);
        let actualDefDmg = Math.min(effectiveDef, splitDmg);
        defDamage += actualDefDmg;
        hpDamage += (rawDmg - actualDefDmg);
    } else {
        hpDamage += rawDmg;
    }

    // Desgaste mínimo garantizado
    if (hpDamage < 10 && piercing === 0) {
        hpDamage = 10;
    }

    return { hpDamage, defDamage, piercing };
}

/**
 * Procesa una ronda de combate SIMULTÁNEA con todas las fases.
 */
export function procesarRondaSimultanea(f1, f2) {
    if (f1.hp <= 0 || f2.hp <= 0) return;

    logConsole(`⚔️ ¡${f1.name} y ${f2.name} se abalanzan a la vez en un choque brutal!`, 'attack');

    // Fase 1: Calcular daño detallado (sin mutación aún)
    let dmgToF2 = calcularDetalleDaño(f1, f2);
    let dmgToF1 = calcularDetalleDaño(f2, f1);

    // Verificar si algún revive canceló el daño
    let f1Revived = dmgToF1.reviveCounter || false;
    let f2Revived = dmgToF2.reviveCounter || false;
    if (f1Revived) dmgToF1 = { hpDamage: 0, defDamage: 0, piercing: 0 };
    if (f2Revived) dmgToF2 = { hpDamage: 0, defDamage: 0, piercing: 0 };

    let f1Blocked = dmgToF1.blocked || false;
    let f2Blocked = dmgToF2.blocked || false;
    if (f1Blocked) dmgToF1 = { hpDamage: 0, defDamage: 0, piercing: 0 };
    if (f2Blocked) dmgToF2 = { hpDamage: 0, defDamage: 0, piercing: 0 };

    // 2. Logs de Acción
    if (dmgToF2.piercing > 0) logConsole(`💉 ${f1.name} [Armor Piercing]: ${dmgToF2.piercing} directo al HP!`, 'passive');
    if (!f2Blocked && !f2Revived) logConsole(`💥 ${f1.name} inflige -${dmgToF2.hpDamage} HP y destroza -${dmgToF2.defDamage} DEF.`, 'damage');

    if (dmgToF1.piercing > 0) logConsole(`💉 ${f2.name} [Armor Piercing]: ${dmgToF1.piercing} directo al HP!`, 'passive');
    if (!f1Blocked && !f1Revived) logConsole(`💥 ${f2.name} inflige -${dmgToF1.hpDamage} HP y destroza -${dmgToF1.defDamage} DEF.`, 'damage');

    // 3. Aplicar daño simultáneamente
    f2.def = Math.max(0, f2.def - dmgToF2.defDamage);
    f2.hp -= dmgToF2.hpDamage;

    f1.def = Math.max(0, f1.def - dmgToF1.defDamage);
    f1.hp -= dmgToF1.hpDamage;

    // 4. Procesar pasivas post-daño (reflejo, absorción)
    processPostDamagePassives(f1, f2, dmgToF1);
    processPostDamagePassives(f2, f1, dmgToF2);

    logConsole(`📊 RESULTADO: ${f1.name} (${Math.floor(f1.hp)} HP) vs ${f2.name} (${Math.floor(f2.hp)} HP)`, 'system');
}

/**
 * Procesa pasivas que reaccionan al daño recibido (post-damage).
 */
function processPostDamagePassives(receiver, attacker, dmg) {
    if (!receiver || !attacker || receiver.hp <= 0) return;
    if (dmg.hpDamage <= 0 && dmg.defDamage <= 0) return;

    const totalDmg = dmg.hpDamage + dmg.defDamage;

    // Broken Mirror (gen_reflect_full): Refleja 100% del daño recibido (1 vez)
    if (receiver.passiveId === 'gen_reflect_full' && receiver._reflected === undefined) {
        receiver._reflected = true;
        let reflectedDmg = Math.floor(totalDmg);
        attacker.hp -= reflectedDmg;
        logConsole(`🪞 ${receiver.name} [Broken Mirror]: ¡Refleja ${reflectedDmg} de daño a ${attacker.name}!`, 'passive');
    }

    // Thorn Armor (abs_reflect): Refleja 20% del daño recibido
    if (receiver.passiveId === 'abs_reflect') {
        let reflected = Math.floor(totalDmg * 0.2);
        if (reflected > 0) {
            attacker.hp -= reflected;
            logConsole(`🌵 ${receiver.name} [Thorn Armor]: Refleja ${reflected} de daño a ${attacker.name}!`, 'passive');
        }
    }

    // Iron Skin (abs_def_convert): Convierte 50% del daño en DEF
    if (receiver.passiveId === 'abs_def_convert') {
        let converted = Math.floor(totalDmg * 0.5);
        if (converted > 0) {
            receiver.def += converted;
            logConsole(`🛡️ ${receiver.name} [Iron Skin]: Convierte ${converted} de daño en DEF!`, 'passive');
        }
    }

    // Leech (abs_hp_convert): Absorbe 30% del daño como curación
    if (receiver.passiveId === 'abs_hp_convert') {
        let healed = Math.floor(totalDmg * 0.3);
        if (healed > 0) {
            receiver.hp = Math.min(receiver.maxHp || receiver.hp + healed * 2, receiver.hp + healed);
            logConsole(`🧛 ${receiver.name} [Leech]: Absorbe ${healed} HP del impacto!`, 'passive');
        }
    }
}

/**
 * Aplica un ataque individual (usado por pasivas como Double Strike y Leech).
 */
function findFirstAliveIndex(arr, start = 0) {
    for (let i = start; i < arr.length; i++) {
        if (arr[i] && arr[i].hp > 0) return i;
    }
    return -1;
}

export function procesarAtaque(atk, def, atkLabel, defLabel) {
    if (!atk || !def || atk.hp <= 0 || def.hp <= 0) return { defDamage: 0, hpDamage: 0 };

    let rawDmg = atk.atq;
    let hpDamage = 0;
    let defDamage = 0;

    const aName = atkLabel || atk.name;
    const dName = defLabel || def.name;
    logConsole(`⚔️ ${aName} strikes ${dName}!`, 'attack');

    if (atk.passiveId === 'anti_armor' && def.def > 0) {
        rawDmg = Math.floor(rawDmg * 1.5);
        logConsole(`🎯 ${aName} [Anti-Armor]: Daño sube a ${rawDmg}!`, 'passive');
    }

    if (atk.passiveId === 'armor_piercing' && def.def > 0) {
        let piercingDmg = Math.floor(rawDmg * 0.3);
        let remainingDmg = rawDmg - piercingDmg;
        def.hp = Math.max(0, def.hp - piercingDmg);
        hpDamage += piercingDmg;
        logConsole(`💉 ${aName} [Armor Piercing]: ${piercingDmg} directo al HP!`, 'passive');
        rawDmg = remainingDmg;
    }

    if (def.def > 0) {
        let splitDmg = Math.floor(rawDmg / 2);
        let actualDefDmg = Math.min(def.def, splitDmg);
        def.def -= actualDefDmg;
        defDamage += actualDefDmg;
        hpDamage += (rawDmg - actualDefDmg);
        def.hp = Math.max(0, def.hp - (rawDmg - actualDefDmg));
        logConsole(`🛡️ ${dName} recibe: ${actualDefDmg} DEF / ${rawDmg - actualDefDmg} HP.`, 'damage');
    } else {
        def.hp = Math.max(0, def.hp - rawDmg);
        hpDamage += rawDmg;
    }

    if (hpDamage < 10) {
        def.hp = Math.max(0, def.hp - 10);
        hpDamage += 10;
    }

    logConsole(`💥 ${dName} recibe ${hpDamage} HP de daño total.`, 'damage');
    return { defDamage, hpDamage };
}

/**
 * Verifica victoria y activa el estado de cierre en UI.
 */
export function verifyVictory(c1, c2) {
    if (c1.hp <= 0 || c2.hp <= 0) {
        if (c1.hp === c2.hp) {
            logConsole("⚖️ ¡EMPATE ABSOLUTO! Impacto idéntico en el vacío.", "victory");
        } else {
            const winner = c1.hp > c2.hp ? c1 : c2;
            logConsole(`🏆 ${winner.name} VICTORIOSO (Victoria Negativa: ${Math.floor(winner.hp)} HP)!`, "victory");
        }
        setColiseumButtonMode('finish');
        return true;
    }
    return false;
}

/**
 * Gestiona todas las pasivas de inicio de ronda.
 * Incluye Genesis, Nemesis, Progression, Absorption y Phoenix families.
 */
export function applyRoundStartPassives(f, r) {
    if (!f || !r || !f.passiveId || f.hp <= 0) return false;

    switch (f.passiveId) {
        // === GENESIS FAMILY (1 vez, primera ronda) ===
        case 'gen_block_heal':
            if (f._blockUsed === undefined) {
                logConsole(`🛡️ ${f.name} [Sacred Veil]: Se prepara para bloquear el primer golpe.`, 'passive');
            }
            break;

        case 'gen_reflect_full':
            if (f._reflected === undefined) {
                logConsole(`🪞 ${f.name} [Broken Mirror]: Su escudo reflectante está activo.`, 'passive');
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

        // === NEMESIS FAMILY (Condicional por matchup) ===
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
            logConsole(`🐉 ${f.name} [Dragon Slayer]: Preparado para perforar dragones.`, 'passive');
            break;

        case 'nem_element_ward':
            logConsole(`⚡ ${f.name} [Lightning Rod]: Protección elemental activa.`, 'passive');
            break;

        // === PROGRESSION FAMILY (Escalado por ronda) ===
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

        // === REACTIVE (Ataque extra / utilidad) ===
        case 'double_strike':
            logConsole(`⚡ ${f.name} [Double Strike]: ¡Ataque extra rápido!`, 'passive');
            procesarAtaque(f, r);
            if (r.hp <= 0) return true;
            break;

        case 'life_leech':
            const { hpDamage } = procesarAtaque(f, r);
            let steal = Math.floor(hpDamage * 0.5);
            f.hp = Math.min(f.maxHp || f.hp * 2, f.hp + steal);
            logConsole(`🧛 ${f.name} [Leech]: Drena vida y recupera ${steal} HP.`, 'passive');
            if (r.hp <= 0) return true;
            break;

        case 'shield_recharge':
            let regen = Math.floor((f.maxHp || f.hp || 1) * 0.1);
            f.def += regen;
            logConsole(`🛡️ ${f.name} [Recharge]: Regenera ${regen} de Escudo.`, 'passive');
            break;

        // === PHOENIX FAMILY (Umbrales de vida) ===
        case 'fen_revive':
            logConsole(`✨ ${f.name} [Graceful Strike]: Su esencia vital está protegida.`, 'passive');
            break;

        case 'fen_berserker':
            if (f.hp <= Math.floor((f.maxHp || f.hp || 1) * 0.3)) {
                f.atq = Math.floor(f.atq * 3);
                logConsole(`🔥 ${f.name} [Berserker]: ¡Furia desatada! ATK x3!`, 'passive');
            }
            break;

        case 'fen_last_stand':
            if (f.hp <= Math.floor((f.maxHp || f.hp || 1) * 0.2)) {
                f.def = Math.floor(f.def * 4);
                logConsole(`🏛️ ${f.name} [Last Stand]: ¡Resistencia absoluta! DEF x4!`, 'passive');
            }
            break;

        // === ORC WARLORD (pasiva dual: Berserker Fury + regeneración) ===
        case 'orc_warlord':
            // Regeneración pasiva cada turno
            if (f.hp > 0 && f.hp < f.maxHp) {
                let regen = Math.floor(f.maxHp * 0.02);
                f.hp = Math.min(f.maxHp, f.hp + regen);
                logConsole(`🩸 ${f.name} [Warlord's Vitality]: Regenera ${regen} HP!`, 'passive');
            }
            if (f.hp <= Math.floor((f.maxHp || f.hp || 1) * 0.3)) {
                f.atq = Math.floor(f.atq * 3);
                logConsole(`🔥 ${f.name} [Berserker Fury]: ¡ATK x3 al borde de la muerte!`, 'passive');
            }
            break;
    }
    return false;
}

// --- GESTIÓN DE BIBLIOTECA ---
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

export function saveCard(card) {
    if (!card.id || !card.name || !card.hp) {
        console.error("Intento de guardar carta corrupta abortado.");
        return false;
    }

    // Validación del límite de 7400 puntos (Regla de Oro)
    const totalStats = (card.hp || 0) + (card.atq || 0) + (card.def || 0);
    if (totalStats > 7400) {
        console.error(`Carta '${card.name}' excede el límite de 7400 puntos (${totalStats}).`);
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
// 👾 ENEMY ROSTER (Zona 1 — 5v5)
// =============================================
const ENEMY_ROSTER = {
    orc_boss: {
        id: 'orc_boss',
        name: 'Orc Warlord',
        element: 'Earth',
        cardClass: 'Orc',
        hp: 40000,
        def: 5000,
        atq: 3500,
        maxHp: 40000,
        passiveId: 'orc_warlord',
        image: 'https://via.placeholder.com/300x200?text=Orc+Warlord+BOSS'
    }
};

const ENEMY_SQUAD_ROSTER = {
    goblin_shieldbearer: {
        id: 'goblin_shield', name: 'Goblin Shieldbearer', element: 'Neutral',
        cardClass: 'Goblin', hp: 3500, def: 2500, atq: 1400, maxHp: 3500,
        passiveId: '', image: 'https://via.placeholder.com/120x80?text=Shield'
    },
    goblin_piker: {
        id: 'goblin_piker', name: 'Goblin Piker', element: 'Neutral',
        cardClass: 'Goblin', hp: 2800, def: 1500, atq: 2100, maxHp: 2800,
        passiveId: '', image: 'https://via.placeholder.com/120x80?text=Piker'
    },
    goblin_sapper: {
        id: 'goblin_sapper', name: 'Goblin Sapper', element: 'Darkness',
        cardClass: 'Goblin', hp: 2500, def: 1200, atq: 2200, maxHp: 2500,
        passiveId: 'prog_venom', image: 'https://via.placeholder.com/120x80?text=Sapper'
    },
    goblin_scout: {
        id: 'goblin_scout', name: 'Goblin Scout', element: 'Wind',
        cardClass: 'Goblin', hp: 2200, def: 1000, atq: 2700, maxHp: 2200,
        passiveId: '', image: 'https://via.placeholder.com/120x80?text=Scout'
    },
    goblin_shaman: {
        id: 'goblin_shaman', name: 'Goblin Shaman', element: 'Nature',
        cardClass: 'Goblin', hp: 2000, def: 1500, atq: 1800, maxHp: 2000,
        passiveId: 'shield_recharge', image: 'https://via.placeholder.com/120x80?text=Shaman'
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

export function executePartyTurn(party, squad) {
    if (!party || !squad) return { enemyDead: false, partyWiped: false };

    // === ALIED PHASE: each alive ally targets first alive enemy ===
    for (let i = 0; i < party.length; i++) {
        const ally = party[i];
        if (!ally || ally.hp <= 0) continue;
        const eIdx = findFirstAliveIndex(squad);
        if (eIdx === -1) break;
        const enemy = squad[eIdx];
        applyRoundStartPassives(ally, enemy);
        if (enemy.hp <= 0) continue;
        procesarAtaque(ally, enemy, `[Ally ${i+1}] ${ally.name}`, `[Enemy ${eIdx+1}] ${enemy.name}`);
    }

    // === ENEMY PHASE: each alive enemy targets first alive ally ===
    for (let i = 0; i < squad.length; i++) {
        const enemy = squad[i];
        if (!enemy || enemy.hp <= 0) continue;
        const aIdx = findFirstAliveIndex(party);
        if (aIdx === -1) break;
        const ally = party[aIdx];
        applyRoundStartPassives(enemy, ally);
        if (ally.hp <= 0) continue;
        procesarAtaque(enemy, ally, `[Enemy ${i+1}] ${enemy.name}`, `[Ally ${aIdx+1}] ${ally.name}`);
    }

    return {
        enemyDead: squad.every(e => !e || e.hp <= 0),
        partyWiped: party.every(a => !a || a.hp <= 0)
    };
}

export function verifyPartyVictory(party, squad) {
    return {
        victory: squad && squad.length > 0 && squad.every(e => !e || e.hp <= 0),
        defeat: party && party.length > 0 && party.every(a => !a || a.hp <= 0)
    };
}
