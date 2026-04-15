function startClock() {
    setInterval(() => {
        const now = new Date();
        const clockEl = document.getElementById('currentTime');
        if (clockEl) {
            clockEl.innerText = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        }
    }, 1000);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerText = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 2500);
}

function addCase(id) {
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
    if (typeof generateTemplate === 'function') generateTemplate();
    el.focus();
}

function applyIndividualPreset(id, n) {
    const target = document.getElementById(id);
    if (!target) return;
    let text = "";
    for (let i = 1; i <= n; i++) text += `CASE ${i}. \n\n`;
    target.value = text.trim();
    if (typeof generateTemplate === 'function') generateTemplate();
}

function copySpecific(id) {
    const el = document.getElementById(id);
    if (!el) return;
    
    if (window.event && window.event.type === 'click' && window.event.target === el) {
        return;
    }

    el.select();
    document.execCommand('copy');
    showToast('복사되었습니다.');
}

function copyAll() {
    const tVal = document.getElementById('outputTitle')?.value || '';
    const bVal = document.getElementById('outputBody')?.value || '';
    const combined = `${tVal}\n\n${bVal}`;
    const t = document.createElement("textarea");
    document.body.appendChild(t);
    t.value = combined;
    t.select();
    document.execCommand("copy");
    document.body.removeChild(t);
    showToast('전체 복사 완료!');
}

function renderPresence() {
    const presenceList = document.getElementById('presence-list');
    if (!presenceList) return;

    firebase.database().ref('presence').on('value', (snapshot) => {
        presenceList.innerHTML = '';
        const users = snapshot.val();

        if (users) {
            presenceList.classList.add('presence-active');

            Object.values(users).forEach((u, idx) => {
                const img = document.createElement('img');
                img.src = u.photo && u.photo !== 'undefined' ? u.photo : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                img.title = u.name || '알 수 없음';
                img.className = 'presence-avatar';
                img.style.marginLeft = idx === 0 ? '0' : '-12px';
                img.style.zIndex = 100 - idx;
                presenceList.appendChild(img);
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    startClock();
    renderPresence();
});
