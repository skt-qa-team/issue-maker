/**
 * 이슈틀 자동 생성기 - V17.0 Core Logic
 */

const defaultConfig = { andDevices: [], iosDevices: [], andVer: '', iosVer: '', adminUrl: '', pcUrl: '' };
const STORAGE_KEY = 'qa_system_config_master';

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

// --- [V17.0 핵심] 개별 필드 CASE 프리셋 로직 ---
function toggleCaseSelector(selectorId) {
    const selector = document.getElementById(selectorId);
    // 현재 열린 것 외에 다른 것들은 닫기 (UX 개선)
    document.querySelectorAll('.case-selector').forEach(el => {
        if(el.id !== selectorId) el.style.display = 'none';
    });
    
    const isHidden = getComputedStyle(selector).display === 'none';
    selector.style.display = isHidden ? 'flex' : 'none';
}

function applyIndividualPreset(targetFieldId, count) {
    const target = document.getElementById(targetFieldId);
    
    // 내용이 있을 경우 덮어씌울지 확인
    if (target.value.trim() && !confirm('해당 칸의 내용이 초기화되고 CASE 서식이 입력됩니다. 진행하시겠습니까?')) {
        return;
    }

    let presetText = "";
    for (let i = 1; i <= count; i++) {
        presetText += `CASE ${i}. \n\n`;
    }
    
    target.value = presetText.trim();
    
    // 서식 입력 후 선택창 닫기
    document.querySelectorAll('.case-selector').forEach(el => el.style.display = 'none');
    
    generateTemplate(); // 전체 결과 갱신
}

// --- [Storage] 데이터 핸들링 ---
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
    const data = {
        adminUrl: document.getElementById('set_admin_url').value,
        pcUrl: document.getElementById('set_pc_url').value,
        andDevices: getDevices('set_and_devices'),
        andVer: document.getElementById('set_and_ver').value,
        iosDevices: getDevices('set_ios_devices'),
        iosVer: document.getElementById('set_ios_ver').value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    syncEnvironmentByOS(); 
    handlePocChange();
    closeModal();
}

// --- [UI Control] 모달 및 폼 제어 ---
function openModal() { document.getElementById('settingModal').style.display = 'flex'; }
function closeModal() { document.getElementById('settingModal').style.display = 'none'; }
function openChangelogModal() { document.getElementById('changelogModal').style.display = 'flex'; }
function closeChangelogModal() { document.getElementById('changelogModal').style.display = 'none'; }

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

    andContainer.innerHTML = ''; iosContainer.innerHTML = '';
    andCol.classList.remove('active'); iosCol.classList.remove('active');

    if (osType.includes("Android")) {
        andCol.classList.add('active');
        if (config.andDevices.length > 0) {
            config.andDevices.forEach((dev, i) => {
                andContainer.innerHTML += `<input type="checkbox" id="and_dev_${i}" class="issue-device-cb pill-cb" value="${dev}" onchange="generateTemplate()"><label for="and_dev_${i}" class="pill-label">${dev}</label>`;
            });
        }
    }
    if (osType.includes("iOS")) {
        iosCol.classList.add('active');
        if (config.iosDevices.length > 0) {
            config.iosDevices.forEach((dev, i) => {
                iosContainer.innerHTML += `<input type="checkbox" id="ios_dev_${i}" class="issue-device-cb pill-cb" value="${dev}" onchange="generateTemplate()"><label for="ios_dev_${i}" class="pill-label">${dev}</label>`;
            });
        }
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
    const osGroup = document.getElementById('osGroup');
    const deviceGroup = document.getElementById('deviceGroup');
    const urlGroup = document.getElementById('urlGroup');
    const config = loadConfig();

    if (poc === 'Admin' || poc === 'PC Web') {
        osGroup.style.display = 'none'; deviceGroup.style.display = 'none';
        urlGroup.style.display = 'block';
        document.getElementById('targetUrl').value = (poc === 'Admin') ? config.adminUrl : config.pcUrl;
    } else {
        osGroup.style.display = 'block'; deviceGroup.style.display = 'block';
        urlGroup.style.display = 'none';
        syncEnvironmentByOS(); 
    }
    generateTemplate();
}

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
        envSection += `■ Device : ${checkedDevices || '(단말 미선택)'}\n■ 서버 : ${bodyServers}\n■ 버전 : ${getValue('appVersion')}`;
    }

    const prdRef = getValue('ref_prd').trim();
    const notes = getValue('ref_notes').trim();
    const refSection = (prdRef || notes) ? `\n\n[참고사항]\n${prdRef ? '1. 상용 재현 여부 : ' + prdRef + '\n' : ''}${notes}` : '';

    const body = `${envSection}\n\n[Pre-Condition]\n${getValue('preCondition')}\n\n[재현스텝]\n${getValue('steps')}\n\n[실행결과-문제현상]\n${getValue('actualResult')}\n\n[기대결과]\n${getValue('expectedResult')}${refSection}`;

    document.getElementById('outputTitle').value = title;
    document.getElementById('outputBody').value = body.trim();
}

function copySpecific(id) {
    const el = document.getElementById(id);
    if (!el.value.trim()) return;
    el.select();
    document.execCommand('copy');
    alert('복사되었습니다.');
}

function copyAll() {
    const title = document.getElementById('outputTitle').value;
    const body = document.getElementById('outputBody').value;
    if (!title.trim() && !body.trim()) return;
    const combined = `${title}\n${body}`;
    const t = document.createElement("textarea");
    document.body.appendChild(t);
    t.value = combined; t.select();
    document.execCommand("copy");
    document.body.removeChild(t);
    alert('전체 복사가 완료되었습니다!');
}

function clearForm() {
    if(!confirm('작성 내용을 초기화할까요?')) return;
    ['title', 'prefix_account', 'prefix_device', 'prefix_page', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('prefix_critical').value = '';
    // 서식 선택창들도 닫기
    document.querySelectorAll('.case-selector').forEach(el => el.style.display = 'none');
    generateTemplate();
}

document.addEventListener('DOMContentLoaded', () => {
    startClock();
    const config = loadConfig();
    if(config) {
        document.getElementById('set_admin_url').value = config.adminUrl || '';
        document.getElementById('set_pc_url').value = config.pcUrl || '';
        document.getElementById('set_and_devices').value = (config.andDevices || []).join('\n');
        document.getElementById('set_ios_devices').value = (config.iosDevices || []).join('\n');
        document.getElementById('set_and_ver').value = config.andVer || '';
        document.getElementById('set_ios_ver').value = config.iosVer || '';
    }
    syncEnvironmentByOS();
});
