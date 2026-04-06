document.addEventListener('DOMContentLoaded', () => {
    const components = [
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
            .catch(err => console.error('Component load failed:', err))
    ));
});
