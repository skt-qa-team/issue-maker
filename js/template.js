let isInitialRender = true;
const DEFAULT_PREFIX_ORDER = ['env', 'browser', 'os', 'poc', 'critical', 'device', 'account', 'page'];

function escapeHTMLTemplate(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function initDragAndDrop() {
    const container = document.getElementById('prefixContainer');
    if (!container) return;

    let draggedItem = null;

    container.querySelectorAll('.prefix-item').forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            setTimeout(() => this.classList.add('dragging'), 0);
        });

        item.addEventListener('dragend', function() {
            setTimeout(() => {
                this.classList.remove('dragging');
                draggedItem = null;
                generateTemplate();
            }, 0);
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            const afterElement = getDragAfterElement(container, e.clientY, e.clientX);
            if (afterElement == null) {
                container.appendChild(draggedItem);
            } else {
                container.insertBefore(draggedItem, afterElement);
            }
        });
    });
}

function getDragAfterElement(container, y, x) {
    const draggableElements = [...container.querySelectorAll('.prefix-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offsetY = y - box.top - box.height / 2;
        const offsetX = x - box.left - box.width / 2;
        
        const distance = Math.sqrt(offsetX*offsetX + offsetY*offsetY);

        if (offsetY < 0 && distance < closest.distance) {
            return { offset: offsetY, element: child, distance: distance };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY, distance: Number.POSITIVE_INFINITY }).element;
}

function savePrefixOrder() {
    const container = document.getElementById('prefixContainer');
    if (!container) return;
    const currentOrder = Array.from(container.querySelectorAll('.prefix-item')).map(item => item.dataset.id);
    localStorage.setItem('qa_prefix_order', JSON.stringify(currentOrder));
    if (typeof showToast === 'function') showToast('Prefix 순서가 저장되었습니다.');
}

function resetPrefixOrder() {
    localStorage.removeItem('qa_prefix_order');
    applyPrefixOrder(DEFAULT_PREFIX_ORDER);
    if (typeof showToast === 'function') showToast('Prefix 순서가 초기화되었습니다.');
}

function loadPrefixOrder() {
    const saved = localStorage.getItem('qa_prefix_order');
    if (saved) {
        applyPrefixOrder(JSON.parse(saved));
    }
}

function applyPrefixOrder(orderArray) {
    const container = document.getElementById('prefixContainer');
    if (!container) return;
    
    const items = Array.from(container.querySelectorAll('.prefix-item'));
    
    orderArray.forEach(id => {
        const item = items.find(el => el.dataset.id === id);
        if (item) {
            container.appendChild(item);
        }
    });
    generateTemplate();
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initDragAndDrop();
        loadPrefixOrder();
    }, 500);
});

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
        if (osType === "Android/iOS" || osType === "모바일" || osType === "태블릿" || osType === "모바일/태블릿" || osType === "direct") {
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

    const showAnd = (osType === "Android/iOS" || osType === "Android" || osType === "모바일" || osType === "태블릿" || osType === "모바일/태블릿" || osType === "direct");
    const showIos = (osType === "Android/iOS" || osType === "iOS" || osType === "모바일" || osType === "태블릿" || osType === "모바일/태블릿" || osType === "direct");

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

    const andChecked = document.querySelectorAll('#andDeviceCol .issue-device-cb:checked').length > 0;
    const iosChecked = document.querySelectorAll('#iosDeviceCol .issue-device-cb:checked').length > 0;
    
    const cbAnd = document.getElementById('ver_cb_android');
    const cbIos = document.getElementById('ver_cb_ios');
    if (cbAnd) cbAnd.checked = andChecked;
    if (cbIos) cbIos.checked = iosChecked;

    updateVersionTextbox();
    generateTemplate();
}

function syncDeviceFromVersion(platform) {
    const cb = document.getElementById(platform === 'and' ? 'ver_cb_android' : 'ver_cb_ios');
    if (!cb) return;
    const isChecked = cb.checked;
    const col = document.getElementById(`${platform}DeviceCol`);
    
    if (col) {
        if (!isChecked) {
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
    
    if(aiModeGroup) {
        if (isAI) {
            aiModeGroup.classList.remove('d-none');
        } else {
            aiModeGroup.classList.add('d-none');
        }
    }
    
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
        } else if (type === '삼성인터넷') {
            versionParts.push(`삼성인터넷_${config.samsungBrowser || ''}`);
        } else if (type === 'Safari') {
            versionParts.push(`Safari_${config.safariBrowser || ''}`);
        } else if (type === 'Chrome') {
            versionParts.push(`Chrome_${config.chromeBrowser || ''}`);
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

    let prefixMap = {
        'env': '',
        'browser': '',
        'os': '',
        'poc': '',
        'critical': '',
        'device': '',
        'account': '',
        'page': ''
    };

    const envVal = getDropdownOrCustom('prefix_env', 'prefix_env_custom');
    if (envVal) prefixMap['env'] = `[${envVal}]`;

    let browserVals = [];
    const browserNone = document.getElementById('prefix_browser_none');
    if (!browserNone || !browserNone.checked) {
        document.querySelectorAll('.prefix-browser-cb:checked').forEach(cb => {
            if (cb.value === '기타') {
                const customBrowser = document.getElementById('prefix_browser_custom')?.value.trim();
                if (customBrowser) browserVals.push(customBrowser);
            } else {
                browserVals.push(cb.value);
            }
        });
    }
    if (browserVals.length > 0) prefixMap['browser'] = `[${browserVals.join('/')}]`;

    const osVal = getDropdownOrCustom('osType', 'osType_custom');
    if (osVal) prefixMap['os'] = `[${osVal}]`;

    let pocVal = getDropdownOrCustom('poc', 'poc_custom');
    if (pocVal === 'PC M.Web') pocVal = 'PCWeb';
    if (pocVal && pocVal !== 'T 멤버십') prefixMap['poc'] = `[${pocVal}]`;

    const critVal = getDropdownOrCustom('prefix_critical', 'prefix_critical_custom');
    if (critVal) prefixMap['critical'] = `[${critVal}]`;

    const devVal = document.getElementById('prefix_device') ? document.getElementById('prefix_device').value.trim() : '';
    if (devVal) prefixMap['device'] = `[${devVal}]`;

    const accVal = document.getElementById('prefix_account') ? document.getElementById('prefix_account').value.trim() : '';
    if (accVal) prefixMap['account'] = `[${accVal}]`;

    const pageVal = document.getElementById('prefix_page') ? document.getElementById('prefix_page').value.trim() : '';
    if (pageVal) prefixMap['page'] = `[${pageVal}]`;

    const container = document.getElementById('prefixContainer');
    let orderedPrefixString = '';
    
    if (container) {
        const items = Array.from(container.querySelectorAll('.prefix-item'));
        items.forEach(item => {
            const id = item.dataset.id;
            if (prefixMap[id]) {
                orderedPrefixString += prefixMap[id];
            }
        });
    }

    const titleVal = document.getElementById('title') ? document.getElementById('title').value.trim() : '';
    const titleText = `${orderedPrefixString} ${titleVal}`.replace(/\s+/g, ' ').trim();

    const pocDropdownVal = document.getElementById('poc')?.value || '';
    const osDropdownVal = document.getElementById('osType')?.value || '';
    const isPureWeb = pocDropdownVal === 'Admin' || pocDropdownVal === 'PC Web';
    let servers = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    let devices = "";
    
    if (!isPureWeb) {
        let activeDeviceLists = [];
        const andMode = document.querySelector('input[name="and_dev_mode"]:checked')?.value;
        const iosMode = document.querySelector('input[name="ios_dev_mode"]:checked')?.value;

        const showAnd = (osDropdownVal === "Android/iOS" || osDropdownVal === "Android" || osDropdownVal === "모바일" || osDropdownVal === "태블릿" || osDropdownVal === "모바일/태블릿" || osDropdownVal === "direct");
        const showIos = (osDropdownVal === "Android/iOS" || osDropdownVal === "iOS" || osDropdownVal === "모바일" || osDropdownVal === "태블릿" || osDropdownVal === "모바일/태블릿" || osDropdownVal === "direct");

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
        .filter(val => ['삼성인터넷', 'Safari', 'Chrome', 'Edge'].includes(val))
        .join(' / ');

    let envSection = `[Environment]\n■ POC : ${pocDropdownVal === 'PC M.Web' ? 'PC M.Web' : pocVal}\n`;

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
