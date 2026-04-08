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
                if (!response.ok) throw new Error(`Failed to load ${comp.url}`);
                return response.text();
            })
            .then(html => {
                const placeholder = document.getElementById(comp.id);
                if (placeholder) {
                    // 핵심 수정 포인트: innerHTML 대신 outerHTML을 사용하여 
                    // 임시 껍데기 div를 완전히 제거하고 원본 UI 구조를 복구합니다.
                    placeholder.outerHTML = html;
                }
            })
            .catch(err => console.error(err))
    )).then(() => {
        // 모든 HTML 조각이 브라우저에 완벽하게 결합될 때까지 아주 짧은 시간 대기 (안정성 확보)
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
                    syncEnvironmentByOS(); // 폼 세팅 및 환경설정 값 로드
                }
            } catch(e) { 
                console.error("Init Error:", e); 
            }
        }, 100);
    });
});
