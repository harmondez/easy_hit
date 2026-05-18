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
    'Monster': '👽', 'Viking': '🪓', 'Pirate': '🏴‍☠️', 'Beast': '🐾', 'Alien': '🛸', 'Neutral': '⚪'
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
    'double_strike': 'Double Strike: Attacks twice in one round',
    'life_leech': 'Leech: Drains 50% of damage dealt as HP',
    'shield_recharge': 'Recharge: Regenerates 10% max HP as shield',
    'abs_def_convert': 'Iron Skin: Converts 50% of damage into DEF',
    'abs_hp_convert': 'Leech: Absorbs 30% of damage as HP',
    'abs_reflect': 'Thorn Armor: Reflects 20% of damage received',
    'fen_revive': 'Graceful Strike: Absorbs lethal hit as HP and strikes back',
    'fen_berserker': 'Berserker: ATK x3 when dropping below 30% HP',
    'fen_last_stand': 'Last Stand: DEF x4 when dropping below 20% HP'
};

// --- 🛠️ FUNCIONES DE INTERFAZ Y NAVEGACIÓN ---

const ALL_SECTION_IDS = ['section-library', 'creatorMainGroup', 'section-coliseo', 'section-adventure', 'section-inventory', 'section-shop'];
const ALL_TAB_IDS = ['tab-library', 'tab-creator', 'tab-coliseo', 'tab-adventure', 'tab-inventory', 'tab-shop'];

// =============================================
// 🔒 COMING SOON TOAST
// =============================================
export function showComingSoon(feature) {
    const existing = document.querySelector('.coming-soon-toast');
    if (existing) existing.remove();

    const labels = {
        coliseo: 'Coliseum',
        adventure: 'Adventure',
        inventory: 'Inventory',
        shop: 'Shop',
        chest: 'Loot Chest',
        reforge: 'Reforge Altar'
    };

    const label = labels[feature] || feature;

    const toast = document.createElement('div');
    toast.className = 'coming-soon-toast';
    toast.innerHTML = `🔒 <strong>${label}</strong> — Coming in Phase 4`;

    document.body.appendChild(toast);

    if (typeof gsap !== 'undefined') {
        try {
            gsap.fromTo(toast, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
            gsap.to(toast, { y: 50, opacity: 0, delay: 2.5, duration: 0.3, onComplete: () => { if (toast.parentNode) toast.remove(); } });
        } catch (e) {
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
        }
    } else {
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
    }
}

export function showSection(section) {
    // Ocultar todas las secciones
    ALL_SECTION_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Quitar active de todas las pestañas
    ALL_TAB_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });

    // Activar sección y pestaña correspondiente
    switch (section) {
        case 'library':
            const lib = document.getElementById('section-library');
            if (lib) { lib.style.display = 'block'; }
            const tabLib = document.getElementById('tab-library');
            if (tabLib) tabLib.classList.add('active');
            displayCards();
            break;

        case 'creator':
            const creatorGroup = document.getElementById('creatorMainGroup');
            if (creatorGroup) { creatorGroup.style.display = 'flex'; }
            const tabCreator = document.getElementById('tab-creator');
            if (tabCreator) tabCreator.classList.add('active');
            break;

        case 'coliseo':
            const col = document.getElementById('section-coliseo');
            if (col) { col.style.display = 'block'; }
            const tabCol = document.getElementById('tab-coliseo');
            if (tabCol) tabCol.classList.add('active');
            renderSelector();
            break;

        case 'adventure':
            const adv = document.getElementById('section-adventure');
            if (adv) { adv.style.display = 'block'; }
            const tabAdv = document.getElementById('tab-adventure');
            if (tabAdv) tabAdv.classList.add('active');
            break;

        case 'inventory':
            const inv = document.getElementById('section-inventory');
            if (inv) { inv.style.display = 'block'; }
            const tabInv = document.getElementById('tab-inventory');
            if (tabInv) tabInv.classList.add('active');
            break;

        case 'shop':
            const shop = document.getElementById('section-shop');
            if (shop) { shop.style.display = 'block'; }
            const tabShop = document.getElementById('tab-shop');
            if (tabShop) tabShop.classList.add('active');
            break;

        default:
            console.warn(`showSection: sección '${section}' no reconocida.`);
    }
}

// --- ⚔️ SECCIÓN DEL COLISEO ---

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

    consoleEl.appendChild(div);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

export function setColiseumButtonMode(mode) {
    const btn = document.getElementById('btnNextRound');
    if (!btn) return;

    if (mode === 'finish') {
        btn.innerText = 'FINALIZAR COMBATE';
        btn.style.background = '#ef4444';
        btn.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
        btn.dataset.mode = 'finish';
    } else {
        btn.innerText = 'NEXT ROUND';
        btn.style.background = 'var(--primary)';
        btn.style.boxShadow = 'none';
        btn.dataset.mode = 'next';
    }
}

export function resetColiseum() {
    const consoleEl = document.getElementById('logContent');
    if (consoleEl) {
        consoleEl.innerHTML = '<div class="empty-state-msg" style="color:#94a3b8;">🏛️ Architect Harmondez Edition — The arena awaits the contenders...</div>';
    }

    setColiseumButtonMode('next');

    const btnInit = document.getElementById('btnInitCombat');
    const btnNext = document.getElementById('btnNextRound');
    if (btnInit && btnNext) {
        btnInit.style.display = 'block';
        btnNext.style.display = 'none';
        if (typeof gsap !== 'undefined') {
            try { gsap.from(btnInit, { scale: 0.5, opacity: 0, duration: 0.3, ease: "back.out(2)" }); } catch (e) {}
        }
    }

    ['1', '2'].forEach(num => {
        const img = document.getElementById(`img-f${num}`);
        const placeholder = document.querySelector(`#miniPreviewF${num} .slot-placeholder`);
        const hpBar = document.getElementById(`hp-bar-${num}`);
        const select = document.getElementById(`selectF${num}`);
        const search = document.getElementById(`searchF${num}`);

        if (img) { img.src = ""; img.style.display = 'none'; }
        if (placeholder) placeholder.style.display = 'block';

        if (hpBar && typeof gsap !== 'undefined') {
            try { gsap.to(hpBar, { width: '100%', duration: 0.3 }); } catch (e) {}
        } else if (hpBar) {
            hpBar.style.width = '100%';
        }

        if (select) select.value = "";
        if (search) search.value = "";
    });

    const statusEl = document.getElementById('consoleStatus');
    if (statusEl) {
        statusEl.innerText = 'READY — AHE';
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

        if (typeof gsap !== 'undefined') {
            try {
                gsap.fromTo(previewImg,
                    { opacity: 0, x: 20 },
                    { opacity: 1, x: 0, duration: 0.4 }
                );
            } catch (e) {}
        }
    }
}

window.handleDeleteCard = function(id) {
    if (confirm("¿Seguro que quieres borrar este héroe de la historia?")) {
        Engine.deleteCard(id);
        displayCards();

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

/**
 * Muestra la lista de cartas en la biblioteca, con filtro opcional por nombre.
 */
export function displayCards(searchTerm) {
    const listContainer = document.getElementById('librarySidebarList');
    if (!listContainer) return;

    const library = Engine.cards || [];
    let filtered = library;

    if (searchTerm && searchTerm.length > 0) {
        const term = searchTerm.toLowerCase();
        filtered = library.filter(c => (c.name || '').toLowerCase().includes(term));
    }

    if (filtered.length === 0) {
        listContainer.innerHTML = `<div class="empty-state-msg">${library.length === 0 ? 'Roster is empty...' : 'No heroes match your search...'}</div>`;
        return;
    }

    const groups = filtered.reduce((acc, card) => {
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
                    const totalPoints = (card.hp || 0) + (card.atq || 0) + (card.def || 0);
                    const isMythic = totalPoints >= 7400;
                    const rarityClass = isMythic ? 'rarity-legendary' : totalPoints > 5000 ? 'rarity-epic' : 'rarity-common';

                    return `
                    <div class="card-list-item ${rarityClass}" data-id="${card.id}" onclick="selectLibraryCard('${card.id}')">
                        <div class="item-main-info">
                            <span class="item-element-dot" style="background-color: ${elementConfigs[card.element]?.color || '#fff'}"></span>
                            <span class="item-name">${card.name}</span>
                        </div>
                        <div class="item-stats-brief">
                            <span style="color:#ef4444">❤️${card.hp}</span>
                            <span style="color:#49BBEB">🛡️${card.def}</span>
                            <span style="color:#f59e0b">⚔️${card.atq}</span>
                        </div>
                    </div>
                `}).join('')}
            </div>
        </div>`;
    }).join('');
}

/**
 * Renderiza el detalle de una carta en el panel derecho de la biblioteca.
 */
export function renderCardDetail(card) {
    const detailContainer = document.getElementById('libraryDetail');
    if (!detailContainer) return;

    const skillName = passiveNames[card.passiveId] || card.passiveId || 'None';
    const elementColor = elementConfigs[card.element]?.color || '#94a3b8';
    const totalStats = (card.hp || 0) + (card.atq || 0) + (card.def || 0);
    const isMythic = totalStats >= 7400;

    detailContainer.innerHTML = `
        <div class="tcg-card ${isMythic ? 'mythic-glow' : ''}" style="
            width: 320px;
            height: 450px;
            background: #1a1a1a;
            border-radius: 18px;
            position: relative;
            padding: 12px;
            box-sizing: border-box;
            border: 8px solid #222;
            outline: 2px solid ${isMythic ? '#ffd700' : '#444'};
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            flex-shrink: 0;
        ">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: linear-gradient(90deg, rgba(255,255,255,0.1), transparent);
                padding: 5px 10px;
                border-radius: 5px;
                border: 1px solid rgba(255,255,255,0.2);
                margin-bottom: 8px;
            ">
                <span style="font-weight: 800; font-size: 1rem; color: #eee; text-transform: uppercase; letter-spacing: 1px;">${card.name}</span>
                <span>${elementConfigs[card.element]?.icon || '🔘'}</span>
            </div>

            <div style="
                width: 100%;
                height: 200px;
                background: #000;
                border-radius: 5px;
                overflow: hidden;
                border: 3px solid #333;
                box-shadow: inset 0 0 10px #000;
            ">
                <img src="${card.image || ''}" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) brightness(1.1);" onerror="this.src='https://via.placeholder.com/300x200?text=Forjando...'">
            </div>

            <div style="
                margin: 8px 0;
                background: #2a2a2a;
                padding: 2px 10px;
                font-size: 0.75rem;
                font-weight: bold;
                color: ${elementColor};
                border: 1px solid ${elementColor}44;
                border-radius: 3px;
                font-style: italic;
            ">
                ${card.cardClass} // ${card.element}
            </div>

            <div style="
                flex-grow: 1;
                background: #e2e2e2;
                border-radius: 4px;
                padding: 10px;
                color: #111;
                font-size: 0.85rem;
                line-height: 1.3;
                border: 2px solid #999;
                box-shadow: inset 2px 2px 5px rgba(0,0,0,0.2);
                overflow-y: auto;
            ">
                <b style="color: #333;">Ability:</b><br>
                <span style="color: #444;">${skillName}</span>
            </div>

            <div style="
                display: flex;
                justify-content: space-around;
                margin-top: 10px;
                font-weight: 900;
                font-size: 0.9rem;
            ">
                <span style="color: #ef4444; text-shadow: 1px 1px 0 #000;">❤️ ${card.hp}</span>
                <span style="color: #3b82f6; text-shadow: 1px 1px 0 #000;">🛡️ ${card.def}</span>
                <span style="color: #f59e0b; text-shadow: 1px 1px 0 #000;">⚔️ ${card.atq}</span>
            </div>
        </div>

        <div class="detail-actions" style="flex: 1; padding-left: 40px; text-align: left;">
            <h3 style="color: var(--text-dim); margin-bottom: 5px;">HERO DATA FILE</h3>
            <div style="width: 50px; height: 4px; background: ${elementColor}; margin-bottom: 20px;"></div>

            <p style="color: var(--text-dim); line-height: 1.6; font-size: 0.9rem; margin-bottom: 30px;">
                This unit belongs to the <strong>${card.cardClass}</strong> faction.
                Infused with the <strong>${card.element}</strong> core, it possesses a total combat power of
                <span style="color: var(--primary); font-weight: bold;">${totalStats}</span> points.
            </p>

            <button onclick="handleDeleteCard('${card.id}')" class="btn-delete-pro">
                DISMANTLE HERO
            </button>
        </div>
    `;

    if (typeof gsap !== 'undefined') {
        try {
            gsap.from(".tcg-card", { rotateY: 90, opacity: 0, duration: 0.6, ease: "power2.out" });
            gsap.from(".detail-actions", { x: 50, opacity: 0, duration: 0.5, delay: 0.2 });
        } catch (e) {}
    }
}

// --- 🔨 SECCIÓN DE LA FORJA (Creador) ---

export let currentCropper = null;
export let croppedImageBase64 = null;

export function updatePreview(croppedImg) {
    const previewContainer = document.getElementById('cardVisual');
    if (!previewContainer) return;

    const name = document.getElementById('cardName')?.value || "Unnamed Hero";
    const element = document.getElementById('cardElement')?.value || "Neutral";
    const cardClass = document.getElementById('cardClass')?.value || "Human";
    const passiveId = document.getElementById('cardPassive')?.value || "";
    const hp = parseInt(document.getElementById('inputHP')?.value) || 1;
    const def = parseInt(document.getElementById('inputDEF')?.value) || 1;
    const atq = parseInt(document.getElementById('inputATQ')?.value) || 1;

    const skillName = passiveNames[passiveId] || "Passive: Select one";
    const config = elementConfigs[element];
    const totalStats = hp + def + atq;
    const isMythic = totalStats >= 7400;

    previewContainer.innerHTML = `
        <div class="tcg-card ${isMythic ? 'mythic-glow' : ''}" style="
            width: 310px;
            height: 440px;
            background: #1a1a1a;
            border-radius: 18px;
            padding: 12px;
            box-sizing: border-box;
            border: 6px solid #222;
            outline: 2px solid ${isMythic ? '#ffd700' : '#444'};
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            margin: auto;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 8px;">
                <span style="font-weight: 800; font-size: 0.9rem; color: #eee; text-transform: uppercase;">${name}</span>
                <span>${config?.icon || '🔘'}</span>
            </div>

            <div id="previewArt" style="width: 100%; height: 190px; background: #000; border-radius: 4px; overflow: hidden; border: 2px solid #333; background-image: url('${croppedImg || ''}'); background-size: cover; background-position: center;">
                ${!croppedImg ? '<div style="color:#444; display:flex; align-items:center; justify-content:center; height:100%; font-size:0.8rem;">AWAITING ART...</div>' : ''}
            </div>

            <div style="margin: 8px 0; background: #2a2a2a; padding: 2px 10px; font-size: 0.7rem; font-weight: bold; color: ${config?.color || '#fff'}; border: 1px solid ${config?.color}44; border-radius: 3px; font-style: italic;">
                ${classIcons[cardClass] || '❓'} ${cardClass} // ${element}
            </div>

            <div style="flex-grow: 1; background: #d1d1d1; border-radius: 4px; padding: 8px; color: #111; font-size: 0.75rem; line-height: 1.2; border: 2px solid #888; overflow-y: auto;">
                <b style="color: #000;">Ability:</b><br>
                <span>${skillName}</span>
            </div>

            <div style="display: flex; justify-content: space-around; margin-top: 10px; font-weight: 900; font-size: 0.85rem;">
                <span style="color: #ef4444; text-shadow: 1px 1px 0 #000;">❤️ ${hp}</span>
                <span style="color: #3b82f6; text-shadow: 1px 1px 0 #000;">🛡️ ${def}</span>
                <span style="color: #f59e0b; text-shadow: 1px 1px 0 #000;">⚔️ ${atq}</span>
            </div>
        </div>
    `;

    croppedImageBase64 = croppedImg;
}

export function updateRemainingPoints() {
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

        if (remaining < 0 && typeof gsap !== 'undefined') {
            try { gsap.to(display, { x: 5, yoyo: true, repeat: 5, duration: 0.05 }); } catch (e) {}
        }
    }

    const labels = { 'valHP': hp, 'valDEF': def, 'valATQ': atq };
    for (const [id, val] of Object.entries(labels)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }

    updatePreview(croppedImageBase64);
    return remaining >= 0;
}

export function resetCropperData() {
    croppedImageBase64 = null;
    const previewArt = document.getElementById('previewArt');
    if (previewArt) previewArt.style.backgroundImage = '';

    const fileInput = document.getElementById('cardImgFile');
    if (fileInput) fileInput.value = '';

    if (document.getElementById('inputHP')) document.getElementById('inputHP').value = 1;
    if (document.getElementById('inputDEF')) document.getElementById('inputDEF').value = 1;
    if (document.getElementById('inputATQ')) document.getElementById('inputATQ').value = 1;

    updateRemainingPoints();
    updatePreview(null);
}

/**
 * Anima el choque de dos cartas en el Coliseo.
 * Corregido: usa boxShadow en lugar de outline (no animable por GSAP).
 */
export function animateCombatHit(isFighter1Attacking) {
    const f1 = document.getElementById('boxF1');
    const f2 = document.getElementById('boxF2');
    if (!f1 || !f2) return;

    if (typeof gsap === 'undefined') return;

    const tl = gsap.timeline({ onComplete: () => {
        f2.style.boxShadow = '';
        f1.style.boxShadow = '';
    }});

    if (isFighter1Attacking) {
        tl.to(f1, { x: 50, duration: 0.1, ease: "power2.in" })
          .to(f1, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });

        tl.to(f2, {
            x: 10, rotation: 5, duration: 0.05,
            boxShadow: "0 0 25px 8px rgba(239,68,68,0.8)",
            yoyo: true, repeat: 3
        }, "-=0.4")
          .to(f2, { x: 0, rotation: 0, duration: 0.2, boxShadow: "0 0 0px rgba(239,68,68,0)" });
    } else {
        tl.to(f2, { x: -50, duration: 0.1, ease: "power2.in" })
          .to(f2, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });

        tl.to(f1, {
            x: -10, rotation: -5, duration: 0.05,
            boxShadow: "0 0 25px 8px rgba(239,68,68,0.8)",
            yoyo: true, repeat: 3
        }, "-=0.4")
          .to(f1, { x: 0, rotation: 0, duration: 0.2, boxShadow: "0 0 0px rgba(239,68,68,0)" });
    }
}

/**
 * Actualiza visualmente la barra de vida y las estadísticas de un luchador.
 */
export function refreshFighterStats(fighter, num) {
    const hpBar = document.getElementById(`hp-bar-${num}`);
    const hpText = document.getElementById(`statHP-${num}`);

    if (!fighter || !hpBar) return;

    const maxHp = fighter.maxHp || 1000;
    const percentage = Math.max(0, (fighter.hp / maxHp) * 100);

    if (typeof gsap !== 'undefined') {
        try {
            gsap.to(hpBar, {
                width: `${percentage}%`,
                duration: 0.4,
                ease: "power2.out",
                backgroundColor: percentage < 30 ? "#ff0000" : "#ef4444"
            });
        } catch (e) {}
    } else {
        hpBar.style.width = `${percentage}%`;
        hpBar.style.backgroundColor = percentage < 30 ? "#ff0000" : "#ef4444";
    }

    if (hpText) {
        hpText.innerText = Math.ceil(fighter.hp);
    }
}

/**
 * Efecto visual para cuando salta una pasiva.
 */
export function animatePassiveTrigger(fighterNum) {
    const el = document.getElementById(`boxF${fighterNum}`);
    if (!el || typeof gsap === 'undefined') return;

    try {
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
    } catch (e) {}
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
 * Actualiza la imagen y el estado visual del luchador en el Coliseo.
 */
export function updateFighterPreview(fighter, num) {
    const slot = document.getElementById(`miniPreviewF${num}`);
    const img = document.getElementById(`img-f${num}`);
    const placeholder = slot ? slot.querySelector('.slot-placeholder') : null;
    const hpBar = document.getElementById(`hp-bar-${num}`);
    const stats = document.getElementById(`statsF${num}`);

    if (fighter && fighter.image) {
        if (img) {
            img.src = fighter.image;
            img.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (stats) stats.style.display = 'flex';

        if (hpBar) hpBar.style.width = '100%';

        const hpEl = document.getElementById(`statHP-${num}`);
        const atqEl = document.getElementById(`statATQ-${num}`);
        const defEl = document.getElementById(`statDEF-${num}`);
        const nameEl = document.getElementById(`statNameF${num}`);
        if (hpEl) hpEl.innerText = fighter.hp || 0;
        if (atqEl) atqEl.innerText = fighter.atq || 0;
        if (defEl) defEl.innerText = fighter.def || 0;
        if (nameEl) nameEl.innerText = fighter.name || '';

        if (img && typeof gsap !== 'undefined') {
            try {
                gsap.fromTo(img,
                    { scale: 1.5, filter: "brightness(5) contrast(2)", opacity: 0 },
                    { scale: 1, filter: "brightness(1) contrast(1)", opacity: 1, duration: 0.6, ease: "power2.out" }
                );
            } catch (e) {}
        }

        if (stats && typeof gsap !== 'undefined') {
            try {
                gsap.fromTo(stats,
                    { y: 10, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.4, delay: 0.2 }
                );
            } catch (e) {}
        }

        const elementColors = { Fire: '#ef4444', Water: '#3b82f6', Earth: '#10b981', Air: '#60a5fa' };
        if (slot && typeof gsap !== 'undefined') {
            try { gsap.to(slot, { borderColor: elementColors[fighter.element] || '#475569', duration: 0.5 }); } catch (e) {}
        } else if (slot) {
            slot.style.borderColor = elementColors[fighter.element] || '#475569';
        }
    } else {
        if (img) { img.style.display = 'none'; }
        if (placeholder) placeholder.style.display = 'block';
        if (stats) stats.style.display = 'none';
        if (slot && typeof gsap !== 'undefined') {
            try { gsap.to(slot, { borderColor: '#1e293b', duration: 0.3 }); } catch (e) {}
        } else if (slot) {
            slot.style.borderColor = '#1e293b';
        }
    }
}

window.selectLibraryCard = function(id) {
    const card = Engine.cards.find(c => c.id === id);
    if (card) {
        renderCardDetail(card);
        document.querySelectorAll('.card-list-item').forEach(el => el.classList.remove('active'));
        const el = document.querySelector(`[data-id="${id}"]`);
        if (el) el.classList.add('active');
    }
};

// --- 📤 FUNCIONES DE EXPORTACIÓN/IMPORTACIÓN (Migradas desde engine.js) ---

export function exportarBiblioteca() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(Engine.cards));
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

            if (Array.isArray(imported) && imported.every(c => c.id && c.name)) {
                const success = Engine.importCards(imported);
                if (success) {
                    console.log(`📥 Importación exitosa: ${imported.length} cartas procesadas.`);
                    if (callback) callback();
                } else {
                    throw new Error("Error al fusionar bibliotecas.");
                }
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

// =============================================
// 🗺️ RENDER MAP NODES (Adventure World Map)
// =============================================
export function renderMapNodes() {
    const canvas = document.getElementById('worldMapCanvas');
    if (!canvas) return;

    const nodes = [
        { id: 'node1', x: 10, y: 50, icon: '🏰', label: 'Stage 1', status: 'completed' },
        { id: 'node2', x: 30, y: 20, icon: '🌲', label: 'Stage 2', status: 'completed' },
        { id: 'node3', x: 55, y: 35, icon: '🏜️', label: 'Stage 3', status: 'active' },
        { id: 'node4', x: 45, y: 65, icon: '🗿', label: 'Stage 4', status: 'locked' },
        { id: 'node5', x: 70, y: 55, icon: '🌋', label: 'Stage 5', status: 'locked' },
        { id: 'node6', x: 85, y: 25, icon: '👑', label: 'BOSS', status: 'locked', boss: true }
    ];

    canvas.innerHTML = nodes.map(n => {
        const cls = `map-node${n.status === 'active' ? ' active' : ''}${n.status === 'locked' ? ' locked' : ''}${n.status === 'completed' ? ' completed' : ''}${n.boss ? ' boss' : ''}`;
        return `<div class="${cls}" style="left:${n.x}%;top:${n.y}%;" data-node="${n.id}" title="${n.label}">${n.icon}</div>`;
    }).join('');
}

// =============================================
// 📖 RENDER CODEX (Drop Codex)
// =============================================
export function renderCodex() {
    const grid = document.getElementById('codexGrid');
    const progress = document.getElementById('codexProgress');
    if (!grid) return;

    const codexEntries = [
        { id: 'c1', name: 'Forest Wisp', icon: '🧚', dropRate: '25%', owned: true },
        { id: 'c2', name: 'Stone Golem', icon: '🗿', dropRate: '15%', owned: true },
        { id: 'c3', name: 'Shadow Stalker', icon: '👻', dropRate: '10%', owned: false },
        { id: 'c4', name: 'Fire Drake', icon: '🐉', dropRate: '5%', owned: false },
        { id: 'c5', name: 'Abyssal Mage', icon: '🧙', dropRate: '3%', owned: false },
        { id: 'c6', name: 'Colossal Warden', icon: '👁️', dropRate: '1%', owned: false }
    ];

    const owned = codexEntries.filter(e => e.owned).length;

    grid.innerHTML = codexEntries.map(e => `
        <div class="codex-entry${e.owned ? ' owned' : ''}">
            <div class="codex-icon">${e.icon}</div>
            <div class="codex-name">${e.name}</div>
            <div class="codex-drop-rate">${e.owned ? '✅ Collected' : `⬜ ${e.dropRate}`}</div>
        </div>
    `).join('');

    if (progress) {
        progress.innerText = `${owned}/${codexEntries.length} collected`;
    }
}

// =============================================
// 🎴 CHEST OPEN (Loot Chest Modal)
// =============================================
export function openChest(count, gameState) {
    const modal = document.getElementById('chestModal');
    const lid = document.getElementById('chestLid');
    const rewardArea = document.getElementById('chestRewardArea');
    const chestOpenBtn = document.getElementById('btnChestOpen');

    if (!modal || !lid || !rewardArea) return;

    modal.style.display = 'flex';
    lid.className = 'chest-lid';
    rewardArea.innerHTML = `<span style="color:var(--text-dim);font-size:0.9rem;">Click to open ${count > 1 ? `${count} chests` : 'the chest'}...</span>`;
    if (chestOpenBtn) chestOpenBtn.style.display = 'none';

    // Animar apertura
    lid.classList.add('open');

    setTimeout(() => {
        const rewardCards = generateRewardCards(count);
        let rewardsHTML = '';

        rewardCards.forEach((card, i) => {
            const delay = i * 150;
            rewardsHTML += `
                <div class="chest-reward-card rarity-${card.rarity}" style="animation-delay:${delay}ms; text-align:center; margin:8px; padding:10px; background:var(--bg-card); border-radius:10px; border:2px solid ${card.borderColor};">
                    <div style="font-size:2rem;">${card.icon}</div>
                    <div style="font-weight:700;font-size:0.9rem;">${card.name}</div>
                    <div style="font-size:0.75rem;color:var(--text-dim);">${card.rarity.toUpperCase()}</div>
                </div>
            `;
        });

        rewardArea.innerHTML = `
            <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;">${rewardsHTML}</div>
            <button id="btnChestClaim" class="btn-forge" style="margin-top:20px;padding:12px 30px;width:auto;" onclick="document.getElementById('chestModal').style.display='none'">CLAIM ALL</button>
        `;

        if (count > 1 && typeof gsap !== 'undefined') {
            try {
                gsap.from('.chest-reward-card', { scale: 0, rotation: 180, duration: 0.5, stagger: 0.1, ease: "back.out(2)" });
            } catch (e) {}
        }

        if (chestOpenBtn) chestOpenBtn.style.display = 'inline-block';
    }, 700);
}

function generateRewardCards(count) {
    const pool = [
        { name: 'Iron Shield', icon: '🛡️', rarity: 'common', borderColor: '#94a3b8' },
        { name: 'Healing Potion', icon: '🧪', rarity: 'common', borderColor: '#94a3b8' },
        { name: 'Silver Dagger', icon: '🗡️', rarity: 'common', borderColor: '#94a3b8' },
        { name: 'Arcane Scroll', icon: '📜', rarity: 'rare', borderColor: '#3b82f6' },
        { name: 'Shadow Amulet', icon: '📿', rarity: 'rare', borderColor: '#3b82f6' },
        { name: 'Dragon Scale', icon: '🐉', rarity: 'epic', borderColor: '#a78bfa' },
        { name: 'Phoenix Feather', icon: '🪶', rarity: 'epic', borderColor: '#a78bfa' },
        { name: 'Excalibur Shard', icon: '⚔️', rarity: 'legendary', borderColor: '#fbbf24' },
        { name: 'Crown of Ages', icon: '👑', rarity: 'legendary', borderColor: '#fbbf24' },
        { name: 'Void Crystal', icon: '💎', rarity: 'mythic', borderColor: '#ff6b6b' }
    ];

    const results = [];
    for (let i = 0; i < count; i++) {
        const pick = pool[Math.floor(Math.random() * pool.length)];
        results.push({ ...pick });
    }
    return results;
}
