/**
 * [SKM] 이슈틀 생성기 - V18.1 Core Logic (UX Optimized)
 * Author: Gemini
 * Last Updated: 2026-03-31
 */

// 1. Firebase 설정 (싱가포르 asia-southeast1 리전 및 대장님의 API Key)
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

// Firebase 초기화
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
const auth = firebase.auth();

const defaultConfig = { andDevices: [], iosDevices: [], andVer: '', iosVer: '', adminUrl: '', pcUrl: '' };
const STORAGE_KEY = 'qa_system_config_master';

let currentUserId = null; // 현재 로그인한 사용자 ID

// --- [Auth & Presence] 구글 로그인 및 실시간 접속자 시스템 (V18.1) ---

function initPresenceSystem() {
    const list = document.getElementById('presence-list');
    const allUsersRef = database.ref('presence');
    const authBtn = document.getElementById('auth-btn');

    // 1. 모든 접속자 상태를 실시간으로 그려주는 리스너 (로그인 안 해도 다른 사람 볼 수 있음)
    allUsersRef.on('value', (snapshot) => {
        list.innerHTML = '';
        const users = snapshot.val();
        
        if (users) {
            Object.keys(users).forEach((id) => {
                const userData = users[id];
                const isMe = (id === currentUserId);
                
                // 구글 프로필 이미지가 있으면 img 태그 렌더링 (referrerpolicy 속성 필수)
                let avatarContent = '';
                if (userData.photo) {
                    avatarContent = `<img src="${userData.photo}" alt="profile" referrerpolicy="no-referrer">`;
                } else {
                    avatarContent = isMe ? "Me" : userData.name.charAt(0);
                }
                
                list.innerHTML += `
                    <div class="user-avatar" 
                         style="${isMe ? 'border-color: #3b82f6; z-index:5;' : 'border-color: #ffffff;'}" 
                         data-name="${userData.name}${isMe ? ' (나)' : ''}">
                         ${avatarContent}
                    </div>`;
            });
        }
    });

    // 2. 내 로그인 상태 감지 및 내 상태(Presence) DB에 쓰기
    auth.onAuthStateChanged((user) => {
        // [UX 개선] 파이어베이스 인증 상태 확인이 끝나면 버튼 활성화 (깜빡임 방지)
        authBtn.disabled = false;
        
        if (user) {
            // [로그인 성공 상태]
            currentUserId = user.uid;
            authBtn.innerText = 'G 로그아웃';
            authBtn.classList.add('logged-in');

            const myUserRef = database.ref('presence/' + currentUserId);
            
            // 서버와 연결이 확인되면 내 구글 정보를 DB에 등록
            database.ref('.info/connected').on('value', (snapshot) => {
                if (snapshot.val() === true && currentUserId) {
                    myUserRef.set({
                        name: user.displayName || "이름 없음",
                        photo: user.photoURL || "",
                        lastActive: firebase.database.ServerValue.TIMESTAMP
                    });
                    // 브라우저 닫을 때 내 정보 자동 삭제
                    myUserRef.onDisconnect().remove();
                }
            });
        } else {
            // [로그아웃 상태]
            if (currentUserId) {
                // 로그아웃 시 서버에서 내 정보 즉시 삭제
                database.ref('presence/' + currentUserId).remove();
            }
            currentUserId = null;
            authBtn.innerText = 'G 로그인';
            authBtn.classList.remove('logged-in');
        }
    });
}

// 구글 로그인/로그아웃 버튼 클릭 함수
function toggleAuth() {
    if (auth.currentUser) {
        // 로그아웃 처리
        auth.signOut().catch((error) => alert('로그아웃 실패: ' + error.message));
    } else {
        // 구글 로그인 팝업 호출
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch((error) => {
            alert('로그인 에러: ' + error.message);
        });
    }
}

// --- [Clock] 실시간 시간 표시 ---
function startClock() {
    const timeDisplay = document.getElementById('currentTime');
    if (!timeDisplay) return;

    function update() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeDisplay.innerText = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    update();
    setInterval(update, 1000);
}

// --- [Case Engine] 개별 필드 CASE 프리셋 제어 ---
function toggleCaseSelector(selectorId) {
    const selector = document.getElementById(selectorId);
    document.querySelectorAll('.case-selector').forEach(el => {
        if(el.id !== selectorId) el.style.display = 'none';
    });
    const isHidden = getComputedStyle(selector).display === 'none';
    selector.style.display = isHidden ? 'flex' : 'none';
}

function applyIndividualPreset(targetFieldId, count) {
    const target = document.getElementById(targetFieldId);
    if (target.value.trim() && !confirm('내용이 초기화되고 CASE 서식이 입력됩니다. 진행하시겠습니까?')) return;

    let presetText = "";
    for (let i = 1; i <= count; i++) {
        presetText += `CASE ${i}. \n\n`;
    }
    target.value = presetText.trim();
    document.querySelectorAll('.case-selector').forEach(el => el.style.display = 'none');
    generateTemplate();
}

// --- [Data Logic] 로컬 설정 데이터 로딩 및 동기화 ---
function loadConfig() {
    let config = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!config) {
        config = JSON.parse(localStorage.getItem('qa_config_v12')) || defaultConfig;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
    return config;
}

function saveSettings() {
    const getDevices = (id) => document.getElementById(id).value.split('\n').map(s => s.trim()).filter(Boolean);
    const config = loadConfig();
    const data = {
        adminUrl: document.getElementById('set_admin_url').value,
        pcUrl: document.getElementById('set_pc_url').value,
        andDevices: getDevices('set_and_devices'),
        iosDevices: getDevices('set_ios_devices'),
        andVer: config.andVer || "",
        iosVer: config.iosVer || ""
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    syncEnvironmentByOS(); 
    handlePocChange();
    closeModal();
}

function syncEnvironmentByOS() {
    const config = loadConfig();
    const osType = document.getElementById('osType').value;
    const andCol = document.getElementById('andDeviceCol');
    const iosCol = document.getElementById('iosDeviceCol');
    const andContainer = document.getElementById('andCheckboxes');
    const iosContainer = document.getElementById('iosCheckboxes');

    andContainer.innerHTML = ''; iosContainer.innerHTML = '';
    andCol.classList.remove('active'); iosCol.classList.remove('active');

    if (osType.includes("Android")) {
        andCol.classList.add('active');
        config.andDevices.forEach((dev, i) => {
            andContainer.innerHTML += `<input type="checkbox" id="and_dev_${i}" class="pill-cb issue-device-cb" value="${dev}" onchange="generateTemplate()"><label for="and_dev_${i}" class="pill-label">${dev}</label>`;
        });
    }
    if (osType.includes("iOS")) {
        iosCol.classList.add('active');
        config.iosDevices.forEach((dev, i) => {
            iosContainer.innerHTML += `<input type="checkbox" id="ios_dev_${i}" class="pill-cb issue-device-cb" value="${dev}" onchange="generateTemplate()"><label for="ios_dev_${i}" class="pill-label">${dev}</label>`;
        });
    }

    let targetVer = "";
    if (osType === "[Android/iOS]") targetVer = [config.andVer, config.iosVer].filter(Boolean).join(' / ');
    else if (osType === "[Android]") targetVer = config.andVer;
    else if (osType === "[iOS]") targetVer = config.iosVer;
    document.getElementById('appVersion').value = targetVer;
    generateTemplate();
}

function handlePocChange() {
    const poc = document.getElementById('poc').value;
    const isWeb = poc === 'Admin' || poc === 'PC Web';
    const config = loadConfig();
    document.getElementById('osGroup').style.display = isWeb ? 'none' : 'block';
    document.getElementById('deviceGroup').style.display = isWeb ? 'none' : 'block';
    document.getElementById('urlGroup').style.display = isWeb ? 'block' : 'none';
    if (isWeb) document.getElementById('targetUrl').value = (poc === 'Admin') ? config.adminUrl : config.pcUrl;
    else syncEnvironmentByOS();
    generateTemplate();
}

// --- [Template Engine] 리포트 조립 엔진 ---
function generateTemplate() {
    const getValue = (id) => document.getElementById(id).value;
    const rawPoc = getValue('poc');
    
    const serversArr = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    const titleServers = serversArr.join('/'); 
    const bodyServers = serversArr.join(' / '); 
    
    let rawEnv = titleServers.replace('PRD', '상용'); 
    const envStr = (rawEnv === 'STG' || !rawEnv) ? '' : `[${rawEnv}]`;
    const osStr = (rawPoc === 'Admin' || rawPoc === 'PC Web') ? '' : getValue('osType');
    const pocStr = (rawPoc === 'T 멤버십' || !rawPoc) ? '' : (rawPoc === 'PC Web' ? '[PC]' : `[${rawPoc}]`);
    
    const critStr = getValue('prefix_critical') ? `[${getValue('prefix_critical')}]` : '';
    const devStr = getValue('prefix_device').trim() ? `[${getValue('prefix_device').trim()}]` : '';
    const accStr = getValue('prefix_account').trim() ? `[${getValue('prefix_account').trim()}]` : '';
    const pageStr = getValue('prefix_page').trim() ? `[${getValue('prefix_page').trim()}]` : '';
    
    const title = `${envStr}${osStr}${pocStr}${critStr}${devStr}${accStr}${pageStr} ${getValue('title').trim()}`.trim();
    const checkedDevices = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value).join(' / ');
    
    let envSection = `[Environment]\n■ POC : ${rawPoc}\n`;
    if (rawPoc === 'Admin' || rawPoc === 'PC Web') {
        envSection += `■ 서버 : ${bodyServers}\n■ URL : ${getValue('targetUrl')}`;
    } else {
        envSection += `■ Device : ${checkedDevices || '-'}\n■ 서버 : ${bodyServers}\n■ 버전 : ${getValue('appVersion')}`;
    }

    const prdRef = getValue('ref_prd').trim();
    const notes = getValue('ref_notes').trim();
    const refSection = (prdRef || notes) ? `\n\n[참고사항]\n${prdRef ? '1. 상용 재현 여부 : ' + prdRef + '\n' : ''}${notes}` : '';

    const body = `${envSection}\n\n[Pre-Condition]\n${getValue('preCondition')}\n\n[재현스텝]\n${getValue('steps')}\n\n[실행결과-문제현상]\n${getValue('actualResult')}\n\n[기대결과]\n${getValue('expectedResult')}${refSection}`;

    document.getElementById('outputTitle').value = title;
    document.getElementById('outputBody').value = body.trim();
}

// --- [Modals] 모달 제어 ---
function openModal() { document.getElementById('settingModal').style.display = 'flex'; }
function closeModal() { document.getElementById('settingModal').style.display = 'none'; }
function openChangelogModal() { document.getElementById('changelogModal').style.display = 'flex'; }
function closeChangelogModal() { document.getElementById('changelogModal').style.display = 'none'; }

// --- [Utility] 복사 및 초기화 ---
function copySpecific(id) {
    const el = document.getElementById(id);
    if (!el.value.trim()) return;
    el.select();
    document.execCommand('copy');
    alert('복사되었습니다.');
}

function copyAll() {
    const combined = `${document.getElementById('outputTitle').value}\n${document.getElementById('outputBody').value}`;
    if (!combined.trim()) return;
    const t = document.createElement("textarea");
    document.body.appendChild(t);
    t.value = combined; t.select();
    document.execCommand("copy");
    document.body.removeChild(t);
    alert('전체 내용이 복사되었습니다.');
}

function clearForm() {
    if(!confirm('내용을 초기화할까요?')) return;
    ['title', 'prefix_account', 'prefix_device', 'prefix_page', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('prefix_critical').value = '';
    document.querySelectorAll('.case-selector').forEach(el => el.style.display = 'none');
    generateTemplate();
}

// --- [Start] 시스템 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    initPresenceSystem(); // 구글 로그인 및 접속자 감지 시작
    
    const config = loadConfig();
    if(config) {
        document.getElementById('set_admin_url').value = config.adminUrl || '';
        document.getElementById('set_pc_url').value = config.pcUrl || '';
        document.getElementById('set_and_devices').value = (config.andDevices || []).join('\n');
        document.getElementById('set_ios_devices').value = (config.iosDevices || []).join('\n');
    }
    syncEnvironmentByOS();
});
