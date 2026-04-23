let cards = [];

// --- 1. ESCUCHADORES DE EVENTOS (REACTIVIDAD) ---

// Agrupamos los IDs que deben disparar la actualización de la Preview
const inputIds = ['cardName', 'cardImg', 'cardElement', 'cardClass', 'inputHP', 'inputDEF', 'inputATQ', 'cardPassive'];

inputIds.forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        // Cada vez que el usuario haga ALGO, ejecutamos ambas funciones
        updateRemainingPoints();
        updatePreview();
    });
});

// --- 2. LÓGICA DE PUNTOS ---

function updateRemainingPoints() {
    const hp = parseInt(document.getElementById('inputHP').value);
    const def = parseInt(document.getElementById('inputDEF').value);
    const atq = parseInt(document.getElementById('inputATQ').value);
    
    // Actualizamos los números pequeños al lado de los sliders
    document.getElementById('valHP').innerText = hp;
    document.getElementById('valDEF').innerText = def;
    document.getElementById('valATQ').innerText = atq;

    const totalPoints = 7400;
    const remainingPoints = totalPoints - (hp + def + atq);
    
    const remainingEl = document.getElementById('remainingPts');
    remainingEl.innerText = remainingPoints;

    // Advertencia técnica: Si es negativo, ponemos el número en rojo
    if (remainingPoints < 0) {
        remainingEl.style.color = "red";
        remainingEl.style.fontWeight = "bold";
        document.getElementById('saveCardBtn').disabled = true;
    } else {
        remainingEl.style.color = "black"; // O el color de tu diseño
        remainingEl.style.fontWeight = "normal";
        document.getElementById('saveCardBtn').disabled = false;
    }
}

// --- 3. PREVISUALIZACIÓN EN VIVO ---

function updatePreview() {
    const name = document.getElementById('cardName').value;
    const imgUrl = document.getElementById('cardImg').value;
    const element = document.getElementById('cardElement').value;
    const cardClass = document.getElementById('cardClass').value;
    const hp = document.getElementById('inputHP').value;
    const def = document.getElementById('inputDEF').value;
    const atq = document.getElementById('inputATQ').value;
    const passive = document.getElementById('cardPassive').value;

    const elementIcons = {
        'Fuego': '🔥', 'Agua': '💧', 'Rayo': '⚡',
        'Naturaleza': '🌿', 'Viento': '🌬️', 'Luz': '✨', 'Oscuridad': '🌑'
    };

    const passiveNames = {
        'regen': 'Regeneración de HP',
        'reflect': 'Reflejo de Daño',
        'poison': 'Envenenamiento',
        'control': 'Paralizar',
        'atk_boost': 'Aumento ATQ Masivo',
        'risk': 'Gran Daño (Prob. Fallo)'
    };

    // Inyectar en el DOM
    document.getElementById('previewName').innerText = name || "Nombre de Carta";
    document.getElementById('previewElement').innerText = elementIcons[element] || '❓';
    
    const artContainer = document.getElementById('previewArt');
    artContainer.style.backgroundImage = imgUrl.trim() !== "" ? `url('${imgUrl}')` : `url('https://via.placeholder.com/200?text=Imagen')`;

    document.getElementById('previewClass').innerText = `Clase: ${cardClass}`;
    document.getElementById('statHP').innerText = hp;
    document.getElementById('statDEF').innerText = def;
    document.getElementById('statATQ').innerText = atq;
    document.getElementById('previewPassive').innerText = `Pasiva: ${passiveNames[passive] || 'Selecciona una...'}`;
}

// --- 4. GESTIÓN DE BIBLIOTECA ---

document.getElementById('saveCardBtn').addEventListener('click', () => {
    const card = {
        name: document.getElementById('cardName').value,
        img: document.getElementById('cardImg').value,
        element: document.getElementById('cardElement').value,
        cardClass: document.getElementById('cardClass').value,
        hp: parseInt(document.getElementById('inputHP').value),
        def: parseInt(document.getElementById('inputDEF').value),
        atq: parseInt(document.getElementById('inputATQ').value),
        passive: document.getElementById('cardPassive').value
    };
    
    cards.push(card);
    displayCards();
    clearForm();
});

function displayCards() {
    const cardsDeck = document.getElementById('cardsDeck');
    cardsDeck.innerHTML = ''; 
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-preview'; // Misma clase CSS para todas
        cardDiv.innerHTML = `
            <div class="card-art" style="background-image: url('${card.img || 'https://via.placeholder.com/300x200?text=Easy+Hit'}');"></div>
            <div class="card-body">
                <div class="card-header">
                    <h3>${card.name}</h3>
                </div>
                <div class="meta-info">
                    ${card.element} | ${card.cardClass}
                </div>
                <div class="preview-stats">
                    <div>⚔️ <b>${card.atq}</b></div>
                    <div>🛡️ <b>${card.def}</b></div>
                    <div>❤️ <b>${card.hp}</b></div>
                </div>
                <p class="passive-desc">${card.passive}</p>
            </div>
        `;
        cardsDeck.appendChild(cardDiv);
    });
}

function clearForm() {
    document.getElementById('cardName').value = '';
    document.getElementById('cardImg').value = '';
    document.getElementById('inputHP').value = 2400;
    document.getElementById('inputDEF').value = 2500;
    document.getElementById('inputATQ').value = 2500;
    updateRemainingPoints();
    updatePreview(); // Limpiamos también la previsualización
}