/**
 * 이슈틀 자동 생성기 - V16.4 Core Logic
 */

const defaultConfig = { andDevices: [], iosDevices: [], andVer: '', iosVer: '', adminUrl: '', pcUrl: '' };
const STORAGE_KEY = 'qa_system_config_master';

// --- 환경 설정 및 데이터 로딩 ---
function loadConfig() {
    let config = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!config) {
        config = JSON.parse(localStorage.getItem('qa_config_v12')) || defaultConfig;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
    return config;
}

function openModal() { document.getElementById('settingModal').style.display = 'flex'; }
function closeModal() { document.getElementById('settingModal').style.display = 'none'; }
function openChangelogModal() { document.getElementById('changelogModal').style.display = 'flex'; }
function closeChangelogModal() { document.getElementById('changelogModal').style.display = 'none'; }

window.onclick = function(event) { 
    if (event.target.classList.contains('modal-overlay')) {
        closeModal();
        closeChangelogModal();
    }
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

// --- 플랫폼 및 POC 제어 로직 ---
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
    // 본문용 가이드라인: 입력 필드에 표시될 때도 공백 포함하여 시인성 확보
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
        document.getElementById('targetUrl').value = poc === 'Admin' ? config.adminUrl : config.pcUrl;
    } else {
        osGroup.style.display = 'block'; deviceGroup.style.display = 'block';
        urlGroup.style.display = 'none';
        syncEnvironmentByOS(); 
    }
    generateTemplate();
}

// --- 템플릿 생성 엔진 ---
function generateTemplate() {
    const getValue = (id) => document.getElementById(id).value;
    const rawPoc = getValue('poc');
    
    // [V16.4 핵심 로직] 영역별 슬래시 공백 처리 분리
    const serversArr = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    const titleServers = serversArr.join('/'); // 제목용: 공백 없음
    const bodyServers = serversArr.join(' / '); // 본문용: 공백 있음
    
    let rawEnv = titleServers.replace('PRD', '상용'); 
    const envStr = (rawEnv === 'STG' || !rawEnv) ? '' : `[${rawEnv}]`;
    const osStr = (rawPoc === 'Admin' || rawPoc === 'PC Web') ? '' : getValue('osType');
    const pocStr = (rawPoc === 'T 멤버십' || !rawPoc) ? '' : (rawPoc === 'PC Web' ? '[PC]' : `[${rawPoc}]`);
    
    const critStr = getValue('prefix_critical') ? `[${getValue('prefix_critical')}]` : '';
    const devStr = getValue('prefix_device').trim() ? `[${getValue('prefix_device').trim()}]` : '';
    const accStr = getValue('prefix_account').trim() ? `[${getValue('prefix_account').trim()}]` : '';
    const pageStr = getValue('prefix_page').trim() ? `[${getValue('prefix_page').trim()}]` : '';
    
    // [제목 (Title) 조립] 슬래시 공백 없음
    const title = `${envStr}${osStr}${pocStr}${critStr}${devStr}${accStr}${pageStr} ${getValue('title').trim()}`.trim();

    // [본문 (Body) 조립] 슬래시 공백 포함
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

    const body = `${envSection}\n\n[Pre-Condition]\n${getValue('preCondition')}\n\n[재현스텝]\n${getValue('steps')}\n\n[실행결과]\n${getValue('actualResult')}\n\n[기대결과]\n${getValue('expectedResult')}${refSection}`;

    document.getElementById('outputTitle').value = title;
    document.getElementById('outputBody').value = body.trim();
}

// --- 유틸리티 ---
function copySpecific(id) {
    const el = document.getElementById(id);
    if (!el.value.trim()) return alert('복사할 내용이 없습니다.');
    el.select();
    document.execCommand('copy');
    alert('복사되었습니다.');
}

function copyAll() {
    const title = document.getElementById('outputTitle').value;
    const body = document.getElementById('outputBody').value;
    if (!title.trim() && !body.trim()) return alert('복사할 내용이 없습니다.');
    
    const combined = `${title}\n${body}`;
    const t = document.createElement("textarea");
    document.body.appendChild(t);
    t.value = combined; t.select();
    document.execCommand("copy");
    document.body.removeChild(t);
    alert('전체 내용이 복사되었습니다.');
}

function clearForm() {
    if(!confirm('작성 중인 내용을 초기화할까요?')) return;
    ['title', 'prefix_account', 'prefix_device', 'prefix_page', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('prefix_critical').value = '';
    generateTemplate();
}

window.onload = function() {
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
};
