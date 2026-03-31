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
    const bg = document.getElementById('picker_bg').value;
    const panel = document.getElementById('picker_panel').value;
    const text = document.getElementById('picker_text').value;
    applyTheme(bg, panel, text);
}

function saveTheme() {
    const themeData = {
        bg: document.getElementById('picker_bg').value,
        panel: document.getElementById('picker_panel').value,
        text: document.getElementById('picker_text').value
    };
    localStorage.setItem('skm_custom_palette', JSON.stringify(themeData));
    closeThemeModal();
}

function resetTheme() {
    const defBg = '#f0f2f5', defPanel = '#ffffff', defText = '#475569';
    applyTheme(defBg, defPanel, defText);
    syncPickers(defBg, defPanel, defText);
    localStorage.removeItem('skm_custom_palette');
}

function openThemeModal() { document.getElementById('themeModal').style.display = 'flex'; }
function closeThemeModal() { 
    document.getElementById('themeModal').style.display = 'none'; 
    initCustomTheme(); 
}

function renderChangelog() {
    const container = document.getElementById('changelog-container');
    if (!container || typeof changelogData === 'undefined') return;
    let htmlString = '';
    changelogData.forEach(log => {
        let listItems = log.changes.map(change => `<li>${change}</li>`).join('');
        htmlString += `<div class="changelog-item"><span class="version-badge">${log.version}</span><span class="changelog-date">${log.date}</span><ul class="changelog-desc">${listItems}</ul></div>`;
    });
    container.innerHTML = htmlString;
}

function initPresenceSystem() {
    const list = document.getElementById('presence-list');
    const allUsersRef = database.ref('presence');
    const authBtn = document.getElementById('auth-btn');
    allUsersRef.on('value', (snapshot) => {
        list.innerHTML = '';
        const users = snapshot.val();
        if (users) {
            Object.keys(users).forEach((id) => {
                const userData = users[id];
                const isMe = (id === currentUserId);
                let avatarContent = userData.photo ? `<img src="${userData.photo}" alt="profile" referrerpolicy="no-referrer">` : (isMe ? "Me" : (userData.name.includes('_') ? userData.name.split('_')[1].charAt(0) : userData.name.charAt(0)));
                const bgColor = userData.color || '#cbd5e1';
                list.innerHTML += `<div class="user-avatar" style="background: ${bgColor}; ${isMe ? 'border-color: #3b82f6; z-index:5;' : 'border-color: #ffffff;'}" data-name="${userData.name}${isMe ? ' (나)' : ''}">${avatarContent}</div>`;
            });
        }
    });
    auth.onAuthStateChanged((user) => {
        authBtn.disabled = false;
        if (user) {
            if (currentUserId && currentUserId !== user.uid) database.ref('presence/' + currentUserId).remove();
            currentUserId = user.uid;
            const myUserRef = database.ref('presence/' + currentUserId);
            if (user.isAnonymous) {
                authBtn.innerText = 'G 로그인';
                authBtn.classList.remove('logged-in');
                database.ref('.info/connected').on('value', (s) => { if (s.val() === true && currentUserId === user.uid) { myUserRef.set({ name: myAnonName, color: myAnonColor, photo: "", lastActive: firebase.database.ServerValue.TIMESTAMP }); myUserRef.onDisconnect().remove(); } });
            } else {
                authBtn.innerText = 'G 로그아웃';
                authBtn.classList.add('logged-in');
                database.ref('.info/connected').on('value', (s) => { if (s.val() === true && currentUserId === user.uid) { myUserRef.set({ name: user.displayName || "이름 없음", photo: user.photoURL || "", color: "#3b82f6", lastActive: firebase.database.ServerValue.TIMESTAMP }); myUserRef.onDisconnect().remove(); } });
            }
        } else {
            if (currentUserId) { database.ref('presence/' + currentUserId).remove(); currentUserId = null; }
            auth.signInAnonymously().catch(e => console.error(e));
        }
    });
}

function toggleAuth() {
    if (auth.currentUser && !auth.currentUser.isAnonymous) auth.signOut().catch(e => alert(e.message));
    else auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e => { if (e.code !== 'auth/popup-closed-by-user') alert(e.message); });
}

function startClock() {
    const timeDisplay = document.getElementById('currentTime');
    function update() { 
        const now = new Date(); 
        timeDisplay.innerText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`; 
    }
    update(); setInterval(update, 1000);
}

function toggleCaseSelector(selectorId) {
    const selector = document.getElementById(selectorId);
    document.querySelectorAll('.case-selector').forEach(el => { if(el.id !== selectorId) el.style.display = 'none'; });
    selector.style.display = (getComputedStyle(selector).display === 'none') ? 'flex' : 'none';
}

function applyIndividualPreset(targetFieldId, count) {
    const target = document.getElementById(targetFieldId);
    if (target.value.trim() && !confirm('내용이 초기화되고 CASE 서식이 입력됩니다. 진행하시겠습니까?')) return;
    let presetText = ""; for (let i = 1; i <= count; i++) presetText += `CASE ${i}. \n\n`;
    target.value = presetText.trim(); document.querySelectorAll('.case-selector').forEach(el => el.style.display = 'none'); generateTemplate();
}

function loadConfig() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultConfig;
}

function saveSettings() {
    const getDevices = (id) => document.getElementById(id).value.split('\n').map(s => s.trim()).filter(Boolean);
    const data = {
        adminUrl: document.getElementById('set_admin_url').value,
        pcUrl: document.getElementById('set_pc_url').value,
        andAppTester: document.getElementById('set_and_apptester').value,
        iosTestFlight: document.getElementById('set_ios_testflight').value,
        iosDistribution: document.getElementById('set_ios_distribution').value,
        andDevices: getDevices('set_and_devices'),
        andSpecialDevices: getDevices('set_and_special'),
        iosDevices: getDevices('set_ios_devices'),
        iosSpecialDevices: getDevices('set_ios_special')
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    syncEnvironmentByOS(); handlePocChange(); closeModal();
}

function syncEnvironmentByOS() {
    const config = loadConfig();
    const osType = document.getElementById('osType').value;
    const andCol = document.getElementById('andDeviceCol'); 
    const iosCol = document.getElementById('iosDeviceCol');
    const iosVerToggle = document.getElementById('ios-ver-toggle');
    
    const andNormal = document.getElementById('andNormalList');
    const andSpecial = document.getElementById('andSpecialList');
    const iosNormal = document.getElementById('iosNormalList');
    const iosSpecial = document.getElementById('iosSpecialList');

    andNormal.innerHTML = ''; andSpecial.innerHTML = ''; 
    iosNormal.innerHTML = ''; iosSpecial.innerHTML = '';
    
    andCol.style.display = osType.includes("Android") ? 'block' : 'none';
    iosCol.style.display = osType.includes("iOS") ? 'block' : 'none';
    iosVerToggle.style.display = osType.includes("iOS") ? 'flex' : 'none';

    const render = (container, list, idPrefix) => {
        list.forEach(dev => {
            container.innerHTML += `<input type="checkbox" id="${idPrefix}_${dev}" class="pill-cb issue-device-cb" value="${dev}" onchange="generateTemplate()"><label for="${idPrefix}_${dev}" class="pill-label">${dev}</label>`;
        });
    };

    render(andNormal, config.andDevices, 'and_n');
    render(andSpecial, config.andSpecialDevices, 'and_s');
    render(iosNormal, config.iosDevices, 'ios_n');
    render(iosSpecial, config.iosSpecialDevices, 'ios_s');

    let ver = "";
    if (osType === "[Android/iOS]") {
        const iosType = document.querySelector('input[name="ios_ver_type"]:checked').value;
        const iosVer = (iosType === 'TestFlight') ? config.iosTestFlight : config.iosDistribution;
        ver = `App Tester_${config.andAppTester} / ${iosType}_${iosVer}`;
    } else if (osType === "[Android]") {
        ver = config.andAppTester;
    } else if (osType === "[iOS]") {
        const iosType = document.querySelector('input[name="ios_ver_type"]:checked').value;
        ver = (iosType === 'TestFlight') ? config.iosTestFlight : config.iosDistribution;
    }
    document.getElementById('appVersion').value = ver;

    toggleDeviceMode();
}

function toggleDeviceMode() {
    const mode = document.querySelector('input[name="dev_mode"]:checked').value;
    document.getElementById('andNormalList').style.display = mode === 'normal' ? 'flex' : 'none';
    document.getElementById('andSpecialList').style.display = mode === 'special' ? 'flex' : 'none';
    document.getElementById('iosNormalList').style.display = mode === 'normal' ? 'flex' : 'none';
    document.getElementById('iosSpecialList').style.display = mode === 'special' ? 'flex' : 'none';
    generateTemplate();
}

function handlePocChange() {
    const poc = document.getElementById('poc').value; 
    const isWeb = poc === 'Admin' || poc === 'PC Web';
    document.getElementById('deviceGroup').style.display = isWeb ? 'none' : 'block'; 
    document.getElementById('urlGroup').style.display = isWeb ? 'block' : 'none';
    if (isWeb) {
        const config = loadConfig();
        document.getElementById('targetUrl').value = (poc === 'Admin') ? config.adminUrl : config.pcUrl; 
    } else syncEnvironmentByOS();
    generateTemplate();
}

function generateTemplate() {
    const getValue = (id) => document.getElementById(id).value;
    const rawPoc = getValue('poc');
    const osType = getValue('osType');
    const serversArr = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    const bodyServers = serversArr.join(' / '); 

    let formattedVer = getValue('appVersion');
    if (rawPoc === 'T 멤버십') {
        if (osType === "[Android]") formattedVer = `App Tester_${formattedVer}`;
        else if (osType === "[iOS]") {
            const iosType = document.querySelector('input[name="ios_ver_type"]:checked').value;
            formattedVer = `${iosType}_${formattedVer}`;
        }
    }

    const rawEnv = serversArr.join('/').replace('PRD', '상용'); 
    const envStr = (rawEnv === 'STG' || !rawEnv) ? '' : `[${rawEnv}]`; 
    const osStr = (rawPoc === 'Admin' || rawPoc === 'PC Web') ? '' : osType; 
    const pocStr = (rawPoc === 'T 멤버십' || !rawPoc) ? '' : (rawPoc === 'PC Web' ? '[PC]' : `[${rawPoc}]`);
    const critStr = getValue('prefix_critical') ? `[${getValue('prefix_critical')}]` : ''; 
    const devStr = getValue('prefix_device').trim() ? `[${getValue('prefix_device').trim()}]` : ''; 
    const accStr = getValue('prefix_account').trim() ? `[${getValue('prefix_account').trim()}]` : ''; 
    const pageStr = getValue('prefix_page').trim() ? `[${getValue('prefix_page').trim()}]` : '';
    
    const titleText = `${envStr}${osStr}${pocStr}${critStr}${devStr}${accStr}${pageStr} ${getValue('title').trim()}`.trim();
    const checkedDevices = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value).join(' / ');
    
    let envSection = `[Environment]\n■ POC : ${rawPoc}\n`;
    if (rawPoc === 'Admin' || rawPoc === 'PC Web') envSection += `■ 서버 : ${bodyServers}\n■ URL : ${getValue('targetUrl')}`;
    else envSection += `■ Device : ${checkedDevices || '-'}\n■ 서버 : ${bodyServers}\n■ 버전 : ${formattedVer}`;
    
    const prdRef = getValue('ref_prd').trim(); 
    const notes = getValue('ref_notes').trim(); 
    const refSection = (prdRef || notes) ? `\n\n[참고사항]\n${prdRef ? '1. 상용 재현 여부 : ' + prdRef + '\n' : ''}${notes}` : '';
    
    const extraNotes = getValue('extra_notes').trim();
    const extraStr = extraNotes ? `\n\n[검증 참고사항]\n${extraNotes}` : '';

    const bodyText = `${envSection}\n\n[Pre-Condition]\n${getValue('preCondition')}\n\n[재현스텝]\n${getValue('steps')}\n\n[실행결과-문제현상]\n${getValue('actualResult')}\n\n[기대결과]\n${getValue('expectedResult')}${refSection}${extraStr}`;
    
    document.getElementById('outputTitle').value = titleText; 
    document.getElementById('outputBody').value = bodyText.trim();
}

function openCompletionModal() {
    const config = loadConfig();
    const osType = document.getElementById('osType').value;
    const currentCheckedDevs = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);
    const currentCheckedSrvs = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    
    const andList = document.getElementById('comp_and_list');
    const iosList = document.getElementById('comp_ios_list');
    andList.innerHTML = ''; iosList.innerHTML = '';

    document.getElementById('comp_and_section').style.display = osType.includes("Android") ? 'block' : 'none';
    document.getElementById('comp_ios_section').style.display = osType.includes("iOS") ? 'block' : 'none';

    const renderComp = (container, list) => {
        list.forEach(dev => {
            const isChecked = currentCheckedDevs.includes(dev) ? 'checked' : '';
            container.innerHTML += `<label class="pill-label" style="display:flex; align-items:center; gap:10px;"><input type="checkbox" class="comp-dev-cb" value="${dev}" ${isChecked} onchange="updateCompletionPreview()"> ${dev}</label>`;
        });
    };

    renderComp(andList, [...config.andDevices, ...config.andSpecialDevices]);
    renderComp(iosList, [...config.iosDevices, ...config.iosSpecialDevices]);

    const vList = document.getElementById('comp_version_list');
    vList.innerHTML = '';
    document.getElementById('appVersion').value.split(' / ').forEach(v => {
        vList.innerHTML += `<label class="checkbox-label" style="display:flex; align-items:center; gap:8px;"><input type="checkbox" class="comp-ver-cb" value="${v}" checked onchange="updateCompletionPreview()"> ${v}</label>`;
    });

    const sList = document.getElementById('comp_server_list');
    sList.innerHTML = '';
    ['STG', 'DEV', 'PRD'].forEach(s => {
        const isChecked = currentCheckedSrvs.includes(s) ? 'checked' : '';
        const labelName = s === 'PRD' ? 'PRD(상용)' : s;
        sList.innerHTML += `<label class="checkbox-label" style="display:flex; align-items:center; gap:8px;"><input type="checkbox" class="comp-srv-cb" value="${labelName}" ${isChecked} onchange="updateCompletionPreview()"> ${labelName}</label>`;
    });

    document.getElementById('comp_check').value = '';
    document.getElementById('completionModal').style.display = 'flex';
    updateCompletionPreview();
}

function closeCompletionModal() { document.getElementById('completionModal').style.display = 'none'; }

function updateCompletionPreview() {
    const devices = Array.from(document.querySelectorAll('.comp-dev-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    const versions = Array.from(document.querySelectorAll('.comp-ver-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    const servers = Array.from(document.querySelectorAll('.comp-srv-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    const check = document.getElementById('comp_check').value;

    const report = `■ Device(OS Ver.) : ${devices}\n■ 버젼 : ${versions}\n■ 서버 : ${servers}\n■ 현상 check : ${check}`;
    document.getElementById('comp_preview').value = report;
}

function copyCompletionReport() {
    const el = document.getElementById('comp_preview');
    el.select();
    document.execCommand('copy');
    alert('완료문이 복사되었습니다.');
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

function closeModal() { document.getElementById('settingModal').style.display = 'none'; }
function openChangelogModal() { document.getElementById('changelogModal').style.display = 'flex'; }
function closeChangelogModal() { document.getElementById('changelogModal').style.display = 'none'; }

function copySpecific(id) { const el = document.getElementById(id); el.select(); document.execCommand('copy'); alert('복사되었습니다.'); }
function copyAll() { const t = document.createElement("textarea"); t.value = `${document.getElementById('outputTitle').value}\n${document.getElementById('outputBody').value}`; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); alert('전체 내용이 복사되었습니다.'); }

function clearForm() { 
    if(!confirm('내용을 초기화할까요? (에픽 링크/검증 참고사항 제외)')) return; 
    ['title', 'prefix_account', 'prefix_device', 'prefix_page', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'].forEach(id => { 
        document.getElementById(id).value = ''; 
    }); 
    document.getElementById('prefix_critical').value = ''; 
    document.querySelectorAll('.case-selector').forEach(el => el.style.display = 'none'); 
    document.getElementById('osType').value = '[Android/iOS]';
    document.getElementById('poc').value = 'T 멤버십';
    syncEnvironmentByOS();
    handlePocChange();
    generateTemplate(); 
}

document.addEventListener('DOMContentLoaded', () => {
    initCustomTheme();
    startClock();
    initPresenceSystem();
    renderChangelog();
    syncEnvironmentByOS();
    document.getElementById('comp_check').addEventListener('input', updateCompletionPreview);
});
