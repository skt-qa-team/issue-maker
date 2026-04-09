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
    toast.innerText = message;
    toast.style.cssText = "position:fixed; bottom:40px; left:50%; transform:translateX(-50%); background:rgba(15,23,42,0.9); color:#f8fafc; padding:12px 24px; border-radius:30px; z-index:9999; font-size:0.95rem; font-weight:700; box-shadow:0 10px 25px rgba(0,0,0,0.2); opacity:0; transition:opacity 0.3s ease; pointer-events:none;";
    document.body.appendChild(toast);
    setTimeout(() => toast.style.opacity = '1', 10);
    setTimeout(() => {
        toast.style.opacity = '0';
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
            presenceList.style.display = 'flex';
            presenceList.style.flexDirection = 'row';
            presenceList.style.alignItems = 'center';

            Object.values(users).forEach((u, idx) => {
                const img = document.createElement('img');
                img.src = u.photo && u.photo !== 'undefined' ? u.photo : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                img.title = u.name || '알 수 없음';
                img.style.cssText = `width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid #f8fafc; box-shadow:0 2px 4px rgba(0,0,0,0.05); margin-left:${idx === 0 ? '0' : '-12px'}; z-index:${100 - idx}; transition:transform 0.2s; cursor:pointer;`;
                
                img.onmouseenter = () => img.style.transform = 'translateY(-3px)';
                img.onmouseleave = () => img.style.transform = 'translateY(0)';
                
                presenceList.appendChild(img);
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    startClock();
    renderPresence();
});
