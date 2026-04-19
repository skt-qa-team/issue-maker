window.startClock = () => {
    setInterval(() => {
        const now = new Date();
        const clockEl = document.getElementById('currentTime');
        if (clockEl) {
            clockEl.textContent = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        }
    }, 1000);
};

window.showToast = (message) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) container.removeChild(toast);
        }, 400);
    }, 2500);
};

window.addCase = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const match = el.value.match(/CASE (\d+)/g);
    let nextNum = 1;
    if (match) {
        const lastCase = match[match.length - 1];
        nextNum = parseInt(lastCase.replace('CASE ', '')) + 1;
    }
    const prefix = el.value.trim() === '' ? '' : '\n\n';
    el.value += `${prefix}CASE ${nextNum}.\n`;
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
    el.focus();
};

window.applyIndividualPreset = (id, n) => {
    const target = document.getElementById(id);
    if (!target) return;
    let text = "";
    for (let i = 1; i <= n; i++) text += `CASE ${i}. \n\n`;
    target.value = text.trim();
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
};

window.copySpecific = async (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    
    if (window.event && window.event.type === 'click' && window.event.target === el) {
        return;
    }

    const textToCopy = el.value;

    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(textToCopy);
            window.showToast('복사되었습니다.');
        } catch (err) {
            window.fallbackCopyText(textToCopy);
        }
    } else {
        window.fallbackCopyText(textToCopy);
    }
};

window.copyAll = async () => {
    const tVal = document.getElementById('outputTitle')?.value || '';
    const bVal = document.getElementById('outputBody')?.value || '';
    const combined = `${tVal}\n\n${bVal}`;
    
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(combined);
            window.showToast('전체 복사 완료!');
        } catch (err) {
            window.fallbackCopyText(combined);
        }
    } else {
        window.fallbackCopyText(combined);
    }
};

window.fallbackCopyText = (text) => {
    const t = document.createElement("textarea");
    t.className = 'sr-only';
    document.body.appendChild(t);
    t.value = text;
    t.select();
    try {
        document.execCommand("copy");
        window.showToast('복사 완료!');
    } catch (err) {
        console.error('Copy fallback failed', err);
    }
    document.body.removeChild(t);
};

window.renderPresence = () => {
    const presenceList = document.getElementById('presence-list');
    if (!presenceList) return;

    if (typeof firebase !== 'undefined' && firebase.database) {
        firebase.database().ref('presence').on('value', (snapshot) => {
            presenceList.innerHTML = '';
            const users = snapshot.val();

            if (users) {
                presenceList.classList.add('presence-active');
                Object.values(users).forEach((u) => {
                    const img = document.createElement('img');
                    img.src = (u.photo && u.photo !== 'undefined') ? u.photo : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                    img.title = (u.name && u.name !== 'undefined') ? u.name : '알 수 없음';
                    img.className = 'presence-avatar';
                    presenceList.appendChild(img);
                });
            } else {
                presenceList.classList.remove('presence-active');
            }
        });
    }
};

window.initTabNavigation = () => {
    const tabBtns = document.querySelectorAll('.main-tab-btn');
    const panels = document.querySelectorAll('.main-panel-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            if (!targetId) return;

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            panels.forEach(panel => {
                if (panel.id === targetId) {
                    panel.classList.remove('d-none');
                    panel.classList.add('active');
                } else {
                    panel.classList.add('d-none');
                    panel.classList.remove('active');
                }
            });

            if (targetId === 'panel-completion' && typeof window.initCompletionPanel === 'function') {
                window.initCompletionPanel();
            }
        });
    });
};
