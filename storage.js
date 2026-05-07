// Variable de estado de la biblioteca
export let cards = JSON.parse(localStorage.getItem('easyHitLibrary')) || [];

export function saveCard(card) {
    cards.push(card);
    localStorage.setItem('easyHitLibrary', JSON.stringify(cards));
}

export function deleteCard(id) {
    cards = cards.filter(c => c.id !== id);
    localStorage.setItem('easyHitLibrary', JSON.stringify(cards));
}

export function exportarBiblioteca() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cards));
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
            if (Array.isArray(imported)) {
                cards = imported;
                localStorage.setItem('easyHitLibrary', JSON.stringify(cards));
                if (callback) callback();
            }
        } catch (err) {
            alert("Error al importar el archivo JSON.");
        }
    };
    reader.readAsText(file);
}