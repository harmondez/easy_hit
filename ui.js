import { cards } from './engine.js';
import * as Engine from './engine.js';

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
    // 1. Limpieza del Log de combate
    const consoleEl = document.getElementById('logContent');
    if (consoleEl) {
        consoleEl.innerHTML = '<div class="empty-state-msg">The arena awaits the contenders...</div>';
    }
    
    // 2. Restaurar el modo del botón (color y texto)
    setColiseumButtonMode('next');
    
    // 3. Gestión de visibilidad de botones
    const btnInit = document.getElementById('btnInitCombat');
    const btnNext = document.getElementById('btnNextRound');
    if (btnInit && btnNext) {
        btnInit.style.display = 'block';
        btnNext.style.display = 'none';
        // Efecto visual para que el botón de inicio aparezca con fuerza
        gsap.from(btnInit, { scale: 0.5, opacity: 0, duration: 0.3, ease: "back.out(2)" });
    }

    // 4. LIMPIEZA DE LUCHADORES (Fotos, Barras de vida y Selectores)
    ['1', '2'].forEach(num => {
        const img = document.getElementById(`img-f${num}`);
        const placeholder = document.querySelector(`#miniPreviewF${num} .slot-placeholder`);
        const hpBar = document.getElementById(`hp-bar-${num}`);
        const select = document.getElementById(`selectF${num}`);
        const search = document.getElementById(`searchF${num}`);

        // Limpiar imagen y mostrar texto de espera
        if (img) {
            img.src = "";
            img.style.display = 'none';
        }
        if (placeholder) placeholder.style.display = 'block';

        // Resetear barra de vida al 100%
        if (hpBar) {
            gsap.to(hpBar, { width: '100%', duration: 0.3 });
        }

        // Limpiar inputs de selección
        if (select) select.value = "";
        if (search) search.value = "";
    });

    // 5. Reset de estado en consola
    const statusEl = document.getElementById('consoleStatus');
    if (statusEl) {
        statusEl.innerText = 'READY';
        statusEl.style.color = 'var(--text-dim)';
    }
}

// --- 📜 SECCIÓN DE LA BIBLIOTECA (UI) ---






export function previewLibraryCard(id) {
    const card = Engine.cards.find(c => c.id === id);
    const previewImg = document.getElementById('library-preview-img');
    const previewName = document.getElementById('library-preview-name');

    if (card && previewImg) {
        previewImg.src = card.image;
        previewImg.style.display = 'block';
        if (previewName) previewName.innerText = card.name;

        // Animación Vanguard de aparición
        gsap.fromTo(previewImg, 
            { opacity: 0, x: 20 }, 
            { opacity: 1, x: 0, duration: 0.4 }
        );
    }
}

window.handleDeleteCard = function(id) {
    if (confirm("¿Seguro que quieres borrar este héroe de la historia?")) {
        Engine.deleteCard(id);
        displayCards(); // Refresca la lista automáticamente
        
        // Volvemos al estado vacío en el detalle
        const detailContainer = document.getElementById('libraryDetail');
        if (detailContainer) {
            detailContainer.innerHTML = `
                <div class="empty-state-msg">
                    <span style="font-size: 3rem; display: block; margin-bottom: 10px;">🛡️</span>
                    Select a hero to view their file
                </div>`;
        }
    }
};

export function displayCards() {
    const listContainer = document.getElementById('librarySidebarList');
    if (!listContainer) return;

    const library = Engine.cards || [];

    if (library.length === 0) {
        listContainer.innerHTML = `<div class="empty-state-msg">Roster is empty...</div>`;
        return;
    }

    const groups = library.reduce((acc, card) => {
        const className = (card.cardClass || 'Neutral').toUpperCase();
        if (!acc[className]) acc[className] = [];
        acc[className].push(card);
        return acc;
    }, {});

    listContainer.innerHTML = Object.keys(groups).sort().map(className => {
        const formattedClass = className.charAt(0) + className.slice(1).toLowerCase();
        
        return `
        <div class="roster-group">
            <div class="roster-category-header">
                <span class="category-icon">${classIcons[formattedClass] || '🛡️'}</span>
                ${className}S
            </div>
            <div class="roster-category-list">
                ${groups[className].map(card => {
                    const totalPoints = (card.atq || 0) + (card.def || 0) + (card.hp || 0);
                    const rarityClass = totalPoints > 7000 ? 'rarity-legendary' : totalPoints > 5000 ? 'rarity-epic' : 'rarity-common';
                    
                    // ERROR CORREGIDO: Añadido onclick="selectLibraryCard('${card.id}')"
                    return `
                    <div class="card-list-item ${rarityClass}" data-id="${card.id}" onclick="selectLibraryCard('${card.id}')">
                        <div class="item-main-info">
                            <span class="item-element-dot" style="background-color: ${elementConfigs[card.element]?.color || '#fff'}"></span>
                            <span class="item-name">${card.name}</span>
                        </div>
                        <div class="item-stats-brief">
                            <span>⚔️${card.atq}</span> <span>🛡️${card.def}</span> <span>❤️${card.hp}</span>
                        </div>
                    </div>
                `}).join('')}
            </div>
        </div>`;
    }).join('');
}

/**
 * Renderiza el detalle de una carta en el panel derecho de la biblioteca.
 * Diseñado para el "Modo Escaparate" (Showcase Mode).
 */

export function renderCardDetail(card) {
    const detailContainer = document.getElementById('libraryDetail');
    if (!detailContainer) return;

    // Usamos Flexbox para asegurar que la imagen y el texto se vean lado a lado
    detailContainer.style.display = 'flex';
    detailContainer.style.alignItems = 'center';

    detailContainer.innerHTML = `
        <div class="detail-art-container" style="width: 280px; height: 380px; border-radius: 12px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.5); border: 2px solid var(--primary); flex-shrink: 0;">
            <img src="${card.image || ''}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/280x380?text=No+Image'">
        </div>
        
        <div class="detail-info" style="flex: 1; padding-left: 30px;">
            <h2 style="color: var(--primary); font-size: 2.5rem; margin: 0; line-height: 1;">${card.name}</h2>
            <p style="color: var(--text-dim); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; font-weight: bold;">
                ${card.cardClass} // ${card.element}
            </p>
            
            <div class="stats-display" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="font-size: 1.1rem;">❤️ HP: <strong style="color: #ef4444;">${card.hp}</strong></div>
                <div style="font-size: 1.1rem;">🛡️ DEF: <strong style="color: #3b82f6;">${card.def}</strong></div>
                <div style="font-size: 1.1rem;">⚔️ ATQ: <strong style="color: #f59e0b;">${card.atq}</strong></div>
                <div style="font-size: 1.1rem;">✨ SKILL: <strong style="color: #a78bfa;">${card.passiveId || 'None'}</strong></div>
            </div>

            <button onclick="handleDeleteCard('${card.id}')" style="margin-top: 25px; background: linear-gradient(to right, #450a0a, #991b1b); color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                🗑️ Delete Hero from Roster
            </button>
        </div>
    `;

    if (window.gsap) {
        gsap.from(detailContainer.children, { opacity: 0, y: 20, duration: 0.4, stagger: 0.1 });
    }
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



// ui.js

/**
 * Anima el choque de dos cartas en el Coliseo
 */
export function animateCombatHit(isFighter1Attacking) {
    const f1 = document.getElementById('boxF1');
    const f2 = document.getElementById('boxF2');
    if (!f1 || !f2) return;

    const tl = gsap.timeline();

    if (isFighter1Attacking) {
        // Fighter 1 embiste a Fighter 2
        tl.to(f1, { x: 50, duration: 0.1, ease: "power2.in" })
          .to(f1, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });
        
        // Fighter 2 reacciona al golpe (temblor y flash rojo)
        tl.to(f2, { x: 10, rotation: 5, duration: 0.05, yoyo: true, repeat: 3, outline: "4px solid #ef4444" }, "-=0.4")
          .to(f2, { x: 0, rotation: 0, duration: 0.2, outline: "0px solid transparent" });
    } else {
        // Fighter 2 embiste a Fighter 1
        tl.to(f2, { x: -50, duration: 0.1, ease: "power2.in" })
          .to(f2, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });
        
        // Fighter 1 reacciona
        tl.to(f1, { x: -10, rotation: -5, duration: 0.05, yoyo: true, repeat: 3, outline: "4px solid #ef4444" }, "-=0.4")
          .to(f1, { x: 0, rotation: 0, duration: 0.2, outline: "0px solid transparent" });
    }
}


/**
 * Actualiza visualmente la barra de vida y las estadísticas de un luchador
 * @param {Object} fighter - El objeto del luchador con el HP actual
 * @param {number} num - El número del luchador (1 o 2)
 */
export function refreshFighterStats(fighter, num) {
    const hpBar = document.getElementById(`hp-bar-${num}`);
    const hpText = document.getElementById(`statHP-${num}`); // Asegúrate de tener este ID en tu mini-preview o texto de stats

    if (!fighter || !hpBar) return;

    // Calcular porcentaje (evitando división por cero)
    const maxHp = fighter.maxHp || 1000; // O el valor inicial que definas
    const percentage = Math.max(0, (fighter.hp / maxHp) * 100);

    // Animación de la barra de vida con GSAP
    gsap.to(hpBar, {
        width: `${percentage}%`,
        duration: 0.4,
        ease: "power2.out",
        backgroundColor: percentage < 30 ? "#ff0000" : "#ef4444" // Se pone roja intensa si queda poca vida
    });

    // Si tienes un elemento de texto para el HP, actualízalo también
    if (hpText) {
        hpText.innerText = Math.ceil(fighter.hp);
    }
}




/**
 * Efecto visual para cuando salta una pasiva
 */
export function animatePassiveTrigger(fighterNum) {
    const el = document.getElementById(`boxF${fighterNum}`);
    if (!el) return;

    gsap.fromTo(el, 
        { scale: 1, filter: "brightness(1)" }, 
        { 
            scale: 1.1, 
            filter: "brightness(2) drop-shadow(0 0 15px #a78bfa)", 
            duration: 0.3, 
            yoyo: true, 
            repeat: 1, 
            ease: "back.out(1.7)" 
        }
    );
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


/**
 * Actualiza la imagen y el estado visual del luchador en el Coliseo
 */
export function updateFighterPreview(fighter, num) {
    const slot = document.getElementById(`miniPreviewF${num}`);
    const img = document.getElementById(`img-f${num}`);
    const placeholder = slot.querySelector('.slot-placeholder');
    const hpBar = document.getElementById(`hp-bar-${num}`);

    if (fighter && fighter.image) {
        img.src = fighter.image;
        img.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        
        // Reset de barra de vida visual
        if (hpBar) hpBar.style.width = '100%';

        // Animación GSAP de "Invocación"
        gsap.fromTo(img, 
            { scale: 1.5, filter: "brightness(5) contrast(2)", opacity: 0 },
            { scale: 1, filter: "brightness(1) contrast(1)", opacity: 1, duration: 0.6, ease: "power2.out" }
        );
        
        // Brillo en el contenedor según el elemento
        const elementColors = { Fire: '#ef4444', Water: '#3b82f6', Earth: '#10b981', Air: '#60a5fa' };
        gsap.to(slot, { borderColor: elementColors[fighter.element] || '#475569', duration: 0.5 });

    } else {
        img.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
        gsap.to(slot, { borderColor: '#1e293b', duration: 0.3 });
    }
}

window.selectLibraryCard = function(id) {
    const card = Engine.cards.find(c => c.id === id);
    if (card) {
        renderCardDetail(card);
        // Feedback visual: marcar como activa
        document.querySelectorAll('.card-list-item').forEach(el => el.classList.remove('active'));
        document.querySelector(`[data-id="${id}"]`)?.classList.add('active');
    }
};