import * as Storage from './storage.js';
import * as UI from './ui.js';
import * as Engine from './engine.js';

let fighter1 = null, fighter2 = null;

document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    UI.displayCards();
    UI.updateRemainingPoints();
    UI.renderSelector(); // Para llenar los selectores del Coliseo al cargar
});

function initEvents() {
    // --- CREADOR DE CARTAS ---
    ['cardName', 'cardElement', 'cardClass', 'inputHP', 'inputDEF', 'inputATQ', 'cardPassive'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            UI.updateRemainingPoints();
            UI.updatePreview(UI.croppedImageBase64);
        });
    });

    document.getElementById('cardImgFile').addEventListener('change', (e) => UI.handleFileSelect(e));
    
    document.getElementById('cropImageBtn').addEventListener('click', () => {
        UI.applyCrop((img) => UI.updatePreview(img));
    });

    document.getElementById('saveCardBtn').addEventListener('click', () => {
        const name = document.getElementById('cardName').value;
        if (!name) return alert("¡Ponle un nombre a tu héroe!");
        if (!UI.updateRemainingPoints()) return alert("¡Te has pasado de los 7400 puntos!");

        const card = {
            id: Date.now().toString(),
            name: name,
            element: document.getElementById('cardElement').value,
            cardClass: document.getElementById('cardClass').value,
            hp: parseInt(document.getElementById('inputHP').value),
            def: parseInt(document.getElementById('inputDEF').value),
            atq: parseInt(document.getElementById('inputATQ').value),
            maxHp: parseInt(document.getElementById('inputHP').value), // Guardamos el tope para cálculos
            passiveId: document.getElementById('cardPassive').value,
            image: UI.croppedImageBase64
        };

        Storage.saveCard(card);
        UI.displayCards();
        UI.renderSelector(); // Actualizamos los selectores del Coliseo
        
        // Limpieza tras forjar
        UI.resetCropperData(); // Skill recomendada: Limpiar base64 tras guardar
        alert("¡Héroe Forjado!");
    });

    // --- COLISEO (REVIVIDO) ---
    
    // Selección de luchadores
    document.getElementById('selectF1').addEventListener('change', (e) => {
        const card = Storage.cards.find(c => c.id === e.target.value);
        fighter1 = card ? JSON.parse(JSON.stringify(card)) : null; // Clonación profunda
        UI.logConsole(fighter1 ? `${fighter1.name} entra en la arena.` : "Luchador 1 retirado.", 'system');
    });

    document.getElementById('selectF2').addEventListener('change', (e) => {
        const card = Storage.cards.find(c => c.id === e.target.value);
        fighter2 = card ? JSON.parse(JSON.stringify(card)) : null;
        UI.logConsole(fighter2 ? `${fighter2.name} entra en la arena.` : "Luchador 2 retirado.", 'system');
    });

    // Botón de ataque (Ejecutar Ronda)
    const attackBtn = document.getElementById('btnNextRound');
    if (attackBtn) {
        attackBtn.addEventListener('click', () => {
            if (!fighter1 || !fighter2) {
                return UI.logConsole("Necesitas dos luchadores para empezar.", 'system');
            }

            if (fighter1.hp <= 0 || fighter2.hp <= 0) {
                return UI.logConsole("El combate ha terminado. Reinicia los luchadores.", 'system');
            }

            // Ciclo de Vida del Combate (según CLAUDE.md)
            Engine.applyRoundStartPassives(fighter1, fighter2);
            Engine.applyRoundStartPassives(fighter2, fighter1);
            
            Engine.procesarAtaque(fighter1, fighter2);
            Engine.procesarAtaque(fighter2, fighter1);
            
            Engine.verifyVictory(fighter1, fighter2);
        });
    }
}

// EXPOSICIÓN GLOBAL


// Creamos el puente para que el HTML vea la función
window.showSection = (sectionId) => {
    UI.showSection(sectionId);
};

window.borrarCarta = (id) => {
    Storage.deleteCard(id);
    UI.displayCards();
    UI.renderSelector();
};

window.exportarBiblioteca = Storage.exportarBiblioteca;
window.importarBiblioteca = (e) => Storage.importarBiblioteca(e, () => {
    UI.displayCards();
    UI.renderSelector();
});

window.showSection = UI.showSection;