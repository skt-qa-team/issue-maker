document.addEventListener('componentsLoaded', () => {
    let saveTimer;
    
    document.addEventListener('input', (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            if (e.target.readOnly || e.target.closest('#guide-panel-placeholder')) return; 
            
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                if (typeof window.saveDraft === 'function') window.saveDraft();
                const now = new Date();
                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                if (typeof window.showToast === 'function') {
                    window.showToast(`💾 ${timeStr} 폼 데이터 자동 저장됨`);
                }
            }, 1500);
        }
    });
});

window.fallbackCopyText = (text, el = null) => {
    const t = document.createElement("textarea");
    t.className = 'sr-only';
    document.body.appendChild(t);
    t.value = text;
    t.select();
    try {
        document.execCommand("copy");
        if (typeof window.showToast === 'function') window.showToast('📋 복사 완료!');
        if (el) {
            el.classList.add('copy-feedback');
            setTimeout(() => el.classList.remove('copy-feedback'), 500);
        }
    } catch (err) {
        console.error(err);
        if (typeof window.showToast === 'function') window.showToast('❌ 복사에 실패했습니다.');
    }
    document.body.removeChild(t);
};

window.copySpecific = async (targetId) => {
    const el = document.getElementById(targetId);
    if (!el) return;

    let textToCopy = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el.value : el.innerText;

    if (!textToCopy.trim()) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ 복사할 내용이 없습니다.');
        return;
    }

    const triggerFeedback = () => {
        if (typeof window.showToast === 'function') window.showToast('📋 복사되었습니다.');
        el.classList.add('copy-feedback');
        setTimeout(() => el.classList.remove('copy-feedback'), 500);
    };

    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(textToCopy);
            triggerFeedback();
        } catch (err) {
            window.fallbackCopyText(textToCopy, el);
        }
    } else {
        window.fallbackCopyText(textToCopy, el);
    }
};

window.copyToClipboard = async (text) => {
    if (!text || !text.trim()) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ 복사할 내용이 없습니다.');
        return;
    }
    
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            if (typeof window.showToast === 'function') window.showToast('📋 전체 복사되었습니다.');
        } catch (err) {
            window.fallbackCopyText(text);
        }
    } else {
        window.fallbackCopyText(text);
    }
};
