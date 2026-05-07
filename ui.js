import { cards } from './engine.js';

export const elementConfigs = {
    'Fuego':      { icon: '🔥', color: '#ef4444' },
    'Agua':       { icon: '💧', color: '#3b82f6' },
    'Rayo':       { icon: '⚡', color: '#f59e0b' },
    'Naturaleza': { icon: '🌿', color: '#10b981' }
};

export const classIcons = {
    'Human': '👤', 'Robot': '🤖', 'Dragon': '🐉', 'Spectre': '🌪️', 
    'Monster': '👽', 'Viking': '🪓', 'Pirate': '🏴‍☠️', 'Beast': '🐾', 'Neutral': '⚪'
};

export const passiveNames = {
    'gen_block_heal': 'Sacred Veil: Blocks 1st attack and adds to HP',
    'gen_reflect_full': 'Broken Mirror: 1st strike reflects 100% damage',
    'gen_steal_stats': 'Soul Thief: Steals 40% of enemy stats as ATK',
    'nem_xenophobia': 'Xenophobia: Double stats if rival is NOT Human',
    'nem_dragon_slayer': 'Dragon Slayer: Ignores 50% DEF vs Dragons',
    'nem_element_ward': 'Lightning Rod: Reduces 50% ATK if rival is Lightning',
    'prog_scale_stats': 'Growth: +10% ATK & DEF per round',
    'prog_venom': 'Venomous: Drains 5% of rival HP per round',
    'prog_drain_def': 'Metal Fatigue: Reduces 10% of rival DEF per round',
    'abs_def_convert': 'Iron Skin: Converts 50% of damage into DEF',
    'abs_hp_convert': 'Leech: Absorbs 30% of damage as HP',
    'abs_reflect': 'Thorn Armor: Reflects 20% of damage received',
    'fen_revive': 'Graceful Strike: Absorbs lethal hit as HP and strikes back',
    'fen_berserker': 'Berserker: ATK x3 when dropping below 30% HP',
    'fen_last_stand': 'Last Stand: DEF x4 when dropping below 20% HP'
};

// --- 🛠️ FUNCIONES DE INTERFAZ Y NAVEGACIÓN ---

export function showSection(section) {
    const creatorGroup = document.getElementById('creatorMainGroup');
    const library = document.getElementById('library');
    const coliseo = document.getElementById('coliseo');
    
    const tabCreator = document.getElementById('tab-creator');
    const tabLibrary = document.getElementById('tab-library');
    const tabColiseo = document.getElementById('tab-coliseo');

    // 1. Ocultar todas las secciones
    if (creatorGroup) creatorGroup.style.display = 'none';
    if (library) library.style.display = 'none';
    if (coliseo) coliseo.style.display = 'none';
    
    // 2. Quitar clase "active" de todos los botones
    if (tabCreator) tabCreator.classList.remove('active');
    if (tabLibrary) tabLibrary.classList.remove('active');
    if (tabColiseo) tabColiseo.classList.remove('active');

    // 3. Mostrar la sección correcta y activar su pestaña
    if (section === 'creator') {
        if (creatorGroup) creatorGroup.style.display = 'flex';
        if (tabCreator) tabCreator.classList.add('active');
    } else if (section === 'coliseo') {
        if (coliseo) coliseo.style.display = 'block';
        if (tabColiseo) tabColiseo.classList.add('active');
        renderSelector(); // ¡Vital! Llena las opciones al entrar al Coliseo
    } else {
        if (library) library.style.display = 'block';
        if (tabLibrary) tabLibrary.classList.add('active');
        displayCards();
    }
}

// --- ⚔️ SECCIÓN DEL COLISEO (UI FINAL V1.2) ---

export function renderSelector() {
    const select1 = document.getElementById('selectF1');
    const select2 = document.getElementById('selectF2');
    if (!select1 || !select2) return;

    const groups = cards.reduce((acc, card) => {
        const className = card.cardClass || 'Neutral';
        if (!acc[className]) acc[className] = [];
        acc[className].push(card);
        return acc;
    }, {});

    let optionsHTML = '<option value="">Select your hero...</option>';
    
    Object.keys(groups).sort().forEach(className => {
        const icon = classIcons[className] || '👤';
        optionsHTML += `<optgroup label="${icon} ${className.toUpperCase()}S">`;
        groups[className].forEach(card => {
            optionsHTML += `<option value="${card.id}">${card.name} (ATK: ${card.atq})</option>`;
        });
        optionsHTML += `</optgroup>`;
    });

    select1.innerHTML = optionsHTML;
    select2.innerHTML = optionsHTML;
}

export function logConsole(msg, type = 'system', round = null) {
    const consoleEl = document.getElementById('logContent');
    if (!consoleEl) return;
    
    const div = document.createElement('div');
    div.className = `log-entry ${type}`; 

    let roundTag = round ? `<span class="log-round-tag">R${round}</span> ` : '';
    div.innerHTML = `${roundTag}${msg}`;
    
    // ABAJO: Lectura cronológica natural
    consoleEl.appendChild(div);
    
    // AUTO-SCROLL: Siempre al último mensaje
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

export function setColiseumButtonMode(mode) {
    const btn = document.getElementById('btnNextRound');
    if (!btn) return;

    if (mode === 'finish') {
        btn.innerText = 'FINALIZAR COMBATE';
        btn.style.background = '#ef4444'; // Rojo Puro
        btn.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
        btn.dataset.mode = 'finish';
    } else {
        btn.innerText = 'NEXT ROUND';
        btn.style.background = 'var(--primary)'; // Tu color de marca
        btn.style.boxShadow = 'none';
        btn.dataset.mode = 'next';
    }
}

export function resetColiseum() {
    const consoleEl = document.getElementById('logContent');
    if (consoleEl) {
        // Limpieza absoluta
        consoleEl.innerHTML = '';
    }
    
    // Restaurar el botón para el siguiente duelo
    setColiseumButtonMode('next');
    
    // Si tienes botones separados de Inicio y Siguiente, asegúrate de resetear su visibilidad
    const btnInit = document.getElementById('btnInitCombat');
    const btnNext = document.getElementById('btnNextRound');
    if (btnInit && btnNext) {
        btnInit.style.display = 'block';
        btnNext.style.display = 'none';
    }
}

// --- 📜 SECCIÓN DE LA BIBLIOTECA (UI) ---


export function displayCards() {
    const listContainer = document.getElementById('librarySidebarList');
    if (!listContainer) return;

    if (cards.length === 0) {
        listContainer.innerHTML = '<p class="empty-state-msg">Roster is empty. Forge some heroes!</p>';
        return;
    }

    // 1. Agrupamos las cartas por Clase y forzamos mayúsculas (HUMANS, DRAGONS...)
    const groups = cards.reduce((acc, card) => {
        const className = (card.cardClass || 'Neutral').toUpperCase(); 
        if (!acc[className]) acc[className] = [];
        acc[className].push(card);
        return acc;
    }, {});

    // 2. Renderizamos con la nueva estructura de "Roster Group"
    listContainer.innerHTML = Object.keys(groups).sort().map(className => `
        <div class="roster-group">
            <div class="roster-category-header">
                <span class="category-icon">
                    ${classIcons[className.charAt(0) + className.slice(1).toLowerCase()] || '🛡️'}
                </span>
                ${className}S
            </div>
            <div class="roster-category-list">
                ${groups[className].map(card => `
                    <div class="card-list-item" data-id="${card.id}">
                        <span class="item-element-dot" style="background-color: ${elementConfigs[card.element]?.color || '#fff'}"></span>
                        
                        <span class="item-name">${card.name}</span>
                        
                        <span class="item-stats-brief">ATQ:${card.atq}/DEF:${card.def}/HP:${card.hp}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

/**
 * Renderiza el detalle de una carta en el panel derecho de la biblioteca.
 * Diseñado para el "Modo Escaparate" (Showcase Mode).
 */

export function renderCardDetail(card) {
    const detailView = document.getElementById('libraryDetail');
    if (!detailView || !card) return;

    const config = elementConfigs[card.element];
    const passiveDesc = passiveNames[card.passiveId] || "No passive description";

    detailView.innerHTML = `
        <div class="card-preview showcase-animation" style="border-color: ${config?.color || '#fff'}; transform: scale(1.1);">
            <div class="card-art" style="background-image: url('${card.image || ''}'); background-size: cover;"></div>
            <div class="card-body">
                <div class="card-header-inner">
                    <h3>${card.name}</h3>
                </div>
                <div class="meta-info">
                    <span>${config?.icon || '⚪'} ${card.element}</span> | 
                    <span>${classIcons[card.cardClass] || '👤'} ${card.cardClass}</span>
                </div>
                <div class="preview-stats">
                    <div class="stat-box">⚔️ <b>${card.atq}</b></div>
                    <div class="stat-box">🛡️ <b>${card.def}</b></div>
                    <div class="stat-box">❤️ <b>${card.hp}</b></div>
                </div>
                <p class="passive-desc">
                    <strong>Passive:</strong> ${passiveDesc}
                </p>
            </div>
        </div>
        <button type="button" class="btn-delete-card btn-delete-showcase" data-delete-id="${card.id}">
            DELETE FROM ROSTER
        </button>
    `;
}

// --- 🔨 SECCIÓN DE LA FORJA (Creador) ---

export let currentCropper = null;
export let croppedImageBase64 = null;

export function updatePreview(croppedImg) {
    // 🛡️ ESCUDO VANGUARD: Captura segura de elementos
    const elName = document.getElementById('cardName');
    const elElement = document.getElementById('cardElement');
    const elClass = document.getElementById('cardClass');
    const elPassive = document.getElementById('cardPassive');
    const elHP = document.getElementById('inputHP');
    const elDEF = document.getElementById('inputDEF');
    const elATQ = document.getElementById('inputATQ');

    const data = {
        name: elName && elName.value ? elName.value : "Héroe Desconocido",
        element: elElement ? elElement.value : "Neutral",
        cardClass: elClass ? elClass.value : "Human",
        passive: elPassive ? elPassive.value : "",
        hp: elHP ? parseInt(elHP.value) || 0 : 0,
        def: elDEF ? parseInt(elDEF.value) || 0 : 0,
        atq: elATQ ? parseInt(elATQ.value) || 0 : 0
    };

    const config = elementConfigs[data.element];
    
    if(document.getElementById('previewName')) document.getElementById('previewName').innerText = data.name;
    if(document.getElementById('previewElement')) document.getElementById('previewElement').innerText = config?.icon || '⚪';
    if(document.getElementById('previewClass')) document.getElementById('previewClass').innerText = `${classIcons[data.cardClass] || '❓'} ${data.cardClass}`;
    if(document.getElementById('statHP')) document.getElementById('statHP').innerText = data.hp;
    if(document.getElementById('statDEF')) document.getElementById('statDEF').innerText = data.def;
    if(document.getElementById('statATQ')) document.getElementById('statATQ').innerText = data.atq;
    
    const passiveDesc = passiveNames[data.passive];
    if(document.getElementById('previewPassive')) {
        document.getElementById('previewPassive').innerHTML = passiveDesc ? `<strong>Pasiva:</strong> ${passiveDesc}` : "<strong>Pasiva:</strong> Ninguna";
    }

    const cardVisual = document.getElementById('cardVisual');
    if (cardVisual && config) cardVisual.style.borderColor = config.color;

    const art = document.getElementById('previewArt');
    if (art) art.style.backgroundImage = croppedImg ? `url('${croppedImg}')` : "";
}

export function updateRemainingPoints() {
    // 🛡️ ESCUDO VANGUARD
    const elHP = document.getElementById('inputHP');
    const elDEF = document.getElementById('inputDEF');
    const elATQ = document.getElementById('inputATQ');

    const hp = elHP ? parseInt(elHP.value) || 0 : 0;
    const def = elDEF ? parseInt(elDEF.value) || 0 : 0;
    const atq = elATQ ? parseInt(elATQ.value) || 0 : 0;
    
    const total = hp + def + atq;
    const remaining = 7400 - total;
    
    const display = document.getElementById('remainingPts');
    if (display) {
        display.innerText = remaining;
        display.style.color = remaining < 0 ? "#ef4444" : "#10b981";
    }
    
    if(document.getElementById('valHP')) document.getElementById('valHP').innerText = hp;
    if(document.getElementById('valDEF')) document.getElementById('valDEF').innerText = def;
    if(document.getElementById('valATQ')) document.getElementById('valATQ').innerText = atq;
    
    return remaining >= 0;
}

export function resetCropperData() {
    croppedImageBase64 = null;
    const previewArt = document.getElementById('previewArt');
    if (previewArt) previewArt.style.backgroundImage = '';
    
    const fileInput = document.getElementById('cardImgFile');
    if (fileInput) fileInput.value = '';
    
    // CORRECCIÓN: El mínimo permitido es 1, no 0.
    if (document.getElementById('inputHP')) document.getElementById('inputHP').value = 1;
    if (document.getElementById('inputDEF')) document.getElementById('inputDEF').value = 1;
    if (document.getElementById('inputATQ')) document.getElementById('inputATQ').value = 1;
    
    updateRemainingPoints();
    updatePreview(null);
}

// ⚠️ NOTA ARQUITECTÓNICA: Las funciones de abajo (handleFileSelect y applyCrop)
// deberían ser movidas a forge.js en la próxima refactorización para respetar
// completamente los 5 pilares, pero se mantienen aquí para preservar la funcionalidad actual.

export function handleFileSelect(e) {
    const file = e.target.files[0];
    
    if (!file || !file.type.startsWith('image/')) {
        console.error("Por favor, selecciona un archivo de imagen válido.");
        return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
        const img = document.getElementById('imageToCrop');
        if (!img) return;

        img.src = event.target.result;
        
        const modal = document.getElementById('cropperModal');
        if (modal) modal.style.display = 'flex';

        if (currentCropper) {
            currentCropper.destroy();
        }

        currentCropper = new Cropper(img, { 
            aspectRatio: 4/3, 
            viewMode: 1,
            guides: true,
            center: true,
            highlight: false,
            responsive: true,
            autoCropArea: 1
        });
    };

    reader.readAsDataURL(file);
}

export function applyCrop(callback) {
    if (!currentCropper) return;
    
    const canvas = currentCropper.getCroppedCanvas({ width: 600, height: 450 });
    croppedImageBase64 = canvas.toDataURL('image/webp', 0.8);
    
    const previewArt = document.getElementById('previewArt');
    if (previewArt) {
        previewArt.style.backgroundImage = `url('${croppedImageBase64}')`;
    }
    
    const modal = document.getElementById('cropperModal');
    if (modal) modal.style.display = 'none';
    
    currentCropper.destroy();
    currentCropper = null;
    
    if (callback) callback(croppedImageBase64);
}