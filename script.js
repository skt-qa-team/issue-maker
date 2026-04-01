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

const defaultConfig = { 
    andDevices: [], andSpecialDevices: [],
    iosDevices: [], iosSpecialDevices: [],
    andAppTester: '', iosTestFlight: '', iosDistribution: '',
    adminUrl: '', pcUrl: '' 
};
const STORAGE_KEY = 'qa_system_config_master';
let currentUserId = null;

const anonColors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
let myAnonName = sessionStorage.getItem('anonName') || ("동료_" + Math.random().toString(36).substring(7, 10).toUpperCase());
let myAnonColor = sessionStorage.getItem('anonColor') || anonColors[Math.floor(Math.random() * anonColors.length)];
sessionStorage.setItem('anonName', myAnonName);
sessionStorage.setItem('anonColor', myAnonColor);

function initCustomTheme() {
    const savedTheme = JSON.parse(localStorage.getItem('skm_custom_palette'));
    if(savedTheme) {
        applyTheme(savedTheme.bg, savedTheme.panel, savedTheme.text);
        syncPickers(savedTheme.bg, savedTheme.panel, savedTheme.text);
    }
}

function applyTheme(bg, panel, text) {
    document.documentElement.style.setProperty('--bg-color', bg);
    document.documentElement.style.setProperty('--panel-bg', panel);
    document.documentElement.style.setProperty('--text-main', text);
    document.documentElement.style.setProperty('--text-sub', text);
}

function syncPickers(bg, panel, text) {
    const pb = document.getElementById('picker_bg');
    const pp = document.getElementById('picker_panel');
    const pt = document.getElementById('picker_text');
    if (pb) pb.value = bg;
    if (pp) pp.value = panel;
    if (pt) pt.value = text;
}

function applyPreset(bg, panel, text) {
    syncPickers(bg, panel, text);
    applyTheme(bg, panel, text);
}

function previewTheme() {
    applyTheme(document.getElementById('picker_bg').value, document.getElementById('picker_panel').value, document.getElementById('picker_text').value);
}

function saveTheme() {
    localStorage.setItem('skm_custom_palette', JSON.stringify({
        bg: document.getElementById('picker_bg').value,
        panel: document.getElementById('picker_panel').value,
        text: document.getElementById('picker_text').value
    }));
    closeThemeModal();
}

function resetTheme() {
    applyTheme('#f0f2f5', '#ffffff', '#475569');
    syncPickers('#f0f2f5', '#ffffff', '#475569');
    localStorage.removeItem('skm_custom_palette');
}

function openThemeModal() { document.getElementById('themeModal').style.display = 'flex'; }
function closeThemeModal() { document.getElementById('themeModal').style.display = 'none'; initCustomTheme(); }

function renderChangelog() {
    const container = document.getElementById('changelog-container');
    if (!container || typeof changelogData === 'undefined') return;
    let htmlString = '';
    changelogData.forEach(log => {
        let listItems = log.changes.map(change => `<li>${change}</li>`).join('');
        htmlString += `<div class="changelog-item"><span class="version-badge">${log.version}</span><ul class="changelog-desc">${listItems}</ul></div>`;
    });
    container.innerHTML = htmlString;
}

function initPresenceSystem() {
    const list = document.getElementById('presence-list');
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
        document.getElementById('auth-btn').disabled = false;
        if (user) {
            currentUserId = user.uid;
            const myUserRef = database.ref('presence/' + currentUserId);
            if (user.isAnonymous) {
                document.getElementById('auth-btn').innerText = 'G 로그인';
                myUserRef.set({ name: myAnonName, color: myAnonColor, photo: "", lastActive: firebase.database.ServerValue.TIMESTAMP });
            } else {
                document.getElementById('auth-btn').innerText = 'G 로그아웃';
                document.getElementById('auth-btn').classList.add('logged-in');
                myUserRef.set({ name: user.displayName, photo: user.photoURL, color: "#3b82f6", lastActive: firebase.database.ServerValue.TIMESTAMP });
            }
            myUserRef.onDisconnect().remove();
        } else auth.signInAnonymously();
    });
}

function toggleAuth() { if (auth.currentUser && !auth.currentUser.isAnonymous) auth.signOut(); else auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }

function startClock() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('currentTime').innerText = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    }, 1000);
}

function applyIndividualPreset(id, n) {
    const target = document.getElementById(id);
    let text = ""; for (let i = 1; i <= n; i++) text += `CASE ${i}. \n\n`;
    target.value = text.trim();
    generateTemplate();
}

function loadConfig() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultConfig; }

function saveSettings() {
    const split = (id) => document.getElementById(id).value.split('\n').map(s => s.trim()).filter(Boolean);
    const data = {
        adminUrl: document.getElementById('set_admin_url').value,
        pcUrl: document.getElementById('set_pc_url').value,
        andAppTester: document.getElementById('set_and_apptester').value,
        iosTestFlight: document.getElementById('set_ios_testflight').value,
        iosDistribution: document.getElementById('set_ios_distribution').value,
        andDevices: split('set_and_devices'),
        andSpecialDevices: split('set_and_special'),
        iosDevices: split('set_ios_devices'),
        iosSpecialDevices: split('set_ios_special')
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    syncEnvironmentByOS();
    closeModal();
}

function syncEnvironmentByOS() {
    const config = loadConfig();
    const osType = document.getElementById('osType').value;
    const currentSelected = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);

    document.getElementById('andDeviceCol').style.display = osType.includes("Android") ? 'block' : 'none';
    document.getElementById('iosDeviceCol').style.display = osType.includes("iOS") ? 'block' : 'none';
    document.getElementById('ios-ver-toggle').style.display = osType.includes("iOS") ? 'flex' : 'none';

    const render = (container, list, idPrefix) => {
        container.innerHTML = '';
        list.forEach(dev => {
            const isChecked = currentSelected.includes(dev) ? 'checked' : '';
            container.innerHTML += `<input type="checkbox" id="${idPrefix}_${dev}" class="pill-cb issue-device-cb" value="${dev}" ${isChecked} onchange="handleDeviceClick(this)"><label for="${idPrefix}_${dev}" class="pill-label">${dev}</label>`;
        });
    };

    render(document.getElementById('andNormalList'), config.andDevices, 'and_n');
    render(document.getElementById('andSpecialList'), config.andSpecialDevices, 'and_s');
    render(document.getElementById('iosNormalList'), config.iosDevices, 'ios_n');
    render(document.getElementById('iosSpecialList'), config.iosSpecialDevices, 'ios_s');

    let ver = "";
    if (osType === "[Android/iOS]") {
        const iosType = document.querySelector('input[name="ios_ver_type"]:checked').value;
        ver = `App Tester_${config.andAppTester} / ${iosType}_${(iosType==='TestFlight'?config.iosTestFlight:config.iosDistribution)}`;
    } else if (osType === "[Android]") ver = config.andAppTester;
    else {
        const iosType = document.querySelector('input[name="ios_ver_type"]:checked').value;
        ver = (iosType==='TestFlight'?config.iosTestFlight:config.iosDistribution);
    }
    document.getElementById('appVersion').value = ver;
    generateTemplate();
}

function handleDeviceClick(element) {
    if (element.checked) {
        const allChecked = Array.from(document.querySelectorAll('.issue-device-cb:checked'));
        const sameValueCount = allChecked.filter(cb => cb.value === element.value).length;
        if (sameValueCount > 1) {
            alert('이미 선택된 단말입니다.');
            element.checked = false;
            return;
        }
    }
    generateTemplate();
}

function toggleDeviceMode(platform) {
    const mode = document.querySelector(`input[name="${platform}_dev_mode"]:checked`).value;
    document.getElementById(`${platform}NormalList`).style.display = mode === 'normal' ? 'flex' : 'none';
    document.getElementById(`${platform}SpecialList`).style.display = mode === 'special' ? 'flex' : 'none';
    generateTemplate();
}

function handlePocChange() {
    const poc = document.getElementById('poc').value;
    const isWeb = poc === 'Admin' || poc === 'PC Web';
    document.getElementById('deviceGroup').style.display = isWeb ? 'none' : 'block';
    document.getElementById('urlGroup').style.display = isWeb ? 'block' : 'none';
    if (isWeb) {
        const cfg = loadConfig();
        document.getElementById('targetUrl').value = poc === 'Admin' ? cfg.adminUrl : cfg.pcUrl;
    } else syncEnvironmentByOS();
    generateTemplate();
}

function generateTemplate() {
    const getValue = (id) => document.getElementById(id).value;
    const poc = getValue('poc');
    const os = getValue('osType');
    const servers = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    const devices = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value).join(' / ');
    
    let ver = getValue('appVersion');
    if (poc === 'T 멤버십') {
        if (os === "[Android]") ver = `App Tester_${ver}`;
        else if (os === "[iOS]") ver = `${document.querySelector('input[name="ios_ver_type"]:checked').value}_${ver}`;
    }

    const rawEnv = servers.join('/').replace('PRD', '상용');
    const envPrefix = (rawEnv === 'STG' || !rawEnv) ? '' : `[${rawEnv}]`;
    const osPrefix = (poc === 'Admin' || poc === 'PC Web') ? '' : os;
    const specOsPrefix = getValue('prefix_spec_os').trim() ? `[${getValue('prefix_spec_os').trim()}]` : '';
    const pocPrefix = poc ? `[${poc}]` : '';
    const critPrefix = getValue('prefix_critical') ? `[${getValue('prefix_critical')}]` : '';
    const devPrefix = getValue('prefix_device').trim() ? `[${getValue('prefix_device').trim()}]` : '';
    const accPrefix = getValue('prefix_account').trim() ? `[${getValue('prefix_account').trim()}]` : '';
    const pagePrefix = getValue('prefix_page').trim() ? `[${getValue('prefix_page').trim()}]` : '';

    const titleText = `${envPrefix}${osPrefix}${specOsPrefix}${pocPrefix}${critPrefix}${devPrefix}${accPrefix}${pagePrefix} ${getValue('title').trim()}`.replace(/\s+/g, ' ').trim();
    
    let envSection = `[Environment]\n■ POC : ${poc}\n`;
    if (poc === 'Admin' || poc === 'PC Web') envSection += `■ 서버 : ${servers.join(' / ')}\n■ URL : ${getValue('targetUrl')}`;
    else envSection += `■ Device : ${devices || '-'}\n■ 서버 : ${servers.join(' / ')}\n■ 버전 : ${ver}`;
    
    const prdRef = getValue('ref_prd').trim();
    const notes = getValue('ref_notes').trim();
    const refSection = (prdRef || notes) ? `\n\n[참고사항]\n${prdRef ? '1. 상용 재현 여부 : ' + prdRef + '\n' : ''}${notes}` : '';

    const body = `${envSection}\n\n[Pre-Condition]\n${getValue('preCondition')}\n\n[재현스텝]\n${getValue('steps')}\n\n[실행결과-문제현상]\n${getValue('actualResult')}\n\n[기대결과]\n${getValue('expectedResult')}${refSection}`;
    
    document.getElementById('outputTitle').value = titleText;
    document.getElementById('outputBody').value = body.trim();
}

function openCompletionModal() {
    const config = loadConfig();
    const osType = document.getElementById('osType').value;
    const currentSelected = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);
    
    const andList = document.getElementById('comp_and_list');
    const iosList = document.getElementById('comp_ios_list');
    andList.innerHTML = ''; iosList.innerHTML = '';
    
    document.getElementById('comp_and_section').style.display = osType.includes("Android") ? 'block' : 'none';
    document.getElementById('comp_ios_section').style.display = osType.includes("iOS") ? 'block' : 'none';

    const renderComp = (container, list) => {
        list.forEach(dev => {
            const chk = currentSelected.includes(dev) ? 'checked' : '';
            container.innerHTML += `<label class="pill-label" style="display:flex; align-items:center; gap:10px;"><input type="checkbox" class="comp-dev-cb" value="${dev}" ${chk} onchange="updateCompletionPreview()"> ${dev}</label>`;
        });
    };
    renderComp(andList, [...config.andDevices, ...config.andSpecialDevices]);
    renderComp(iosList, [...config.iosDevices, ...config.iosSpecialDevices]);

    const vList = document.getElementById('comp_version_list'); vList.innerHTML = '';
    document.getElementById('appVersion').value.split(' / ').forEach(v => {
        vList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-ver-cb" value="${v}" checked onchange="updateCompletionPreview()"> ${v}</label>`;
    });

    const sList = document.getElementById('comp_server_list'); sList.innerHTML = '';
    const currentCheckedSrvs = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    ['STG', 'GRN', 'PRD'].forEach(s => {
        const chk = currentCheckedSrvs.includes(s) ? 'checked' : '';
        const label = s==='PRD'?'상용(PRD)':s;
        sList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-srv-cb" value="${label}" ${chk} onchange="updateCompletionPreview()"> ${label}</label>`;
    });

    document.getElementById('comp_check').value = '';
    document.getElementById('completionModal').style.display = 'flex';
    updateCompletionPreview();
}

function closeCompletionModal() { document.getElementById('completionModal').style.display = 'none'; }
function closeThemeModal() { document.getElementById('themeModal').style.display = 'none'; initCustomTheme(); }
function closeModal() { document.getElementById('settingModal').style.display = 'none'; }
function closeChangelogModal() { document.getElementById('changelogModal').style.display = 'none'; }

function updateCompletionPreview() {
    const devs = Array.from(document.querySelectorAll('.comp-dev-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    const vers = Array.from(document.querySelectorAll('.comp-ver-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    const srvs = Array.from(document.querySelectorAll('.comp-srv-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    const extra = document.getElementById('extra_notes').value.trim();
    document.getElementById('comp_preview').value = `■ Device(OS Ver.) : ${devs}\n■ 버젼 : ${vers}\n■ 서버 : ${srvs}\n■ 현상 check : ${document.getElementById('comp_check').value}${extra ? '\n\n[검증 참고사항]\n' + extra : ''}`;
}

function copyCompletionReport() {
    const el = document.getElementById('comp_preview');
    el.select();
    document.execCommand('copy');
    alert('완료문 복사 완료!');
    closeCompletionModal();
}

function openModal() {
    const cfg = loadConfig();
    document.getElementById('settingModal').style.display = 'flex';
    document.getElementById('set_admin_url').value = cfg.adminUrl || '';
    document.getElementById('set_pc_url').value = cfg.pcUrl || '';
    document.getElementById('set_and_apptester').value = cfg.andAppTester || '';
    document.getElementById('set_ios_testflight').value = cfg.iosTestFlight || '';
    document.getElementById('set_ios_distribution').value = cfg.iosDistribution || '';
    document.getElementById('set_and_devices').value = (cfg.andDevices || []).join('\n');
    document.getElementById('set_and_special').value = (cfg.andSpecialDevices || []).join('\n');
    document.getElementById('set_ios_devices').value = (cfg.iosDevices || []).join('\n');
    document.getElementById('set_ios_special').value = (cfg.iosSpecialDevices || []).join('\n');
}

function openChangelogModal() { document.getElementById('changelogModal').style.display = 'flex'; }

function copySpecific(id) {
    const el = document.getElementById(id);
    el.select();
    document.execCommand('copy');
    alert('복사되었습니다.');
}

function copyAll() {
    const combined = `${document.getElementById('outputTitle').value}\n${document.getElementById('outputBody').value}`;
    const t = document.createElement("textarea");
    document.body.appendChild(t);
    t.value = combined;
    t.select();
    document.execCommand("copy");
    document.body.removeChild(t);
    alert('전체 복사 완료!');
}

function clearForm() {
    if(!confirm('초기화하시겠습니까? (에픽/참고사항 제외)')) return;
    ['title', 'prefix_spec_os', 'prefix_account', 'prefix_device', 'prefix_page', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'].forEach(id => document.getElementById(id).value = '');
    syncEnvironmentByOS();
}

document.addEventListener('DOMContentLoaded', () => {
    initCustomTheme();
    startClock();
    initPresenceSystem();
    syncEnvironmentByOS();
    document.getElementById('comp_check').addEventListener('input', updateCompletionPreview);
});
