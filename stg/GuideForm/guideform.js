window.QA_CORE = window.QA_CORE || {};
window.QA_CORE.CONSTANTS = window.QA_CORE.CONSTANTS || {};

window.QA_CORE.CONSTANTS.GUIDE = {
    DB_NAME: "QA_System_DB",
    STORE_NAME: "guide_drafts",
    DRAFT_ID: "current_draft",
    FALLBACK_KEY: "qa_guide_fallback",
    SAVE_DELAY: 1000
};

window.QA_CORE.GuideForm = {
    isSaving: false,
    saveTimer: null,

    initDB: () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(window.QA_CORE.CONSTANTS.GUIDE.DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(window.QA_CORE.CONSTANTS.GUIDE.STORE_NAME)) {
                    db.createObjectStore(window.QA_CORE.CONSTANTS.GUIDE.STORE_NAME, { keyPath: "id" });
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    validate: (epic, notes) => {
        if (epic.length > 1000 || notes.length > 10000) {
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast("입력 가능한 최대 글자 수를 초과했습니다.", "warning");
            return false;
        }
        return true;
    },

    save: async () => {
        if (window.QA_CORE.GuideForm.isSaving) return;

        const epicEl = document.getElementById('guide_epic');
        const notesEl = document.getElementById('guide_notes');
        if (!epicEl || !notesEl) return;

        const epic = epicEl.value.trim();
        const notes = notesEl.value.trim();

        if (!window.QA_CORE.GuideForm.validate(epic, notes)) return;

        window.QA_CORE.GuideForm.isSaving = true;

        const data = {
            id: window.QA_CORE.CONSTANTS.GUIDE.DRAFT_ID,
            epic: epic,
            notes: notes,
            updatedAt: Date.now()
        };

        try {
            const db = await window.QA_CORE.GuideForm.initDB();
            const transaction = db.transaction([window.QA_CORE.CONSTANTS.GUIDE.STORE_NAME], "readwrite");
            const store = transaction.objectStore(window.QA_CORE.CONSTANTS.GUIDE.STORE_NAME);
            
            store.put(data);

            transaction.oncomplete = () => {
                localStorage.setItem(window.QA_CORE.CONSTANTS.GUIDE.FALLBACK_KEY, JSON.stringify(data));
                window.QA_CORE.GuideForm.isSaving = false;
            };

            transaction.onerror = (e) => {
                throw e.target.error;
            };
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'GuideForm Save DB');
            localStorage.setItem(window.QA_CORE.CONSTANTS.GUIDE.FALLBACK_KEY, JSON.stringify(data));
            window.QA_CORE.GuideForm.isSaving = false;
        }
    },

    handleInput: () => {
        clearTimeout(window.QA_CORE.GuideForm.saveTimer);
        window.QA_CORE.GuideForm.saveTimer = setTimeout(() => {
            window.QA_CORE.GuideForm.save();
        }, window.QA_CORE.CONSTANTS.GUIDE.SAVE_DELAY);
    },

    load: async () => {
        try {
            const db = await window.QA_CORE.GuideForm.initDB();
            const transaction = db.transaction([window.QA_CORE.CONSTANTS.GUIDE.STORE_NAME], "readonly");
            const store = transaction.objectStore(window.QA_CORE.CONSTANTS.GUIDE.STORE_NAME);
            const request = store.get(window.QA_CORE.CONSTANTS.GUIDE.DRAFT_ID);

            request.onsuccess = (e) => {
                const data = e.target.result;
                if (data) {
                    window.QA_CORE.GuideForm.applyData(data);
                } else {
                    window.QA_CORE.GuideForm.loadFallback();
                }
            };
            
            request.onerror = () => {
                window.QA_CORE.GuideForm.loadFallback();
            };
        } catch (e) {
            window.QA_CORE.GuideForm.loadFallback();
        }
    },

    loadFallback: () => {
        const fallback = localStorage.getItem(window.QA_CORE.CONSTANTS.GUIDE.FALLBACK_KEY);
        if (fallback) {
            try {
                window.QA_CORE.GuideForm.applyData(JSON.parse(fallback));
            } catch(err) {
                if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'GuideForm Fallback Parse');
            }
        }
    },

    applyData: (data) => {
        const epicEl = document.getElementById('guide_epic');
        const notesEl = document.getElementById('guide_notes');
        if (epicEl && data.epic) epicEl.value = data.epic;
        if (notesEl && data.notes) notesEl.value = data.notes;
        
        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        } else if (typeof window.generateTemplate === 'function') {
            window.generateTemplate();
        }
    },

    initEvents: () => {
        const guideContainer = document.getElementById('guide-panel-placeholder');
        if (guideContainer) {
            guideContainer.addEventListener('input', (e) => {
                if (e.target.id === 'guide_epic' || e.target.id === 'guide_notes') {
                    window.QA_CORE.GuideForm.handleInput();
                }
            });
        }
    }
};

document.addEventListener('componentsLoaded', () => {
    if (window.QA_CORE && window.QA_CORE.GuideForm) {
        window.QA_CORE.GuideForm.load();
        window.QA_CORE.GuideForm.initEvents();
    }
});
