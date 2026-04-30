window.QA_CORE = window.QA_CORE || {};

window.QA_CORE.Loader = {
    components: [
        { id: 'header-placeholder', url: 'Header/header.html' },
        { id: 'input-form-placeholder', url: 'InputForm/inputform.html' },
        { id: 'guide-panel-placeholder', url: 'GuideForm/GuideForm.html' },
        { id: 'result-panel-placeholder', url: 'ResultForm/resultform.html' },
        { id: 'calendar-placeholder', url: 'Calendar/calendar.html' },
        { id: 'completion-panel-placeholder', url: 'Completion/completion-input.html' },
        { id: 'bookmark-panel-placeholder', url: 'Bookmark/bookmark.html' },
        { id: 'condition-modal-placeholder', url: 'Condition/condition.html' },
        { id: 'kpi-modal-placeholder', url: 'Kpi/kpi.html' },
        { id: 'theme-modal-placeholder', url: 'Theme/theme.html' },
        { id: 'setting-modal-placeholder', url: 'Setting/setting.html' },
        { id: 'schedule-modal-placeholder', url: 'Calendar/schedule.html' },
        { id: 'schedule-detail-modal-placeholder', url: 'Calendar/schedule-detail.html' },
        { id: 'bugreport-modal-placeholder', url: 'Bugreport/bugreport.html' },
        { id: 'admin-modal-placeholder', url: 'Admin/admin.html' }
    ],

    initModules: () => {
        const initFunctions = [
            () => window.QA_CORE.UI?.startClock?.(),
            () => window.QA_CORE.UI?.renderPresence?.(),
            () => window.QA_CORE.Theme?.init?.(),
            () => {
                const inputForm = window.QA_CORE.InputForm;
                if (localStorage.getItem('skm_draft') && inputForm?.loadDraft) {
                    inputForm.loadDraft();
                } else if (inputForm?.syncEnvironment) {
                    inputForm.syncEnvironment();
                }
            },
            () => window.QA_CORE.UI?.switchMainTab?.('issue'),
            () => window.QA_CORE.CompletionInput?.init?.(),
            () => window.QA_CORE.CompletionResult?.init?.()
        ];

        initFunctions.forEach(fn => {
            try { 
                fn(); 
            } catch(e) { 
                if (window.QA_CORE && window.QA_CORE.ErrorHandler) {
                    window.QA_CORE.ErrorHandler.handle(e, 'Loader Init');
                } else {
                    console.error("Initialization Failure:", e); 
                }
            }
        });
    },

    load: async () => {
        const versionTag = new Date().getTime();

        try {
            await Promise.all(window.QA_CORE.Loader.components.map(async (comp) => {
                const response = await fetch(`${comp.url}?v=${versionTag}`);
                if (!response.ok) throw new Error(`[HTTP ${response.status}] ${comp.url}`);
                
                const html = await response.text();
                const placeholder = document.getElementById(comp.id);
                if (placeholder) {
                    placeholder.innerHTML = html;
                    placeholder.classList.add('component-loaded');
                }
            }));

            const compResponse = await fetch(`Completion/completion-result.html?v=${versionTag}`);
            if (!compResponse.ok) throw new Error(`[HTTP ${compResponse.status}] Completion Result`);
            
            const compHtml = await compResponse.text();
            const innerPlaceholder = document.getElementById('completion-result-placeholder');
            if (innerPlaceholder) {
                innerPlaceholder.innerHTML = compHtml;
                innerPlaceholder.classList.add('component-loaded');
            }

            setTimeout(() => {
                window.QA_CORE.Loader.initModules();
                document.dispatchEvent(new CustomEvent('componentsLoaded'));
            }, 150);

        } catch (error) {
            if (window.QA_CORE.ErrorHandler) {
                window.QA_CORE.ErrorHandler.handle(error, 'Component Load Failure');
            } else {
                console.error("Component Load Failure:", error.message);
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.QA_CORE && window.QA_CORE.Loader) {
        window.QA_CORE.Loader.load();
    }
});
