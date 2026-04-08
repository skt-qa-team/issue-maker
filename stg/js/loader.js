document.addEventListener('DOMContentLoaded', () => {
    const components = [
        { id: 'comp-header', url: 'components/header.html' },
        { id: 'comp-guide', url: 'components/guide-panel.html' },
        { id: 'comp-input', url: 'components/input-form.html' },
        { id: 'comp-result', url: 'components/result-panel.html' },
        { id: 'modal-placeholder-condition', url: 'components/condition-modal.html' },
        { id: 'modal-placeholder-history', url: 'components/history-modal.html' },
        { id: 'modal-placeholder-completion', url: 'components/completion-modal.html' },
        { id: 'modal-placeholder-kpi', url: 'components/kpi-modal.html' },
        { id: 'modal-placeholder-theme', url: 'components/theme-modal.html' },
        { id: 'modal-placeholder-setting', url: 'components/setting-modal.html' },
        { id: 'modal-placeholder-changelog', url: 'components/changelog-modal.html' }
    ];

    Promise.all(components.map(comp => 
        fetch(comp.url)
            .then(response => {
                if (!response.ok) throw new Error(comp.url);
                return response.text();
            })
            .then(html => {
                const placeholder = document.getElementById(comp.id);
                if (placeholder) {
                    placeholder.innerHTML = html;
                }
            })
            .catch(err => console.error(err))
    )).then(() => {
        if (typeof startClock === 'function') startClock();
        if (typeof initPresenceSystem === 'function') initPresenceSystem();
        if (typeof renderChangelog === 'function') renderChangelog();
        
        setTimeout(() => {
            const draftExists = localStorage.getItem('skm_draft');
            if (draftExists && typeof loadDraft === 'function') {
                loadDraft();
            } else if (typeof syncEnvironmentByOS === 'function') {
                syncEnvironmentByOS();
            }
            if (typeof initCustomTheme === 'function') initCustomTheme();
        }, 50);
    });
});
