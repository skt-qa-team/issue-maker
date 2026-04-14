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
});
