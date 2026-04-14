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


    async function safeLoadComponent(url, placeholderId) {
    try {
        const response = await fetch(url);
        // 응답 상태가 200(정상)이 아니면, 404 HTML을 그리지 않고 즉시 중단합니다.
        if (!response.ok) {
            console.warn(`[로드 실패] ${url} 파일을 찾을 수 없습니다. 경로를 확인하세요.`);
            return; 
        }
        const html = await response.text();
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            placeholder.innerHTML = html;
        }
    } catch (error) {
        console.error(`[오류] ${url} 로드 중 문제 발생:`, error);
    }
}

// 스크립트가 실행될 때 안전하게 스케줄 모달을 불러옵니다.
document.addEventListener('DOMContentLoaded', () => {
    safeLoadComponent('modals/schedule-modal.html', 'modal-placeholder-schedule');
});


    

    
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
