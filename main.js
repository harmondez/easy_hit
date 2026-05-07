import * as UI from './ui.js';
import * as Engine from './engine.js';

let fighter1 = null, fighter2 = null;

// ⚠️ VANGUARD FIX: Ejecución directa. 
// Eliminamos el 'DOMContentLoaded' porque los módulos (type="module") 
// ya se ejecutan automáticamente cuando el HTML está listo.
console.log("🔥 Vanguard System: Conectando cables en tiempo real...");

// 1. Inicializamos eventos
initEvents();

// 2. FORZAMOS EL INICIO EN EL CREADOR (Añade esta línea aquí)
UI.showSection('creator');

// 3. Cargamos el resto de datos
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

    // --- CREADOR DE CARTAS (Imagen & Guardado) ---
    safeListener('cardImgFile', 'change', (e) => UI.handleFileSelect(e));
    
    safeListener('cropImageBtn', 'click', () => {
        UI.applyCrop((img) => UI.updatePreview(img));
    });

    safeListener('cancelCropBtn', 'click', () => {
        const modal = document.getElementById('cropperModal');
        if(modal) modal.style.display = 'none';
        const fileInput = document.getElementById('cardImgFile');
        if (fileInput) fileInput.value = '';
    });

    safeListener('saveCardBtn', 'click', () => {
        const nameInput = document.getElementById('cardName');
        if (!nameInput || !nameInput.value) return alert("¡Ponle un nombre a tu héroe!");
        if (!UI.updateRemainingPoints()) return alert("¡Puntos excedidos!");

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
        UI.renderSelector(); // Actualiza los selectores del Coliseo inmediatamente
        
        if (UI.resetCropperData) UI.resetCropperData(); 
        alert("¡Héroe Forjado!");
    });

    // --- BIBLIOTECA ---
    safeListener('btnExport', 'click', () => Engine.exportarBiblioteca());
    
    safeListener('importJSON', 'change', (e) => {
        Engine.importarBiblioteca(e, () => {
            UI.displayCards();
            UI.renderSelector();
        });
    });

    // Click en lista (Roster)
    safeListener('librarySidebarList', 'click', (e) => {
        const item = e.target.closest('.card-list-item');
        if (!item) return;
        document.querySelectorAll('.card-list-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        const card = Engine.cards.find(c => c.id === item.getAttribute('data-id'));
        if (card) UI.renderCardDetail(card);
    });

    // Click en detalle (Borrar)
    safeListener('libraryDetail', 'click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete-card');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-delete-id');
            if (id && confirm("Delete hero?")) {
                Engine.deleteCard(id);
                UI.displayCards();
                document.getElementById('libraryDetail').innerHTML = '<p class="empty-state-msg">Select a hero</p>';
                UI.renderSelector();
            }
        }
    });

    // --- COLISEO (Selección) ---
    ['1', '2'].forEach(num => {
        safeListener(`selectF${num}`, 'change', (e) => {
            const card = Engine.cards.find(c => c.id === e.target.value);
            // Creamos una copia profunda para que el combate no afecte a la biblioteca
            if (num === '1') fighter1 = card ? JSON.parse(JSON.stringify(card)) : null;
            if (num === '2') fighter2 = card ? JSON.parse(JSON.stringify(card)) : null;
            
            const name = card ? card.name : `Luchador ${num}`;
            UI.logConsole(`${name} se prepara.`, 'system');
        });

        // BUSCADOR MEJORADO (Filtra sin romper la UI)
        safeListener(`searchF${num}`, 'input', (e) => {
            const term = e.target.value.toLowerCase();
            UI.renderSelector(term); // Pasamos el término a una versión mejorada de renderSelector
        });
    });

    // --- BOTÓN DE ACCIÓN DEL COLISEO (Unificado) ---
    safeListener('btnInitCombat', 'click', () => {
        if (!fighter1 || !fighter2) return alert("Selecciona dos combatientes.");
        
        document.getElementById('btnInitCombat').style.display = 'none';
        const nextBtn = document.getElementById('btnNextRound');
        nextBtn.style.display = 'block';
        UI.setColiseumButtonMode('next'); // Asegura que empiece en naranja
        
        UI.logConsole(`¡QUE COMIENCE EL COMBATE!`, 'system');
    });

    safeListener('btnNextRound', 'click', (e) => {
    // 1. MODO FINALIZAR: Limpiar todo
    if (e.target.dataset.mode === 'finish') {
        UI.resetColiseum();
        fighter1 = null; 
        fighter2 = null;
        return;
    }

    // 2. MODO COMBATE: Ejecutar la ronda
    if (!fighter1 || !fighter2) return;

    // --- Lógica de Combate ---
    // Aplicar pasivas de inicio de ronda
    Engine.applyRoundStartPassives(fighter1, fighter2);
    Engine.applyRoundStartPassives(fighter2, fighter1);
    
    // Ejecutar ataques mutuos
    Engine.procesarAtaque(fighter1, fighter2);
    Engine.procesarAtaque(fighter2, fighter1);
    
    // Verificar si alguien ha caído
    const matchEnded = Engine.verifyVictory(fighter1, fighter2);
    
    // Si terminó, el botón ya habrá cambiado a 'finish' dentro de verifyVictory
    // mediante la llamada a UI.setColiseumButtonMode('finish')
    });
}