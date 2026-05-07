import * as UI from './ui.js';
import * as Engine from './engine.js';

let fighter1 = null, fighter2 = null;

// ⚠️ VANGUARD FIX: Ejecución directa. 
// Eliminamos el 'DOMContentLoaded' porque los módulos (type="module") 
// ya se ejecutan automáticamente cuando el HTML está listo.
console.log("🔥 Vanguard System: Conectando cables en tiempo real...");

// Ejecutamos la carga inicial directamente
initEvents();
UI.displayCards();
UI.updateRemainingPoints();

if (typeof UI.renderSelector === 'function') {
    UI.renderSelector();
}

// ---------------------------------------------------------

function safeListener(id, eventType, callback) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(eventType, callback);
    } else {
        console.warn(`Vanguard Warning: No se encontró el ID '${id}'. El evento no se asignó, pero el juego sigue funcionando.`);
    }
}

function initEvents() {
    // --- NAVEGACIÓN PRINCIPAL ---
    safeListener('tab-library', 'click', () => UI.showSection('library'));
    safeListener('tab-creator', 'click', () => UI.showSection('creator'));
    safeListener('tab-coliseo', 'click', () => UI.showSection('coliseo'));

    // --- CREADOR DE CARTAS (Inputs) ---
    const creatorInputs = ['cardName', 'cardElement', 'cardClass', 'inputHP', 'inputDEF', 'inputATQ', 'cardPassive'];
    creatorInputs.forEach(id => {
        safeListener(id, 'input', () => {
            UI.updateRemainingPoints();
            UI.updatePreview(UI.croppedImageBase64);
        });
    });

    // --- CREADOR DE CARTAS (Botones) ---
    safeListener('cardImgFile', 'change', (e) => UI.handleFileSelect(e));
    
    safeListener('cropImageBtn', 'click', () => {
        UI.applyCrop((img) => UI.updatePreview(img));
    });

    safeListener('cancelCropBtn', 'click', () => {
        const modal = document.getElementById('cropperModal');
        if(modal) modal.style.display = 'none';
        
        // VANGUARD FIX: Limpiamos el input para permitir re-subir la foto
        const fileInput = document.getElementById('cardImgFile');
        if (fileInput) fileInput.value = '';
    });

    safeListener('saveCardBtn', 'click', () => {
        const nameInput = document.getElementById('cardName');
        if (!nameInput || !nameInput.value) return alert("¡Ponle un nombre a tu héroe!");
        if (!UI.updateRemainingPoints()) return alert("¡Te has pasado de los 7400 puntos!");

        // 🛡️ VANGUARD FIX: Extracción defensiva usando Optional Chaining y defaults
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
            image: UI.croppedImageBase64
        };

        Engine.saveCard(card);
        UI.displayCards();
        if (typeof UI.renderSelector === 'function') UI.renderSelector();
        
        if (typeof UI.resetCropperData === 'function') {
            UI.resetCropperData(); 
        }
        alert("¡Héroe Forjado!");
    });

    // --- BIBLIOTECA ---
    safeListener('btnExport', 'click', () => Engine.exportarBiblioteca());
    
    safeListener('importJSON', 'change', (e) => {
        Engine.importarBiblioteca(e, () => {
            UI.displayCards();
            if (typeof UI.renderSelector === 'function') UI.renderSelector();
        });
    });

    // 1. CLICK EN LA LISTA LATERAL: Para seleccionar y ver la carta
    safeListener('librarySidebarList', 'click', (e) => {
        const item = e.target.closest('.card-list-item');
        if (!item) return;

        // Visual: marcar como activo
        document.querySelectorAll('.card-list-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        // Lógica: obtener datos y renderizar detalle
        const id = item.getAttribute('data-id');
        const card = Engine.cards.find(c => c.id === id);
        if (card) {
            UI.renderCardDetail(card);
        }
    });

    // 2. CLICK EN EL DETALLE: Para el botón de eliminar (que ahora vive en 'libraryDetail')
    safeListener('libraryDetail', 'click', (e) => {
        if (e.target.classList.contains('btn-delete-card')) {
            const id = e.target.getAttribute('data-delete-id');
            if (id && confirm("Delete this hero permanently?")) {
                Engine.deleteCard(id);
                UI.displayCards();
                // Limpiar la vista de detalle tras borrar
                document.getElementById('libraryDetail').innerHTML = '<div class="empty-state-msg">Select a hero from the roster</div>';
                if (typeof UI.renderSelector === 'function') UI.renderSelector();
            }
        }
    });

    // --- COLISEO ---
    safeListener('selectF1', 'change', (e) => {
        const card = Engine.cards.find(c => c.id === e.target.value);
        fighter1 = card ? JSON.parse(JSON.stringify(card)) : null; 
        UI.logConsole(fighter1 ? `${fighter1.name} entra en la arena.` : "Luchador 1 retirado.", 'system');
    });

    safeListener('selectF2', 'change', (e) => {
        const card = Engine.cards.find(c => c.id === e.target.value);
        fighter2 = card ? JSON.parse(JSON.stringify(card)) : null;
        UI.logConsole(fighter2 ? `${fighter2.name} entra en la arena.` : "Luchador 2 retirado.", 'system');
    });

    safeListener('btnInitCombat', 'click', () => {
        if (!fighter1 || !fighter2) return alert("Necesitas dos luchadores en la arena.");
        
        document.getElementById('btnInitCombat').style.display = 'none';
        document.getElementById('btnNextRound').style.display = 'block';
        UI.logConsole(`¡Que comience el combate!`, 'system');
    });

    // --- BUSCADOR DE LUCHADORES DEL COLISEO ---
    ['1', '2'].forEach(num => {
        safeListener(`searchF${num}`, 'input', (e) => {
            const term = e.target.value.toLowerCase();
            const select = document.getElementById(`selectF${num}`);
            if (!select) return;
            
            let optionsHTML = '<option value="">Seleccionar luchador...</option>';
            Engine.cards
                .filter(c => c.name.toLowerCase().includes(term))
                .forEach(card => {
                    const icon = UI.classIcons[card.cardClass] || '👤';
                    optionsHTML += `<option value="${card.id}">${icon} ${card.name}</option>`;
                });
            select.innerHTML = optionsHTML;
        });
    });

    safeListener('btnNextRound', 'click', () => {
        if (!fighter1 || !fighter2) return UI.logConsole("Error de combatientes.", 'system');

        if (fighter1.hp <= 0 || fighter2.hp <= 0) {
            return UI.logConsole("El combate ha terminado. Reinicia la arena.", 'system');
        }

        Engine.applyRoundStartPassives(fighter1, fighter2);
        Engine.applyRoundStartPassives(fighter2, fighter1);
        
        Engine.procesarAtaque(fighter1, fighter2);
        Engine.procesarAtaque(fighter2, fighter1);
        
        const matchEnded = Engine.verifyVictory(fighter1, fighter2);
        
        if (matchEnded) {
            document.getElementById('btnInitCombat').style.display = 'block';
            document.getElementById('btnNextRound').style.display = 'none';
        }
    });
}