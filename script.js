/**
 * [SKM] 이슈틀 생성기 - V17.2 Core Logic
 * Author: Gemini (Adaptive AI Collaborator)
 * Last Updated: 2026-03-31
 */

const defaultConfig = { 
    andDevices: [], 
    iosDevices: [], 
    andVer: '', 
    iosVer: '', 
    adminUrl: '', 
    pcUrl: '' 
};
const STORAGE_KEY = 'qa_system_config_master';

// --- [Presence] 실시간 접속자 시스템 (Google Sheets Style) ---
function initPresence() {
    const list = document.getElementById('presence-list');
    if (!list) return;

    const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    const names = ['익명의 호랑이', '익명의 사자', '익명의 고양이', '익명의 여우', '익명의 곰', '익명의 펭귄'];
    
    // 1. 나 자신(Me) 아바타 생성
    list.innerHTML = `<div class="user-avatar" style="background: #1e293b; border-color: #3b82f6; z-index: 5;" data-name="나 (작성 중)">Me</div>`;
    
    // 2. 가상의 팀원 랜덤 생성 로직 (데모 모드)
    // 실제 서버 연동 시 이 부분은 Firebase 등 실시간 DB 리스너로 대체됩니다.
    const activeCount = Math.floor(Math.random() * 4) + 1; // 1~4명의 가상 동료 생성
    for(let i = 0; i < activeCount; i++) {
        const name = names[i];
        const color = colors[i];
        const initial = name.split(' ')[1].charAt(0);
        list.innerHTML += `<div class="user-avatar" style="background: ${color}" data-name="${name}">${initial}</div>`;
    }
}

// --- [Clock] 실시간 시간 표시 기능 ---
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
    // 현재 클릭한 것 외에 다른 열려있는 선택창 닫기
    document.querySelectorAll('.case-selector').forEach(el => {
        if(el.id !== selectorId) el.style.display = 'none';
    });
    
    const isHidden = getComputedStyle(selector).display === 'none';
    selector.style.display = isHidden ? 'flex' : 'none';
}

function applyIndividualPreset(targetFieldId, count) {
    const target = document.getElementById(targetFieldId);
    
    if (target.value.trim() && !confirm('해당 칸의 내용이 초기화되고 CASE 서식이 입력됩니다. 계속하시겠습니까?')) {
        return;
    }

    let presetText = "";
    for (let i = 1; i <= count; i++) {
        presetText += `CASE ${i}. \n\n`;
    }
    
    target.value = presetText.trim();
    
    // 서식 입력 후 선택창 자동 닫기
    document.querySelectorAll('.case-selector').forEach(el => el.style.display = 'none');
    
    generateTemplate(); // 본문 실시간 갱신
}

// --- [Storage] 로컬 데이터 핸들링 ---
function loadConfig() {
    let config = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!config) {
        // 구버전 호환성 체크 후 데이터 마이그레이션
        config = JSON.parse(localStorage.getItem('qa_config_v12')) || defaultConfig;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
    return config;
}

function saveSettings() {
    const getDevices = (id) => document.getElementById(id).value.split('\n').map(s => s.trim()).filter(Boolean);
    const data = {
        adminUrl: document.getElementById('set_admin_url').value,
        pcUrl: document.getElementById('set_pc_url').value,
        andDevices: getDevices('set_and_devices'),
        iosDevices: getDevices('set_ios_devices'),
        // 설정 화면에 버전 필드가 분리되지 않은 경우를 대비해 초기값 유지
        andVer: loadConfig().andVer || "",
        iosVer: loadConfig().iosVer || ""
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    syncEnvironmentByOS(); 
    handlePocChange();
    closeModal();
}

// --- [UI Control] 모달 및 플랫폼 제어 ---
function openModal() { document.getElementById('settingModal').style.display = 'flex'; }
function closeModal() { document.getElementById('settingModal').style.display = 'none'; }
function openChangelogModal() { document.getElementById('changelogModal').style.display = 'flex'; }
function closeChangelogModal() { document.getElementById('changelogModal').style.display = 'none'; }

// 모달 외부 클릭 시 닫기
window.onclick = function(event) { 
    if (event.target.classList.contains('modal-overlay')) {
        closeModal(); closeChangelogModal();
    }
}

function syncEnvironmentByOS() {
    const config = loadConfig();
    const osType = document.getElementById('osType').value;
    const andCol = document.getElementById('andDeviceCol');
    const iosCol = document.getElementById('iosDeviceCol');
    const andContainer = document.getElementById('andCheckboxes');
    const iosContainer = document.getElementById('iosCheckboxes');

    // 컨테이너 초기화
    andContainer.innerHTML = ''; 
    iosContainer.innerHTML = '';
    andCol.classList.remove('active'); 
    iosCol.classList.remove('active');

    // Android 필터링 및 렌더링
    if (osType.includes("Android")) {
        andCol.classList.add('active');
        if (config.andDevices.length > 0) {
            config.andDevices.forEach((dev, i) => {
                andContainer.innerHTML += `
                    <input type="checkbox" id="and_dev_${i}" class="pill-cb issue-device-cb" value="${dev}" onchange="generateTemplate()">
                    <label for="and_dev_${i}" class="pill-label">${dev}</label>`;
            });
        }
    }
    // iOS 필터링 및 렌더링
    if (osType.includes("iOS")) {
        iosCol.classList.add('active');
        if (config.iosDevices.length > 0) {
            config.iosDevices.forEach((dev, i) => {
                iosContainer.innerHTML += `
                    <input type="checkbox" id="ios_dev_${i}" class="pill-cb issue-device-cb" value="${dev}" onchange="generateTemplate()">
                    <label for="ios_dev_${i}" class="pill-label">${dev}</label>`;
            });
        }
    }

    // 버전 필드 자동 업데이트 (V16.4 슬래시 공백 로직 적용)
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

    if (isWeb) {
        document.getElementById('targetUrl').value = (poc === 'Admin') ? config.adminUrl : config.pcUrl;
    } else {
        syncEnvironmentByOS(); 
    }
    generateTemplate();
}

// --- [Core Engine] 이슈 템플릿 생성 ---
function generateTemplate() {
    const getValue = (id) => document.getElementById(id).value;
    const rawPoc = getValue('poc');
    
    // [V16.4] 슬래시 공백 분리 로직
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
    
    // 1. 제목(Title) 조립
    const title = `${envStr}${osStr}${pocStr}${critStr}${devStr}${accStr}${pageStr} ${getValue('title').trim()}`.trim();

    // 2. 본문(Description) 조립
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

// --- [Utils] 복사 및 초기화 ---
function copySpecific(id) {
    const el = document.getElementById(id);
    if (!el.value.trim()) return;
    el.select();
    document.execCommand('copy');
    alert('클립보드에 복사되었습니다.');
}

function copyAll() {
    const title = document.getElementById('outputTitle').value;
    const body = document.getElementById('outputBody').value;
    if (!title.trim() && !body.trim()) return;
    
    const combined = `${title}\n${body}`;
    const t = document.createElement("textarea");
    document.body.appendChild(t);
    t.value = combined; 
    t.select();
    document.execCommand("copy");
    document.body.removeChild(t);
    alert('전체 내용(제목+본문)이 복사되었습니다.');
}

function clearForm() {
    if(!confirm('작성 중인 내용을 초기화할까요?')) return;
    const targets = ['title', 'prefix_account', 'prefix_device', 'prefix_page', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'];
    targets.forEach(id => document.getElementById(id).value = '');
    document.getElementById('prefix_critical').value = '';
    
    // 개별 선택창 닫기
    document.querySelectorAll('.case-selector').forEach(el => el.style.display = 'none');
    generateTemplate();
}

// --- [Initialize] 시스템 기동 ---
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    initPresence();
    
    const config = loadConfig();
    if(config) {
        document.getElementById('set_admin_url').value = config.adminUrl || '';
        document.getElementById('set_pc_url').value = config.pcUrl || '';
        document.getElementById('set_and_devices').value = (config.andDevices || []).join('\n');
        document.getElementById('set_ios_devices').value = (config.iosDevices || []).join('\n');
    }
    
    syncEnvironmentByOS();
});
