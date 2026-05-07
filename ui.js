import { cards } from './storage.js';

export const elementConfigs = {
    'Fire':      { icon: '🔥', color: '#ef4444' },
    'Water':     { icon: '💧', color: '#3b82f6' },
    'Lightning': { icon: '⚡', color: '#f59e0b' },
    'Nature':    { icon: '🌿', color: '#10b981' }
};

export const classIcons = {
    'Human': '👤', 'Robot': '🤖', 'Dragon': '🐉', 'Spectre': '👻', 
    'Monster': '👹', 'Viking': '🪓', 'Pirate': '🏴‍☠️', 'Beast': '🐾', 
    'Alien': '👽', 'Neutral': '😐'
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

// --- ⚔️ SECCIÓN DEL COLISEO (UI) ---

export function renderSelector() {
    // Inyecta las cartas en los selectores del Coliseo
    const select1 = document.getElementById('selectF1');
    const select2 = document.getElementById('selectF2');
    
    if (!select1 || !select2) return;

    let optionsHTML = '<option value="">Seleccionar luchador...</option>';
    cards.forEach(card => {
        const icon = classIcons[card.cardClass] || '👤';
        optionsHTML += `<option value="${card.id}">${icon} ${card.name}</option>`;
    });

    select1.innerHTML = optionsHTML;
    select2.innerHTML = optionsHTML;
}

export function logConsole(msg, type = 'system') {
    // CORRECCIÓN: Inyectamos en logContent, no en combatLog
    const consoleEl = document.getElementById('logContent');
    if (!consoleEl) return;
    
    const div = document.createElement('div');
    // Para que los estilos CSS funcionen correctamente
    div.className = `log-entry ${type}`; 
    div.innerText = msg;
    
    // Añadir al principio de la consola
    consoleEl.prepend(div);
}

// --- 📜 SECCIÓN DE LA BIBLIOTECA (UI) ---

export function displayCards(onDeleteCallback) {
    const deck = document.getElementById('cardsDeck');
    if (!deck) return;
    
    if (cards.length === 0) {
        deck.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">No tienes cartas en tu colección. ¡Ve a la Forja!</p>';
        return;
    }

    deck.innerHTML = cards.map(card => `
        <div class="card-item" style="border-color: ${elementConfigs[card.element]?.color || '#fff'}">
            <div class="card-item-art" style="background-image: url('${card.image || ''}')"></div>
            <div class="card-item-info">
                <strong>${card.name}</strong>
                <p>${elementConfigs[card.element]?.icon || ''} ${card.cardClass}</p>
                <button onclick="window.borrarCarta('${card.id}')" style="margin-top: 10px; cursor:pointer; background: #ef4444; color:white; border:none; padding:5px 10px; border-radius:4px;">Eliminar</button>
            </div>
        </div>
    `).join('');
}

// --- 🔨 SECCIÓN DE LA FORJA (Creador) ---

export let currentCropper = null;
export let croppedImageBase64 = null;

export function updatePreview(croppedImg) {
    const nameVal = document.getElementById('cardName').value;
    const elementVal = document.getElementById('cardElement').value;
    const classVal = document.getElementById('cardClass').value;
    const passiveVal = document.getElementById('cardPassive').value;

    const data = {
        name: nameVal ? nameVal : "Nombre del Héroe",
        element: elementVal,
        cardClass: classVal,
        hp: document.getElementById('inputHP').value || 0,
        def: document.getElementById('inputDEF').value || 0,
        atq: document.getElementById('inputATQ').value || 0,
        passive: passiveVal
    };

    const config = elementConfigs[data.element];
    
    if(document.getElementById('previewName')) document.getElementById('previewName').innerText = data.name;
    if(document.getElementById('previewElement')) document.getElementById('previewElement').innerText = config?.icon || '⚪';
    if(document.getElementById('previewClass')) document.getElementById('previewClass').innerText = `${classIcons[data.cardClass] || '❓'} ${data.cardClass}`;
    if(document.getElementById('statHP')) document.getElementById('statHP').innerText = data.hp;
    if(document.getElementById('statDEF')) document.getElementById('statDEF').innerText = data.def;
    if(document.getElementById('statATQ')) document.getElementById('statATQ').innerText = data.atq;
    
    const passiveDesc = passiveNames[data.passive];
    if(document.getElementById('previewPassive')) document.getElementById('previewPassive').innerHTML = passiveDesc ? `<strong>Pasiva:</strong> ${passiveDesc}` : "<strong>Pasiva:</strong> Ninguna";

    const cardVisual = document.getElementById('cardVisual');
    if (cardVisual && config) cardVisual.style.borderColor = config.color;

    const art = document.getElementById('previewArt');
    if (art) art.style.backgroundImage = croppedImg ? `url('${croppedImg}')` : "";
}

export function updateRemainingPoints() {
    const hp = parseInt(document.getElementById('inputHP').value) || 0;
    const def = parseInt(document.getElementById('inputDEF').value) || 0;
    const atq = parseInt(document.getElementById('inputATQ').value) || 0;
    const total = hp + def + atq;
    const remaining = 7400 - total;
    
    const display = document.getElementById('remainingPts');
    if (display) {
        display.innerText = remaining;
        display.style.color = remaining < 0 ? "#ef4444" : "#10b981"; // Rojo si se pasa, verde si está bien
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
    
    if (document.getElementById('inputHP')) document.getElementById('inputHP').value = 0;
    if (document.getElementById('inputDEF')) document.getElementById('inputDEF').value = 0;
    if (document.getElementById('inputATQ')) document.getElementById('inputATQ').value = 0;
    
    updateRemainingPoints();
    updatePreview(null);
}

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