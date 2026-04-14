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
        { id: 'modal-placeholder-changelog', url: 'components/changelog-modal.html' },
        { id: 'modal-placeholder-schedule', url: 'components/schedule-modal.html' },
        { id: 'modal-placeholder-schedule-detail', url: 'components/schedule-detail-modal.html' }
    ];

    Promise.all(components.map(comp => 
        fetch(comp.url + '?v=' + new Date().getTime()) 
            .then(response => {
                if (!response.ok) throw new Error(`[404] ${comp.url} 파일을 찾을 수 없습니다.`);
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
                console.error("Loader Error:", err);
                alert(`🔥 앗! 파일 로드 실패:\n${err.message}\ncomponents 폴더 안에 파일명 오타가 없는지 확인해 주세요!`);
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
                console.error("Init Error:", e); 
            }
        }, 300); 
    });
});
