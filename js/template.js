let isInitialRender = true;

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

    const showAnd = (osType === "[Android/iOS]" || osType === "[Android]");
    const showIos = (osType === "[Android/iOS]" || osType === "[iOS]");

    if(andCol) showAnd ? andCol.classList.remove('d-none') : andCol.classList.add('d-none');
    if(iosCol) showIos ? iosCol.classList.remove('d-none') : iosCol.classList.add('d-none');
    if(iosVerToggle) showIos ? iosVerToggle.classList.remove('d-none') : iosVerToggle.classList.add('d-none');

    let claimedDevices = new Set();

    const render = (containerId, list, idPrefix) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        list.forEach(dev => {
            let isCheckedStr = '';
            if (currentSelected.includes(dev) && !claimedDevices.has(dev)) {
                isCheckedStr = 'checked';
                claimedDevices.add(dev);
            }
            container.innerHTML += `<input type="checkbox" id="${idPrefix}_${dev}" class="pill-cb issue-device-cb" value="${dev}" ${isCheckedStr} onchange="handleDeviceClick(this)"><label for="${idPrefix}_${dev}" class="pill-label">${dev}</label>`;
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

function handleDeviceClick(element) {
    if (element.checked) {
        const allChecked = Array.from(document.querySelectorAll('.issue-device-cb:checked'));
        const sameValueCount = allChecked.filter(cb => cb.value === element.value).length;
        if (sameValueCount > 1) {
            if (typeof showToast === 'function') showToast('이미 선택된 단말입니다.');
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
        if(normalList) normalList.classList.remove('d-none');
        if(specialList) specialList.classList.add('d-none');
    } else {
        if(specialList) specialList.classList.remove('d-none');
        if(normalList) normalList.classList.add('d-none');
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
    
    if(devGroup) isWeb ? devGroup.classList.add('d-none') : devGroup.classList.remove('d-none');
    if(urlGroup) isWeb ? urlGroup.classList.remove('d-none') : urlGroup.classList.add('d-none');
    
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
    
    const isWeb = poc === 'Admin' || poc === 'PC Web';
    let servers = [];
    let devices = "";
    
    servers = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    if (!isWeb) {
        let checkedDeviceCbs = Array.from(document.querySelectorAll('.issue-device-cb:checked'));
        if (os === "[Android]") {
            checkedDeviceCbs = checkedDeviceCbs.filter(cb => cb.id.startsWith('and_'));
        } else if (os === "[iOS]") {
            checkedDeviceCbs = checkedDeviceCbs.filter(cb => cb.id.startsWith('ios_'));
        }
        devices = checkedDeviceCbs.map(cb => cb.value).join(' / ');
    }

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

    if (typeof saveDraft === 'function') saveDraft();
}
