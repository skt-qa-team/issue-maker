const defaultConfig = { poc: 'T 멤버십', servers: ['STG'], andDevices: [], iosDevices: [], andVer: '', iosVer: '', adminUrl: '', pcUrl: '' };

const STORAGE_KEY = 'qa_system_config_master';

function loadConfig() {
    let config = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!config) {
        config = JSON.parse(localStorage.getItem('qa_config_v12')) || 
                 JSON.parse(localStorage.getItem('qa_config_v11')) || 
                 defaultConfig;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
    return config;
}

function openModal() { document.getElementById('settingModal').style.display = 'flex'; }
function closeModal() { document.getElementById('settingModal').style.display = 'none'; }
window.onclick = function(event) { if (event.target === document.getElementById('settingModal')) closeModal(); }

function saveSettings() {
    const getDevices = (id) => document.getElementById(id).value.split('\n').map(s => s.trim()).filter(Boolean);
    const getCheckedServers = () => Array.from(document.querySelectorAll('.set-server-cb:checked')).map(cb => cb.value);

    const data = {
        poc: document.getElementById('set_poc').value,
        servers: getCheckedServers(),
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

function syncEnvironmentByOS() {
    const config = loadConfig();
    const osType = document.getElementById('osType').value;
    
    document.getElementById('poc').value = config.poc || defaultConfig.poc;
    document.querySelectorAll('.issue-server-cb').forEach(cb => {
        if(config.servers) cb.checked = config.servers.includes(cb.value);
    });

    const andCol = document.getElementById('andDeviceCol');
    const iosCol = document.getElementById('iosDeviceCol');
    const andContainer = document.getElementById('andCheckboxes');
    const iosContainer = document.getElementById('iosCheckboxes');

    andContainer.innerHTML = ''; iosContainer.innerHTML = '';
    andCol.classList.remove('active'); iosCol.classList.remove('active');

    if (osType.includes("Android")) {
        andCol.classList.add('active');
        if (config.andDevices.length === 0) andContainer.innerHTML = '<span class="empty-msg">기기 없음</span>';
        else config.andDevices.forEach((dev, i) => {
            andContainer.innerHTML += `<input type="checkbox" id="and_dev_${i}" class="issue-device-cb pill-cb" value="${dev}" onchange="generateTemplate()"><label for="and_dev_${i}" class="pill-label and-pill">${dev}</label>`;
        });
    }
    if (osType.includes("iOS")) {
        iosCol.classList.add('active');
        if (config.iosDevices.length === 0) iosContainer.innerHTML = '<span class="empty-msg">기기 없음</span>';
        else config.iosDevices.forEach((dev, i) => {
            iosContainer.innerHTML += `<input type="checkbox" id="ios_dev_${i}" class="issue-device-cb pill-cb" value="${dev}" onchange="generateTemplate()"><label for="ios_dev_${i}" class="pill-label ios-pill">${dev}</label>`;
        });
    }

    let targetVer = "";
    if (osType === "[Android/iOS]") targetVer = [config.andVer, config.iosVer].filter(Boolean).join(' / ');
    else if (osType === "[Android]") targetVer = config.andVer;
    else if (osType === "[iOS]") targetVer = config.iosVer;
    document.getElementById('appVersion').value = targetVer;
}

function handlePocChange() {
    const poc = document.getElementById('poc').value;
    const osGroup = document.getElementById('osGroup');
    const deviceGroup = document.getElementById('deviceGroup');
    const appVersionGroup = document.getElementById('appVersionGroup');
    const appVersionLabel = document.getElementById('appVersionLabel');
    const urlGroup = document.getElementById('urlGroup');
    const urlLabel = document.getElementById('urlLabel');
    const targetUrl = document.getElementById('targetUrl');
    
    const config = loadConfig();

    if (poc === 'Admin') {
        osGroup.style.display = 'none'; deviceGroup.style.display = 'none'; appVersionGroup.style.display = 'none';
        urlGroup.style.display = 'block'; urlLabel.innerText = 'Admin URL'; targetUrl.value = config.adminUrl || '';
    } else if (poc === 'PC Web') {
        osGroup.style.display = 'none'; deviceGroup.style.display = 'none';
        appVersionGroup.style.display = 'block'; appVersionLabel.innerText = '브라우저 버전';
        urlGroup.style.display = 'block'; urlLabel.innerText = 'PC URL'; targetUrl.value = config.pcUrl || '';
    } else {
        osGroup.style.display = 'block'; deviceGroup.style.display = 'block';
        appVersionGroup.style.display = 'block'; appVersionLabel.innerText = '앱 버전';
        urlGroup.style.display = 'none';
        syncEnvironmentByOS(); 
    }
    generateTemplate();
}

function generateTemplate() {
    const getValue = (id) => document.getElementById(id).value;
    const rawPoc = getValue('poc');
    const checkedServers = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value).join(' / ');
    
    let rawEnv = checkedServers.replace('PRD', '상용'); 
    const envStr = (rawEnv === 'STG' || !rawEnv) ? '' : `[${rawEnv}]`;
    
    let osStr = getValue('osType'); 
    if (rawPoc === 'Admin' || rawPoc === 'PC Web') osStr = ''; 
    
    const mappedPoc = rawPoc === 'PC Web' ? 'PC' : rawPoc;
    const pocStr = (mappedPoc === 'T 멤버십' || !mappedPoc) ? '' : `[${mappedPoc}]`;
    
    const critStr = getValue('prefix_critical') ? `[${getValue('prefix_critical')}]` : '';
    const devPrefixStr = getValue('prefix_device').trim() ? `[${getValue('prefix_device').trim()}]` : '';
    const accStr = getValue('prefix_account').trim() ? `[${getValue('prefix_account').trim()}]` : '';
    const pageStr = getValue('prefix_page').trim() ? `[${getValue('prefix_page').trim()}]` : '';
    
    const smartTitle = `${envStr}${osStr}${pocStr}${critStr}${devPrefixStr}${accStr}${pageStr} ${getValue('title').trim()}`.trim();

    let envSection = `[Environment]\n`;
    if (rawPoc === 'Admin') {
        envSection += `■ POC : Admin\n■ 서버 : ${checkedServers || '(선택 안됨)'}\n■ Admin URL: ${getValue('targetUrl')}`;
    } else if (rawPoc === 'PC Web') {
        envSection += `■ POC : T 멤버십 Web\n■ 서버 : ${checkedServers || '(선택 안됨)'}\n■ 버전 : ${getValue('appVersion')}\n■ PC URL: ${getValue('targetUrl')}`;
    } else {
        const checkedDevices = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value).join(' / ');
        envSection += `■ POC : ${rawPoc}\n■ Device(OS Ver.) : ${checkedDevices || '(단말 선택 안됨)'}\n■ 서버 : ${checkedServers || '(선택 안됨)'}\n■ 버전 : ${getValue('appVersion')}`;
    }

    const prdRef = getValue('ref_prd').trim();
    const noteRef = getValue('ref_notes').trim();
    let refOutput = '';
    
    if (prdRef || noteRef) {
        if (prdRef) refOutput += `1. 상용 재현 여부 : ${prdRef}\n`;
        if (noteRef) refOutput += `${noteRef}`; 
    }

    const template = `${smartTitle}
${envSection}

[Pre-Condition]
${getValue('preCondition')}

[재현스텝]
${getValue('steps')}

[실행결과-문제현상]
${getValue('actualResult')}

[기대결과]
${getValue('expectedResult')}

[참고사항]
${refOutput.trim()}`;

    document.getElementById('outputArea').value = template;
}

// [개선된 부분] 환경과 단말기를 유지하는 클리어 로직
function clearForm() {
    if(!confirm('입력한 텍스트가 초기화됩니다. 새로 작성하시겠습니까?\n(선택한 환경 정보 및 단말기는 그대로 유지됩니다)')) return;
    
    // 1회성 텍스트 필드만 초기화
    const textInputs = ['title', 'prefix_account', 'prefix_device', 'prefix_page', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'];
    textInputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    
    document.getElementById('prefix_critical').value = '';
    
    // OS, POC, 서버, 디바이스 체크 상태는 건드리지 않음
    // 단, Admin/PC 환경일 경우 URL 입력창을 기본값으로 원복
    const config = loadConfig();
    const poc = document.getElementById('poc').value;
    if (poc === 'Admin') document.getElementById('targetUrl').value = config.adminUrl || '';
    if (poc === 'PC Web') document.getElementById('targetUrl').value = config.pcUrl || '';
    
    generateTemplate();
}

function copyToClipboard() {
    const outputText = document.getElementById('outputArea');
    if(!outputText.value) return alert('생성된 내용이 없습니다.');
    outputText.select();
    document.execCommand('copy');
    alert('클립보드에 복사되었습니다.');
}

window.onload = function() {
    const config = loadConfig(); 
    if(config) {
        document.getElementById('set_poc').value = config.poc || defaultConfig.poc;
        document.getElementById('set_admin_url').value = config.adminUrl || '';
        document.getElementById('set_pc_url').value = config.pcUrl || '';
        document.getElementById('set_and_devices').value = (config.andDevices || []).join('\n');
        document.getElementById('set_ios_devices').value = (config.iosDevices || []).join('\n');
        document.getElementById('set_and_ver').value = config.andVer || '';
        document.getElementById('set_ios_ver').value = config.iosVer || '';
        
        document.querySelectorAll('.set-server-cb').forEach(cb => {
            if(config.servers) cb.checked = config.servers.includes(cb.value);
        });
    }
    syncEnvironmentByOS();
    handlePocChange();
};
