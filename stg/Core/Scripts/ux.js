window.QA_CORE = window.QA_CORE || {};

window.QA_CORE.UX = {
    initAutoSave: () => {
        let saveTimer;
        document.addEventListener('input', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                if (e.target.readOnly || e.target.closest('#guide-panel-placeholder')) return; 
                
                clearTimeout(saveTimer);
                saveTimer = setTimeout(() => {
                    if (window.QA_CORE.InputForm && typeof window.QA_CORE.InputForm.saveDraft === 'function') {
                        window.QA_CORE.InputForm.saveDraft();
                    }
                    const now = new Date();
                    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    if (window.QA_CORE.UI && typeof window.QA_CORE.UI.showToast === 'function') {
                        window.QA_CORE.UI.showToast(`💾 ${timeStr} 폼 데이터 자동 저장됨`, 'info');
                    }
                }, 1500);
            }
        });
    },

    fallbackCopyText: (text, el = null) => {
        const t = document.createElement("textarea");
        t.className = 'sr-only';
        document.body.appendChild(t);
        t.value = text;
        t.select();
        try {
            document.execCommand("copy");
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('📋 복사 완료!', 'success');
            if (el) {
                el.classList.add('copy-feedback');
                setTimeout(() => el.classList.remove('copy-feedback'), 500);
            }
        } catch (err) {
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('❌ 복사에 실패했습니다.', 'error');
        }
        document.body.removeChild(t);
    },

    copySpecific: async (targetId) => {
        const el = document.getElementById(targetId);
        if (!el) return;

        let textToCopy = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el.value : el.innerText;

        if (!textToCopy.trim()) {
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 복사할 내용이 없습니다.', 'warning');
            return;
        }

        const triggerFeedback = () => {
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('📋 복사되었습니다.', 'success');
            el.classList.add('copy-feedback');
            setTimeout(() => el.classList.remove('copy-feedback'), 500);
        };

        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(textToCopy);
                triggerFeedback();
            } catch (err) {
                window.QA_CORE.UX.fallbackCopyText(textToCopy, el);
            }
        } else {
            window.QA_CORE.UX.fallbackCopyText(textToCopy, el);
        }
    },

    copyToClipboard: async (text) => {
        if (!text || !text.trim()) {
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 복사할 내용이 없습니다.', 'warning');
            return;
        }
        
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('📋 전체 복사되었습니다.', 'success');
            } catch (err) {
                window.QA_CORE.UX.fallbackCopyText(text);
            }
        } else {
            window.QA_CORE.UX.fallbackCopyText(text);
        }
    }
};

document.addEventListener('componentsLoaded', () => {
    if (window.QA_CORE && window.QA_CORE.UX) {
        window.QA_CORE.UX.initAutoSave();
    }
});
