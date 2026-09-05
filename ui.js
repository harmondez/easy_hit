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
            // Restore adventure layout when switching to tab
            cleanAdventureOverlays();
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

    btn.classList.remove('btn-finish', 'btn-next');
    if (mode === 'finish') {
        btn.innerText = 'FINALIZAR COMBATE';
        btn.classList.add('btn-finish');
        btn.dataset.mode = 'finish';
    } else {
        btn.innerText = 'NEXT ROUND';
        btn.classList.add('btn-next');
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
        try {
            Engine.deleteCard(id);
        } catch (e) {
            console.error('Error deleting card:', e);
            alert('Error al eliminar la carta.');
            return;
        }
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

export function clearPvETurnHighlights() {
    document.querySelectorAll('.active-turn, .dimmed, .targetable, .target-selected').forEach(el => {
        el.classList.remove('active-turn', 'dimmed', 'targetable', 'target-selected');
    });
    clearActiveArrow();
    _dimmed = false;
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

// =============================================
// 🔦 ACTIVE HERO INDICATOR (Pulsing Arrow)
// =============================================

let _arrowTween = null;

export function clearActiveArrow() {
    const existing = document.getElementById('pveActiveArrow');
    if (existing) {
        if (existing.parentNode) existing.parentNode.style.position = '';
        existing.remove();
    }
    if (_arrowTween) { _arrowTween.kill(); _arrowTween = null; }
}

// =============================================
// ✈️ CARD FLY ATTACK ANIMATION (GSAP)
// =============================================

export function animatePvEHit(attackerSelector, targetSelector) {
    if (typeof gsap === 'undefined') return;
    const attacker = document.querySelector(attackerSelector);
    const target = document.querySelector(targetSelector);
    if (!attacker || !target) return;
    try {
        attacker.classList.add('active-turn');
        const aRect = attacker.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();
        const dx = tRect.left + tRect.width / 2 - (aRect.left + aRect.width / 2);
        const dy = tRect.top + tRect.height / 2 - (aRect.top + aRect.height / 2);

        gsap.timeline()
            .to(attacker, { x: dx * 0.75, y: dy * 0.75, duration: 0.2, ease: "power2.in" })
            .to(target, {
                scale: 1.1,
                boxShadow: "0 0 30px 8px rgba(239,68,68,0.9)",
                duration: 0.08
            }, "-=0.05")
            .to('.pve-battlefield', {
                x: 6, yoyo: true, repeat: 3, duration: 0.04,
                clearProps: "x"
            }, "-=0.05")
            .to(target, {
                scale: 1,
                boxShadow: "",
                duration: 0.15,
                clearProps: "boxShadow"
            })
            .to(attacker, {
                x: 0, y: 0,
                duration: 0.3,
                ease: "elastic.out(1, 0.3)",
                clearProps: "x,y",
                onComplete: () => attacker.classList.remove('active-turn')
            });
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

    const rewardModal = document.getElementById('rewardModal');
    if (rewardModal) rewardModal.style.display = 'none';

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
            <button id="btnChestClaim" class="btn-forge" style="margin-top:20px;padding:12px 30px;width:auto;">CLAIM ALL</button>
        `;

        const claimBtn = document.getElementById('btnChestClaim');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => {
                const m = document.getElementById('chestModal');
                if (m) m.style.display = 'none';
            });
        }

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

export function cleanAdventureOverlays() {
    ['teamSelectionOverlay','cardPickerModal','pveArena','pveResultOverlay',
     'heroPickerOverlay','organigramaContainer',     'itemDropOverlay','upgradeModalOverlay',
     'runResultOverlay','singleArena','potionBar','adventureLobbyContainer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
    const reward = document.getElementById('rewardModal');
    if (reward) reward.style.display = 'none';
    const mapLayout = document.querySelector('.adventure-layout');
    if (mapLayout) mapLayout.style.display = 'grid';
}

// =============================================
// 🎁 2F — REWARD MODAL
// =============================================
export function showRewardModal(stageId, loot) {
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

    if (dropArea) {
        if (loot && loot.length > 0) {
            dropArea.innerHTML = loot.map((item, i) => `
                <div class="drop-item" data-drop-idx="${i}" style="opacity:0;transform:translateY(12px)">
                    <span class="drop-icon">${esc(item.icon || '📦')}</span>
                    <span class="drop-name">${esc(item.name || 'Unknown')}</span>
                    <span class="drop-rarity rarity-${esc((item.rarity || 'common').toLowerCase())}">${esc(item.rarity || 'Common')}</span>
                </div>
            `).join('');
            if (typeof gsap !== 'undefined') {
                gsap.to('.drop-item', {
                    opacity: 1, y: 0, duration: 0.35, stagger: 0.15, ease: 'back.out(1.2)'
                });
                const mythicItems = dropArea.querySelectorAll('.rarity-mythic, .rarity-legendary');
                if (mythicItems.length > 0 && typeof gsap !== 'undefined') {
                    gsap.fromTo(mythicItems, { scale: 0.5 }, { scale: 1, duration: 0.5, stagger: 0.2, ease: 'elastic.out(1, 0.4)' });
                }
            } else {
                dropArea.querySelectorAll('.drop-item').forEach(el => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
            }
        } else {
            dropArea.innerHTML = `<span style="color:var(--text-dim);font-size:0.85rem;">No item drops this time.</span>`;
        }
    }

    const chestModal = document.getElementById('chestModal');
    if (chestModal) chestModal.style.display = 'none';

    modal.style.display = 'flex';
    modal.dataset.stageId = stageId || '';

    const claimBtn = document.getElementById('btnClaimRewards');
    if (claimBtn) {
        claimBtn.onclick = () => {
            modal.style.display = 'none';
            const sid = modal.dataset.stageId;
            const evt = new CustomEvent('rewardsClaimed', {
                detail: { stageId: sid, gold, xp, loot: loot || [] }
            });
            document.dispatchEvent(evt);
        };
    }
}

// =============================================
// 💾 INVENTORY PERSISTENCE
// =============================================

export function saveInventory(items) {
    try {
        const clean = (items || []).map(item => {
            const { weight, ...rest } = item;
            return rest;
        });
        localStorage.setItem('inv', JSON.stringify(clean));
    } catch (e) {
        console.warn('saveInventory failed:', e);
    }
}

export function loadInventory() {
    try {
        const raw = localStorage.getItem('inv');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn('loadInventory failed:', e);
        return [];
    }
}

export function renderInventory(items) {
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;
    const list = items || [];
    if (list.length === 0) {
        grid.innerHTML = `<div class="empty-state-msg" style="grid-column:1/-1;text-align:center;padding:40px;">
            <span style="font-size:3rem;display:block;margin-bottom:10px;">🎒</span>
            No items yet. Complete stages to earn loot!
        </div>`;
        return;
    }
    grid.innerHTML = list.map((item, i) => `
        <div class="inv-item rarity-${esc((item.rarity || 'common').toLowerCase())}" data-idx="${i}">
            <span class="inv-item-icon">${esc(item.icon || '📦')}</span>
            <span class="inv-item-name">${esc(item.name || 'Unknown')}</span>
            <span class="inv-item-rarity">${esc((item.rarity || 'Common').charAt(0).toUpperCase() + (item.rarity || 'Common').slice(1))}</span>
        </div>
    `).join('');
}

export function initInventoryFilters() {
    if (window._invFiltersInit) return;
    window._invFiltersInit = true;
    document.addEventListener('click', (e) => {
        const catEl = e.target.closest('.inventory-category');
        if (!catEl) return;
        const sidebar = catEl.closest('.inventory-sidebar');
        if (!sidebar) return;
        sidebar.querySelectorAll('.inventory-category').forEach(c => c.classList.remove('active'));
        catEl.classList.add('active');
        const cat = catEl.dataset.category;
        const allItems = window.gameState ? window.gameState.inventory : [];
        if (cat === 'all') {
            renderInventory(allItems);
        } else {
            const filtered = allItems.filter(item => (item.type || 'material') === cat);
            renderInventory(filtered);
        }
    });
}

// =============================================
// 🏆 TOURNAMENT — UI
// =============================================
let _tournamentSlots = [];

export function renderTournamentSetup() {
    const grid = document.getElementById('tournamentSlotGrid');
    if (!grid) return;

    grid.innerHTML = Array.from({ length: 16 }, (_, i) => `
        <div class="tournament-slot ${_tournamentSlots[i] ? 'filled' : ''}" data-slot="${i}" data-slot-index="${i}">
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

    // Event delegation for tournament slot clicks
    grid.onclick = null; // remove previous
    grid.addEventListener('click', (e) => {
        const slotEl = e.target.closest('.tournament-slot');
        if (slotEl && slotEl.dataset.slotIndex !== undefined) {
            const idx = parseInt(slotEl.dataset.slotIndex);
            if (!isNaN(idx)) _openTournamentPicker(idx);
        }
    });

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

    const closeBtn = modal.querySelector('.card-picker-close');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());

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
        <button id="btnChampionClose" class="btn-forge" style="margin-top:20px;" onclick="var el=document.getElementById('tournamentChampionOverlay');if(el)el.style.display='none'">🏆 CHAMPION</button>
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

// =============================================
// 🎮 ROGUELIKE — Hero Picker
// =============================================
// 🎮 ROGUELIKE — Adventure Lobby
// =============================================
export function renderAdventureLobby(runData) {
    const existing = document.getElementById('adventureLobbyContainer');
    if (existing) existing.remove();
    cleanAdventureOverlays();

    const container = document.createElement('div');
    container.id = 'adventureLobbyContainer';
    container.className = 'adventure-lobby-container';

    container.innerHTML = `
        <div class="adventure-lobby-text" id="btnSelectHero">⚔️ Empieza tu aventura</div>
    `;

    const canvas = document.getElementById('worldMapCanvas');
    if (canvas) canvas.appendChild(container);

    if (typeof gsap !== 'undefined') {
        try { gsap.from('.adventure-lobby-text', { y: 20, opacity: 0, duration: 0.4, ease: "power2.out" }); } catch (e) {}
    }
}

// =============================================
export function renderHeroPicker(onSelect) {
    const existing = document.getElementById('heroPickerOverlay');
    if (existing) existing.remove();

    const allCards = Engine.getAllPlayableCards();
    const overlay = document.createElement('div');
    overlay.id = 'heroPickerOverlay';
    overlay.className = 'hero-picker-overlay';

    const gridHtml = allCards.map(c => {
        return `
            <div class="hero-picker-card" data-card-id="${esc(c.id)}">
                <span class="hpc-element">${elementIcon(c.element || 'Neutral')}</span>
                <div class="hpc-name">${esc(c.name)}</div>
                <div class="hpc-desc">${esc(c.description || c.cardClass || '')}</div>
                <div class="hpc-stats">
                    <span>❤️${c.hp}</span>
                    <span>⚔️${c.atq}</span>
                    <span>🛡️${c.def}</span>
                    <span>💨${c.vel || 80}</span>
                </div>
            </div>
        `;
    }).join('');

    overlay.innerHTML = `
        <button class="hero-picker-close" id="heroPickerClose">✕</button>
        <div class="hero-picker-title">🎴 Choose Your Hero</div>
        <div class="hero-picker-subtitle">Select one hero to embark on the run</div>
        <div class="hero-picker-grid">${gridHtml}</div>
    `;

    const closeBtn = overlay.querySelector('#heroPickerClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.remove();
        });
    }

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.hero-picker-card').forEach(el => {
        el.addEventListener('click', () => {
            const cardId = el.dataset.cardId;
            const card = allCards.find(c => c.id === cardId);
            if (card && onSelect) {
                const clone = Engine.initializeCard(JSON.parse(JSON.stringify(card)));
                clone.fervor = 0;
                clone.ultimateCooldown = 0;
                clone._secondWindUsed = false;
                onSelect(clone);
            }
            overlay.remove();
        });
    });

    if (typeof gsap !== 'undefined') {
        try { gsap.from('.hero-picker-grid > *', { y: 30, opacity: 0, duration: 0.3, stagger: 0.03, ease: "power2.out" }); } catch (e) {}
    }
}

// =============================================
// 🎮 ROGUELIKE — Organigrama
// =============================================
export function renderOrganigrama(runData, currentNode) {
    const existing = document.getElementById('organigramaContainer');
    if (existing) existing.remove();
    cleanAdventureOverlays();

    const container = document.createElement('div');
    container.id = 'organigramaContainer';
    container.className = 'organigrama-container';

    const phasesHtml = runData.nodes.map((n, i) => {
        const phaseNum = i + 1;
        const isCompleted = i < currentNode;
        const isCurrent = i === currentNode;
        const isBoss = n.isBoss;

        let cls = 'og-phase';
        if (isCompleted) cls += ' completed';
        if (isCurrent) cls += ' current';
        if (isBoss) cls += ' boss';

        let icon, desc;
        if (n.type === 'combat') {
            icon = isBoss ? '👾' : '⚔️';
            desc = isBoss ? 'Goblin Shaman' : n.enemyId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        } else {
            icon = '🏕️';
            desc = 'ITEM OR BUFF SELECTOR';
        }

        let statusHtml;
        if (isCompleted) statusHtml = '✅';
        else if (isCurrent) statusHtml = '✦';
        else statusHtml = '🔒';

        return `
            <div class="${cls}" data-phase="${i}">
                <span class="og-phase-icon">${icon}</span>
                <span class="og-phase-label">Fase 1-${phaseNum}</span>
                <span class="og-phase-desc">${esc(desc)}</span>
                <span class="og-phase-status">${statusHtml}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="og-phases">${phasesHtml}</div>`;

    const canvas = document.getElementById('worldMapCanvas');
    if (canvas) canvas.appendChild(container);

}

function elementIcon(element) {
    const map = { 'Fuego': '🔥', 'Agua': '💧', 'Rayo': '⚡', 'Naturaleza': '🌿', 'Oscuridad': '🌑', 'Luz': '☀️', 'Neutral': '⚪', 'Wind': '💨', 'Earth': '⛰️', 'Darkness': '🌑', 'Nature': '🌿' };
    return map[element] || '❓';
}

// =============================================
// 🎮 ROGUELIKE — Single Hero Arena (1v1)
// =============================================
export function renderSingleHeroArena(hero, enemy, turnCount) {
    const existing = document.getElementById('singleArena');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'singleArena';
    container.className = 'single-arena';

    const isBoss = !!enemy.isBoss;

    const cardHtml = (entity, type) => {
        const cls = type === 'hero' ? 'hero-card' : (isBoss ? 'boss-enemy' : 'enemy-card');
        const hpPct = Math.max(0, (entity.hp / entity.maxHp) * 100);
        const fervorPct = Math.min(100, ((entity.fervor || 0) / 10) * 100);
        return `
            <div class="single-arena-card ${cls}" data-entity="${type}">
                <div class="sac-avatar">${elementIcon(entity.element || 'Neutral')}</div>
                <div class="sac-name">${esc(entity.name)}</div>
                <div class="sac-element">${entity.element || 'Neutral'} · ${entity.cardClass || ''}</div>
                <div class="sac-hp-bar">
                    <div class="sac-hp-fill" id="${type}HpFill" style="width:${hpPct}%"></div>
                </div>
                <div class="sac-hp-text">❤️ ${Math.max(0, entity.hp)} / ${entity.maxHp}</div>
                <div class="sac-stats">
                    <span class="s">⚔️ ATQ</span><span class="v">${entity.atq}</span>
                    <span class="s">🛡️ DEF</span><span class="v">${entity.def}</span>
                    <span class="s">💨 VEL</span><span class="v">${entity.vel || 50}</span>
                </div>
                <div class="single-arena-fervor">🔥 Fervor: ${entity.fervor || 0}/10</div>
            </div>
        `;
    };

    container.innerHTML = `
        ${cardHtml(hero, 'hero')}
        <div class="single-arena-vs">⚔</div>
        ${cardHtml(enemy, 'enemy')}
    `;

    const canvas = document.getElementById('worldMapCanvas');
    if (canvas) canvas.appendChild(container);

    if (typeof gsap !== 'undefined') {
        try {
            gsap.from('.single-arena-card', { y: -30, opacity: 0, duration: 0.4, stagger: 0.1, ease: "back.out(1.7)" });
        } catch (e) {}
    }
}

export function updateSingleHeroArena(hero, enemy) {
    const updateCard = (entity, type) => {
        const card = document.querySelector(`.single-arena-card[data-entity="${type}"]`);
        if (!card) return;
        const hpPct = Math.max(0, (entity.hp / entity.maxHp) * 100);
        const fill = card.querySelector('.sac-hp-fill');
        if (fill) fill.style.width = `${hpPct}%`;
        const hpText = card.querySelector('.sac-hp-text');
        if (hpText) hpText.textContent = `❤️ ${Math.max(0, entity.hp)} / ${entity.maxHp}`;
        const fervor = card.querySelector('.single-arena-fervor');
        if (fervor) fervor.textContent = `🔥 Fervor: ${entity.fervor || 0}/10`;
    };
    updateCard(hero, 'hero');
    updateCard(enemy, 'enemy');
}

export function renderPotionBar(healCount, fervorCount) {
    const existing = document.getElementById('potionBar');
    if (existing) existing.remove();
    const bar = document.createElement('div');
    bar.id = 'potionBar';
    bar.className = 'potion-bar';
    bar.innerHTML = `
        <button class="potion-btn potion-heal" id="btnHealPotion"${healCount <= 0 ? ' disabled' : ''}>
            🧪 <span class="potion-count">${healCount}</span>
        </button>
        <button class="potion-btn potion-fervor" id="btnFervorPotion"${fervorCount <= 0 ? ' disabled' : ''}>
            🟡 <span class="potion-count">${fervorCount}</span>
        </button>
    `;
    const canvas = document.getElementById('worldMapCanvas');
    if (canvas) canvas.appendChild(bar);
}

export function showSingleHeroActions(hero, onAttack, onUltimate) {
    const existing = document.getElementById('singleArenaActions');
    if (existing) existing.remove();

    const actions = document.createElement('div');
    actions.id = 'singleArenaActions';
    actions.className = 'single-arena-actions';

    const ultAvailable = hero.fervor >= 10 && hero.ultimateId && (hero.ultimateCooldown || 0) <= 0;
    const ultDisabled = !ultAvailable || !hero.ultimateId || hero.ultimateCooldown > 0;
    const ultLabel = ultDisabled ? (hero.ultimateCooldown > 0 ? 'Cooldown' : 'Need Fervor') : 'ULTIMATE';

    actions.innerHTML = `
        <button class="btn-attack" id="btnSingleAttack">⚔️ ATTACK</button>
        <button class="btn-ultimate" id="btnSingleUltimate"${ultDisabled ? ' disabled' : ''}>
            🔥 ${ultLabel}
        </button>
    `;

    const canvas = document.getElementById('worldMapCanvas');
    if (canvas) canvas.appendChild(actions);

    document.getElementById('btnSingleAttack')?.addEventListener('click', () => { if (onAttack) onAttack(); });
    document.getElementById('btnSingleUltimate')?.addEventListener('click', () => { if (onUltimate && !ultDisabled) onUltimate(); });
}

export function removeSingleHeroActions() {
    const el = document.getElementById('singleArenaActions');
    if (el) el.remove();
}

// =============================================
// 🎮 ROGUELIKE — Upgrade Modal
// =============================================
export function renderUpgradeModal(choices, onSelect) {
    const existing = document.getElementById('upgradeModalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'upgradeModalOverlay';
    overlay.className = 'upgrade-modal-overlay';

    const cardsHtml = choices.map((c, i) => `
        <div class="upgrade-card" data-choice-index="${i}">
            <div class="uc-icon">${c.icon || '⭐'}</div>
            <div class="uc-name">${esc(c.name)}</div>
            <div class="uc-desc">${esc(c.desc)}</div>
        </div>
    `).join('');

    overlay.innerHTML = `
        <div class="upgrade-modal-title">🏕️ Choose an Upgrade</div>
        <div class="upgrade-modal-sub">Pick one blessing for your journey</div>
        <div class="upgrade-choices">${cardsHtml}</div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.upgrade-card').forEach(el => {
        el.addEventListener('click', () => {
            const idx = parseInt(el.dataset.choiceIndex);
            if (onSelect) onSelect(idx);
            overlay.remove();
        });
    });

}

// =============================================
// 🎮 ROGUELIKE — Item Drop
// =============================================
export function renderItemDrop(item, onEquip, onSkip) {
    const existing = document.getElementById('itemDropOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'itemDropOverlay';
    overlay.className = 'item-drop-overlay';

    const color = Engine.getItemRarityColor(item.rarity);
    const statsParts = [];
    if (item.atq) statsParts.push(`⚔️ +${item.atq} ATQ`);
    if (item.def) statsParts.push(`🛡️ ${item.def >= 0 ? '+' : ''}${item.def} DEF`);
    if (item.hp) statsParts.push(`❤️ +${item.hp} HP`);
    if (item.vel) statsParts.push(`💨 +${item.vel} VEL`);
    const statsStr = statsParts.length > 0 ? statsParts.join(' · ') : 'No stats';

    const slotLabel = item.slot === 'weapon' ? '⚔️ Weapon Slot' : '🛡️ Armor Slot';

    overlay.innerHTML = `
        <div class="item-drop-box">
            <div class="item-drop-icon">${item.slot === 'weapon' ? '🗡️' : '🛡️'}</div>
            <div class="item-drop-name" style="color:${color}">${esc(item.name)}</div>
            <div class="item-drop-rarity" style="color:${color}">${item.rarity} · ${slotLabel}</div>
            <div class="item-drop-stats">${statsStr}</div>
            <div class="item-drop-btns">
                <button class="btn-equip" id="btnEquipItem">⚡ Equip</button>
                <button class="btn-skip" id="btnSkipItem">Skip</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btnEquipItem')?.addEventListener('click', () => { if (onEquip) onEquip(); overlay.remove(); });
    document.getElementById('btnSkipItem')?.addEventListener('click', () => { if (onSkip) onSkip(); overlay.remove(); });
}

// =============================================
// 🎮 ROGUELIKE — Run Result
// =============================================
export function renderRunComplete(runName, hero, weapon, armor, onContinue) {
    const existing = document.getElementById('runResultOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'runResultOverlay';
    overlay.className = 'run-result-overlay';

    const items = [];
    if (weapon) items.push(`⚔️ ${weapon.name}`);
    if (armor) items.push(`🛡️ ${armor.name}`);

    const itemsHtml = items.length > 0
        ? items.map(i => `<span class="rri">${i}</span>`).join('')
        : '<span class="rri" style="color:#888;">No items</span>';

    const gold = 100;
    const xp = 50;

    overlay.innerHTML = `
        <div class="run-result-box victory">
            <div class="run-result-icon">👑</div>
            <div class="run-result-title win">🏆 Run Complete!</div>
            <div class="run-result-desc">${esc(runName)} conquered!</div>
            <div class="run-result-stats">❤️ ${Math.max(0, hero.hp)} / ${hero.maxHp} HP remaining</div>
            <div class="run-result-stats">💰 Gold: +${gold} · ⭐ XP: +${xp}</div>
            <div class="run-result-items">${itemsHtml}</div>
            <button class="run-result-btn btn-continue" id="btnRunContinue">Continue</button>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btnRunContinue')?.addEventListener('click', () => { if (onContinue) onContinue(); overlay.remove(); });
}

export function renderRunGameOver(hero, runName, onRetry, onQuit) {
    const existing = document.getElementById('runResultOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'runResultOverlay';
    overlay.className = 'run-result-overlay';

    overlay.innerHTML = `
        <div class="run-result-box defeat">
            <div class="run-result-icon">💀</div>
            <div class="run-result-title lose">Run Failed</div>
            <div class="run-result-desc">${esc(hero.name)} fell in ${esc(runName)}</div>
            <div class="run-result-stats" style="margin-bottom:14px;">Reached node ${Math.max(0, hero._runNodeReached || 0)}/${hero._runTotalNodes || 6}</div>
            <button class="run-result-btn btn-retry" id="btnRunRetry">🔄 Try Again</button>
            <button class="run-result-btn btn-quit" id="btnRunQuit">Quit</button>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('btnRunRetry')?.addEventListener('click', () => { if (onRetry) onRetry(); overlay.remove(); });
    document.getElementById('btnRunQuit')?.addEventListener('click', () => { if (onQuit) onQuit(); overlay.remove(); });
}
