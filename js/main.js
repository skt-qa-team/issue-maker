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
const anonColors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
let myAnonName = sessionStorage.getItem('anonName') || ("동료_" + Math.random().toString(36).substring(7, 10).toUpperCase());
let myAnonColor = sessionStorage.getItem('anonColor') || anonColors[Math.floor(Math.random() * anonColors.length)];
sessionStorage.setItem('anonName', myAnonName);
sessionStorage.setItem('anonColor', myAnonColor);

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
        const icon = document.getElementById('auth-btn-icon');
        const label = document.getElementById('auth-btn-label');
        if (user) {
            currentUserId = user.uid;
            const myUserRef = database.ref('presence/' + currentUserId);
            if (user.isAnonymous) {
                label.innerText = '로그인';
                icon.style.background = '#ef4444';
                myUserRef.set({ name: myAnonName, color: myAnonColor, photo: "", lastActive: firebase.database.ServerValue.TIMESTAMP });
            } else {
                label.innerText = '로그아웃';
                icon.style.background = '#3b82f6';
                myUserRef.set({ name: user.displayName, photo: user.photoURL, color: "#3b82f6", lastActive: firebase.database.ServerValue.TIMESTAMP });
            }
            myUserRef.onDisconnect().remove();
        } else auth.signInAnonymously();
    });
}

function toggleAuth() { 
    if (auth.currentUser && !auth.currentUser.isAnonymous) auth.signOut(); 
    else auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); 
}

function startClock() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('currentTime').innerText = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    }, 1000);
}

function applyIndividualPreset(id, n) {
    const target = document.getElementById(id);
    let text = ""; 
    for (let i = 1; i <= n; i++) text += `CASE ${i}. \n\n`;
    target.value = text.trim();
    generateTemplate();
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
    } else if (osType === "[Android]") {
        ver = config.andAppTester;
    } else {
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
    } else {
        syncEnvironmentByOS();
    }
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
    
    document.getElementById('outputTitle').value = titleText;
    document.getElementById('outputBody').value = body.trim();
}

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
    if (typeof initCustomTheme === 'function') initCustomTheme();
    startClock();
    initPresenceSystem();
    if (typeof renderChangelog === 'function') renderChangelog();
    syncEnvironmentByOS();
});
