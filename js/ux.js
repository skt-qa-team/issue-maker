document.addEventListener('DOMContentLoaded', () => {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    window.showToast = function(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-msg';
        toast.innerHTML = message;
        toastContainer.appendChild(toast);
        
        requestAnimationFrame(() => {
            setTimeout(() => toast.classList.add('show'), 10);
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2000);
    };

    let saveTimer;
    document.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.target.readOnly) return;
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                const now = new Date();
                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                window.showToast(`💾 ${timeStr} 자동 저장됨`);
            }, 1500);
        }
    });

    document.addEventListener('click', (e) => {
        const targetIds = ['comp_preview', 'outputField', 'kpi_preview', 'outputTitle', 'outputBody'];
        if (targetIds.includes(e.target.id)) {
            const el = e.target;
            if (!el.value || !el.value.trim()) return;

            if (navigator.clipboard) {
                navigator.clipboard.writeText(el.value).then(() => {
                    window.showToast(`✨ 텍스트 복사 완료!`);
                });
            } else {
                el.select();
                document.execCommand('copy');
                window.showToast(`✨ 텍스트 복사 완료!`);
            }
            
            el.classList.add('copy-feedback');
            setTimeout(() => el.classList.remove('copy-feedback'), 500);
            window.getSelection().removeAllRanges();
        }
    });
    
    document.addEventListener('mouseover', (e) => {
        const targetIds = ['comp_preview', 'outputField', 'kpi_preview', 'outputTitle', 'outputBody'];
        if (targetIds.includes(e.target.id)) {
            e.target.classList.add('clickable-preview');
            e.target.title = "💡 클릭하면 전체 내용이 복사됩니다";
        }
    });
});
