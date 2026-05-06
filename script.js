// --- 1. APPLICATION STATE ---
let cards = JSON.parse(localStorage.getItem('easyHitLibrary')) || [];
let currentCropper = null;
let croppedImageBase64 = null; 

// --- 2. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateRemainingPoints();
    updatePreview();
    displayCards();
});

// --- 3. EVENT LISTENERS ---
function setupEventListeners() {
    const inputIds = ['cardName', 'cardElement', 'cardClass', 'inputHP', 'inputDEF', 'inputATQ', 'cardPassive'];
    
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', () => {
                updateRemainingPoints();
                updatePreview();
            });
        }
    });

    document.getElementById('cardImgFile').addEventListener('change', handleFileSelect);
    document.getElementById('cropImageBtn').addEventListener('click', applyCrop);
    document.getElementById('cancelCropBtn').addEventListener('click', closeCropper);
    document.getElementById('saveCardBtn').addEventListener('click', saveCard);

    // --- Coliseum Search Handlers ---
    const search1 = document.getElementById('searchFighter1');
    const search2 = document.getElementById('searchFighter2');
    
    if(search1) {
        search1.addEventListener('input', (e) => renderSelector('fighter1Select', e.target.value));
    }
    if(search2) {
        search2.addEventListener('input', (e) => renderSelector('fighter2Select', e.target.value));
    }

    // --- AI Art Generator ---
    const btnAI = document.getElementById('btnGenerateAI');
    const inputAI = document.getElementById('aiPrompt');

    if (btnAI) {
        btnAI.addEventListener('click', generateAIImage);
    }
    if (inputAI) {
        inputAI.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') generateAIImage();
        });
    }
}

// --- 4. IMAGE HANDLING (FILE API + CROPPER) ---
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const imgElement = document.getElementById('imageToCrop');
        imgElement.src = event.target.result;
        
        document.getElementById('cropperModal').style.display = 'flex';

        if (currentCropper) currentCropper.destroy();

        currentCropper = new Cropper(imgElement, {
            aspectRatio: 1 / 1, 
            dragMode: 'move', 
            viewMode: 1, 
            modal: false, 
            guides: true, 
            center: false, 
            highlight: false,
            responsive: true,
            restore: false,
            cropBoxMovable: false, 
            cropBoxResizable: false, 
            zoomable: true,
            wheelZoomRatio: 0.1, 
            toggleDragModeOnDblclick: false, 
        });
    };
    reader.readAsDataURL(file);
}

function applyCrop() {
    if (!currentCropper) return;

    const exportWidth = 280; 
    const exportHeight = 200;

    const canvas = currentCropper.getCroppedCanvas({
        width: exportWidth,
        height: exportHeight,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'medium',
    });

    croppedImageBase64 = canvas.toDataURL('image/webp', 0.9);
    
    updatePreview();
    closeCropper();
    
    const saveBtn = document.getElementById('saveCardBtn');
    if (saveBtn) saveBtn.disabled = false;
}

function closeCropper() {
    document.getElementById('cropperModal').style.display = 'none';
    if (currentCropper) {
        currentCropper.destroy();
        currentCropper = null;
    }
}

// --- 5. BALANCING LOGIC (7400 PTS) ---
function updateRemainingPoints() {
    const hp = parseInt(document.getElementById('inputHP').value) || 0;
    const def = parseInt(document.getElementById('inputDEF').value) || 0;
    const atq = parseInt(document.getElementById('inputATQ').value) || 0;
    
    const totalPoints = 7400;
    const usedPoints = hp + def + atq;
    const remainingPoints = totalPoints - usedPoints;

    document.getElementById('valHP').innerText = hp;
    document.getElementById('valDEF').innerText = def;
    document.getElementById('valATQ').innerText = atq;

    const remainingEl = document.getElementById('remainingPts');
    remainingEl.innerText = remainingPoints;

    const saveBtn = document.getElementById('saveCardBtn');
    
    if (remainingPoints < 0) {
        remainingEl.style.color = "#ef4444";
        saveBtn.disabled = true;
    } else {
        remainingEl.style.color = "var(--gold)"; 
        saveBtn.disabled = false;
    }
}

// --- 6. DYNAMIC PREVIEW ---
function updatePreview() {
    const data = {
        name: document.getElementById('cardName').value.trim() || "Hero Name",
        element: document.getElementById('cardElement').value,
        class: document.getElementById('cardClass').value,
        hp: document.getElementById('inputHP').value,
        def: document.getElementById('inputDEF').value,
        atq: document.getElementById('inputATQ').value,
        passive: document.getElementById('cardPassive').value
    };

    const elementConfigs = {
        'Fuego':      { icon: '🔥', color: '#ef4444', label: 'Fire' },
        'Agua':       { icon: '💧', color: '#3b82f6', label: 'Water' },
        'Rayo':       { icon: '⚡', color: '#f59e0b', label: 'Lightning' },
        'Naturaleza': { icon: '🌿', color: '#10b981', label: 'Nature' }
    };

    const classIcons = {
        'Robot': '🤖', 'Dragón': '🐉', 'Humano': '👤', 'Espectro': '👻', 'Neutral': '😐'
    };

    const passiveNames = {
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

    document.getElementById('previewName').innerText = data.name;
    document.getElementById('previewElement').innerText = elementConfigs[data.element].icon;
    document.getElementById('previewClass').innerText = `${classIcons[data.class]} ${data.class}`;
    
    document.getElementById('statHP').innerText = data.hp;
    document.getElementById('statDEF').innerText = data.def;
    document.getElementById('statATQ').innerText = data.atq;
    
    document.getElementById('previewPassive').innerHTML = `<strong>PASSIVE:</strong> ${passiveNames[data.passive] || 'Select one'}`;

    const cardVisual = document.getElementById('cardVisual');
    if (cardVisual) {
        cardVisual.style.borderColor = elementConfigs[data.element].color;
    }
    
    const art = document.getElementById('previewArt');
    if (art) {
        if (croppedImageBase64) {
            art.style.backgroundImage = `url('${croppedImageBase64}')`;
        } else {
            art.style.backgroundImage = `url('https://via.placeholder.com/500x380/1e293b/94a3b8?text=Waiting+for+Hero...')`;
        }
    }
}

// --- 7. LIBRARY MANAGEMENT ---
function saveCard() {
    const card = {
        id: Date.now(),
        name: document.getElementById('cardName').value || "Unnamed Hero",
        img: croppedImageBase64, 
        element: document.getElementById('cardElement').value,
        cardClass: document.getElementById('cardClass').value,
        hp: parseInt(document.getElementById('inputHP').value),
        def: parseInt(document.getElementById('inputDEF').value),
        atq: parseInt(document.getElementById('inputATQ').value),
        passiveId: document.getElementById('cardPassive').value,
        passiveName: document.getElementById('cardPassive').options[document.getElementById('cardPassive').selectedIndex].text
    };

    cards.push(card);
    syncStorage();
    displayCards();
    clearForm();
    
    if(typeof showSection === 'function') showSection('library');
}

function deleteCard(id) {
    if(confirm('Delete this card from your collection?')) {
        cards = cards.filter(c => c.id !== id);
        syncStorage();
        displayCards();
    }
}

function displayCards() {
    const deck = document.getElementById('cardsDeck');
    if (!deck) return;

    if (cards.length === 0) {
        deck.innerHTML = '<div class="empty-state"><p>No cards forged yet...</p></div>';
        return;
    }

    deck.innerHTML = '';
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-preview';
        
        const elementColors = { 'Fuego': '#ef4444', 'Agua': '#3b82f6', 'Rayo': '#f59e0b', 'Naturaleza': '#10b981' };
        cardDiv.style.borderColor = elementColors[card.element] || '#334155';

        cardDiv.innerHTML = `
            <div class="card-art" style="background-image: url('${card.img || 'https://via.placeholder.com/300x200?text=No+Art'}')"></div>
            <div class="card-body">
                <div class="card-header-inner">
                    <h3>${card.name}</h3>
                </div>
                <div class="meta-info">${card.element} | ${card.cardClass}</div>
                <div class="preview-stats">
                    <div class="stat-box">⚔️ <b>${card.atq}</b></div>
                    <div class="stat-box">🛡️ <b>${card.def}</b></div>
                    <div class="stat-box">❤️ <b>${card.hp}</b></div>
                </div>
                <p class="passive-desc"><strong>PASSIVE:</strong> ${card.passiveName || "No Ability"}</p>
                <button class="btn-delete" onclick="deleteCard(${card.id})" style="margin-top:10px; background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.7rem; font-weight:bold; width:100%;">[ DELETE ]</button>
            </div>
        `;
        deck.appendChild(cardDiv);
    });
}

function syncStorage() {
    try {
        localStorage.setItem('easyHitLibrary', JSON.stringify(cards));
    } catch (e) {
        alert("⚠️ Local storage limit reached! Your library is massive. Please export your collection to your PC and delete some cards to make space.");
    }
}

function clearForm() {
    document.getElementById('cardName').value = '';
    document.getElementById('cardImgFile').value = '';
    croppedImageBase64 = null; 
    document.getElementById('cardElement').selectedIndex = 0;
    document.getElementById('cardClass').selectedIndex = 0;
    document.getElementById('cardPassive').selectedIndex = 0;
    document.getElementById('inputHP').value = 2400;
    document.getElementById('inputDEF').value = 2500;
    document.getElementById('inputATQ').value = 2500;
    updateRemainingPoints();
    updatePreview();
}

// --- 8. JSON IMPORT/EXPORT ---
function exportarBiblioteca() {
    if (cards.length === 0) {
        alert("Library is empty. Forge some cards first.");
        return;
    }
    const exportData = {
        app: "EasyHitForge",
        version: 1,
        exportDate: new Date().toISOString().split('T')[0],
        library: cards
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `easyhit_library_${new Date().toLocaleDateString()}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function importarBiblioteca(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = JSON.parse(e.target.result);
            let newCards = content.library || (Array.isArray(content) ? content : []);
            if (newCards.length > 0) {
                if (confirm(`Found ${newCards.length} cards. Import and overwrite current library?`)) {
                    cards = newCards;
                    syncStorage();
                    displayCards();
                    alert("Library loaded successfully!");
                }
            } else {
                alert("The file is valid but the library is empty.");
            }
        } catch (err) {
            alert("Critical error processing JSON file.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// --- 9. COLISEUM MATH ENGINE ---
let c1, c2; 
let roundNum = 0;

function renderSelector(selectId, searchTerm = '') {
    const select = document.getElementById(selectId);
    const btnFight = document.getElementById('btnLuchar');
    if (!select) return;

    const term = searchTerm.toLowerCase().trim();
    const filteredCards = cards.filter(c => c.name.toLowerCase().includes(term));
    
    if (filteredCards.length === 0) {
        select.innerHTML = '<option value="">No hero matches...</option>';
        if (btnFight) btnFight.disabled = true; 
        return;
    }

    if (btnFight && cards.length >= 2) btnFight.disabled = false;

    const classOrder = ['Humano', 'Robot', 'Dragón', 'Espectro', 'Neutral'];
    const groupedCards = { 'Humano': [], 'Robot': [], 'Dragón': [], 'Espectro': [], 'Neutral': [], 'Unknown': [] };

    filteredCards.forEach(c => {
        const cardCl = c.cardClass || 'Unknown';
        if (groupedCards[cardCl]) groupedCards[cardCl].push(c);
        else groupedCards['Unknown'].push(c);
    });

    let optionsHTML = '';
    [...classOrder, 'Unknown'].forEach(className => {
        const group = groupedCards[className];
        if (group && group.length > 0) {
            optionsHTML += `<optgroup label="-- ${className.toUpperCase()} --">`;
            group.forEach(c => {
                optionsHTML += `<option value="${c.id}">${c.name} (${c.hp} HP / ${c.def} DEF / ${c.atq} ATQ)</option>`;
            });
            optionsHTML += `</optgroup>`;
        }
    });
    
    const prevValue = select.value;
    select.innerHTML = optionsHTML;
    if (prevValue && Array.from(select.options).some(opt => opt.value === prevValue)) {
        select.value = prevValue;
    }
}

function prepararColiseo() {
    const btnFight = document.getElementById('btnLuchar');
    if (cards.length < 2) {
        document.getElementById('fighter1Select').innerHTML = '<option value="">Need more cards</option>';
        document.getElementById('fighter2Select').innerHTML = '<option value="">Need more cards</option>';
        if (btnFight) btnFight.disabled = true;
        return;
    }
    if (btnFight) btnFight.disabled = false;
    renderSelector('fighter1Select', '');
    renderSelector('fighter2Select', '');
}

function logConsole(msg, type = 'attack') {
    const consoleEl = document.getElementById('combatLog');
    consoleEl.innerHTML += `<div class="log-entry ${type}">${msg}</div>`;
    consoleEl.scrollTop = consoleEl.scrollHeight; 
}

function iniciarCombate() {
    const id1 = parseInt(document.getElementById('fighter1Select').value);
    const id2 = parseInt(document.getElementById('fighter2Select').value);
    
    if (isNaN(id1) || isNaN(id2)) {
        alert("Please select two valid fighters.");
        return;
    }
    if (id1 === id2) {
        alert("Cloning not allowed! Select different heroes.");
        return;
    }

    c1 = JSON.parse(JSON.stringify(cards.find(c => c.id === id1)));
    c2 = JSON.parse(JSON.stringify(cards.find(c => c.id === id2)));
    
    if (!c1 || !c2) return;

    c1.maxHp = c1.hp; c1.flags = {};
    c2.maxHp = c2.hp; c2.flags = {};
    
    roundNum = 0;
    document.getElementById('combatLog').innerHTML = '';
    document.getElementById('btnLuchar').style.display = 'none';
    document.getElementById('btnSiguiente').style.display = 'block';
    document.getElementById('fighter1Select').disabled = true;
    document.getElementById('fighter2Select').disabled = true;

    logConsole(`[ COMBAT START ]`, 'system');
    applyPreCombatPassives(c1, c2);
    applyPreCombatPassives(c2, c1);
    ejecutarRonda(); 
}

function applyPreCombatPassives(fighter, rival) {
    if (fighter.passiveId === 'gen_steal_stats') {
        let stolen = Math.floor((rival.hp + rival.def + rival.atq) * 0.4);
        fighter.atq += stolen;
        logConsole(`✨ ${fighter.name} [Soul Thief]: Stole ${stolen} total power from rival.`, 'system');
    }
    if (fighter.passiveId === 'nem_xenophobia' && rival.cardClass !== 'Humano') {
        fighter.hp *= 2; fighter.maxHp *= 2; fighter.def *= 2; fighter.atq *= 2;
        logConsole(`🩸 ${fighter.name} [Xenophobia]: Enemy is not Human. Stats DOUBLED!`, 'system');
    }
    if (fighter.passiveId === 'nem_element_ward' && rival.element === 'Rayo') {
        rival.atq = Math.floor(rival.atq / 2);
        logConsole(`🛡️ ${fighter.name} [Lightning Rod]: Halved enemy Lightning power.`, 'system');
    }
}

function applyRoundStartPassives(fighter, rival) {
    if (fighter.passiveId === 'prog_scale_stats') {
        fighter.atq = Math.floor(fighter.atq * 1.1);
        fighter.def = Math.floor(fighter.def * 1.1);
        logConsole(`📈 ${fighter.name} [Growth]: Stats increased by 10%.`, 'system');
    }
    if (fighter.passiveId === 'prog_venom') {
        let poison = Math.floor(rival.maxHp * 0.05);
        rival.hp -= poison;
        logConsole(`☠️ ${fighter.name} [Venom]: ${rival.name} takes ${poison} toxin damage.`, 'system');
    }
    if (fighter.passiveId === 'prog_drain_def') {
        let drain = Math.floor(rival.def * 0.1);
        rival.def -= drain;
        if(rival.def < 0) rival.def = 0;
        logConsole(`⚙️ ${fighter.name} [Metal Fatigue]: ${rival.name}'s armor corrodes (-${drain} DEF).`, 'system');
    }
}

function procesarAtaque(attacker, defender) {
    let logStr = "";
    let incomingDmg = attacker.atq;
    let effectiveDef = defender.def;

    if (attacker.passiveId === 'nem_dragon_slayer' && defender.cardClass === 'Dragón') {
        effectiveDef = Math.floor(effectiveDef / 2);
        logStr += `(Ignores 50% DEF) `;
    }

    if (roundNum === 1 && defender.passiveId === 'gen_block_heal') {
        defender.hp += incomingDmg;
        return `[Sacred Veil] Blocks impact and heals ${incomingDmg} HP.`;
    }
    if (roundNum === 1 && defender.passiveId === 'gen_reflect_full') {
        attacker.hp -= incomingDmg;
        return `[Broken Mirror] Reflects attack! Deals ${incomingDmg} damage back.`;
    }

    if (defender.passiveId === 'abs_def_convert') {
        let gain = Math.floor(incomingDmg * 0.5);
        defender.def += gain;
        effectiveDef += gain; 
        logStr += `[Iron Skin: +${gain} DEF] `;
    }
    if (defender.passiveId === 'abs_hp_convert') {
        let heal = Math.floor(incomingDmg * 0.3);
        defender.hp += heal;
        logStr += `[Leech: +${heal} HP] `;
    }

    let reflectedDmg = (defender.passiveId === 'abs_reflect') ? Math.floor(incomingDmg * 0.2) : 0;
    let shieldDmg = Math.min(incomingDmg, effectiveDef);
    defender.def -= shieldDmg;
    if(defender.def < 0) defender.def = 0;
    
    let lifeDmg = incomingDmg - shieldDmg;
    defender.hp -= lifeDmg;

    logStr += `Hits: -${shieldDmg} DEF / <span style="color:#ef4444">-${lifeDmg} HP</span>.`;

    if (reflectedDmg > 0) {
        attacker.hp -= reflectedDmg;
        logStr += ` (Thorn Armor: -${reflectedDmg} HP).`;
    }

    if (defender.hp <= 0 && defender.passiveId === 'fen_revive' && !defender.flags.reviveUsed) {
        defender.hp = incomingDmg; 
        attacker.hp -= incomingDmg; 
        defender.flags.reviveUsed = true;
        logStr += `<br>🌟 <b>GRACEFUL STRIKE!</b> Resurrects with ${incomingDmg} HP and returns fatal damage.`;
    }

    if (defender.hp <= 0 && defender.passiveId === 'fen_antimatter' && !defender.flags.antimatterUsed) {
        let explosion = defender.atq * 3;
        attacker.hp -= explosion;
        defender.flags.antimatterUsed = true;
        logStr += `<br>☢️ <b>OVERKILL!</b> Core detonates dealing ${explosion} direct damage.`;
    }

    return logStr;
}

function checkPhoenix(fighter) {
    if (fighter.passiveId === 'fen_berserker' && !fighter.flags.berserk && fighter.hp <= (fighter.maxHp * 0.3)) {
        fighter.atq = Math.floor(fighter.atq * 3);
        fighter.flags.berserk = true;
        logConsole(`🔥 ${fighter.name} enters BERSERKER MODE (ATK x3)!`, 'system');
    }
    if (fighter.passiveId === 'fen_last_stand' && !fighter.flags.lastStand && fighter.hp <= (fighter.maxHp * 0.2)) {
        fighter.def = Math.floor(fighter.def * 4);
        fighter.flags.lastStand = true;
        logConsole(`🛡️ ${fighter.name} activates LAST STAND (DEF x4)!`, 'system');
    }
}

function ejecutarRonda() {
    roundNum++;
    logConsole(`--- ROUND ${roundNum} ---`, 'round');
    
    applyRoundStartPassives(c1, c2);
    applyRoundStartPassives(c2, c1);

    if(c1.hp <= 0 || c2.hp <= 0) return verifyVictory();

    let log1 = procesarAtaque(c1, c2);
    let log2 = procesarAtaque(c2, c1);

    logConsole(`⚔️ <b>${c1.name}</b> attacks: ${log1}`, 'attack');
    logConsole(`⚔️ <b>${c2.name}</b> attacks: ${log2}`, 'attack');

    checkPhoenix(c1);
    checkPhoenix(c2);

    logConsole(`📊 STATUS: ${c1.name} [${c1.hp} HP] vs ${c2.name} [${c2.hp} HP]`, 'system');
    verifyVictory();
}

function verifyVictory() {
    let battleEnd = false;
    if (c1.hp <= 0 && c2.hp <= 0) {
        logConsole('💥 BOTH FIGHTERS FALL!', 'system');
        if (c1.hp > c2.hp) logConsole(`🏆 ${c1.name} CLAIMS A NEGATIVE VICTORY!`, 'victory');
        else if (c2.hp > c1.hp) logConsole(`🏆 ${c2.name} CLAIMS A NEGATIVE VICTORY!`, 'victory');
        else logConsole('⚖️ ABSOLUTE MATHEMATICAL DRAW.', 'victory');
        battleEnd = true;
    } 
    else if (c1.hp <= 0) {
        logConsole(`🏆 ${c2.name} IS VICTORIOUS!`, 'victory');
        battleEnd = true;
    } else if (c2.hp <= 0) {
        logConsole(`🏆 ${c1.name} IS VICTORIOUS!`, 'victory');
        battleEnd = true;
    }

    if (battleEnd) {
        document.getElementById('btnSiguiente').style.display = 'none';
        const btnFight = document.getElementById('btnLuchar');
        btnFight.style.display = 'block';
        btnFight.innerText = 'NEW BATTLE';
        ['fighter1Select', 'fighter2Select', 'searchFighter1', 'searchFighter2'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.disabled = false;
        });
        renderSelector('fighter1Select', '');
        renderSelector('fighter2Select', '');
    }
}

// Placeholder for AI Art Generator - Logic to be implemented
function generateAIImage() {
    const status = document.getElementById('aiStatus');
    if(status) status.innerText = "Connecting to Aether... (Feature coming soon)";
}