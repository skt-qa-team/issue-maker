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

window.copySpecific = (targetId) => {
    const el = document.getElementById(targetId);
    if (!el) return;

    let textToCopy = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el.value : el.innerText;

    if (!textToCopy.trim()) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ 복사할 내용이 없습니다.');
        return;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
        if (typeof window.showToast === 'function') window.showToast('📋 복사되었습니다.');
        
        el.classList.add('copy-feedback');
        setTimeout(() => {
            el.classList.remove('copy-feedback');
        }, 500);
    }).catch(err => {
        console.error(err);
        if (typeof window.showToast === 'function') window.showToast('❌ 복사에 실패했습니다.');
    });
};

window.copyToClipboard = (text) => {
    if (!text || !text.trim()) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ 복사할 내용이 없습니다.');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        if (typeof window.showToast === 'function') window.showToast('📋 전체 복사되었습니다.');
    }).catch(err => {
        console.error(err);
        if (typeof window.showToast === 'function') window.showToast('❌ 복사에 실패했습니다.');
    });
};
