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
