let isInitialRender = true;

function escapeHTMLTemplate(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function updateVersionCheckboxesByOS() {
    const osEl = document.getElementById('osType');
    const pocEl = document.getElementById('poc');
    if (!osEl || !pocEl) return;
    
    const osType = osEl.value;
    const poc = pocEl.value;
    const isPureWeb = poc === 'Admin' || poc === 'PC Web';

    const cbAnd = document.getElementById('ver_cb_android');
    const cbIos = document.getElementById('ver_cb_ios');
    const cbSam = document.getElementById('ver_cb_samsung');
    const cbSaf = document.getElementById('ver_cb_safari');
    const cbChr = document.getElementById('ver_cb_chrome');
    const cbEdg = document.getElementById('ver_cb_edge');

    if (cbAnd) cbAnd.checked = false;
    if (cbIos) cbIos.checked = false;
    if (cbSam) cbSam.checked = false;
    if (cbSaf) cbSaf.checked = false;
    if (cbChr) cbChr.checked = false;
    if (cbEdg) cbEdg.checked = false;

    if (!isPureWeb) {
        if (osType === "Android/iOS" || osType === "모바일" || osType === "태블릿" || osType === "direct") {
            if (cbAnd) cbAnd.checked = true;
            if (cbIos) cbIos.checked = true;
        } else if (osType === "Android") {
            if (cbAnd) cbAnd.checked = true;
        } else if (osType === "iOS") {
            if (cbIos) cbIos.checked = true;
        }
    } else {
        if (cbChr) cbChr.checked = true; 
    }
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

    updateVersionCheckboxesByOS();

    const andCol = document.getElementById('andDeviceCol');
    const iosCol = document.getElementById('iosDeviceCol');
    const iosVerToggle = document.getElementById('ios-ver-toggle');

    const showAnd = (osType === "Android/iOS" || osType === "Android" || osType === "모바일" || osType === "태블릿" || osType === "direct");
    const showIos = (osType === "Android/iOS" || osType === "iOS" || osType === "모바일" || osType === "태블릿" || osType === "direct");

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
            
            const uniqueKey = `${idPrefix}_${dev}`;
            if (currentSelected.includes(dev) && !claimedDevices.has(uniqueKey)) {
                isCheckedStr = 'checked';
                claimedDevices.add(uniqueKey);
            }
            
            const safeDevName = escapeHTMLTemplate(dev);
            
            container.innerHTML += `<input type="checkbox" id="${idPrefix}_${safeDevName}" class="pill-cb issue-device-cb" value="${safeDevName}" ${isCheckedStr} onchange="handleDeviceClick(this)"><label for="${idPrefix}_${safeDevName}" class="pill-label">${safeDevName}</label>`;
        });
    };

    render('andNormalList', config.andDevices || [], 'and_n');
    render('andSpecialList', config.andSpecialDevices || [], 'and_s');
    render('iosNormalList', config.iosDevices || [], 'ios_n');
    render('iosSpecialList', config.iosSpecialDevices || [], 'ios_s');

    updateVersionTextbox();
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
    
    const isPureWeb = poc === 'Admin' || poc === 'PC Web';
    const needsUrl = poc === 'Admin' || poc === 'PC Web' || poc === 'PC M.Web';
    const isAI = poc === 'AI Layer';

    const devGroup = document.getElementById('deviceGroup');
    const urlGroup = document.getElementById('urlGroup');
    const aiModeGroup = document.getElementById('aiModeGroup');
    
    if(devGroup) isPureWeb ? devGroup.classList.add('d-none') : devGroup.classList.remove('d-none');
    if(urlGroup) needsUrl ? urlGroup.classList.remove('d-none') : urlGroup.classList.add('d-none');
    if(aiModeGroup) isAI ? aiModeGroup.style.display = 'block' : aiModeGroup.style.display = 'none';
    
    if (needsUrl) {
        const cfg = typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master')) || {};
        const targetUrl = document.getElementById('targetUrl');
        if(targetUrl) targetUrl.value = poc === 'Admin' ? (cfg.adminUrl || '') : (cfg.pcUrl || '');
    }
    
    updateVersionCheckboxesByOS();
    
    if (!isPureWeb) {
        syncEnvironmentByOS();
    } else {
        updateVersionTextbox();
        generateTemplate();
    }
}

function updateVersionTextbox() {
    const config = typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master')) || {};
    const checkedTypes = Array.from(document.querySelectorAll('.ver-type-cb:checked')).map(cb => cb.value);
    
    let versionParts = [];
    const iosTypeChecked = document.querySelector('input[name="ios_ver_type"]:checked');
    const iosMode = iosTypeChecked ? iosTypeChecked.value : 'TestFlight';

    checkedTypes.forEach(type => {
        if (type === 'Android') {
            versionParts.push(`App Tester_${config.andAppTester || ''}`);
        } else if (type === 'iOS') {
            versionParts.push(`${iosMode}_${(iosMode === 'TestFlight' ? (config.iosTestFlight || '') : (config.iosDistribution || ''))}`);
        } else if (type === '삼성 브라우저') {
            versionParts.push(`삼성 브라우저_${config.samsungBrowser || ''}`);
        } else if (type === 'Safari') {
            versionParts.push(`Safari_${config.safariBrowser || ''}`);
        } else if (type === '크롬') {
            versionParts.push(`크롬_${config.chromeBrowser || ''}`);
        } else if (type === 'Edge') {
            versionParts.push(`Edge_${config.edgeBrowser || ''}`);
        }
    });

    const verInput = document.getElementById('appVersion');
    if (verInput) verInput.value = versionParts.join(' / ');
}

function generateTemplate() {
    const getDropdownOrCustom = (dropdownId, customId) => {
        const el = document.getElementById(dropdownId);
        if (!el) return '';
        if (el.value === 'direct') {
            const customEl = document.getElementById(customId);
            return customEl ? customEl.value.trim() : '';
        }
        return el.value.trim();
    };

    const envVal = getDropdownOrCustom('prefix_env', 'prefix_env_custom');
    const osVal = getDropdownOrCustom('osType', 'osType_custom');
    const pocVal = getDropdownOrCustom('poc', 'poc_custom');
    const critVal = getDropdownOrCustom('prefix_critical', 'prefix_critical_custom');
    
    const pocDropdownVal = document.getElementById('poc')?.value || '';
    const osDropdownVal = document.getElementById('osType')?.value || '';
    
    const devVal = document.getElementById('prefix_device') ? document.getElementById('prefix_device').value.trim() : '';
    const accVal = document.getElementById('prefix_account') ? document.getElementById('prefix_account').value.trim() : '';
    const pageVal = document.getElementById('prefix_page') ? document.getElementById('prefix_page').value.trim() : '';
    const titleVal = document.getElementById('title') ? document.getElementById('title').value.trim() : '';

    const envPrefix = envVal ? `[${envVal}]` : '';
    const osPrefix = osVal ? `[${osVal}]` : '';
    const pocPrefix = (pocVal && pocVal !== 'T 멤버십') ? `[${pocVal}]` : '';
    const critPrefix = critVal ? `[${critVal}]` : '';
    const devPrefix = devVal ? `[${devVal}]` : '';
    const accPrefix = accVal ? `[${accVal}]` : '';
    const pagePrefix = pageVal ? `[${pageVal}]` : '';

    const titleText = `${envPrefix}${osPrefix}${pocPrefix}${critPrefix}${devPrefix}${accPrefix}${pagePrefix} ${titleVal}`.replace(/\s+/g, ' ').trim();

    const isPureWeb = pocDropdownVal === 'Admin' || pocDropdownVal === 'PC Web';
    let servers = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    let devices = "";
    
    if (!isPureWeb) {
        let activeDeviceLists = [];
        const andMode = document.querySelector('input[name="and_dev_mode"]:checked')?.value;
        const iosMode = document.querySelector('input[name="ios_dev_mode"]:checked')?.value;

        const showAnd = (osDropdownVal === "Android/iOS" || osDropdownVal === "Android" || osDropdownVal === "모바일" || osDropdownVal === "태블릿" || osDropdownVal === "direct");
        const showIos = (osDropdownVal === "Android/iOS" || osDropdownVal === "iOS" || osDropdownVal === "모바일" || osDropdownVal === "태블릿" || osDropdownVal === "direct");

        if (showAnd) {
            if (andMode === 'normal') activeDeviceLists.push(document.getElementById('andNormalList'));
            else activeDeviceLists.push(document.getElementById('andSpecialList'));
        }
        if (showIos) {
            if (iosMode === 'normal') activeDeviceLists.push(document.getElementById('iosNormalList'));
            else activeDeviceLists.push(document.getElementById('iosSpecialList'));
        }

        let checkedDeviceValues = [];
        activeDeviceLists.forEach(list => {
            if (list) {
                const checkedInList = Array.from(list.querySelectorAll('.issue-device-cb:checked'));
                checkedDeviceValues.push(...checkedInList.map(cb => cb.value));
            }
        });
        devices = checkedDeviceValues.join(' / ');
    }

    let ver = document.getElementById('appVersion') ? document.getElementById('appVersion').value : '';
    const searchEngines = Array.from(document.querySelectorAll('.ver-type-cb:checked'))
        .map(cb => cb.value)
        .filter(val => ['삼성 브라우저', 'Safari', '크롬', 'Edge'].includes(val))
        .join(' / ');

    let envSection = `[Environment]\n■ POC : ${pocVal}\n`;

    if (pocDropdownVal === 'PC Web') {
        if (searchEngines) envSection += `■ 검색 엔진 : ${searchEngines}\n`;
        envSection += `■ 서버 : ${servers.join(' / ')}\n■ 버전 : ${ver}\n■ URL : ${document.getElementById('targetUrl') ? document.getElementById('targetUrl').value : ''}`;
    } else if (pocDropdownVal === 'PC M.Web') {
        envSection += `■ Device : ${devices || '-'}\n`;
        if (searchEngines) envSection += `■ 검색 엔진 : ${searchEngines}\n`;
        envSection += `■ 서버 : ${servers.join(' / ')}\n■ 버전 : ${ver}\n■ URL : ${document.getElementById('targetUrl') ? document.getElementById('targetUrl').value : ''}`;
    } else if (pocDropdownVal === 'Admin') {
        envSection += `■ 서버 : ${servers.join(' / ')}\n■ URL : ${document.getElementById('targetUrl') ? document.getElementById('targetUrl').value : ''}`;
    } else {
        envSection += `■ Device : ${devices || '-'}\n■ 서버 : ${servers.join(' / ')}\n■ 버전 : ${ver}`;
        if (pocDropdownVal === 'AI Layer') {
            const aiModeVal = document.getElementById('aiMode') ? document.getElementById('aiMode').value : '';
            if (aiModeVal) {
                envSection += `\n■ 모드 : ${aiModeVal}`;
            }
        }
    }
    
    const prdRef = document.getElementById('ref_prd') ? document.getElementById('ref_prd').value.trim() : '';
    const notes = document.getElementById('ref_notes') ? document.getElementById('ref_notes').value.trim() : '';
    const refSection = (prdRef || notes) ? `\n\n[참고사항]\n${prdRef ? '1. 상용 재현 여부 : ' + prdRef + '\n' : ''}${notes}` : '';
    
    const preCondition = document.getElementById('preCondition') ? document.getElementById('preCondition').value : '';
    const steps = document.getElementById('steps') ? document.getElementById('steps').value : '';
    const actualResult = document.getElementById('actualResult') ? document.getElementById('actualResult').value : '';
    const expectedResult = document.getElementById('expectedResult') ? document.getElementById('expectedResult').value : '';

    const body = `${envSection}\n\n[Pre-Condition]\n${preCondition}\n\n[재현스텝]\n${steps}\n\n[실행결과-문제현상]\n${actualResult}\n\n[기대결과]\n${expectedResult}${refSection}`;
    
    const outTitle = document.getElementById('outputTitle');
    const outBody = document.getElementById('outputBody');
    if (outTitle) outTitle.value = titleText;
    if (outBody) outBody.value = body.trim();

    if (typeof saveDraft === 'function') saveDraft();
}
