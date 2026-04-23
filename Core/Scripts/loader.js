document.addEventListener('DOMContentLoaded', () => {
    const components = [
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
    ];

    const versionTag = new Date().getTime();

    Promise.all(components.map(comp => 
        fetch(`${comp.url}?v=${versionTag}`) 
            .then(response => {
                if (!response.ok) throw new Error(`[HTTP ${response.status}] ${comp.url}`);
                return response.text();
            })
            .then(html => {
                const placeholder = document.getElementById(comp.id);
                if (placeholder) {
                    placeholder.innerHTML = html;
                    placeholder.classList.add('component-loaded'); 
                }
            })
            .catch(err => console.error(`Load Failure: ${comp.id} -> ${err.message}`))
    )).then(() => {
        return fetch(`Completion/completion-result.html?v=${versionTag}`)
            .then(response => {
                if (!response.ok) throw new Error(`[HTTP ${response.status}] Completion Result`);
                return response.text();
            })
            .then(html => {
                const innerPlaceholder = document.getElementById('completion-result-placeholder');
                if (innerPlaceholder) {
                    innerPlaceholder.innerHTML = html;
                    innerPlaceholder.classList.add('component-loaded');
                }
            })
            .catch(err => console.error(`Nested Load Failure: ${err.message}`));
    }).then(() => {
        setTimeout(() => {
            const initFunctions = [
                () => window.startClock?.(),
                () => window.renderPresence?.(),
                () => window.renderChangelog?.(),
                () => window.initCustomTheme?.(),
                () => {
                    if (localStorage.getItem('skm_draft') && window.loadDraft) window.loadDraft();
                    else if (window.syncEnvironmentByOS) window.syncEnvironmentByOS();
                },
                () => window.switchMainTab?.('issue'),
                () => window.initCompletionInput?.(),
                () => window.initCompletionResult?.()
            ];

            initFunctions.forEach(fn => {
                try { fn(); } catch(e) { console.error("Initialization Failure:", e); }
            });

            document.dispatchEvent(new CustomEvent('componentsLoaded'));
        }, 150); 
    });
});
