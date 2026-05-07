import { logConsole } from './ui.js';

/**
 * Procesa un ataque individual entre dos combatientes.
 * Incluye lógica de daño mínimo para evitar bloqueos infinitos.
 */
export function procesarAtaque(atk, def) {
    let rawDmg = atk.atq;
    
    // --- LÓGICA DE DAÑO MÍNIMO ---
    // Si el ataque es muy bajo frente a la defensa, garantizamos al menos 
    // un pequeño impacto basado en el 5% del ATQ (mínimo 10 si el ATQ existe)
    let minDmg = Math.max(10, Math.floor(rawDmg * 0.05));
    
    let currentDmg = rawDmg;
    let defDamage = 0;
    let hpDamage = 0;

    // Log de inicio de ataque
    logConsole(`⚔️ ${atk.name} ataca a ${def.name}...`, 'system');

    // 1. El daño impacta primero en la DEF
    if (def.def > 0) {
        defDamage = Math.min(def.def, currentDmg);
        def.def -= defDamage;
        currentDmg -= defDamage;
        logConsole(`🛡️ DEF de ${def.name} absorbe ${defDamage}.`, 'damage');
    }
    
    // 2. El daño sobrante (o el mínimo) impacta en HP
    if (currentDmg > 0) {
        hpDamage = currentDmg;
    } else {
        // Si la defensa absorbió todo, aplicamos el daño mínimo "de desgaste"
        hpDamage = minDmg;
        logConsole(`🦾 Daño de desgaste: ${hpDamage} HP.`, 'damage');
    }

    def.hp -= hpDamage;
    logConsole(`💥 ${def.name} recibe ${hpDamage} de daño directo.`, 'damage');

    return { defDamage, hpDamage };
}

/**
 * Verifica si alguien ha caído y declara al ganador.
 * Soporta Victoria Negativa (quien queda menos negativo gana).
 */
export function verifyVictory(c1, c2) {
    // Solo comprobamos victoria si alguien ha llegado a 0 o menos
    if (c1.hp <= 0 || c2.hp <= 0) {
        
        if (c1.hp <= 0 && c2.hp <= 0) {
            // Empate técnico: Ambos cayeron en la misma ronda
            if (c1.hp > c2.hp) {
                logConsole(`🏆 ${c1.name} GANA por Victoria Negativa!`, 'victory');
            } else if (c2.hp > c1.hp) {
                logConsole(`🏆 ${c2.name} GANA por Victoria Negativa!`, 'victory');
            } else {
                logConsole("⚖️ ¡EMPATE ABSOLUTO!", "victory");
            }
            return true;
        }

        if (c1.hp <= 0) {
            logConsole(`🏆 ${c2.name} VICTORIOSO!`, "victory");
            return true;
        }

        if (c2.hp <= 0) {
            logConsole(`🏆 ${c1.name} VICTORIOSO!`, "victory");
            return true;
        }
    }
    return false;
}

/**
 * Gestiona los efectos que ocurren al inicio de cada ronda.
 */
export function applyRoundStartPassives(f, r) {
    if (!f.passiveId) return;

    if (f.passiveId === 'prog_scale_stats') {
        f.atq = Math.floor(f.atq * 1.1);
        f.def = Math.floor(f.def * 1.1);
        logConsole(`📈 ${f.name} [Growth]: Stats +10%.`, 'system');
    }
    
    if (f.passiveId === 'prog_venom') {
        // Drenaje basado en la vida máxima (asumiendo que guardamos maxHp al crear la carta)
        let p = Math.floor((f.maxHp || f.hp) * 0.05);
        r.hp -= p;
        logConsole(`☠️ ${f.name} [Venom]: ${r.name} pierde ${p} HP por toxinas.`, 'system');
    }
    
    if (f.passiveId === 'prog_drain_def') {
        let d = Math.floor(r.def * 0.1);
        r.def -= d;
        if(r.def < 0) r.def = 0;
        logConsole(`⚙️ ${f.name} [Metal Fatigue]: Armadura de ${r.name} se corroe (-${d} DEF).`, 'system');
    }
}