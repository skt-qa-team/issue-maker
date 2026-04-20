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

window.switchMainTab = (tabName) => {
    const tabs = {
        'issue': 'panel-issue',
        'calendar': 'panel-calendar',
        'completion': 'panel-completion'
    };

    const targetId = tabs[tabName];
    if (!targetId) return;

    document.querySelectorAll('.main-panel-content').forEach(panel => {
        panel.classList.add('d-none');
        panel.classList.remove('active');
    });

    const targetEl = document.getElementById(targetId);
    if (targetEl) {
        targetEl.classList.remove('d-none');
        targetEl.classList.add('active');
    }

    document.querySelectorAll('.nav-btn, .main-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-tab="${tabName}"], [data-target="${targetId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    if (tabName === 'calendar' && typeof window.renderCalendar === 'function') {
        window.renderCalendar();
    }
    
    if (tabName === 'completion' && typeof window.initCompletionPanel === 'function') {
        window.initCompletionPanel();
    }
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

window.copySpecific = async (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    
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
        console.error(err);
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

window.clearForm = () => {
    if (confirm('모든 입력 내용을 초기화하시겠습니까?')) {
        const fields = [
            'title', 'prefix_env_custom', 'osType_custom', 'poc_custom', 
            'prefix_critical_custom', 'prefix_browser_custom', 'prefix_device_input',
            'prefix_account', 'prefix_page', 'targetUrl', 'preCondition', 
            'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'
        ];
        
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        if (typeof window.generateTemplate === 'function') window.generateTemplate();
        window.showToast('🔄 초기화되었습니다.');
    }
};

document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.main-tab-btn');
    if (tabBtn) {
        const targetId = tabBtn.getAttribute('data-target');
        if (targetId) {
            const tabName = targetId.replace('panel-', '');
            if (typeof window.switchMainTab === 'function') {
                window.switchMainTab(tabName);
            }
        }
    }
});
