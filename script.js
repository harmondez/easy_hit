// --- 1. ESTADO DE LA APLICACIÓN ---
let cards = JSON.parse(localStorage.getItem('easyHitLibrary')) || [];
let currentCropper = null;
let croppedImageBase64 = null; // Almacena la imagen final optimizada

// --- 2. INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateRemainingPoints();
    updatePreview();
    displayCards();
});

// --- 3. ESCUCHADORES DE EVENTOS ---
function setupEventListeners() {
    // IDs de inputs que disparan actualización visual (quitamos cardImg tipo URL)
    const inputIds = ['cardName', 'cardElement', 'cardClass', 'inputHP', 'inputDEF', 'inputATQ', 'cardPassive'];
    
    inputIds.forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            updateRemainingPoints();
            updatePreview();
        });
    });

    // Evento para subir archivo desde el PC
    document.getElementById('cardImgFile').addEventListener('change', handleFileSelect);

    // Botones del Modal de Recorte
    document.getElementById('cropImageBtn').addEventListener('click', applyCrop);
    document.getElementById('cancelCropBtn').addEventListener('click', closeCropper);

    // Botón principal de guardado
    document.getElementById('saveCardBtn').addEventListener('click', saveCard);
}

// --- 4. MANEJO DE IMÁGENES (FILE API + CROPPER) ---
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const imgElement = document.getElementById('imageToCrop');
        imgElement.src = event.target.result;
        
        document.getElementById('cropperModal').style.display = 'flex';

        if (currentCropper) currentCropper.destroy();

        // CONFIGURACIÓN DE UX AVANZADA (MODO INSTAGRAM)
        currentCropper = new Cropper(imgElement, {
            // PROPORCIÓN: Forzamos 1:1 (cuadrado) para que el círculo sea perfecto
            aspectRatio: 1 / 1, 
            
            // UX DEFAULT: El usuario mueve y hace zoom a la foto con el ratón/dedo
            dragMode: 'move', 
            viewMode: 1, // La foto siempre debe cubrir la zona del círculo
            
            // INTERFAZ: Mostramos el círculo, ocultamos lo feo
            modal: false, // Desactivamos el oscurecimiento nativo (lo hacemos nosotros por CSS)
            guides: true, // Guías de tercios (muy útil)
            center: false, // Ocultamos la cruz del centro
            highlight: false,
            responsive: true,
            restore: false,
            
            // GESTIÓN DEL CUADRO: El cuadro es fijo, no se puede redimensionar
            cropBoxMovable: false, 
            cropBoxResizable: false, 
            
            // ZOOM: Activamos zoom y sensibilidad
            zoomable: true,
            wheelZoomRatio: 0.1, // Sensibilidad con rueda de ratón
            toggleDragModeOnDblclick: false, // Evitar clics accidentales
        });
    };
    reader.readAsDataURL(file);
}

function applyCrop() {
    if (!currentCropper) return;

    // 1. Calculamos el tamaño basado en tus variables de :root (multiplicado x2 para calidad)
    const exportWidth = 280 * 2; 
    const exportHeight = 200 * 2;

    // 2. Obtenemos el canvas con super-resolución
    const canvas = currentCropper.getCroppedCanvas({
        width: exportWidth,
        height: exportHeight,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high', // Crucial para que no se pixele
    });

    // 3. Convertimos a Base64 con calidad máxima
    // Usamos image/jpeg con 0.95 para un equilibrio perfecto entre peso y nitidez
    croppedImageBase64 = canvas.toDataURL('image/jpeg', 0.95);
    
    // 4. Inyectamos en la preview
    const art = document.getElementById('previewArt');
    if (art) {
        art.style.backgroundImage = `url('${croppedImageBase64}')`;
        art.style.backgroundSize = 'cover';
        art.style.backgroundPosition = 'center';
    }

    closeCropper();
    
    // Si tienes un sistema de guardado, asegúrate de habilitar el botón ahora
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

// --- 5. LÓGICA DE BALANCEO (7400 PTS) ---
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
        remainingEl.style.color = "var(--primary)";
        saveBtn.disabled = false;
    }
}

// --- 6. PREVISUALIZACIÓN DINÁMICA ---
function updatePreview() {
    const data = {
        name: document.getElementById('cardName').value || "Nombre del Héroe",
        element: document.getElementById('cardElement').value,
        class: document.getElementById('cardClass').value,
        hp: document.getElementById('inputHP').value,
        def: document.getElementById('inputDEF').value,
        atq: document.getElementById('inputATQ').value,
        passive: document.getElementById('cardPassive').value
    };

    const elementIcons = {
        'Fuego': '🔥', 'Agua': '💧', 'Rayo': '⚡', 'Naturaleza': '🌿', 
        'Viento': '🌬️', 'Luz': '✨', 'Oscuridad': '🌑'
    };

    const passiveNames = {
        'regen': 'Regeneración de HP',
        'reflect': 'Reflejo de Daño (%)',
        'poison': 'Envenenamiento',
        'control': 'Parálisis',
        'atk_boost': 'Aumento ATQ Masivo',
        'risk': 'Daño Crítico (Prob. Fallo)'
    };

    document.getElementById('previewName').innerText = data.name;
    document.getElementById('previewElement').innerText = elementIcons[data.element];
    document.getElementById('previewClass').innerText = data.class;
    document.getElementById('statHP').innerText = data.hp;
    document.getElementById('statDEF').innerText = data.def;
    document.getElementById('statATQ').innerText = data.atq;
    document.getElementById('previewPassive').innerText = `Pasiva: ${passiveNames[data.passive]}`;

    const art = document.getElementById('previewArt');
    // Usamos la imagen cortada si existe, si no, un placeholder
    art.style.backgroundImage = croppedImageBase64 ? `url('${croppedImageBase64}')` : `url('https://via.placeholder.com/300x200?text=Subir+Imagen')`;
}

// --- 7. GESTIÓN DE LA BIBLIOTECA ---
function saveCard() {
    const card = {
        id: Date.now(),
        name: document.getElementById('cardName').value || "Héroe sin nombre",
        img: croppedImageBase64, // Aquí se guarda la imagen real en Base64
        element: document.getElementById('cardElement').value,
        cardClass: document.getElementById('cardClass').value,
        hp: document.getElementById('inputHP').value,
        def: document.getElementById('inputDEF').value,
        atq: document.getElementById('inputATQ').value,
        passive: document.getElementById('cardPassive').options[document.getElementById('cardPassive').selectedIndex].text
    };

    cards.push(card);
    syncStorage();
    displayCards();
    clearForm();
    
    if(typeof showSection === 'function') showSection('library');
}

function deleteCard(id) {
    if(confirm('¿Eliminar esta carta de la colección?')) {
        cards = cards.filter(c => c.id !== id);
        syncStorage();
        displayCards();
    }
}

function displayCards() {
    const deck = document.getElementById('cardsDeck');
    if (!deck) return;

    if (cards.length === 0) {
        deck.innerHTML = '<div class="empty-state"><p>Aún no has forjado ninguna carta...</p></div>';
        return;
    }

    deck.innerHTML = '';
    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-preview';
        cardDiv.innerHTML = `
            <div class="card-art" style="background-image: url('${card.img || 'https://via.placeholder.com/300x200?text=Sin+Arte'}')"></div>
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
                <p class="passive-desc">${card.passive}</p>
                <button class="btn-delete" onclick="deleteCard(${card.id})" style="margin-top:10px; background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.7rem; font-weight:bold;">[ ELIMINAR ]</button>
            </div>
        `;
        deck.appendChild(cardDiv);
    });
}

function syncStorage() {
    localStorage.setItem('easyHitLibrary', JSON.stringify(cards));
}

function clearForm() {
    document.getElementById('cardName').value = '';
    document.getElementById('cardImgFile').value = '';
    croppedImageBase64 = null;
    document.getElementById('inputHP').value = 2400;
    document.getElementById('inputDEF').value = 2500;
    document.getElementById('inputATQ').value = 2500;
    updateRemainingPoints();
    updatePreview();
}