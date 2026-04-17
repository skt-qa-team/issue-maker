document.addEventListener('DOMContentLoaded', () => {
    const components = [
        { id: 'header-placeholder', url: 'components/header.html' },
        { id: 'input-form-placeholder', url: 'components/input-form.html' },
        { id: 'guide-panel-placeholder', url: 'components/guide-panel.html' },
        { id: 'result-panel-placeholder', url: 'components/result-panel.html' },
        { id: 'calendar-placeholder', url: 'components/calendar.html' },
        { id: 'completion-panel-placeholder', url: 'components/completion-panel.html' },
        { id: 'condition-modal-placeholder', url: 'components/condition-modal.html' },
        { id: 'history-modal-placeholder', url: 'components/history-modal.html' },
        { id: 'kpi-modal-placeholder', url: 'components/kpi-modal.html' },
        { id: 'theme-modal-placeholder', url: 'components/theme-modal.html' },
        { id: 'setting-modal-placeholder', url: 'components/setting-modal.html' },
        { id: 'changelog-modal-placeholder', url: 'components/changelog-modal.html' },
        { id: 'schedule-modal-placeholder', url: 'components/schedule-modal.html' },
        { id: 'schedule-detail-modal-placeholder', url: 'components/schedule-detail-modal.html' },
        { id: 'bugreport-modal-placeholder', url: 'components/bugreport-modal.html' },
        { id: 'bookmark-modal-placeholder', url: 'components/bookmark-modal.html' }
    ];

    const versionTag = new Date().getTime();

    Promise.all(components.map(comp => 
        fetch(`${comp.url}?v=${versionTag}`) 
            .then(response => {
                if (!response.ok) throw new Error(`[${response.status}] ${comp.url}`);
                return response.text();
            })
            .then(html => {
                const placeholder = document.getElementById(comp.id);
                if (placeholder) {
                    placeholder.innerHTML = html;
                    placeholder.classList.add('component-loaded'); 
                }
            })
            .catch(err => {
                console.error("Component Load Failure:", err);
            })
    )).then(() => {
        setTimeout(() => {
            try { if (typeof startClock === 'function') startClock(); } catch(e) { console.warn(e); }
            try { if (typeof initPresenceSystem === 'function') initPresenceSystem(); } catch(e) { console.warn(e); }
            try { if (typeof renderChangelog === 'function') renderChangelog(); } catch(e) { console.warn(e); }
            try { if (typeof initCustomTheme === 'function') initCustomTheme(); } catch(e) { console.warn(e); }
            
            try {
                const draftExists = localStorage.getItem('skm_draft');
                if (draftExists && typeof loadDraft === 'function') {
                    loadDraft();
                } else if (typeof syncEnvironmentByOS === 'function') {
                    syncEnvironmentByOS(); 
                }
            } catch(e) { 
                console.error("Initialization Failure:", e); 
            }
        }, 300); 
    });
});
