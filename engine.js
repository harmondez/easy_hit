import { logConsole, setColiseumButtonMode } from './ui.js';

/**
 * Procesa un ataque individual entre dos combatientes.
 */
export function procesarAtaque(atk, def) {
    if (atk.hp <= 0 || def.hp <= 0) return { defDamage: 0, hpDamage: 0 }; // Blindaje de seguridad

    let rawDmg = atk.atq;
    let minDmg = Math.max(10, Math.floor(rawDmg * 0.05));
    
    let currentDmg = rawDmg;
    let defDamage = 0;
    let hpDamage = 0;

    logConsole(`⚔️ ${atk.name} ataca a ${def.name}...`, 'attack');

    if (def.def > 0) {
        defDamage = Math.min(def.def, currentDmg);
        def.def -= defDamage;
        currentDmg -= defDamage;
        // Si la defensa queda en negativo por algún error, la reseteamos a 0
        if (def.def < 0) def.def = 0;
        logConsole(`🛡️ DEF de ${def.name} absorbe ${defDamage}.`, 'damage');
    }
    
    if (currentDmg > 0) {
        hpDamage = currentDmg;
    } else {
        hpDamage = minDmg;
        logConsole(`🦾 Daño de desgaste: ${hpDamage} HP.`, 'damage');
    }

    def.hp -= hpDamage;
    logConsole(`💥 ${def.name} recibe ${hpDamage} de daño directo.`, 'damage');

    return { defDamage, hpDamage };
}

/**
 * Verifica si alguien ha caído y activa el modo FINALIZAR.
 */
export function verifyVictory(c1, c2) {
    if (c1.hp <= 0 || c2.hp <= 0) {
        // 1. Lógica de Empate / Victoria Negativa
        if (c1.hp <= 0 && c2.hp <= 0) {
            if (c1.hp > c2.hp) {
                logConsole(`🏆 ${c1.name} GANA por Victoria Negativa!`, 'victory');
            } else if (c2.hp > c1.hp) {
                logConsole(`🏆 ${c2.name} GANA por Victoria Negativa!`, 'victory');
            } else {
                logConsole("⚖️ ¡EMPATE ABSOLUTO!", "victory");
            }
        } else {
            // 2. Victoria normal
            const winner = c1.hp > 0 ? c1 : c2;
            logConsole(`🏆 ${winner.name} VICTORIOSO!`, "victory");
        }

        // --- VANGUARD FIX: CAMBIO DE MODO DE BOTÓN ---
        // Esto es lo que desbloquea tu interfaz
        setColiseumButtonMode('finish');
        return true;
    }
    return false;
}

/**
 * Gestiona los efectos de inicio de ronda.
 */
export function applyRoundStartPassives(f, r) {
    if (!f || !r || !f.passiveId || f.hp <= 0) return;

    if (f.passiveId === 'prog_scale_stats') {
        f.atq = Math.floor(f.atq * 1.1);
        f.def = Math.floor(f.def * 1.1);
        logConsole(`📈 ${f.name} [Growth]: Stats +10%.`, 'passive');
    }
    
    if (f.passiveId === 'prog_venom') {
        let p = Math.floor((f.maxHp || f.hp) * 0.05);
        r.hp -= p;
        logConsole(`☠️ ${f.name} [Venom]: ${r.name} pierde ${p} HP por toxinas.`, 'passive');
    }
    
    if (f.passiveId === 'prog_drain_def') {
        let d = Math.floor(r.def * 0.1);
        r.def = Math.max(0, r.def - d);
        logConsole(`⚙️ ${f.name} [Metal Fatigue]: Armadura de ${r.name} se corroe (-${d} DEF).`, 'passive');
    }
}

// --- GESTIÓN DE BIBLIOTECA (ESTADO PROTEGIDO) ---
export let cards = [];
function loadLibrary() {
    try {
        const savedData = localStorage.getItem('easyHitLibrary');
        cards = savedData ? JSON.parse(savedData) : [];
    } catch (error) {
        console.error("Vanguard Error: Fallo en carga de datos.", error);
        cards = [];
    }
}
loadLibrary();

export function saveCard(card) {
    cards.push(card);
    syncStorage();
}

export function deleteCard(id) {
    cards = cards.filter(c => c.id !== id);
    syncStorage();
}

function syncStorage() {
    localStorage.setItem('easyHitLibrary', JSON.stringify(cards));
}

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
            if (Array.isArray(imported)) {
                cards = imported;
                syncStorage();
                if (callback) callback();
            }
        } catch (err) {
            alert("Error: El archivo JSON no es válido.");
        }
    };
    reader.readAsText(file);
}