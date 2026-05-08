import { logConsole, setColiseumButtonMode } from './ui.js';

/**
 * Procesa un ataque individual entre dos combatientes.
 * Optimización: Blindaje total contra valores negativos y nulos.
 */



/**
 * Procesa una ronda de combate SIMULTÁNEA.
 * Implementa la mecánica de "Overkill" de Easy Hit (+200% en negativo).
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
        rawDmg -= piercing; // El resto del daño se procesa normal
        hpDamage += piercing;
    }

    // Reparto de daño (Equitativo si hay armadura)
    if (def.def > 0) {
        let splitDmg = Math.floor(rawDmg / 2);
        
        let actualDefDmg = Math.min(def.def, splitDmg);
        defDamage += actualDefDmg;

        let excessDefDmg = splitDmg - actualDefDmg;
        hpDamage += (splitDmg + excessDefDmg);
    } else {
        // Sin armadura, todo al HP
        hpDamage += rawDmg;
    }

    // Desgaste mínimo garantizado
    if (hpDamage < 10 && piercing === 0) {
        hpDamage = 10;
    }

    return { hpDamage, defDamage, piercing };
}



export function procesarRondaSimultanea(f1, f2) {
    if (f1.hp <= 0 || f2.hp <= 0) return;

    logConsole(`⚔️ ¡${f1.name} y ${f2.name} se abalanzan a la vez en un choque brutal!`, 'attack');

    // 1. Calculamos todo el daño exacto (HP y DEF) antes de aplicarlo
    let dmgToF2 = calcularDetalleDaño(f1, f2);
    let dmgToF1 = calcularDetalleDaño(f2, f1);

    // 2. Logs de Acción: F1 impacta a F2
    if (dmgToF2.piercing > 0) logConsole(`💉 ${f1.name} [Armor Piercing]: ${dmgToF2.piercing} directo al HP!`, 'passive');
    logConsole(`💥 ${f1.name} inflige -${dmgToF2.hpDamage} HP y destroza -${dmgToF2.defDamage} DEF.`, 'damage');

    // 3. Logs de Acción: F2 impacta a F1
    if (dmgToF1.piercing > 0) logConsole(`💉 ${f2.name} [Armor Piercing]: ${dmgToF1.piercing} directo al HP!`, 'passive');
    logConsole(`💥 ${f2.name} inflige -${dmgToF1.hpDamage} HP y destroza -${dmgToF1.defDamage} DEF.`, 'damage');

    // 4. Aplicar el daño simultáneamente (Ahora la DEF sí se gasta correctamente)
    f2.def = Math.max(0, f2.def - dmgToF2.defDamage);
    f2.hp -= dmgToF2.hpDamage; // Se permite bajar a negativo para el cálculo de victoria

    f1.def = Math.max(0, f1.def - dmgToF1.defDamage);
    f1.hp -= dmgToF1.hpDamage; // Se permite bajar a negativo

    logConsole(`📊 RESULTADO: ${f1.name} (${Math.floor(f1.hp)} HP) vs ${f2.name} (${Math.floor(f2.hp)} HP)`, 'system');
}

/**
 * Función auxiliar para calcular el daño siguiendo tus reglas de reparto DEF/HP
 */
function calcularDaño(atk, def) {
    let rawDmg = atk.atq;
    
    // Aplicamos pasivas de daño (Anti-Armor, etc.)
    if (atk.passiveId === 'anti_armor' && def.def > 0) rawDmg = Math.floor(rawDmg * 1.5);
    
    // Si tiene DEF, el daño se reparte al 50% según tu regla de Easy Hit
    if (def.def > 0) {
        return Math.floor(rawDmg / 2) + Math.floor(rawDmg / 2); // Total rawDmg pero repartido visualmente
    }
    return rawDmg;
}




export function procesarAtaque(atk, def) {
    if (!atk || !def || atk.hp <= 0 || def.hp <= 0) return { defDamage: 0, hpDamage: 0 };

    let rawDmg = atk.atq;
    let hpDamage = 0;
    let defDamage = 0;

    logConsole(`⚔️ ${atk.name} lanza un ataque...`, 'attack');

    // --- PASIVA: ANTI-ARMOR ---
    if (atk.passiveId === 'anti_armor' && def.def > 0) {
        rawDmg = Math.floor(rawDmg * 1.5);
        logConsole(`🎯 ¡Efecto Anti-Armadura! El daño sube a ${rawDmg}.`, 'passive');
    }

    // --- PASIVA: ARMOR PIERCING (30% directo al HP) ---
    if (atk.passiveId === 'armor_piercing' && def.def > 0) {
        let piercingDmg = Math.floor(rawDmg * 0.3);
        let remainingDmg = rawDmg - piercingDmg;

        def.hp = Math.max(0, def.hp - piercingDmg);
        hpDamage += piercingDmg;
        logConsole(`💉 Penetración: ${piercingDmg} HP dañados directamente.`, 'passive');

        rawDmg = remainingDmg;
    }

    // --- REGLA DE CONSUMO EQUITATIVO ---
    if (def.def > 0) {
        let splitDmg = Math.floor(rawDmg / 2);
        
        let actualDefDmg = Math.min(def.def, splitDmg);
        def.def -= actualDefDmg;
        defDamage += actualDefDmg;

        let excessDefDmg = splitDmg - actualDefDmg;
        let totalHpImpact = splitDmg + excessDefDmg;
        
        def.hp = Math.max(0, def.hp - totalHpImpact);
        hpDamage += totalHpImpact;

        logConsole(`🛡️ El impacto se reparte: ${actualDefDmg} DEF / ${totalHpImpact} HP.`, 'damage');
    } else {
        def.hp = Math.max(0, def.hp - rawDmg);
        hpDamage += rawDmg;
    }

    // Garantía de daño mínimo
    if (hpDamage < 10) {
        def.hp = Math.max(0, def.hp - 10);
        hpDamage += 10;
    }

    logConsole(`💥 Daño total recibido: ${hpDamage} HP.`, 'damage');
    
    // Retornamos los datos del daño para que otras funciones (como Leech) lo usen
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
            // Ejemplo: c1 tiene -10 y c2 tiene -200. c1 > c2, por tanto c1 gana.
            const winner = c1.hp > c2.hp ? c1 : c2;
            logConsole(`🏆 ${winner.name} VICTORIOSO (Victoria Negativa: ${Math.floor(winner.hp)} HP)!`, "victory");
        }

        setColiseumButtonMode('finish');
        return true;
    }
    return false;
}

/**
 * Gestiona pasivas de inicio de ronda.
 * Optimizaciones: Uso de Switch y nuevas pasivas balanceadas.
 */
export function applyRoundStartPassives(f, r) {
    if (!f || !r || !f.passiveId || f.hp <= 0) return false;

    switch (f.passiveId) {
        case 'prog_scale_stats':
            f.atq = Math.floor(f.atq * 1.1);
            f.def = Math.floor(f.def * 1.1);
            logConsole(`📈 ${f.name} [Growth]: Stats +10%.`, 'passive');
            break;

        case 'prog_venom':
            let venomDmg = Math.floor((f.maxHp || f.hp) * 0.05);
            r.hp = Math.max(0, r.hp - venomDmg);
            logConsole(`☠️ ${f.name} [Venom]: ${r.name} pierde ${venomDmg} HP.`, 'passive');
            if (r.hp <= 0) return true; // El oponente ha muerto por veneno
            break;

        case 'prog_drain_def':
            let drain = Math.floor(r.def * 0.15);
            r.def = Math.max(0, r.def - drain);
            logConsole(`⚙️ ${f.name} [Rust]: Corroe ${drain} DEF de ${r.name}.`, 'passive');
            break;

        case 'double_strike':
            logConsole(`⚡ ${f.name} [Double Strike]: ¡Ataque extra rápido!`, 'passive');
            procesarAtaque(f, r); 
            if (r.hp <= 0) return true; // Detener si el ataque extra mata al rival
            break;

        case 'life_leech':
            // MEJORA: Ahora se cura basado en el daño real causado, no en el ATQ base
            const { hpDamage } = procesarAtaque(f, r); 
            let steal = Math.floor(hpDamage * 0.5); // Se cura el 50% del daño infligido
            
            f.hp = Math.min(f.maxHp || f.hp * 2, f.hp + steal);
            logConsole(`🧛 ${f.name} [Leech]: Drena vida y recupera ${steal} HP.`, 'passive');
            
            if (r.hp <= 0) return true; 
            break;

        case 'shield_recharge':
            let regen = Math.floor((f.maxHp || f.hp) * 0.1);
            f.def += regen;
            logConsole(`🛡️ ${f.name} [Recharge]: Regenera ${regen} de Escudo.`, 'passive');
            break;
    }
    return false;
}

// --- GESTIÓN DE BIBLIOTECA ---
export let cards = [];
function loadLibrary() {
    try {
        const savedData = localStorage.getItem('easyHitLibrary');
        cards = savedData ? JSON.parse(savedData) : [];
    } catch (error) {
        console.error("Vanguard: Error al cargar biblioteca.", error);
        cards = [];
    }
}
loadLibrary();




export function saveCard(card) {
    // Validamos que la carta tenga lo mínimo para no romper el motor
    if (!card.id || !card.name || !card.hp) {
        console.error("Intento de guardar carta corrupta abortado.");
        return false;
    }

    const index = cards.findIndex(c => c.id === card.id);
    if (index !== -1) {
        cards[index] = card; // Actualización
        console.log(`🗃️ Carta '${card.name}' actualizada.`);
    } else {
        cards.push(card); // Creación nueva
        console.log(`✨ Nueva carta '${card.name}' forjada.`);
    }
    
    syncStorage();
    return true;
}

export function deleteCard(id) {
    cards = cards.filter(c => c.id !== id);
    syncStorage();
}



function syncStorage() {
    try {
        localStorage.setItem('easyHitLibrary', JSON.stringify(cards));
    } catch (e) {
        console.error("Vanguard Critico: El almacenamiento está lleno. ¿Demasiadas imágenes?");
        alert("¡Error de memoria! La biblioteca es demasiado grande para el navegador.");
    }
}

// ... Funciones de exportación e importación se mantienen idénticas ...

export function exportarBiblioteca() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cards));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "easy_hit_library.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

export function importarBiblioteca(event, callback) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            
            // Verificación Vanguard: ¿Es un array y tiene contenido válido?
            if (Array.isArray(imported) && imported.every(c => c.id && c.name)) {
                // Opción Pro: Fusionar en lugar de borrar
                // Esto evita que el usuario pierda sus cartas actuales al importar
                const merged = [...cards];
                imported.forEach(newCard => {
                    const exists = merged.findIndex(c => c.id === newCard.id);
                    if (exists !== -1) merged[exists] = newCard;
                    else merged.push(newCard);
                });

                cards = merged;
                syncStorage();
                console.log(`📥 Importación exitosa: ${imported.length} cartas procesadas.`);
                if (callback) callback();
            } else {
                throw new Error("Formato de datos incompatible.");
            }
        } catch (err) {
            alert("⚠️ El archivo no es una biblioteca válida de Easy Hit.");
            console.error("Fallo de importación:", err);
        }
    };
    reader.readAsText(file);
}