window.dbName = "QA_System_DB";
window.storeName = "guide_drafts";

window.initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(window.dbName, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(window.storeName)) {
                db.createObjectStore(window.storeName, { keyPath: "id" });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

window.saveGuideDraft = async () => {
    const data = {
        id: "current_draft",
        epic: document.getElementById('guide_epic')?.value || '',
        notes: document.getElementById('guide_notes')?.value || '',
        updatedAt: Date.now()
    };

    try {
        const db = await window.initDB();
        const transaction = db.transaction([window.storeName], "readwrite");
        transaction.objectStore(window.storeName).put(data);
        
        localStorage.setItem('qa_guide_fallback', JSON.stringify(data));
    } catch (e) {
        console.error("IndexedDB Save Error:", e);
        localStorage.setItem('qa_guide_fallback', JSON.stringify(data));
    }
};

window.loadGuideDraft = async () => {
    try {
        const db = await window.initDB();
        const transaction = db.transaction([window.storeName], "readonly");
        const request = transaction.objectStore(window.storeName).get("current_draft");

        request.onsuccess = (e) => {
            const data = e.target.result;
            if (data) {
                window.applyGuideData(data);
            } else {
                const fallback = localStorage.getItem('qa_guide_fallback');
                if (fallback) window.applyGuideData(JSON.parse(fallback));
            }
        };
    } catch (e) {
        const fallback = localStorage.getItem('qa_guide_fallback');
        if (fallback) window.applyGuideData(JSON.parse(fallback));
    }
};

window.applyGuideData = (data) => {
    const epicEl = document.getElementById('guide_epic');
    const notesEl = document.getElementById('guide_notes');
    if (epicEl) epicEl.value = data.epic || '';
    if (notesEl) notesEl.value = data.notes || '';
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
};

document.addEventListener('componentsLoaded', () => {
    window.loadGuideDraft();

    const guideContainer = document.getElementById('guide-panel-placeholder');
    if (guideContainer) {
        guideContainer.addEventListener('input', (e) => {
            if (e.target.id === 'guide_epic' || e.target.id === 'guide_notes') {
                window.saveGuideDraft();
            }
        });
    }
});
