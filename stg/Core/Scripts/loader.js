document.addEventListener('DOMContentLoaded', () => {
    const components = [
        { id: 'header-placeholder', url: 'Header/header.html' },
        { id: 'input-form-placeholder', url: 'InputForm/inputform.html' },
        { id: 'guide-panel-placeholder', url: 'GuideForm/GuideForm.html' },
        { id: 'result-panel-placeholder', url: 'ResultForm/resultform.html' },
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
            try { if (typeof window.renderPresence === 'function') window.renderPresence(); } catch(e) { console.warn(e); }
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

            // [추가] 탭 전환 버튼들을 위한 초기화 강제 실행
            try {
                if (typeof window.switchMainTab === 'function') {
                    window.switchMainTab('issue'); // 초기 화면 강제 설정
                }
            } catch(e) { console.warn("Tab Initialization Failed", e); }

            document.dispatchEvent(new CustomEvent('componentsLoaded'));
        }, 150); // 로딩 안정성을 위해 시간을 약간 늘림
    });
});
