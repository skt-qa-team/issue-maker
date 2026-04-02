const firebaseConfig = {
    apiKey: "AIzaSyABC8d0MA-JVpc9muPo1pjAnCp6xSabckw",
    authDomain: "skm-issue-helper.firebaseapp.com",
    databaseURL: "https://skm-issue-helper-default-rtdb.asia-southeast1.firebasedatabase.app", 
    projectId: "skm-issue-helper",
    storageBucket: "skm-issue-helper.firebasestorage.app",
    messagingSenderId: "315338055920",
    appId: "1:315338055920:web:bd1129cc9afb1569aba235",
    measurementId: "G-98H9S1FQB0"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

let currentUserId = null;
let isAnonymousUser = true;
let isInitialRender = true;
const anonColors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
let myAnonName = sessionStorage.getItem('anonName') || ("동료_" + Math.random().toString(36).substring(7, 10).toUpperCase());
let myAnonColor = sessionStorage.getItem('anonColor') || anonColors[Math.floor(Math.random() * anonColors.length)];
sessionStorage.setItem('anonName', myAnonName);
sessionStorage.setItem('anonColor', myAnonColor);

function initPresenceSystem() {
    const list = document.getElementById('presence-list');
    if (!list) return;
    const allUsersRef = database.ref('presence');
    allUsersRef.on('value', (snapshot) => {
        list.innerHTML = '';
        const users = snapshot.val();
        if (users) {
            Object.keys(users).forEach((id) => {
                const userData = users[id];
                const isMe = (id === currentUserId);
                let avatarContent = userData.photo ? `<img src="${userData.photo}" alt="p">` : (isMe ? "Me" : userData.name.charAt(0));
                list.innerHTML += `<div class="user-avatar" style="background: ${userData.color || '#cbd5e1'}; ${isMe ? 'border-color: #3b82f6;' : ''}" data-name="${userData.name}">${avatarContent}</div>`;
            });
        }
    });
    auth.onAuthStateChanged((user) => {
        const icon = document.getElementById('auth-btn-icon');
        const label = document.getElementById('auth-btn-label');
        if (user) {
            currentUserId = user.uid;
            const myUserRef = database.ref('presence/' + currentUserId);
            if (user.isAnonymous) {
                isAnonymousUser = true;
                if(label) label.innerText = '로그인';
                if(icon) icon.style.background = '#ef4444';
                myUserRef.set({ name: myAnonName, color: myAnonColor, photo: "", lastActive: firebase.database.ServerValue.TIMESTAMP });
            } else {
                isAnonymousUser = false;
                if(label) label.innerText = '로그아웃';
                if(icon) icon.style.background = '#3b82f6';
                myUserRef.set({ name: user.displayName, photo: user.photoURL, color: "#3b82f6", lastActive: firebase.database.ServerValue.TIMESTAMP });
                syncFromCloud(currentUserId);
            }
            myUserRef.onDisconnect().remove();
        } else auth.signInAnonymously();
    });
}

function syncFromCloud(uid) {
    database.ref('users/' + uid + '/settings').once('value').then((snapshot) => {
        if (snapshot.exists()) {
            localStorage.setItem('qa_system_config_master', JSON.stringify(snapshot.val()));
            syncEnvironmentByOS();
        }
    });
    database.ref('users/' + uid + '/kpi').once('value').then((snapshot) => {
        if (snapshot.exists()) {
            localStorage.setItem('skm_kpi_data', JSON.stringify(snapshot.val()));
            if (typeof loadKpiLocal === 'function') loadKpiLocal();
        }
    });
}

function toggleAuth() { 
    if (auth.currentUser && !auth.currentUser.isAnonymous) auth.signOut(); 
    else auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); 
}

function startClock() {
    setInterval(() => {
        const now = new Date();
        const clockEl = document.getElementById('currentTime');
        if (clockEl) {
            clockEl.innerText = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        }
    }, 1000);
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
    generateTemplate();
    el.focus();
}

function applyIndividualPreset(id, n) {
    const target = document.getElementById(id);
    if (!target) return;
    let text = ""; 
    for (let i = 1; i <= n; i++) text += `CASE ${i}. \n\n`;
    target.value = text.trim();
    generateTemplate();
}

function syncEnvironmentByOS() {
    const config = typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master')) || {};
    const osEl = document.getElementById('osType');
    if (!osEl) return;
    const osType = osEl.value;
    
    let currentSelected = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);

    if (isInitialRender) {
        currentSelected = [...(config.andDefaultDevices || []), ...(config.iosDefaultDevices || [])];
        isInitialRender = false;
    }

    const andCol = document.getElementById('andDeviceCol');
    const iosCol = document.getElementById('iosDeviceCol');
    const iosVerToggle = document.getElementById('ios-ver-toggle');

    if(andCol) andCol.style.display = osType.includes("Android") ? 'block' : 'none';
    if(iosCol) iosCol.style.display = osType.includes("iOS") ? 'block' : 'none';
    if(iosVerToggle) iosVerToggle.style.display = osType.includes("iOS") ? 'flex' : 'none';

    const render = (containerId, list, idPrefix) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        list.forEach(dev => {
            const isChecked = currentSelected.includes(dev) ? 'checked' : '';
            container.innerHTML += `<input type="checkbox" id="${idPrefix}_${dev}" class="pill-cb issue-device-cb" value="${dev}" ${isChecked} onchange="handleDeviceClick(this)"><label for="${idPrefix}_${dev}" class="pill-label">${dev}</label>`;
        });
    };

    render('andNormalList', config.andDevices || [], 'and_n');
    render('andSpecialList', config.andSpecialDevices || [], 'and_s');
    render('iosNormalList', config.iosDevices || [], 'ios_n');
    render('iosSpecialList', config.iosSpecialDevices || [], 'ios_s');

    let ver = "";
    const iosTypeChecked = document.querySelector('input[name="ios_ver_type"]:checked');
    const iosMode = iosTypeChecked ? iosTypeChecked.value : 'TestFlight';

    if (osType === "[Android/iOS]") {
        ver = `App Tester_${config.andAppTester || ''} / ${iosMode}_${(iosMode === 'TestFlight' ? (config.iosTestFlight || '') : (config.iosDistribution || ''))}`;
    } else if (osType === "[Android]") {
        ver = config.andAppTester || '';
    } else {
        ver = (iosMode === 'TestFlight' ? (config.iosTestFlight || '') : (config.iosDistribution || ''));
    }
    const verInput = document.getElementById('appVersion');
    if(verInput) verInput.value = ver;
    generateTemplate();
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

function handleDeviceClick(element) {
    if (element.checked) {
        const allChecked = Array.from(document.querySelectorAll('.issue-device-cb:checked'));
        const sameValueCount = allChecked.filter(cb => cb.value === element.value).length;
        if (sameValueCount > 1) {
            showToast('이미 선택된 단말입니다.');
            element.checked = false;
            return;
        }
    }
    generateTemplate();
}

function toggleDeviceMode(platform) {
    const modeEl = document.querySelector(`input[name="${platform}_dev_mode"]:checked`);
    if(!modeEl) return;
    const mode = modeEl.value;
    const normalList = document.getElementById(`${platform}NormalList`);
    const specialList = document.getElementById(`${platform}SpecialList`);
    
    if(mode === 'normal') {
        if(normalList) normalList.style.display = 'flex';
        if(specialList) specialList.style.display = 'none';
    } else {
        if(specialList) specialList.style.display = 'flex';
        if(normalList) normalList.style.display = 'none';
    }
    generateTemplate();
}

function handlePocChange() {
    const pocEl = document.getElementById('poc');
    if(!pocEl) return;
    const poc = pocEl.value;
    const isWeb = poc === 'Admin' || poc === 'PC Web';
    const devGroup = document.getElementById('deviceGroup');
    const urlGroup = document.getElementById('urlGroup');
    if(devGroup) devGroup.style.display = isWeb ? 'none' : 'block';
    if(urlGroup) urlGroup.style.display = isWeb ? 'block' : 'none';
    if (isWeb) {
        const cfg = typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master')) || {};
        const targetUrl = document.getElementById('targetUrl');
        if(targetUrl) targetUrl.value = poc === 'Admin' ? (cfg.adminUrl || '') : (cfg.pcUrl || '');
    } else {
        syncEnvironmentByOS();
    }
    generateTemplate();
}

function generateTemplate() {
    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };
    
    const poc = getValue('poc');
    const os = getValue('osType');
    const servers = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    const devices = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value).join(' / ');
    let ver = getValue('appVersion');
    
    if (poc === 'T 멤버십') {
        const iosTypeEl = document.querySelector('input[name="ios_ver_type"]:checked');
        if (os === "[Android]") ver = `App Tester_${ver}`;
        else if (os === "[iOS]" && iosTypeEl) ver = `${iosTypeEl.value}_${ver}`;
    }
    
    const rawEnv = servers.join('/').replace('PRD', '상용');
    const envPrefix = (rawEnv === 'STG' || !rawEnv) ? '' : `[${rawEnv}]`;
    const osPrefix = (poc === 'Admin' || poc === 'PC Web') ? '' : os;
    const specOsPrefix = getValue('prefix_spec_os').trim() ? `[${getValue('prefix_spec_os').trim()}]` : '';
    const pocPrefix = (poc && poc !== 'T 멤버십') ? `[${poc}]` : '';
    const critPrefix = getValue('prefix_critical') ? `[${getValue('prefix_critical')}]` : '';
    const devPrefix = getValue('prefix_device').trim() ? `[${getValue('prefix_device').trim()}]` : '';
    const accPrefix = getValue('prefix_account').trim() ? `[${getValue('prefix_account').trim()}]` : '';
    const pagePrefix = getValue('prefix_page').trim() ? `[${getValue('prefix_page').trim()}]` : '';
    
    const titleText = `${envPrefix}${osPrefix}${specOsPrefix}${pocPrefix}${critPrefix}${devPrefix}${accPrefix}${pagePrefix} ${getValue('title').trim()}`.replace(/\s+/g, ' ').trim();
    
    let envSection = `[Environment]\n■ POC : ${poc}\n`;
    if (poc === 'Admin' || poc === 'PC Web') {
        envSection += `■ 서버 : ${servers.join(' / ')}\n■ URL : ${getValue('targetUrl')}`;
    } else {
        envSection += `■ Device : ${devices || '-'}\n■ 서버 : ${servers.join(' / ')}\n■ 버전 : ${ver}`;
    }
    
    const prdRef = getValue('ref_prd').trim();
    const notes = getValue('ref_notes').trim();
    const refSection = (prdRef || notes) ? `\n\n[참고사항]\n${prdRef ? '1. 상용 재현 여부 : ' + prdRef + '\n' : ''}${notes}` : '';
    
    const body = `${envSection}\n\n[Pre-Condition]\n${getValue('preCondition')}\n\n[재현스텝]\n${getValue('steps')}\n\n[실행결과-문제현상]\n${getValue('actualResult')}\n\n[기대결과]\n${getValue('expectedResult')}${refSection}`;
    
    const outTitle = document.getElementById('outputTitle');
    const outBody = document.getElementById('outputBody');
    if (outTitle) outTitle.value = titleText;
    if (outBody) outBody.value = body.trim();
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

function clearForm() {
    if(!confirm('초기화하시겠습니까? (에픽/참고사항 제외)')) return;
    ['title', 'prefix_spec_os', 'prefix_account', 'prefix_device', 'prefix_page', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    isInitialRender = true;
    syncEnvironmentByOS();
}

document.addEventListener('DOMContentLoaded', () => {
    startClock();
    initPresenceSystem();
    if (typeof renderChangelog === 'function') renderChangelog();
    setTimeout(() => {
        syncEnvironmentByOS();
        if (typeof initCustomTheme === 'function') initCustomTheme();
    }, 50);
});
