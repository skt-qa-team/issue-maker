document.addEventListener('DOMContentLoaded', () => {
    const components = [
        { id: 'header-placeholder', url: 'Header/header.html' },
        { id: 'input-form-placeholder', url: 'InputForm/input-form.html' },
        { id: 'guide-panel-placeholder', url: 'GuidePanel/guide-panel.html' },
        { id: 'result-panel-placeholder', url: 'ResultPanel/result-panel.html' },
        { id: 'calendar-placeholder', url: 'Calendar/calendar.html' },
        { id: 'completion-panel-placeholder', url: 'Completion/completion.html' },
        { id: 'condition-modal-placeholder', url: 'Condition/condition.html' },
        { id: 'history-modal-placeholder', url: 'History/history.html' },
        { id: 'kpi-modal-placeholder', url: 'Kpi/kpi.html' },
        { id: 'theme-modal-placeholder', url: 'Theme/theme.html' },
        { id: 'setting-modal-placeholder', url: 'Setting/setting.html' },
        { id: 'changelog-modal-placeholder', url: 'Changelog/changelog.html' },
        { id: 'schedule-modal-placeholder', url: 'Calendar/schedule.html' },
        { id: 'schedule-detail-modal-placeholder', url: 'Calendar/schedule-detail.html' },
        { id: 'bugreport-modal-placeholder', url: 'Bugreport/bugreport.html' },
        { id: 'bookmark-modal-placeholder', url: 'Bookmark/bookmark.html' },
        { id: 'admin-modal-placeholder', url: 'Admin/admin.html' }
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
            try { if (typeof window.startClock === 'function') window.startClock(); } catch(e) { console.warn(e); }
            try { if (typeof window.initPresenceSystem === 'function') window.initPresenceSystem(); } catch(e) { console.warn(e); }
            try { if (typeof window.renderChangelog === 'function') window.renderChangelog(); } catch(e) { console.warn(e); }
            try { if (typeof window.initCustomTheme === 'function') window.initCustomTheme(); } catch(e) { console.warn(e); }
            
            try {
                const draftExists = localStorage.getItem('skm_draft');
                if (draftExists && typeof window.loadDraft === 'function') {
                    window.loadDraft();
                } else if (typeof window.syncEnvironmentByOS === 'function') {
                    window.syncEnvironmentByOS(); 
                }
            } catch(e) { 
                console.error("Initialization Failure:", e); 
            }

            document.dispatchEvent(new CustomEvent('componentsLoaded'));
        }, 50); 
    });
});