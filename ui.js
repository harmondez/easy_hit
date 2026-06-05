import { cards } from './engine.js';
import * as Engine from './engine.js';

function esc(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return '&#39;';
    });
}

export const elementConfigs = {
    'Fuego':      { icon: '🔥', color: '#ef4444' },
    'Agua':       { icon: '💧', color: '#3b82f6' },
    'Rayo':       { icon: '⚡', color: '#f59e0b' },
    'Naturaleza': { icon: '🌿', color: '#10b981' },
    'Oscuridad':  { icon: '🌑', color: '#7c3aed' },
    'Luz':        { icon: '☀️', color: '#fbbf24' }
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
    'fen_last_stand': 'Last Stand: DEF x4 when dropping below 20% HP',
    'fen_antimatter': 'Overkill: Detonates core upon death (Negative Victory)',
    'anti_armor': 'Anti-Armor: +50% ATK vs targets with DEF > 0',
    'armor_piercing': 'Armor Piercing: Ignores 50% of enemy DEF',
    'orc_warlord': 'Warlord: Blocks 1st hit and enters enraged state'
};

// --- 🛠️ FUNCIONES DE INTERFAZ Y NAVEGACIÓN ---

const ALL_SECTION_IDS = ['section-library', 'creatorMainGroup', 'section-coliseo', 'section-adventure', 'section-gallery', 'section-tournament', 'section-inventory', 'section-shop'];
const ALL_TAB_IDS = ['tab-library', 'tab-creator', 'tab-coliseo', 'tab-adventure', 'tab-gallery', 'tab-tournament', 'tab-inventory', 'tab-shop'];

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
    toast.innerHTML = `🔒 <strong>${label}</strong> — Coming in Phase 5`;

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

        case 'gallery':
            const gal = document.getElementById('section-gallery');
            if (gal) { gal.style.display = 'block'; }
            const tabGal = document.getElementById('tab-gallery');
            if (tabGal) tabGal.classList.add('active');
            renderGallery();
            break;

        case 'tournament':
            const tourn = document.getElementById('section-tournament');
            if (tourn) { tourn.style.display = 'block'; }
            const tabTourn = document.getElementById('tab-tournament');
            if (tabTourn) tabTourn.classList.add('active');
            renderTournamentSetup();
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

// =============================================
// 📋 2A — TURN ORDER BAR
// =============================================
export function renderTurnBar(turnQueue, currentIndex, containerId = 'coliseumTurnBar') {
    const bar = document.getElementById(containerId);
    if (!bar || !turnQueue) return;

    if (turnQueue.length === 0) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';

    const total = turnQueue.length;
    const startIdx = currentIndex;
    const maxShow = 8;
    const preview = [];

    for (let i = 0; i < Math.min(maxShow, total); i++) {
        const idx = (startIdx + i) % total;
        const entry = turnQueue[idx];
        if (!entry || !entry.actor) continue;
        preview.push({ ...entry, queueIdx: idx });
    }

    bar.innerHTML = preview.map((entry, i) => {
        const isActive = entry.queueIdx === currentIndex && i === 0;
        const isDead = entry.actor.hp <= 0;
        const sideClass = entry.isAlly ? 'ally' : 'enemy';
        const imgSrc = entry.actor.image || '';
        const imgHtml = imgSrc
            ? `<img class="tb-portrait" src="${esc(imgSrc)}" alt="">`
            : `<span class="tb-portrait" style="background:${entry.isAlly ? '#3b82f6' : '#ef4444'};display:inline-flex;align-items:center;justify-content:center;font-size:0.6rem;">${entry.isAlly ? 'A' : 'E'}</span>`;

        const nameDisplay = entry.actor.name.length > 8
            ? entry.actor.name.slice(0, 7) + '…'
            : entry.actor.name;

        let html = `<div class="turn-bar-entry ${isActive ? 'active' : ''} ${isDead ? 'dead' : ''} ${sideClass}">`;
        html += imgHtml;
        html += `<span class="tb-name">${esc(nameDisplay)}</span>`;
        html += `<span class="tb-vel">💨${entry.vel}</span>`;
        html += `</div>`;

        if (i < preview.length - 1) {
            html += `<span class="turn-bar-arrow">→</span>`;
        }
        return html;
    }).join('');
}

// --- ⚔️ SECCIÓN DEL COLISEO ---

export function renderSelector() {
    const select1 = document.getElementById('selectF1');
    const select2 = document.getElementById('selectF2');
    if (!select1 || !select2) return;

    const allCards = Engine.getAllPlayableCards();

    const groups = allCards.reduce((acc, card) => {
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
            const tag = card._official ? '🏛️ ' : '';
            optionsHTML += `<option value="${esc(card.id)}">${tag}${esc(card.name)} (ATK: ${card.atq})</option>`;
        });
        optionsHTML += `</optgroup>`;
    });

    select1.innerHTML = optionsHTML;
    select2.innerHTML = optionsHTML;
}

let _currentTurnGroup = null;
const _turnGroupMap = new Map();

function _shouldAutoScroll(el) {
    const threshold = 40;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
}

export function logConsole(msg, type = 'system', round = null, containerId = 'logContent') {
    const consoleEl = document.getElementById(containerId);
    if (!consoleEl) return;

    const prefix = containerId === 'pveLogContent' ? 'T' : 'R';

    if (type === 'round-header') {
        const group = document.createElement('div');
        group.className = 'log-turn-group';
        const header = document.createElement('div');
        header.className = 'log-turn-header';
        const tag = round !== null ? `<span class="log-round-tag">${prefix}${round}</span> ` : '';
        header.innerHTML = `${tag}${esc(msg.replace(/^[^\s]+\s*/, ''))}`;
        group.appendChild(header);
        const msgContainer = document.createElement('div');
        msgContainer.className = 'log-turn-messages';
        group.appendChild(msgContainer);
        consoleEl.appendChild(group);
        if (_shouldAutoScroll(consoleEl)) consoleEl.scrollTop = consoleEl.scrollHeight;
        _currentTurnGroup = group;
        _turnGroupMap.set(containerId, group);
        return;
    }

    // Append to current turn group, or directly to container
    const targetGroup = _turnGroupMap.get(containerId);
    const parent = targetGroup ? targetGroup.querySelector('.log-turn-messages') : null;
    const targetEl = parent || consoleEl;

    const div = document.createElement('div');
    div.className = `log-entry ${type}`;

    let roundTag = '';
    if (round !== null) {
        roundTag = `<span class="log-round-tag">${prefix}${round}</span> `;
    }
    div.innerHTML = `${roundTag}${esc(msg)}`;

    targetEl.appendChild(div);
    if (_shouldAutoScroll(consoleEl)) consoleEl.scrollTop = consoleEl.scrollHeight;
}

export function resetTurnGroups(containerId) {
    _turnGroupMap.delete(containerId);
    if (_currentTurnGroup) _currentTurnGroup = null;
}

export function pveLogConsole(msg, type = 'system', turn = null) {
    logConsole(msg, type, turn, 'pveLogContent');
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
    resetTurnGroups('logContent');
    const consoleEl = document.getElementById('logContent');
    if (consoleEl) {
        consoleEl.innerHTML = '<div class="empty-state-msg" style="color:#94a3b8;">🏛️ Architect Harmondez Edition — The arena awaits the contenders...</div>';
    }

    const turnBar = document.getElementById('coliseumTurnBar');
    if (turnBar) turnBar.style.display = 'none';

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
    const library = Engine.cards || [];
    const card = library.find(c => c.id === id);
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
        const library = Engine.cards || [];
        if (library.length <= 1) {
            alert("No puedes eliminar la única carta restante.");
            return;
        }
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
                    const totalPoints = (card.hp || 0) + (card.atq || 0) + (card.def || 0) + ((card.vel || 0) * Engine.VEL_WEIGHT);
                    const isMythic = totalPoints >= Engine.STAT_LIMIT;
                    const rarityClass = isMythic ? 'rarity-legendary' : totalPoints > 5000 ? 'rarity-epic' : 'rarity-common';

                    return `
                    <div class="card-list-item ${rarityClass}" data-id="${esc(card.id)}" onclick="selectLibraryCard('${esc(card.id)}')">
                        <div class="item-main-info">
                            <span class="item-element-dot" style="background-color: ${elementConfigs[card.element]?.color || '#fff'}"></span>
                            <span class="item-name">${esc(card.name)}</span>
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

// =============================================
// 🖼️ RENDER GALERÍA OFICIAL
// =============================================
export function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    const official = Engine.OFFICIAL_CARDS || [];

    grid.innerHTML = official.map(card => {
        const totalStats = (card.hp || 0) + (card.atq || 0) + (card.def || 0) + ((card.vel || 0) * Engine.VEL_WEIGHT);
        const elCfg = elementConfigs[card.element] || { icon: '❓', color: '#777' };
        const classIcon = classIcons[card.cardClass] || '👤';
        const ultData = Engine.ULTIMATE_DB[card.ultimateId];
        const ultName = ultData ? ultData.name : '—';
        const passName = passiveNames[card.passiveId] || card.passiveId || 'None';

        return `
        <div class="gallery-card-item">
            <div class="gallery-card-header" style="border-left: 4px solid ${elCfg.color};">
                <div class="gallery-card-name">${elCfg.icon} ${esc(card.name)}</div>
                <div class="gallery-card-class">${classIcon} ${card.cardClass}</div>
            </div>
            <div class="gallery-card-img-wrapper">
                <img class="gallery-card-img" src="${esc(card.image || '')}" alt="${esc(card.name)}"
                     onerror="this.src='https://via.placeholder.com/280x160?text=${encodeURIComponent(card.name)}'">
            </div>
            <div class="gallery-card-stats">
                <div class="gallery-stat"><span class="gsl">❤️</span> ${card.hp}</div>
                <div class="gallery-stat"><span class="gsl">🛡️</span> ${card.def}</div>
                <div class="gallery-stat"><span class="gsl">⚔️</span> ${card.atq}</div>
                <div class="gallery-stat"><span class="gsl">💨</span> ${card.vel}</div>
                <div class="gallery-stat"><span class="gsl">📊</span> ${totalStats}</div>
            </div>
            <div class="gallery-card-detail">
                <div class="gallery-detail-row"><span class="gdl">Passive:</span> ${esc(passName)}</div>
                <div class="gallery-detail-row"><span class="gdl">Ultimate:</span> ${esc(ultName)}</div>
                <div class="gallery-detail-row gallery-desc">${esc(card.description || '')}</div>
            </div>
        </div>
        `;
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
    const totalStats = (card.hp || 0) + (card.atq || 0) + (card.def || 0) + ((card.vel || 0) * Engine.VEL_WEIGHT);
    const isMythic = totalStats >= Engine.STAT_LIMIT;

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
                <span style="font-weight: 800; font-size: 1rem; color: #eee; text-transform: uppercase; letter-spacing: 1px;">${esc(card.name)}</span>
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
                <img src="${esc(card.image || '')}" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) brightness(1.1);" onerror="this.src='https://via.placeholder.com/300x200?text=Forjando...'">
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
                ${esc(card.cardClass)} // ${esc(card.element)}
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
                <span style="color: #a78bfa; text-shadow: 1px 1px 0 #000;">💨 ${card.vel || 100}</span>
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

            <button onclick="handleDeleteCard('${esc(card.id)}')" class="btn-delete-pro">
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
    const ultimateId = document.getElementById('cardUltimate')?.value || "";
    const hp = parseInt(document.getElementById('inputHP')?.value) || 1;
    const def = parseInt(document.getElementById('inputDEF')?.value) || 1;
    const atq = parseInt(document.getElementById('inputATQ')?.value) || 1;
    const vel = parseInt(document.getElementById('inputVEL')?.value) || 100;

    const skillName = passiveNames[passiveId] || "Passive: Select one";
    const ultName = ultimateId ? (Engine.ULTIMATE_DB[ultimateId]?.name || 'Ultimate') : '';
    const config = elementConfigs[element];
    const totalStats = hp + def + atq + (vel * Engine.VEL_WEIGHT);
    const isMythic = totalStats >= Engine.STAT_LIMIT;

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
                <span style="font-weight: 800; font-size: 0.9rem; color: #eee; text-transform: uppercase;">${esc(name)}</span>
                <span>${config?.icon || '🔘'}</span>
            </div>

            <div id="previewArt" style="width: 100%; height: 190px; background: #000; border-radius: 4px; overflow: hidden; border: 2px solid #333; background-image: url('${esc(croppedImg || '')}'); background-size: cover; background-position: center;">
                ${!croppedImg ? '<div style="color:#444; display:flex; align-items:center; justify-content:center; height:100%; font-size:0.8rem;">AWAITING ART...</div>' : ''}
            </div>

            <div style="margin: 8px 0; background: #2a2a2a; padding: 2px 10px; font-size: 0.7rem; font-weight: bold; color: ${config?.color || '#fff'}; border: 1px solid ${config?.color}44; border-radius: 3px; font-style: italic;">
                ${classIcons[cardClass] || '❓'} ${esc(cardClass)} // ${esc(element)}
            </div>

            <div style="flex-grow: 1; background: #d1d1d1; border-radius: 4px; padding: 8px; color: #111; font-size: 0.75rem; line-height: 1.2; border: 2px solid #888; overflow-y: auto;">
                <b style="color: #000;">Passive:</b><br>
                <span>${skillName}</span>
                ${ultName ? `<br><b style="color: #000;">Ultimate:</b><br><span style="color:#ef4444;">🔥 ${ultName}</span>` : ''}
            </div>

            <div style="display: flex; justify-content: space-around; margin-top: 10px; font-weight: 900; font-size: 0.85rem;">
                <span style="color: #ef4444; text-shadow: 1px 1px 0 #000;">❤️ ${hp}</span>
                <span style="color: #3b82f6; text-shadow: 1px 1px 0 #000;">🛡️ ${def}</span>
                <span style="color: #f59e0b; text-shadow: 1px 1px 0 #000;">⚔️ ${atq}</span>
                <span id="previewStatVEL" style="color: #a78bfa; text-shadow: 1px 1px 0 #000;">💨 ${vel}</span>
            </div>
        </div>
    `;

    croppedImageBase64 = croppedImg;
}

export function updateRemainingPoints() {
    const elHP = document.getElementById('inputHP');
    const elDEF = document.getElementById('inputDEF');
    const elATQ = document.getElementById('inputATQ');
    const elVEL = document.getElementById('inputVEL');

    const hp = elHP ? parseInt(elHP.value) || 0 : 0;
    const def = elDEF ? parseInt(elDEF.value) || 0 : 0;
    const atq = elATQ ? parseInt(elATQ.value) || 0 : 0;
    const vel = elVEL ? parseInt(elVEL.value) || 0 : 0;

    const total = hp + def + atq + (vel * Engine.VEL_WEIGHT);
    const remaining = Engine.STAT_LIMIT - total;

    const display = document.getElementById('remainingPts');
    if (display) {
        display.innerText = remaining;
        display.style.color = remaining < 0 ? "#ef4444" : "#10b981";

        if (remaining < 0 && typeof gsap !== 'undefined') {
            try { gsap.to(display, { x: 5, yoyo: true, repeat: 5, duration: 0.05 }); } catch (e) {}
        }
    }

    const labels = { 'valHP': hp, 'valDEF': def, 'valATQ': atq, 'valVEL': vel, 'statVEL': vel };
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
    if (document.getElementById('inputVEL')) document.getElementById('inputVEL').value = 100;

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

    const tl = gsap.timeline();

    if (isFighter1Attacking) {
        tl.to(f1, { x: 50, duration: 0.1, ease: "power2.in" })
          .to(f1, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });

        tl.to(f2, {
            x: 10, rotation: 5, duration: 0.05,
            boxShadow: "0 0 25px 8px rgba(239,68,68,0.8)",
            yoyo: true, repeat: 3,
            onComplete: () => { f2.style.boxShadow = ''; }
        }, "-=0.4")
          .to(f2, { x: 0, rotation: 0, duration: 0.2 });
    } else {
        tl.to(f2, { x: -50, duration: 0.1, ease: "power2.in" })
          .to(f2, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });

        tl.to(f1, {
            x: -10, rotation: -5, duration: 0.05,
            boxShadow: "0 0 25px 8px rgba(239,68,68,0.8)",
            yoyo: true, repeat: 3,
            onComplete: () => { f1.style.boxShadow = ''; }
        }, "-=0.4")
          .to(f1, { x: 0, rotation: 0, duration: 0.2 });
    }
}

/**
 * Actualiza visualmente la barra de vida y las estadísticas de un luchador.
 */
export function refreshFighterStats(fighter, num) {
    const hpBar = document.getElementById(`hp-bar-${num}`);
    const hpText = document.getElementById(`statHP-${num}`);

    if (!fighter || !hpBar) return;

    // Fervor bar
    const fervorFill = document.getElementById(`fervorFill-${num}`);
    const fervorText = document.getElementById(`fervorText-${num}`);
    if (fervorFill && fervorText) {
        const pct = Math.min(100, ((fighter.fervor || 0) / 10) * 100);
        fervorFill.style.width = `${pct}%`;
        fervorText.innerText = `🔥 ${fighter.fervor || 0}/10`;
        const parent = fervorFill.closest('.arena-fervor-bar');
        if (parent) {
            parent.classList.toggle('fervor-full', (fighter.fervor || 0) >= 10);
        }
    }

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
        hpText.innerText = Math.ceil(fighter.hp || 0);
    }

    const defText = document.getElementById(`statDEF-${num}`);
    if (defText) {
        defText.innerText = Math.floor(fighter.def || 0);
    }

    const atqText = document.getElementById(`statATQ-${num}`);
    if (atqText) {
        atqText.innerText = Math.floor(fighter.atq || 0);
    }

    const velText = document.getElementById(`statVEL-${num}`);
    if (velText) {
        velText.innerText = fighter.vel || 0;
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

// =============================================
// 👁️ 2C — ACTIVE TURN HIGHLIGHT
// =============================================
export function setActiveHighlight(isColiseum, isAlly, slotIndex) {
    if (isColiseum) {
        [1, 2].forEach(n => {
            const el = document.getElementById(`boxF${n}`);
            if (el) el.classList.remove('active-turn');
        });
        const num = isAlly ? 1 : 2;
        const el = document.getElementById(`boxF${num}`);
        if (el) el.classList.add('active-turn');
    } else {
        document.querySelectorAll('.party-member-card.active-turn, .squad-member-card.active-turn').forEach(el => {
            el.classList.remove('active-turn');
        });
        const selector = isAlly
            ? `.party-member-card[data-index="${slotIndex}"]`
            : `.squad-member-card[data-enemy-index="${slotIndex}"]`;
        const el = document.querySelector(selector);
        if (el) el.classList.add('active-turn');
    }
}

export function clearActiveHighlight() {
    document.querySelectorAll('.active-turn').forEach(el => el.classList.remove('active-turn'));
}

// =============================================
// 💥 2D — FLOATING DAMAGE NUMBERS
// =============================================
export function spawnDmgFloat(parentSelector, type, value) {
    const dmg = Number(value);
    if (isNaN(dmg) || dmg <= 0) return;
    const parent = document.querySelector(parentSelector);
    if (!parent) return;

    const el = document.createElement('div');
    el.className = `dmg-float ${type}`;
    el.innerText = type === 'heal' ? `+${dmg}` : `-${dmg}`;
    el.style.left = (20 + Math.random() * 40) + '%';
    el.style.top = '10%';
    parent.style.position = 'relative';
    parent.appendChild(el);

    if (typeof gsap !== 'undefined') {
        try {
            gsap.fromTo(el,
                { y: 0, opacity: 1, scale: 0.5 },
                { y: -60, opacity: 0, scale: 1.2, duration: 1.0, ease: "power2.out", onComplete: () => el.remove() }
            );
        } catch (e) { setTimeout(() => el.remove(), 1000); }
    } else {
        setTimeout(() => el.remove(), 1000);
    }
}

// =============================================
// 💫 2E — ULTIMATE / DEATH ANIMATIONS
// =============================================
export function playUltimateAnimation(fighterName, ultName) {
    const flash = document.createElement('div');
    flash.className = 'ultimate-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);

    const banner = document.createElement('div');
    banner.className = 'ultimate-banner';
    banner.innerHTML = `🔥 ${esc(fighterName)}<br><span style="font-size:1.2rem;">${esc(ultName)}</span>`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 1200);
}

export function playDeathAnimation(selector) {
    const el = document.querySelector(selector);
    if (!el || typeof gsap === 'undefined') return;
    try {
        gsap.to(el, {
            scale: 0, opacity: 0, duration: 0.5, ease: "power2.in",
            onComplete: () => { el.classList.add('dead'); gsap.set(el, { scale: 1, opacity: 1 }); }
        });
    } catch (e) { el.classList.add('dead'); }
}

export function playHitAnimation(selector, isAlly) {
    const el = document.querySelector(selector);
    if (!el || typeof gsap === 'undefined') return;
    try {
        const color = isAlly ? 'rgba(59,130,246,0.8)' : 'rgba(239,68,68,0.8)';
        gsap.timeline()
            .to(el, { x: isAlly ? 10 : -10, duration: 0.05 })
            .to(el, { x: 0, duration: 0.25, ease: "elastic.out(1,0.3)", boxShadow: `0 0 20px ${color}`, onComplete: () => { el.style.boxShadow = ''; } });
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
        const velEl = document.getElementById(`statVEL-${num}`);
        const nameEl = document.getElementById(`statNameF${num}`);
        if (hpEl) hpEl.innerText = fighter.hp || 0;
        if (atqEl) atqEl.innerText = fighter.atq || 0;
        if (defEl) defEl.innerText = fighter.def || 0;
        if (velEl) velEl.innerText = fighter.vel || 0;
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

        const elementColors = elementConfigs;
        if (slot && typeof gsap !== 'undefined') {
            try { gsap.to(slot, { borderColor: elementColors[fighter.element]?.color || '#475569', duration: 0.5 }); } catch (e) {}
        } else if (slot) {
            slot.style.borderColor = elementColors[fighter.element]?.color || '#475569';
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
        const el = document.querySelector(`[data-id="${CSS.escape(id)}"]`);
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
export function renderMapNodes(adventureState) {
    const canvas = document.getElementById('worldMapCanvas');
    if (!canvas) return;

    const progress = (adventureState && adventureState.stageProgress) || {};
    const stages = [
        { id: '1-1', x: 35, y: 80, icon: '🏰', label: 'Stage 1-1' },
        { id: '1-2', x: 25, y: 55, icon: '🌲', label: 'Stage 1-2' },
        { id: '1-3', x: 50, y: 35, icon: '🏜️', label: 'Stage 1-3' },
        { id: '1-4', x: 75, y: 55, icon: '🗿', label: 'Stage 1-4' },
        { id: '1-5', x: 85, y: 80, icon: '👑', label: 'BOSS: Orc Warlord' }
    ];

    const connectors = stages.slice(0, -1).map((s, i) => {
        const next = stages[i + 1];
        return `<line x1="${s.x}%" y1="${s.y}%" x2="${next.x}%" y2="${next.y}%"
                      stroke="#334155" stroke-width="3" stroke-dasharray="6,4"/>`;
    }).join('');

    const svg = `<svg class="map-connectors" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;">${connectors}</svg>`;

    const nodesHtml = stages.map(s => {
        const status = progress[s.id] || 'locked';
        const cls = `map-node${status === 'available' ? ' active' : ''}${status === 'locked' ? ' locked' : ''}${status === 'completed' ? ' completed' : ''}${s.id === '1-5' ? ' boss' : ''}`;
        return `<div class="${cls}" style="left:${s.x}%;top:${s.y}%;" data-stage="${s.id}" title="${s.label}">${s.icon}</div>`;
    }).join('');

    canvas.innerHTML = svg + nodesHtml;
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
export function openChest(count) {
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

// =============================================
// 🎯 ADVENTURE - TEAM SELECTION (UI state)
// =============================================
let _teamSlots = [null, null, null, null, null];
let _currentStageId = null;

export function initTeamSlots() {
    _teamSlots = [null, null, null, null, null];
    _currentStageId = null;
}

export function getCurrentStageId() {
    return _currentStageId;
}

export function getSelectedTeam() {
    if (_teamSlots.every(s => s !== null)) {
        return _teamSlots.map(c => JSON.parse(JSON.stringify(c)));
    }
    return null;
}

export function renderTeamSelection(stageId) {
    _teamSlots = [null, null, null, null, null];
    _currentStageId = stageId;

    const existing = document.getElementById('teamSelectionOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'team-selection-overlay';
    overlay.id = 'teamSelectionOverlay';
    overlay.innerHTML = `
        <div class="team-selection-panel">
            <div class="team-selection-header">
                <h3>⚔️ Deploy Team for ${stageId}</h3>
                <p>Choose 5 heroes to face the enemy</p>
            </div>
            <div class="party-slots-container" id="partySlotsContainer">
                ${[1,2,3,4,5].map(i => `
                    <div class="party-slot" data-slot-index="${i-1}">
                        <span class="slot-number">#${i}</span>
                        <span class="slot-placeholder-icon">👤</span>
                        <span class="slot-label">Empty</span>
                    </div>
                `).join('')}
            </div>
            <div class="team-selection-actions">
                <button id="btnConfirmTeam" class="btn-forge" disabled>CONFIRM TEAM</button>
                <button id="btnCancelTeam" class="tab-item" style="background:#334155;">CANCEL</button>
            </div>
        </div>
    `;

    const section = document.getElementById('section-adventure');
    if (section) section.appendChild(overlay);

    if (typeof gsap !== 'undefined') {
        try { gsap.from('.team-selection-panel', { y: 50, opacity: 0, duration: 0.3, ease: "back.out(1.7)" }); } catch (e) {}
    }
}

export function closeTeamSelection() {
    const overlay = document.getElementById('teamSelectionOverlay');
    if (overlay) overlay.remove();
    const picker = document.getElementById('cardPickerModal');
    if (picker) picker.remove();
    _teamSlots = [null, null, null, null, null];
}

export function openCardPicker(slotIndex) {
    const existing = document.getElementById('cardPickerModal');
    if (existing) existing.remove();

    const allCards = Engine.getAllPlayableCards();
    const available = allCards.filter(c => !_teamSlots.some(s => s && s.id === c.id));

    const modal = document.createElement('div');
    modal.className = 'card-picker-modal';
    modal.id = 'cardPickerModal';
    modal.dataset.targetSlot = slotIndex;

    let gridHtml;
    if (available.length === 0) {
        gridHtml = `<div class="card-picker-empty">No available heroes in your Library or Gallery</div>`;
    } else {
        gridHtml = available.map(c => {
            const totalStats = (c.hp || 0) + (c.atq || 0) + (c.def || 0) + ((c.vel || 0) * Engine.VEL_WEIGHT);
            const isMythic = totalStats >= Engine.STAT_LIMIT;
            const tag = c._official ? '🏛️ ' : '';
            return `
                <div class="card-picker-item ${c._official ? 'gallery-card' : ''}" data-card-id="${esc(c.id)}">
                    <img class="picker-card-img" src="${esc(c.image || '')}" alt="${esc(c.name)}" onerror="this.src='https://via.placeholder.com/140x60?text=No+Image'">
                    <div class="picker-card-name">${tag}${esc(c.name)}</div>
                    <div class="picker-card-stats">❤️${c.hp} ⚔️${c.atq} 🛡️${c.def} 💨${c.vel || 80}${isMythic ? ' 👑' : ''}</div>
                </div>
            `;
        }).join('');
    }

    modal.innerHTML = `
        <div class="card-picker-panel">
            <div class="card-picker-header">
                <h4>🎴 Select a Hero</h4>
                <button class="card-picker-close">&times;</button>
            </div>
            <div class="card-picker-grid">${gridHtml}</div>
        </div>
    `;

    document.body.appendChild(modal);

    if (typeof gsap !== 'undefined') {
        try { gsap.from('.card-picker-panel', { scale: 0.95, opacity: 0, duration: 0.2, ease: "power2.out" }); } catch (e) {}
    }
}

export function fillTeamSlot(slotIndex, card) {
    if (!card) return;
    _teamSlots[slotIndex] = card;

    const slot = document.querySelector(`.party-slot[data-slot-index="${slotIndex}"]`);
    if (slot) {
        slot.classList.add('filled');
        slot.innerHTML = `
            <span class="slot-number">#${slotIndex + 1}</span>
            <img class="slot-mini-img" src="${esc(card.image || '')}" alt="${esc(card.name)}" onerror="this.src='https://via.placeholder.com/80x60?text=No+Image'">
            <span class="slot-mini-name">${esc(card.name)}</span>
            <span class="slot-mini-stats">❤️${card.hp} ⚔️${card.atq} 🛡️${card.def} 💨${card.vel || 80}</span>
        `;
    }

    const btn = document.getElementById('btnConfirmTeam');
    if (btn && _teamSlots.every(s => s !== null)) {
        btn.disabled = false;
        if (typeof gsap !== 'undefined') {
            try { gsap.fromTo(btn, { scale: 1.05 }, { scale: 1, duration: 0.2, ease: "power2.out" }); } catch (e) {}
        }
    }
}

// =============================================
// ⚔️ PvE ARENA (Adventure Combat)
// =============================================
export function renderPvEArena(party, squad, turnCount) {
    const mapLayout = document.querySelector('.adventure-layout');
    if (mapLayout) mapLayout.style.display = 'none';

    const existing = document.getElementById('pveArena');
    if (existing) existing.remove();

    const isBoss = squad.length === 1;

    const squadHtml = squad.map((m, i) => `
        <div class="squad-member-card${m.hp <= 0 ? ' dead' : ''}${isBoss ? ' boss-card' : ''}" data-enemy-index="${i}">
            <div class="squad-member-header">${isBoss ? '👑' : `[Enemy ${i+1}]`} ${esc(m.name)}</div>
            ${isBoss ? `<img class="enemy-img" src="${esc(m.image || '')}" alt="${esc(m.name)}" onerror="this.src='https://via.placeholder.com/240x160?text=Boss'">` : ''}
            <div class="squad-hp-bar-container">
                <div class="squad-hp-bar-fill" id="squadHpFill${i}" style="width:100%"></div>
                <span class="squad-hp-text" id="squadHpText${i}">${Math.floor(m.hp)}/${m.maxHp}</span>
            </div>
            <div class="squad-stats-row">
                <span>❤️${Math.floor(m.hp)}</span>
                <span>🛡️${Math.floor(m.def)}</span>
                <span>⚔️${Math.floor(m.atq)}</span>
                <span>💨${m.vel || 80}</span>
            </div>
            <div class="squad-fervor-bar" id="squadFervorBar${i}">
                <div class="fervor-fill" id="squadFervorFill${i}" style="width:${Math.min(100, ((m.fervor || 0)/10)*100)}%"></div>
                <span class="fervor-text" id="squadFervorText${i}">🔥${m.fervor || 0}/10</span>
            </div>
        </div>
    `).join('');

    const partyHtml = party.map((member, i) => `
        <div class="party-member-card" data-index="${i}">
            <img class="member-img" src="${esc(member.image || '')}" alt="${esc(member.name)}" onerror="this.src='https://via.placeholder.com/40x40?text=?'">
            <div class="member-info">
                <div class="member-name">[Ally ${i+1}] ${esc(member.name)}</div>
                <div class="member-element">${member.element || 'Neutral'}</div>
                <div class="party-member-hp-bar">
                    <div class="party-member-hp-fill" id="partyHpFill${i}" style="width:100%"></div>
                </div>
                <div class="member-hp-text" id="partyHpText${i}">${Math.floor(member.hp)}/${member.maxHp}</div>
                <div class="party-fervor-bar" id="partyFervorBar${i}">
                    <div class="fervor-fill" id="partyFervorFill${i}" style="width:${Math.min(100, ((member.fervor || 0)/10)*100)}%"></div>
                    <span class="fervor-text" id="partyFervorText${i}">🔥${member.fervor || 0}/10</span>
                </div>
            </div>
        </div>
    `).join('');

    const arena = document.createElement('div');
    arena.className = 'pve-arena active';
    arena.id = 'pveArena';
    arena.innerHTML = `
        <div class="combat-layout">
            <div class="combat-main">
                <div id="pveTurnBar" class="turn-bar"></div>
                <div class="pve-battlefield">
                    <div class="pve-squad-side" id="pveSquadSide">${squadHtml}</div>
                    <div class="pve-vs-column">
                        <div class="pve-turn-counter" id="pveTurnCounter">⚔️ TURN ${turnCount}</div>
                        <div class="vs-badge" style="font-size:2rem;">⚔️</div>
                    </div>
                    <div class="pve-party-side" id="pvePartySide">${partyHtml}</div>
                </div>
                <div class="pve-arena-actions">
                    <button id="btnPvENextTurn" class="btn-forge">NEXT TURN</button>
                    <button id="btnPvERetreat" class="tab-item" style="background:#334155;">RETREAT</button>
                </div>
            </div>
            <div class="combat-console" id="pveLogConsole">
                <div class="console-header">
                    <span>ADVENTURE LOG</span>
                    <span class="console-status">⚔️</span>
                </div>
                <div class="log-messages" id="pveLogContent">
                    <div class="log-entry system">⚔️ ${isBoss ? 'BOSS ENCOUNTER' : '5v5 Squad Battle'} — Fight!</div>
                </div>
            </div>
        </div>
    `;

    const section = document.getElementById('section-adventure');
    if (section) section.appendChild(arena);

    if (typeof gsap !== 'undefined') {
        try {
            gsap.from('#pveArena', { opacity: 0, y: 20, duration: 0.4, ease: "power2.out" });
            gsap.from('.squad-member-card', { x: -50, opacity: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" });
            gsap.from('.party-member-card', { x: 50, opacity: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" });
        } catch (e) {}
    }
}

export function updatePvEArena(party, squad, turnCount) {
    if (squad) {
        squad.forEach((m, i) => {
            const fill = document.getElementById(`squadHpFill${i}`);
            const text = document.getElementById(`squadHpText${i}`);
            const card = document.querySelector(`.squad-member-card[data-enemy-index="${i}"]`);
            if (!card) return;
            if (m.hp <= 0) {
                card.classList.add('dead');
                if (fill) fill.style.width = '0%';
                if (text) text.innerText = '💀';
            } else {
                card.classList.remove('dead');
                if (fill) {
                    const pct = Math.max(0, (m.hp / m.maxHp) * 100);
                    if (typeof gsap !== 'undefined') {
                        try { gsap.to(fill, { width: pct + '%', duration: 0.3, ease: "power2.out" }); } catch (e) { fill.style.width = pct + '%'; }
                    } else { fill.style.width = pct + '%'; }
                }
                if (text) text.innerText = `${Math.floor(m.hp)}/${m.maxHp}`;
            }
            const statsRow = card.querySelector('.squad-stats-row');
            if (statsRow) {
                statsRow.innerHTML = `<span>❤️${Math.floor(m.hp)}</span><span>🛡️${Math.floor(m.def)}</span><span>⚔️${Math.floor(m.atq)}</span><span>💨${m.vel || 80}</span>`;
            }
            // Fervor update
            const fervorFill = document.getElementById(`squadFervorFill${i}`);
            const fervorText = document.getElementById(`squadFervorText${i}`);
            if (fervorFill && fervorText) {
                const pct = Math.min(100, ((m.fervor || 0) / 10) * 100);
                fervorFill.style.width = `${pct}%`;
                fervorText.innerText = `🔥${m.fervor || 0}/10`;
                const parent = fervorFill.closest('.squad-fervor-bar');
                if (parent) parent.classList.toggle('fervor-full', (m.fervor || 0) >= 10);
            }
        });
    }

    if (party) {
        party.forEach((member, i) => {
            const card = document.querySelector(`.party-member-card[data-index="${i}"]`);
            if (!card) return;
            const hpFill = document.getElementById(`partyHpFill${i}`);
            const hpText = document.getElementById(`partyHpText${i}`);

            if (member.hp <= 0) {
                card.classList.add('dead');
                if (hpFill) {
                    if (typeof gsap !== 'undefined') {
                        try { gsap.to(hpFill, { width: '0%', duration: 0.3, ease: "power2.out" }); } catch (e) { hpFill.style.width = '0%'; }
                    } else { hpFill.style.width = '0%'; }
                }
                if (hpText) hpText.innerText = '💀';
            } else {
                card.classList.remove('dead');
                if (hpFill) {
                    const pct = Math.max(0, (member.hp / member.maxHp) * 100);
                    if (typeof gsap !== 'undefined') {
                        try { gsap.to(hpFill, { width: pct + '%', duration: 0.3, ease: "power2.out" }); } catch (e) { hpFill.style.width = pct + '%'; }
                    } else { hpFill.style.width = pct + '%'; }
                    hpFill.className = 'party-member-hp-fill' + (pct < 30 ? ' low' : '');
                }
                if (hpText) hpText.innerText = `${Math.floor(member.hp)}/${member.maxHp}`;
            }
            // Fervor update
            const fervorFill = document.getElementById(`partyFervorFill${i}`);
            const fervorText = document.getElementById(`partyFervorText${i}`);
            if (fervorFill && fervorText) {
                const pct = Math.min(100, ((member.fervor || 0) / 10) * 100);
                fervorFill.style.width = `${pct}%`;
                fervorText.innerText = `🔥${member.fervor || 0}/10`;
                const parent = fervorFill.closest('.party-fervor-bar');
                if (parent) parent.classList.toggle('fervor-full', (member.fervor || 0) >= 10);
            }
        });
    }

    const turnEl = document.getElementById('pveTurnCounter');
    if (turnEl) turnEl.innerText = `⚔️ TURN ${turnCount}`;
}

export function showPvEResult(type) {
    const existing = document.getElementById('pveResultOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'pve-result-overlay';
    overlay.id = 'pveResultOverlay';

    if (type === 'victory') {
        overlay.innerHTML = `
            <div class="pve-result-panel victory">
                <div class="pve-result-icon">🏆</div>
                <div class="pve-result-title victory">VICTORY!</div>
                <div class="pve-result-desc">The enemy has been defeated!</div>
                <div class="pve-result-actions">
                    <button id="btnPvEResultContinue" class="btn-forge">CONTINUE</button>
                </div>
            </div>
        `;
    } else {
        overlay.innerHTML = `
            <div class="pve-result-panel defeat">
                <div class="pve-result-icon">💀</div>
                <div class="pve-result-title defeat">PARTY WIPED</div>
                <div class="pve-result-desc">All heroes have fallen...</div>
                <div class="pve-result-actions">
                    <button id="btnPvEResultRetry" class="btn-forge" style="background:#ef4444;">RETRY</button>
                    <button id="btnPvEBackToMap" class="tab-item" style="background:#334155;">BACK TO MAP</button>
                </div>
            </div>
        `;
    }

    document.body.appendChild(overlay);

    if (typeof gsap !== 'undefined') {
        try { gsap.from('.pve-result-panel', { scale: 0, duration: 0.4, ease: "back.out(2)" }); } catch (e) {}
    }
}

export function cleanAdventureOverlays() {
    const overlay = document.getElementById('teamSelectionOverlay');
    if (overlay) overlay.remove();
    const picker = document.getElementById('cardPickerModal');
    if (picker) picker.remove();
    const arena = document.getElementById('pveArena');
    if (arena) arena.remove();
    const result = document.getElementById('pveResultOverlay');
    if (result) result.remove();
    const reward = document.getElementById('rewardModal');
    if (reward) reward.style.display = 'none';
    const mapLayout = document.querySelector('.adventure-layout');
    if (mapLayout) mapLayout.style.display = 'grid';
    _teamSlots = [null, null, null, null, null];
    _currentStageId = null;
}

// =============================================
// 🎁 2F — REWARD MODAL
// =============================================
export function showRewardModal(stageId) {
    if (!stageId || typeof stageId !== 'string') return;
    const modal = document.getElementById('rewardModal');
    if (!modal) return;
    const goldEl = document.getElementById('rewardGold');
    const xpEl = document.getElementById('rewardXp');
    const dropArea = document.getElementById('rewardDropArea');

    const stageNum = parseInt(stageId.split('-')[1]);
    const gold = 20 + stageNum * 15;
    const xp = 10 + stageNum * 8;

    if (goldEl) goldEl.innerText = gold;
    if (xpEl) xpEl.innerText = xp;

    // Random drop chance (30%)
    const hasDrop = Math.random() < 0.3;
    if (dropArea) {
        if (hasDrop) {
            const pool = [
                { name: 'Iron Ore', icon: '🪨', rarity: 'Common' },
                { name: 'Silver Coin', icon: '🪙', rarity: 'Common' },
                { name: 'Magic Dust', icon: '✨', rarity: 'Rare' },
                { name: 'Dragon Scale', icon: '🐉', rarity: 'Epic' },
                { name: 'Crown Shard', icon: '👑', rarity: 'Legendary' }
            ];
            const pick = pool[Math.floor(Math.random() * pool.length)];
            dropArea.innerHTML = `
                <div class="drop-item">
                    <span class="drop-icon">${pick.icon}</span>
                    <span class="drop-name">${pick.name}</span>
                    <span class="drop-rarity rarity-${pick.rarity.toLowerCase()}">${pick.rarity}</span>
                </div>
            `;
        } else {
            dropArea.innerHTML = `<span style="color:var(--text-dim);font-size:0.85rem;">No item drops this time.</span>`;
        }
    }

    modal.style.display = 'flex';
    modal.dataset.stageId = stageId || '';

    const claimBtn = document.getElementById('btnClaimRewards');
    if (claimBtn) {
        claimBtn.onclick = () => {
            modal.style.display = 'none';
            const sid = modal.dataset.stageId;
            const evt = new CustomEvent('rewardsClaimed', { detail: { stageId: sid } });
            document.dispatchEvent(evt);
        };
    }
}

// =============================================
// 🏆 TOURNAMENT — UI
// =============================================
let _tournamentSlots = [];

export function renderTournamentSetup() {
    const grid = document.getElementById('tournamentSlotGrid');
    if (!grid) return;

    grid.innerHTML = Array.from({ length: 16 }, (_, i) => `
        <div class="tournament-slot ${_tournamentSlots[i] ? 'filled' : ''}" data-slot="${i}" id="tslot-${i}" onclick="_openTournamentPicker(${i})">
            ${_tournamentSlots[i]
                ? `<span class="slot-number">#${i+1}</span>
                   <img class="slot-img" src="${esc(_tournamentSlots[i].image || '')}" alt="">
                   <span class="slot-name">${esc(_tournamentSlots[i].name)}</span>
                   <span class="slot-class">${_tournamentSlots[i].cardClass}</span>`
                : `<span class="slot-number">#${i+1}</span>
                   <span style="font-size:2rem;">➕</span>
                   <span style="font-size:0.7rem;color:var(--text-dim);">Select fighter</span>`
            }
        </div>
    `).join('');

    const btn = document.getElementById('btnStartDraw');
    if (btn) btn.disabled = _tournamentSlots.filter(Boolean).length !== 16;
}

export function _openTournamentPicker(slotIndex) {
    const existing = document.getElementById('tournamentPickerModal');
    if (existing) existing.remove();

    const allCards = Engine.getAllPlayableCards();
    const usedIds = _tournamentSlots.map(s => s && s.id);
    const available = allCards.filter(c => !usedIds.includes(c.id));

    const modal = document.createElement('div');
    modal.className = 'card-picker-modal';
    modal.id = 'tournamentPickerModal';

    let gridHtml;
    if (available.length === 0) {
        gridHtml = '<div class="card-picker-empty">No available fighters</div>';
    } else {
        gridHtml = available.map(c => {
            const tag = c._official ? '🏛️ ' : '';
            return `<div class="card-picker-item" data-card-id="${esc(c.id)}" data-target-slot="${slotIndex}">
                <img class="picker-card-img" src="${esc(c.image || '')}" alt="" onerror="this.src='https://via.placeholder.com/140x60?text=No+Image'">
                <div class="picker-card-name">${tag}${esc(c.name)}</div>
                <div class="picker-card-stats">❤️${c.hp} ⚔️${c.atq} 🛡️${c.def} 💨${c.vel || 80}</div>
            </div>`;
        }).join('');
    }

    modal.innerHTML = `
        <div class="card-picker-panel">
            <div class="card-picker-header">
                <h4>🏆 Select Fighter #${slotIndex+1}</h4>
                <button class="card-picker-close">&times;</button>
            </div>
            <div class="card-picker-grid">${gridHtml}</div>
        </div>`;
    document.body.appendChild(modal);

    modal.querySelectorAll('.card-picker-item').forEach(el => {
        el.addEventListener('click', () => {
            const cardId = el.dataset.cardId;
            const slot = parseInt(el.dataset.targetSlot);
            const card = Engine.getAllPlayableCards().find(c => c.id === cardId);
            if (card !== undefined && slot >= 0 && slot < 16) {
                _tournamentSlots[slot] = card;
            }
            modal.remove();
            renderTournamentSetup();
        });
    });
}

export function getTournamentContestants() {
    return _tournamentSlots.filter(Boolean);
}

export function resetTournamentSlots() {
    _tournamentSlots = [];
}

export function renderTournamentBracket(bracket) {
    const container = document.getElementById('tournamentRoundsContainer');
    if (!container) return;

    const roundLabels = ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];

    container.innerHTML = bracket.map((round, r) => `
        <div class="tournament-round-col">
            <div class="tournament-round-title">${roundLabels[r] || `Round ${r+1}`}</div>
            ${round.map((match, m) => {
                const isCompleted = match.completed;
                const isActive = !match.completed && match.f1 && match.f2;
                const f1Name = match.f1 ? match.f1.name : 'TBD';
                const f2Name = match.f2 ? match.f2.name : 'TBD';
                const f1Win = isCompleted && match.winner && match.winner.id === match.f1?.id;
                const f2Win = isCompleted && match.winner && match.winner.id === match.f2?.id;
                return `
                    <div class="tournament-match-card ${isCompleted ? 'completed' : ''} ${isActive ? 'active-match' : ''}">
                        <div class="tm-fighter ${f1Win ? 'tm-winner' : (isCompleted && !f1Win ? 'tm-loser' : '')}">
                            <img class="tm-portrait" src="${match.f1 ? esc(match.f1.image || '') : ''}" alt="" onerror="this.style.display='none'">
                            <span class="tm-name">${esc(f1Name)}</span>
                            ${f1Win ? '<span style="color:#22c55e;font-size:0.8rem;">👑</span>' : ''}
                        </div>
                        <div class="tm-vs">VS</div>
                        <div class="tm-fighter ${f2Win ? 'tm-winner' : (isCompleted && !f2Win ? 'tm-loser' : '')}">
                            <img class="tm-portrait" src="${match.f2 ? esc(match.f2.image || '') : ''}" alt="" onerror="this.style.display='none'">
                            <span class="tm-name">${esc(f2Name)}</span>
                            ${f2Win ? '<span style="color:#22c55e;font-size:0.8rem;">👑</span>' : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `).join('');
}

export function renderTournamentMatch(f1, f2, round, matchNum) {
    const arena = document.getElementById('tournamentMatchArena');
    if (!arena) return;
    if (!f1 || !f2) {
        arena.innerHTML = '<div class="empty-state-msg">Waiting for fighters...</div>';
        return;
    }

    const label = document.getElementById('tournamentMatchLabel');
    if (label) label.innerText = `Match ${matchNum+1} · ${round === 0 ? 'Round of 16' : round === 1 ? 'Quarter-finals' : round === 2 ? 'Semi-finals' : 'Final'}`;

    function renderBox(fighter, side) {
        const hpPct = Math.min(100, (fighter.hp / fighter.maxHp) * 100);
        const fervorPct = Math.min(100, ((fighter.fervor || 0) / 10) * 100);
        return `
            <div class="tournament-fighter-box" id="tBox-${side}">
                <img class="tf-img" src="${esc(fighter.image || '')}" alt="" onerror="this.src='https://via.placeholder.com/80x80?text=${esc(fighter.name[0])}'">
                <div class="tf-name">${esc(fighter.name)}</div>
                <div style="font-size:0.75rem;color:var(--text-dim);">${fighter.cardClass || ''} · ${fighter.element || ''}</div>
                <div class="tf-hp-bar"><div class="tf-hp-fill" id="tfHpFill-${side}" style="width:${hpPct}%"></div></div>
                <div class="tf-hp-text" id="tfHpText-${side}">${Math.floor(fighter.hp)} / ${fighter.maxHp}</div>
                <div class="tf-fervor-bar"><div class="tf-fervor-fill" id="tfFervorFill-${side}" style="width:${fervorPct}%"></div></div>
                <div style="font-size:0.75rem;color:var(--gold);" id="tfFervorText-${side}">🔥${fighter.fervor || 0}/10</div>
                <div class="tf-stats">
                    <span>❤️${fighter.hp}</span>
                    <span>🛡️${Math.floor(fighter.def)}</span>
                    <span>⚔️${Math.floor(fighter.atq)}</span>
                    <span>💨${fighter.vel}</span>
                </div>
            </div>
        `;
    }

    arena.innerHTML = renderBox(f1, '1') + renderBox(f2, '2');

    const btn = document.getElementById('btnTournamentNextTurn');
    if (btn) btn.style.display = 'block';

    const logEl = document.getElementById('tournamentLogContentMatch');
    if (logEl) logEl.innerHTML = `<div class="empty-state-msg" style="color:#94a3b8;">🏆 The match begins...</div>`;
    resetTurnGroups('tournamentLogContentMatch');
}

export function updateTournamentMatchUI(f1, f2) {
    ['1', '2'].forEach(side => {
        const f = side === '1' ? f1 : f2;
        if (!f) return;
        const hpFill = document.getElementById(`tfHpFill-${side}`);
        const hpText = document.getElementById(`tfHpText-${side}`);
        const fervorFill = document.getElementById(`tfFervorFill-${side}`);
        const fervorText = document.getElementById(`tfFervorText-${side}`);
        if (hpFill) hpFill.style.width = `${Math.min(100, (f.hp / f.maxHp) * 100)}%`;
        if (hpText) hpText.innerText = `${Math.floor(f.hp)} / ${f.maxHp}`;
        if (fervorFill) fervorFill.style.width = `${Math.min(100, ((f.fervor || 0) / 10) * 100)}%`;
        if (fervorText) fervorText.innerText = `🔥${f.fervor || 0}/10`;
    });
}

export function showTournamentChampion(winner) {
    const overlay = document.getElementById('tournamentChampionOverlay');
    const card = document.getElementById('tournamentChampionCard');
    if (!overlay || !card) return;

    card.innerHTML = `
        <span class="tc-crown">🏆</span>
        <div class="tc-name">${esc(winner.name)}</div>
        <div class="tc-class">${winner.cardClass || ''} · ${winner.element || ''}</div>
        <div class="tc-stats">
            <div class="tc-stat">❤️ ${winner.hp}</div>
            <div class="tc-stat">🛡️ ${Math.floor(winner.def)}</div>
            <div class="tc-stat">⚔️ ${Math.floor(winner.atq)}</div>
            <div class="tc-stat">💨 ${winner.vel}</div>
        </div>
        <div class="tc-msg">The champion of the arena!</div>
        <button id="btnChampionClose" class="btn-forge" style="margin-top:20px;" onclick="document.getElementById('tournamentChampionOverlay').style.display='none'">🏆 CHAMPION</button>
    `;
    overlay.style.display = 'flex';
}

export function toggleTournamentView(view) {
    ['tournamentSetupView', 'tournamentBracketView', 'tournamentMatchView'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = id === view ? 'block' : 'none';
    });
}

export function addTournamentLog(msg, type = 'system') {
    const el = document.getElementById('tournamentLogContent');
    if (!el) return;
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.innerHTML = esc(msg);
    el.appendChild(div);
    if (_shouldAutoScroll(el)) el.scrollTop = el.scrollHeight;
}
