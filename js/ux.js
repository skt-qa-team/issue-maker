document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.innerHTML = `
        #toast-container { position: fixed; bottom: 30px; right: 30px; display: flex; flex-direction: column; gap: 10px; z-index: 9999; pointer-events: none; }
        .toast-msg { background: rgba(15, 23, 42, 0.9); color: #fff; padding: 12px 24px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; box-shadow: 0 10px 25px rgba(0,0,0,0.2); backdrop-filter: blur(4px); transform: translateY(100px); opacity: 0; transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); border: 1px solid #334155; }
        .toast-msg.show { transform: translateY(0); opacity: 1; }
        .clickable-preview { cursor: pointer !important; transition: all 0.2s !important; }
        .clickable-preview:hover { box-shadow: 0 0 15px rgba(59, 130, 246, 0.3) !important; border-color: #3b82f6 !important; }
        .copy-feedback { animation: flashSuccess 0.5s ease-out !important; }
        @keyframes flashSuccess {
            0% { background-color: rgba(16, 185, 129, 0.2) !important; border-color: #10b981 !important; color: #10b981 !important; }
            100% { background-color: #1e293b !important; border-color: #2e3c52 !important; color: #e2e8f0 !important; }
        }
    `;
    document.head.appendChild(style);

    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

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
        const targetIds = ['comp_preview', 'outputField', 'kpi_preview'];
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
        const targetIds = ['comp_preview', 'outputField', 'kpi_preview'];
        if (targetIds.includes(e.target.id)) {
            e.target.classList.add('clickable-preview');
            e.target.title = "💡 클릭하면 전체 내용이 복사됩니다";
        }
    });
});
