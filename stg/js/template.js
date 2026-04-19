let isInitialRender = true;

const DEFAULT_PREFIX_ORDER = [
    { id: 'env', order: 1 },
    { id: 'os', order: 2 },
    { id: 'poc', order: 3 },
    { id: 'critical', order: 4 },
    { id: 'device', order: 5 },
    { id: 'account', order: 6 },
    { id: 'page', order: 7 }
];

window.escapeHTMLTemplate = (str) => {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

window.applyAndSavePrefixOrder = () => {
    const inputs = document.querySelectorAll('.prefix-order-input');
    let orderArray = [];

    inputs.forEach(input => {
        let val = parseInt(input.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > 7) val = 7;
        input.value = val;
        orderArray.push({ id: input.dataset.target, order: val });
    });

    orderArray.sort((a, b) => a.order - b.order);

    const container = document.getElementById('prefixContainer');
    if (container) {
        orderArray.forEach(item => {
            const el = container.querySelector(`.prefix-item[data-id="${item.id}"]`);
            if (el) container.appendChild(el);
        });
    }

    localStorage.setItem('qa_prefix_order_map_v3', JSON.stringify(orderArray));
    window.generateTemplate();
    if (typeof showToast === 'function') showToast('✅ Prefix 순서가 저장되었습니다.');
};

window.resetPrefixOrder = () => {
    localStorage.removeItem('qa_prefix_order_map_v3');
    
    document.querySelectorAll('.prefix-order-input').forEach(input => {
        const defaultItem = DEFAULT_PREFIX_ORDER.find(item => item.id === input.dataset.target);
        if (defaultItem) input.value = defaultItem.order;
    });

    const container = document.getElementById('prefixContainer');
    if (container) {
        DEFAULT_PREFIX_ORDER.forEach(item => {
            const el = container.querySelector(`.prefix-item[data-id="${item.id}"]`);
            if (el) container.appendChild(el);
        });
    }

    window.generateTemplate();
    if (typeof showToast === 'function') showToast('🔄 Prefix 순서가 초기화되었습니다.');
};

window.loadPrefixOrder = () => {
    const saved = localStorage.getItem('qa_prefix_order_map_v3');
    const container = document.getElementById('prefixContainer');
    if (!container) return;

    if (saved) {
        try {
            const orderArray = JSON.parse(saved);
            orderArray.forEach(item => {
                const input = document.querySelector(`.prefix-order-input[data-target="${item.id}"]`);
                if (input) input.value = item.order;
            });

            orderArray.sort((a, b) => a.order - b.order).forEach(item => {
                const el = container.querySelector(`.prefix-item[data-id="${item.id}"]`);
                if (el) container.appendChild(el);
            });
        } catch (e) {
            window.resetPrefixOrder();
        }
    } else {
        window.resetPrefixOrder();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof window.loadPrefixOrder === 'function') window.loadPrefixOrder();
    }, 500);
});

window.updateVersionCheckboxesByOS = () => {
    const osEl = document.getElementById('osType');
    const pocEl = document.getElementById('poc');
    if (!osEl || !pocEl) return;
    
    const osType = osEl.value;
    const poc = pocEl.value;
    const isPureWeb = poc === 'Admin' || poc === 'PC Web';

    const cbList = ['ver_cb_android', 'ver_cb_ios', 'ver_cb_samsung', 'ver_cb_safari', 'ver_cb_chrome', 'ver_cb_edge'];
    cbList.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });

    if (!isPureWeb) {
        const multiOs = ["Android/iOS", "Android", "iOS", "모바일", "태블릿", "모바일/태블릿", "direct"];
        if (multiOs.includes(osType)) {
            if (document.getElementById('ver_cb_android')) document.getElementById('ver_cb_android').checked = true;
            if (document.getElementById('ver_cb_ios')) document.getElementById('ver_cb_ios').checked = true;
        } else if (osType === "Android") {
            if (document.getElementById('ver_cb_android')) document.getElementById('ver_cb_android').checked = true;
        } else if (osType === "iOS") {
            if (document.getElementById('ver_cb_ios')) document.getElementById('ver_cb_ios').checked = true;
        }
    } else {
        if (document.getElementById('ver_cb_chrome')) document.getElementById('ver_cb_chrome').checked = true; 
    }
};

window.syncEnvironmentByOS = () => {
    const rawConfig = localStorage.getItem('qa_system_config_master');
    const config = rawConfig ? JSON.parse(rawConfig) : {
        andDevices: ["S21", "S22", "Fold4"],
        iosDevices: ["iPhone 13", "iPhone 14"],
        andDefaultDevices: ["S21"],
        iosDefaultDevices: ["iPhone 13"]
    };

    const osEl = document.getElementById('osType');
    if (!osEl) return;
    const osType = osEl.value;
    
    let currentSelected = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);

    if (isInitialRender || currentSelected.length === 0) {
        currentSelected = [...(config.andDefaultDevices || []), ...(config.iosDefaultDevices || [])];
        isInitialRender = false;
    }

    window.updateVersionCheckboxesByOS();

    const andCol = document.getElementById('andDeviceCol');
    const iosCol = document.getElementById('iosDeviceCol');
    const iosVerToggle = document.getElementById('ios-ver-toggle');

    const osGroup = ["Android/iOS", "Android", "iOS", "모바일", "태블릿", "모바일/태블릿", "direct"];
    const showAnd = (osType === "Android/iOS" || osType === "Android" || osGroup.slice(3).includes(osType));
    const showIos = (osType === "Android/iOS" || osType === "iOS" || osGroup.slice(3).includes(osType));

    if(andCol) andCol.classList.toggle('d-none', !showAnd);
    if(iosCol) iosCol.classList.toggle('d-none', !showIos);
    if(iosVerToggle) iosVerToggle.classList.toggle('d-none', !showIos);

    const render = (containerId, list, idPrefix) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        let html = '';
        list.forEach(dev => {
            const safeDevName = window.escapeHTMLTemplate(dev);
            const domId = `${idPrefix}_${safeDevName.replace(/\s+/g, '_')}`;
            const isChecked = currentSelected.includes(dev) ? 'checked' : '';
            html += `<input type="checkbox" id="${domId}" class="pill-cb issue-device-cb" value="${safeDevName}" ${isChecked} onchange="handleDeviceClick(this)"><label for="${domId}" class="pill-label">${safeDevName}</label>`;
        });
        container.innerHTML = html;
    };

    render('andNormalList', config.andDevices || [], 'and_n');
    render('andSpecialList', config.andSpecialDevices || [], 'and_s');
    render('iosNormalList', config.iosDevices || [], 'ios_n');
    render('iosSpecialList', config.iosSpecialDevices || [], 'ios_s');

    window.updateVersionTextbox();
    window.generateTemplate();
};

window.handleDeviceClick = (element) => {
    if (element.checked) {
        const sameValueCount = Array.from(document.querySelectorAll('.issue-device-cb:checked'))
            .filter(cb => cb.value === element.value).length;
        if (sameValueCount > 1) {
            if (typeof showToast === 'function') showToast('⚠️ 이미 선택된 단말입니다.');
            element.checked = false;
            return;
        }
    }

    const andChecked = document.querySelectorAll('#andDeviceCol .issue-device-cb:checked').length > 0;
    const iosChecked = document.querySelectorAll('#iosDeviceCol .issue-device-cb:checked').length > 0;
    
    const cbAnd = document.getElementById('ver_cb_android');
    const cbIos = document.getElementById('ver_cb_ios');
    if (cbAnd) cbAnd.checked = andChecked;
    if (cbIos) cbIos.checked = iosChecked;

    window.updateVersionTextbox();
    window.generateTemplate();
};

window.syncDeviceFromVersion = (platform) => {
    const cb = document.getElementById(platform === 'and' ? 'ver_cb_android' : 'ver_cb_ios');
    if (!cb) return;
    const col = document.getElementById(`${platform}DeviceCol`);
    
    if (col) {
        if (!cb.checked) {
            col.querySelectorAll('.issue-device-cb').forEach(box => box.checked = false);
        } else {
            const checkedCount = col.querySelectorAll('.issue-device-cb:checked').length;
            if (checkedCount === 0) {
                const modeEl = document.querySelector(`input[name="${platform}_dev_mode"]:checked`);
                const mode = modeEl ? modeEl.value : 'normal';
                const activeList = document.getElementById(`${platform}${mode === 'normal' ? 'Normal' : 'Special'}List`);
                if (activeList) {
                    const firstCb = activeList.querySelector('.issue-device-cb');
                    if (firstCb) firstCb.checked = true;
                }
            }
        }
    }
};

window.toggleDeviceMode = (platform) => {
    const modeEl = document.querySelector(`input[name="${platform}_dev_mode"]:checked`);
    if(!modeEl) return;
    const mode = modeEl.value;
    const normalList = document.getElementById(`${platform}NormalList`);
    const specialList = document.getElementById(`${platform}SpecialList`);
    
    if(normalList) normalList.classList.toggle('d-none', mode !== 'normal');
    if(specialList) specialList.classList.toggle('d-none', mode === 'normal');
    window.generateTemplate(); 
};

window.handlePocChange = () => {
    const pocEl = document.getElementById('poc');
    if(!pocEl) return;
    const poc = pocEl.value;
    
    const isPureWeb = poc === 'Admin' || poc === 'PC Web';
    const needsUrl = poc === 'Admin' || poc === 'PC Web' || poc === 'PC M.Web';
    const isAI = poc === 'AI Layer';

    const groups = {
        'deviceGroup': !isPureWeb,
        'urlGroup': needsUrl,
        'aiModeGroup': isAI
    };

    Object.entries(groups).forEach(([id, show]) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('d-none', !show);
    });
    
    if (needsUrl) {
        const cfg = typeof window.loadConfig === 'function' ? window.loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master')) || {};
        const targetUrl = document.getElementById('targetUrl');
        if(targetUrl) targetUrl.value = poc === 'Admin' ? (cfg.adminUrl || '') : (cfg.pcUrl || '');
    }
    
    window.updateVersionCheckboxesByOS();
    
    if (!isPureWeb) window.syncEnvironmentByOS();
    else {
        window.updateVersionTextbox();
        window.generateTemplate();
    }
};

window.updateVersionTextbox = () => {
    const config = typeof window.loadConfig === 'function' ? window.loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master')) || {};
    const checkedTypes = Array.from(document.querySelectorAll('.ver-type-cb:checked')).map(cb => cb.value);
    
    let versionParts = [];
    const iosTypeChecked = document.querySelector('input[name="ios_ver_type"]:checked');
    const iosMode = iosTypeChecked ? iosTypeChecked.value : 'TestFlight';

    checkedTypes.forEach(type => {
        if (type === 'Android') versionParts.push(`App Tester_${config.andAppTester || ''}`);
        else if (type === 'iOS') versionParts.push(`${iosMode}_${(iosMode === 'TestFlight' ? (config.iosTestFlight || '') : (config.iosDistribution || ''))}`);
        else if (type === '삼성인터넷') versionParts.push(`삼성인터넷_${config.samsungBrowser || ''}`);
        else if (type === 'Safari') versionParts.push(`Safari_${config.safariBrowser || ''}`);
        else if (type === 'Chrome') versionParts.push(`Chrome_${config.chromeBrowser || ''}`);
        else if (type === 'Edge') versionParts.push(`Edge_${config.edgeBrowser || ''}`);
    });

    const verInput = document.getElementById('appVersion');
    if (verInput) verInput.value = versionParts.join(' / ');
};

window.generateTemplate = () => {
    const getDropdownOrCustom = (dropdownId, customId) => {
        const el = document.getElementById(dropdownId);
        if (!el) return '';
        if (el.value === 'direct') {
            const customEl = document.getElementById(customId);
            return customEl ? customEl.value.trim() : '';
        }
        return el.value.trim();
    };

    let prefixMap = { 'env': '', 'os': '', 'poc': '', 'critical': '', 'device': '', 'account': '', 'page': '' };

    const envVal = getDropdownOrCustom('prefix_env', 'prefix_env_custom');
    if (envVal) prefixMap['env'] = `[${envVal}]`;

    const osVal = getDropdownOrCustom('osType', 'osType_custom');
    if (osVal) prefixMap['os'] = `[${osVal}]`;

    let pocVal = getDropdownOrCustom('poc', 'poc_custom');
    if (pocVal === 'PC M.Web') pocVal = 'PCWeb';
    if (pocVal && pocVal !== 'T 멤버십') prefixMap['poc'] = `[${pocVal}]`;

    const critVal = getDropdownOrCustom('prefix_critical', 'prefix_critical_custom');
    if (critVal) prefixMap['critical'] = `[${critVal}]`;

    let deviceVal = '';
    const browserNone = document.getElementById('prefix_browser_none');
    if (!browserNone || !browserNone.checked) {
        let browserVals = [];
        document.querySelectorAll('.prefix-browser-cb:checked').forEach(cb => {
            if (cb.value === '기타') {
                const custom = document.getElementById('prefix_browser_custom')?.value.trim();
                if (custom) browserVals.push(custom);
            } else browserVals.push(cb.value);
        });
        if (browserVals.length > 0) deviceVal = browserVals.join('/');
    } else deviceVal = document.getElementById('prefix_device_input')?.value.trim() || '';
    if (deviceVal) prefixMap['device'] = `[${deviceVal}]`;

    const accVal = document.getElementById('prefix_account')?.value.trim() || '';
    if (accVal) prefixMap['account'] = `[${accVal}]`;

    const pageVal = document.getElementById('prefix_page')?.value.trim() || '';
    if (pageVal) prefixMap['page'] = `[${pageVal}]`;

    const container = document.getElementById('prefixContainer');
    let orderedPrefixString = '';
    
    if (container) {
        const items = Array.from(container.querySelectorAll('.prefix-item'));
        items.sort((a, b) => {
            const orderA = parseInt(a.querySelector('.prefix-order-input')?.value || 99);
            const orderB = parseInt(b.querySelector('.prefix-order-input')?.value || 99);
            return orderA - orderB;
        });

        items.forEach(item => {
            const id = item.dataset.id;
            if (prefixMap[id]) orderedPrefixString += prefixMap[id];
        });
    }

    const titleVal = document.getElementById('title')?.value.trim() || '';
    const titleText = `${orderedPrefixString} ${titleVal}`.replace(/\s+/g, ' ').trim();

    const pocDropdownVal = document.getElementById('poc')?.value || '';
    const osDropdownVal = document.getElementById('osType')?.value || '';
    const isPureWeb = pocDropdownVal === 'Admin' || pocDropdownVal === 'PC Web';
    let servers = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    let devices = "";
    
    if (!isPureWeb) {
        let activeDeviceLists = [];
        const andMode = document.querySelector('input[name="and_dev_mode"]:checked')?.value;
        const iosMode = document.querySelector('input[name="ios_ver_type"]:checked')?.value;
        const osGroup = ["Android/iOS", "Android", "iOS", "모바일", "태블릿", "모바일/태블릿", "direct"];
        const showAnd = (osDropdownVal === "Android/iOS" || osDropdownVal === "Android" || osGroup.slice(3).includes(osDropdownVal));
        const showIos = (osDropdownVal === "Android/iOS" || osDropdownVal === "iOS" || osGroup.slice(3).includes(osDropdownVal));

        if (showAnd) activeDeviceLists.push(document.getElementById(`and${andMode === 'normal' ? 'Normal' : 'Special'}List`));
        if (showIos) activeDeviceLists.push(document.getElementById(`iosNormalList`)); 

        let checkedDeviceValues = [];
        activeDeviceLists.forEach(list => {
            if (list) {
                const checkedInList = Array.from(list.querySelectorAll('.issue-device-cb:checked'));
                checkedDeviceValues.push(...checkedInList.map(cb => cb.value));
            }
        });
        devices = checkedDeviceValues.join(' / ');
    }

    let ver = document.getElementById('appVersion')?.value || '';
    const searchEngines = Array.from(document.querySelectorAll('.ver-type-cb:checked'))
        .map(cb => cb.value)
        .filter(val => ['삼성인터넷', 'Safari', 'Chrome', 'Edge'].includes(val))
        .join(' / ');

    let envSection = `[Environment]\n■ POC : ${pocDropdownVal === 'PC M.Web' ? 'PC M.Web' : pocDropdownVal === 'direct' ? document.getElementById('poc_custom')?.value.trim() : pocDropdownVal}\n`;

    if (pocDropdownVal === 'PC Web') {
        if (searchEngines) envSection += `■ 검색 엔진 : ${searchEngines}\n`;
        envSection += `■ 서버 : ${servers.join(' / ')}\n■ 버전 : ${ver}\n■ URL : ${document.getElementById('targetUrl')?.value || ''}`;
    } else if (pocDropdownVal === 'PC M.Web') {
        envSection += `■ Device : ${devices || '-'}\n`;
        if (searchEngines) envSection += `■ 검색 엔진 : ${searchEngines}\n`;
        envSection += `■ 서버 : ${servers.join(' / ')}\n■ 버전 : ${ver}\n■ URL : ${document.getElementById('targetUrl')?.value || ''}`;
    } else if (pocDropdownVal === 'Admin') {
        envSection += `■ 서버 : ${servers.join(' / ')}\n■ URL : ${document.getElementById('targetUrl')?.value || ''}`;
    } else {
        envSection += `■ Device : ${devices || '-'}\n■ 서버 : ${servers.join(' / ')}\n■ 버전 : ${ver}`;
        if (pocDropdownVal === 'AI Layer') {
            const aiModeVal = document.getElementById('aiMode')?.value || '';
            if (aiModeVal) envSection += `\n■ 모드 : ${aiModeVal}`;
        }
    }
    
    const prdRef = document.getElementById('ref_prd')?.value.trim() || '';
    const notes = document.getElementById('ref_notes')?.value.trim() || '';
    const refSection = (prdRef || notes) ? `\n\n[참고사항]\n${prdRef ? '1. 상용 재현 여부 : ' + prdRef + '\n' : ''}${notes}` : '';
    
    const getVal = id => document.getElementById(id)?.value || '';
    const body = `${envSection}\n\n[Pre-Condition]\n${getVal('preCondition')}\n\n[재현스텝]\n${getVal('steps')}\n\n[실행결과-문제현상]\n${getVal('actualResult')}\n\n[기대결과]\n${getVal('expectedResult')}${refSection}`;
    
    const outTitle = document.getElementById('outputTitle');
    const outBody = document.getElementById('outputBody');
    if (outTitle) outTitle.value = titleText;
    if (outBody) outBody.value = body.trim();

    if (typeof window.saveDraft === 'function') window.saveDraft();
};
