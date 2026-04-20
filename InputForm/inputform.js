window.isInitialRender = true;

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

// ==========================================
// [추가] ui.js에서 이관된 폼 클리어 및 Case 추가 로직
// ==========================================
window.clearForm = () => {
    if (confirm('모든 입력 내용을 초기화하시겠습니까?')) {
        const fields = [
            'title', 'prefix_env_custom', 'osType_custom', 'poc_custom', 
            'prefix_critical_custom', 'prefix_browser_custom', 'prefix_device_input',
            'prefix_account', 'prefix_page', 'targetUrl', 'preCondition', 
            'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'
        ];
        
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        if (typeof window.generateTemplate === 'function') window.generateTemplate();
        if (typeof window.showToast === 'function') window.showToast('🔄 초기화되었습니다.');
    }
};

window.addCase = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const match = el.value.match(/CASE (\d+)/g);
    let nextNum = 1;
    if (match) {
        const lastCase = match[match.length - 1];
        nextNum = parseInt(lastCase.replace('CASE ', '')) + 1;
    }
    const prefix = el.value.trim() === '' ? '' : '\n\n';
    el.value += `${prefix}CASE ${nextNum}.\n`;
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
    el.focus();
};

window.applyIndividualPreset = (id, count) => {
    const el = document.getElementById(id);
    if (!el) return;
    let text = '';
    for (let i = 1; i <= count; i++) {
        text += `CASE ${i}.\n${i < count ? '\n' : ''}`;
    }
    el.value = text;
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
    el.focus();
};

// ==========================================
// Draft (임시 저장) 로직
// ==========================================
window.saveDraft = () => {
    const fields = ['title', 'prefix_env', 'prefix_env_custom', 'osType', 'osType_custom', 'poc', 'poc_custom', 'prefix_critical', 'prefix_critical_custom', 'prefix_device_input', 'prefix_account', 'prefix_page', 'appVersion', 'targetUrl', 'aiMode', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'];
    const data = {};
    
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) data[id] = el.value;
    });

    data.selectedDevices = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);
    data.selectedServers = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    data.selectedVerCbs = Array.from(document.querySelectorAll('.ver-type-cb:checked')).map(cb => cb.id);

    localStorage.setItem('skm_draft', JSON.stringify(data));
};

window.loadDraft = () => {
    const raw = localStorage.getItem('skm_draft');
    if (!raw) return;
    
    try {
        const data = JSON.parse(raw);
        
        Object.entries(data).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el && !['selectedDevices', 'selectedServers', 'selectedVerCbs'].includes(id)) {
                el.value = val;
                if (id.includes('_custom')) {
                    const baseId = id.replace('_custom', '');
                    const baseEl = document.getElementById(baseId);
                    if (baseEl && baseEl.value === 'direct') el.classList.remove('d-none');
                }
            }
        });

        if (data.selectedVerCbs) data.selectedVerCbs.forEach(id => { const cb = document.getElementById(id); if (cb) cb.checked = true; });
        if (data.selectedServers) document.querySelectorAll('.issue-server-cb').forEach(cb => cb.checked = data.selectedServers.includes(cb.value));

        if (typeof window.syncEnvironmentByOS === 'function') window.syncEnvironmentByOS();

        if (data.selectedDevices) {
            setTimeout(() => {
                data.selectedDevices.forEach(dev => {
                    const cb = document.querySelector(`.issue-device-cb[value="${dev}"]`);
                    if (cb) cb.checked = true;
                });
                if (typeof window.generateTemplate === 'function') window.generateTemplate();
            }, 100);
        }
    } catch (e) {
        console.error("Draft Load Error:", e);
    }
};

// ==========================================
// Prefix 제어 로직
// ==========================================
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
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
    if (typeof window.showToast === 'function') window.showToast('✅ Prefix 순서가 저장되었습니다.');
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

    if (typeof window.generateTemplate === 'function') window.generateTemplate();
    if (typeof window.showToast === 'function') window.showToast('🔄 Prefix 순서가 초기화되었습니다.');
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
        } catch (e) { window.resetPrefixOrder(); }
    } else { window.resetPrefixOrder(); }
};

// ==========================================
// 프리셋 관리 로직
// ==========================================
window.getFormDataForPreset = () => {
    return {
        title: document.getElementById('title')?.value || '',
        prefix_env: document.getElementById('prefix_env')?.value || '',
        prefix_env_custom: document.getElementById('prefix_env_custom')?.value || '',
        osType: document.getElementById('osType')?.value || '',
        osType_custom: document.getElementById('osType_custom')?.value || '',
        poc: document.getElementById('poc')?.value || '',
        poc_custom: document.getElementById('poc_custom')?.value || '',
        prefix_critical: document.getElementById('prefix_critical')?.value || '',
        prefix_critical_custom: document.getElementById('prefix_critical_custom')?.value || '',
        prefix_browser_none: document.getElementById('prefix_browser_none')?.checked || false,
        prefix_browser_custom: document.getElementById('prefix_browser_custom')?.value || '',
        prefix_device_input: document.getElementById('prefix_device_input')?.value || '',
        prefix_account: document.getElementById('prefix_account')?.value || '',
        prefix_page: document.getElementById('prefix_page')?.value || '',
        targetUrl: document.getElementById('targetUrl')?.value || '',
        aiMode: document.getElementById('aiMode')?.value || '',
        preCondition: document.getElementById('preCondition')?.value || '',
        steps: document.getElementById('steps')?.value || '',
        actualResult: document.getElementById('actualResult')?.value || '',
        expectedResult: document.getElementById('expectedResult')?.value || '',
        ref_prd: document.getElementById('ref_prd')?.value || '',
        ref_notes: document.getElementById('ref_notes')?.value || '',
        servers: Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(e => e.value),
        devices: Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(e => e.value),
        browsers: Array.from(document.querySelectorAll('.prefix-browser-cb:checked')).map(e => e.value),
        versions: Array.from(document.querySelectorAll('.ver-type-cb:checked')).map(e => e.value),
        and_dev_mode: document.querySelector('input[name="and_dev_mode"]:checked')?.value || 'normal',
        ios_dev_mode: document.querySelector('input[name="ios_dev_mode"]:checked')?.value || 'normal',
        ios_ver_type: document.querySelector('input[name="ios_ver_type"]:checked')?.value || 'TestFlight'
    };
};

window.renderInputPresets = () => {
    const presets = JSON.parse(localStorage.getItem('qa_input_presets') || '{}');
    const selectEl = document.getElementById('inputPresetSelect');
    if (!selectEl) return;
    
    const currentVal = selectEl.value;
    let html = '<option value="">💾 프리셋 선택...</option>';
    
    Object.keys(presets).forEach(name => {
        html += `<option value="${window.escapeHTMLTemplate(name)}">${window.escapeHTMLTemplate(name)}</option>`;
    });
    
    selectEl.innerHTML = html;
    
    if (presets[currentVal]) {
        selectEl.value = currentVal;
    } else {
        selectEl.value = '';
        const editBtn = document.getElementById('btnEditPreset');
        if(editBtn) editBtn.classList.add('d-none');
    }
};

window.handlePresetDropdownChange = () => {
    const selectEl = document.getElementById('inputPresetSelect');
    const editBtn = document.getElementById('btnEditPreset');
    if (!selectEl) return;
    
    const name = selectEl.value;
    if (name) {
        if (editBtn) editBtn.classList.remove('d-none');
        window.applyInputPreset(name);
    } else {
        if (editBtn) editBtn.classList.add('d-none');
    }
};

window.saveInputPreset = () => {
    const nameInput = document.getElementById('newPresetName');
    const name = nameInput ? nameInput.value.trim() : '';
    
    if (!name) return window.showToast?.('⚠️ 프리셋 이름을 입력해주세요.');
    
    let presets = JSON.parse(localStorage.getItem('qa_input_presets') || '{}');
    if (Object.keys(presets).length >= 10 && !presets[name]) return window.showToast?.('⚠️ 프리셋은 최대 10개까지만 저장 가능합니다.');

    presets[name] = window.getFormDataForPreset();
    localStorage.setItem('qa_input_presets', JSON.stringify(presets));
    
    if (nameInput) nameInput.value = '';
    window.renderInputPresets();
    
    const selectEl = document.getElementById('inputPresetSelect');
    if (selectEl) {
        selectEl.value = name;
        window.handlePresetDropdownChange();
    }
    
    window.showToast?.('✅ 프리셋이 저장되었습니다.');
};

window.editInputPreset = () => {
    const selectEl = document.getElementById('inputPresetSelect');
    if (!selectEl || !selectEl.value) return window.showToast?.('⚠️ 수정할 프리셋을 선택해주세요.');
    
    const name = selectEl.value;
    let presets = JSON.parse(localStorage.getItem('qa_input_presets') || '{}');
    presets[name] = window.getFormDataForPreset();
    localStorage.setItem('qa_input_presets', JSON.stringify(presets));
    
    window.showToast?.(`✏️ '${name}' 프리셋이 수정되었습니다.`);
};

window.deleteInputPreset = () => {
    const selectEl = document.getElementById('inputPresetSelect');
    if (!selectEl || !selectEl.value) return window.showToast?.('⚠️ 삭제할 프리셋을 선택해주세요.');
    
    const name = selectEl.value;
    let presets = JSON.parse(localStorage.getItem('qa_input_presets') || '{}');
    delete presets[name];
    localStorage.setItem('qa_input_presets', JSON.stringify(presets));
    
    selectEl.value = '';
    window.handlePresetDropdownChange();
    window.renderInputPresets();
    
    window.showToast?.('🗑️ 프리셋이 삭제되었습니다.');
};

window.applyInputPreset = (name) => {
    const presets = JSON.parse(localStorage.getItem('qa_input_presets') || '{}');
    const data = presets[name];
    if (!data) return;

    window.isInitialRender = false;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const setCheck = (id, checked) => { const el = document.getElementById(id); if (el) el.checked = checked; };
    const toggleDnone = (id, isCustom) => { const el = document.getElementById(id); if (el) el.classList.toggle('d-none', !isCustom); };

    setVal('title', data.title);
    setVal('prefix_env', data.prefix_env);
    setVal('prefix_env_custom', data.prefix_env_custom);
    setVal('osType', data.osType);
    setVal('osType_custom', data.osType_custom);
    setVal('poc', data.poc);
    setVal('poc_custom', data.poc_custom);
    setVal('prefix_critical', data.prefix_critical);
    setVal('prefix_critical_custom', data.prefix_critical_custom);
    setCheck('prefix_browser_none', data.prefix_browser_none);
    setVal('prefix_browser_custom', data.prefix_browser_custom);
    setVal('prefix_device_input', data.prefix_device_input);
    setVal('prefix_account', data.prefix_account);
    setVal('prefix_page', data.prefix_page);
    setVal('targetUrl', data.targetUrl);
    setVal('aiMode', data.aiMode);
    setVal('preCondition', data.preCondition);
    setVal('steps', data.steps);
    setVal('actualResult', data.actualResult);
    setVal('expectedResult', data.expectedResult);
    setVal('ref_prd', data.ref_prd);
    setVal('ref_notes', data.ref_notes);

    document.querySelectorAll('.issue-server-cb').forEach(cb => cb.checked = data.servers?.includes(cb.value));
    document.querySelectorAll('.prefix-browser-cb').forEach(cb => cb.checked = data.browsers?.includes(cb.value));

    const andModeEl = document.querySelector(`input[name="and_dev_mode"][value="${data.and_dev_mode}"]`);
    if (andModeEl) andModeEl.checked = true;
    const iosModeEl = document.querySelector(`input[name="ios_dev_mode"][value="${data.ios_dev_mode}"]`);
    if (iosModeEl) iosModeEl.checked = true;
    const iosVerEl = document.querySelector(`input[name="ios_ver_type"][value="${data.ios_ver_type}"]`);
    if (iosVerEl) iosVerEl.checked = true;

    toggleDnone('prefix_env_custom', data.prefix_env === 'direct');
    toggleDnone('osType_custom', data.osType === 'direct');
    toggleDnone('poc_custom', data.poc === 'direct');
    toggleDnone('prefix_critical_custom', data.prefix_critical === 'direct');

    const browserCustomEl = document.getElementById('prefix_browser_custom');
    if (browserCustomEl) browserCustomEl.classList.toggle('d-none', !data.browsers?.includes('기타'));

    const deviceInputEl = document.getElementById('prefix_device_input');
    if (deviceInputEl) deviceInputEl.classList.toggle('d-none', !data.prefix_browser_none);

    window.toggleDeviceMode('and');
    window.toggleDeviceMode('ios');
    window.handlePocChange();
    window.syncEnvironmentByOS();

    document.querySelectorAll('.issue-device-cb').forEach(cb => { cb.checked = data.devices?.includes(cb.value); });
    document.querySelectorAll('.ver-type-cb').forEach(cb => cb.checked = data.versions?.includes(cb.value));

    window.updateVersionTextbox();
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
};

// ==========================================
// 디바이스 / OS 동기화 로직
// ==========================================
window.updateVersionCheckboxesByOS = () => {
    const osEl = document.getElementById('osType');
    const pocEl = document.getElementById('poc');
    if (!osEl || !pocEl) return;
    
    const osType = osEl.value;
    const poc = pocEl.value;
    const isPureWeb = poc === 'Admin' || poc === 'PC Web';

    const cbList = ['ver_cb_android', 'ver_cb_ios', 'ver_cb_samsung', 'ver_cb_safari', 'ver_cb_chrome', 'ver_cb_edge'];
    cbList.forEach(id => { const el = document.getElementById(id); if (el) el.checked = false; });

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

    if (window.isInitialRender || currentSelected.length === 0) {
        currentSelected = [...(config.andDefaultDevices || []), ...(config.iosDefaultDevices || [])];
        window.isInitialRender = false;
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
            html += `<input type="checkbox" id="${domId}" class="pill-cb issue-device-cb template-trigger" value="${safeDevName}" ${isChecked}><label for="${domId}" class="pill-label">${safeDevName}</label>`;
        });
        container.innerHTML = html;
    };

    render('andNormalList', config.andDevices || [], 'and_n');
    render('andSpecialList', config.andSpecialDevices || [], 'and_s');
    render('iosNormalList', config.iosDevices || [], 'ios_n');
    render('iosSpecialList', config.iosSpecialDevices || [], 'ios_s');

    window.updateVersionTextbox();
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
};

window.handleDeviceClick = (element) => {
    if (element.checked) {
        const sameValueCount = Array.from(document.querySelectorAll('.issue-device-cb:checked'))
            .filter(cb => cb.value === element.value).length;
        if (sameValueCount > 1) {
            if (typeof window.showToast === 'function') window.showToast('⚠️ 이미 선택된 단말입니다.');
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
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
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
    if (typeof window.generateTemplate === 'function') window.generateTemplate(); 
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
        if (typeof window.generateTemplate === 'function') window.generateTemplate();
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

// ==========================================
// [추가] Event Delegation (인라인 이벤트 대체)
// ==========================================
document.addEventListener('componentsLoaded', () => {
    setTimeout(() => {
        if (typeof window.loadPrefixOrder === 'function') window.loadPrefixOrder();
        if (typeof window.renderInputPresets === 'function') window.renderInputPresets();
    }, 500);

    const inputFormContainer = document.getElementById('input-form-placeholder');
    if (!inputFormContainer) return;

    // Click Event Delegation
    inputFormContainer.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.id === 'btnSavePreset') window.saveInputPreset();
        if (target.id === 'btnEditPreset') window.editInputPreset();
        if (target.id === 'btnDeletePreset') window.deleteInputPreset();
        if (target.id === 'btnSavePrefixOrder') window.applyAndSavePrefixOrder();
        if (target.id === 'btnResetPrefixOrder') window.resetPrefixOrder();
        
        if (target.classList.contains('btn-add-case')) {
            window.addCase(target.dataset.target);
        }
        
        if (target.classList.contains('btn-apply-preset')) {
            window.applyIndividualPreset(target.dataset.target, parseInt(target.dataset.preset));
        }
    });

    // Change Event Delegation (Select, Checkbox, Radio)
    inputFormContainer.addEventListener('change', (e) => {
        const target = e.target;

        if (target.id === 'inputPresetSelect') window.handlePresetDropdownChange();
        if (target.id === 'prefix_env') document.getElementById('prefix_env_custom').classList.toggle('d-none', target.value !== 'direct');
        if (target.id === 'osType') {
            document.getElementById('osType_custom').classList.toggle('d-none', target.value !== 'direct');
            window.syncEnvironmentByOS();
        }
        if (target.id === 'poc') {
            document.getElementById('poc_custom').classList.toggle('d-none', target.value !== 'direct');
            window.handlePocChange();
        }
        if (target.id === 'prefix_critical') document.getElementById('prefix_critical_custom').classList.toggle('d-none', target.value !== 'direct');
        
        if (target.id === 'prefix_browser_none') {
            if (target.checked) {
                document.querySelectorAll('.prefix-browser-cb').forEach(cb => cb.checked = false);
                document.getElementById('prefix_browser_custom').classList.add('d-none');
                document.getElementById('prefix_device_input').classList.remove('d-none');
            }
        }
        
        if (target.classList.contains('prefix-browser-cb')) {
            if (target.id === 'prefix_browser_etc') {
                document.getElementById('prefix_browser_none').checked = false;
                document.getElementById('prefix_browser_custom').classList.toggle('d-none', !target.checked);
                document.getElementById('prefix_device_input').classList.toggle('d-none', target.checked);
            } else if (target.checked) {
                document.getElementById('prefix_browser_none').checked = false;
                document.getElementById('prefix_device_input').classList.add('d-none');
            }
        }

        if (target.name === 'and_dev_mode') window.toggleDeviceMode('and');
        if (target.name === 'ios_dev_mode') window.toggleDeviceMode('ios');
        if (target.name === 'ios_ver_type') window.syncEnvironmentByOS();
        
        if (target.id === 'ver_cb_android') { window.syncDeviceFromVersion('and'); window.updateVersionTextbox(); }
        if (target.id === 'ver_cb_ios') { window.syncDeviceFromVersion('ios'); window.updateVersionTextbox(); }
        if (['ver_cb_samsung', 'ver_cb_safari', 'ver_cb_chrome', 'ver_cb_edge'].includes(target.id)) {
            window.updateVersionTextbox();
        }

        if (target.classList.contains('issue-device-cb')) window.handleDeviceClick(target);

        if (target.classList.contains('template-trigger')) {
            if (typeof window.generateTemplate === 'function') window.generateTemplate();
        }
    });

    // Input Event Delegation (Text, Textarea)
    inputFormContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('template-trigger')) {
            if (typeof window.generateTemplate === 'function') window.generateTemplate();
        }
    });
});
