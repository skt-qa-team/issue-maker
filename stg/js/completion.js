let currentCompConfig = {};

function openCompletionModal() {
    currentCompConfig = (typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master'))) || {};
    
    const deviceArea = document.getElementById('comp_device_area');
    if (deviceArea) {
        deviceArea.innerHTML = `
            <div id="comp_and_section" class="comp-os-section">
                <div class="comp-device-header">
                    <span class="comp-os-label comp-and-color">Android</span>
                    <div class="radio-tab-group small">
                        <label class="radio-tab"><input type="radio" name="comp_and_mode" value="normal" checked onchange="renderCompDevices()"> <span>검증</span></label>
                        <label class="radio-tab"><input type="radio" name="comp_and_mode" value="special" onchange="renderCompDevices()"> <span>특수</span></label>
                    </div>
                </div>
                <div id="comp_and_list" class="pill-group"></div>
            </div>
            <div id="comp_ios_section">
                <div class="comp-device-header">
                    <span class="comp-os-label comp-ios-color">iOS</span>
                    <div class="radio-tab-group small">
                        <label class="radio-tab"><input type="radio" name="comp_ios_mode" value="normal" checked onchange="renderCompDevices()"> <span>검증</span></label>
                        <label class="radio-tab"><input type="radio" name="comp_ios_mode" value="special" onchange="renderCompDevices()"> <span>특수</span></label>
                    </div>
                </div>
                <div id="comp_ios_list" class="pill-group"></div>
            </div>
        `;
    }

    const sList = document.getElementById('comp_server_list');
    if (sList) {
        sList.className = 'checkbox-group comp-server-group';
        sList.style = '';
        sList.innerHTML = '';
        
        ['STG', 'GRN', 'PRD'].forEach(s => {
            const chk = s === 'STG' ? 'checked' : '';
            const label = s === 'PRD' ? '상용(PRD)' : s;
            sList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-srv-cb" value="${label}" ${chk} onchange="updateCompletionPreview()"> ${label}</label>`;
        });
    }

    const compCheck = document.getElementById('comp_check');
    if (compCheck) {
        compCheck.value = '';
        compCheck.oninput = updateCompletionPreview;
    }

    const copyBtn = document.querySelector('#completionModal .btn-save') || document.querySelector('#completionModal button[onclick="copyCompletionReport()"]');
    if (copyBtn) {
        copyBtn.innerHTML = '📋 완료문 복사하기';
    }

    const modal = document.getElementById('completionModal');
    if (modal) modal.style.display = 'flex';
    
    handleCompPocChange();
}

function handleCompPocChange() {
    const compPocEl = document.getElementById('comp_poc');
    const poc = compPocEl ? compPocEl.value : 'T 멤버십';
    const isWeb = (poc === 'Admin' || poc === 'PC Web');

    const deviceArea = document.getElementById('comp_device_area');
    if (deviceArea) {
        const deviceGroup = deviceArea.closest('.form-group');
        if (deviceGroup) deviceGroup.style.display = isWeb ? 'none' : 'block';
    }

    let versionContainer = document.getElementById('comp_version_list')?.parentElement;
    if (!versionContainer) versionContainer = document.getElementById('comp_version_input')?.parentElement;
    if (!versionContainer) versionContainer = document.getElementById('comp_url_input')?.parentElement;
    
    if (versionContainer) {
        const parentGrid = versionContainer.parentElement;
        if(parentGrid && parentGrid.classList.contains('grid-2')) {
            parentGrid.classList.add('comp-version-layout');
            parentGrid.style = '';
        }
        
        if (isWeb) {
            const defaultUrl = poc === 'Admin' ? (currentCompConfig.adminUrl || '') : (currentCompConfig.pcUrl || '');
            versionContainer.innerHTML = `<label class="comp-input-label">■ URL</label><input type="text" id="comp_url_input" class="comp-input-field" value="${defaultUrl}" oninput="updateCompletionPreview()">`;
        } else {
            versionContainer.innerHTML = `<label class="comp-input-label">■ 버젼</label><input type="text" id="comp_version_input" class="comp-input-field" oninput="updateCompletionPreview()">`;
        }
    }

    const sList = document.getElementById('comp_server_list');
    const sListParent = sList?.parentElement;
    if (sListParent) {
        sListParent.style.order = isWeb ? "-1" : "0"; 
    }

    if (!isWeb) {
        renderCompDevices();
    } else {
        updateCompletionPreview();
    }
}

function renderCompDevices() {
    const compPocEl = document.getElementById('comp_poc');
    const isWeb = compPocEl && (compPocEl.value === 'Admin' || compPocEl.value === 'PC Web');
    if (isWeb) return; 

    const andMode = document.querySelector('input[name="comp_and_mode"]:checked')?.value || 'normal';
    const iosMode = document.querySelector('input[name="comp_ios_mode"]:checked')?.value || 'normal';

    const andList = document.getElementById('comp_and_list');
    const iosList = document.getElementById('comp_ios_list');

    const andDevices = andMode === 'normal' ? (currentCompConfig.andDevices || []) : (currentCompConfig.andSpecialDevices || []);
    const iosDevices = iosMode === 'normal' ? (currentCompConfig.iosDevices || []) : (currentCompConfig.iosSpecialDevices || []);

    const defaultSelected = [...(currentCompConfig.andDefaultDevices || []), ...(currentCompConfig.iosDefaultDevices || [])];

    const renderItems = (container, list, platform) => {
        if (!container) return;
        container.innerHTML = '';
        list.forEach(dev => {
            const chk = defaultSelected.includes(dev) ? 'checked' : '';
            container.innerHTML += `<label class="pill-label comp-pill-label"><input type="checkbox" class="comp-dev-cb" data-platform="${platform}" value="${dev}" ${chk} onchange="handleCompDeviceChange()"> ${dev}</label>`;
        });
    };

    renderItems(andList, andDevices, 'android');
    renderItems(iosList, iosDevices, 'ios');

    updateVersionTextbox();
    updateCompletionPreview();
}

function handleCompDeviceChange() {
    updateVersionTextbox();
    updateCompletionPreview();
}

function updateVersionTextbox() {
    const verInput = document.getElementById('comp_version_input');
    if (!verInput) return; 

    const checkedDevs = Array.from(document.querySelectorAll('.comp-dev-cb:checked'));
    const hasAndroid = checkedDevs.some(cb => cb.dataset.platform === 'android');
    const hasIos = checkedDevs.some(cb => cb.dataset.platform === 'ios');

    let versions = [];
    const iosTypeChecked = document.querySelector('input[name="ios_ver_type"]:checked');
    const iosMode = iosTypeChecked ? iosTypeChecked.value : 'TestFlight';

    if (hasAndroid) {
        versions.push(`App Tester_${currentCompConfig.andAppTester || ''}`);
    }
    if (hasIos) {
        versions.push(`${iosMode}_${iosMode === 'TestFlight' ? (currentCompConfig.iosTestFlight || '') : (currentCompConfig.iosDistribution || '')}`);
    }

    const verString = versions.join(' / ') || '-';
    verInput.value = verString;
}

function closeCompletionModal() {
    const modal = document.getElementById('completionModal');
    if (modal) modal.style.display = 'none';
}

function updateCompletionPreview() {
    const compPocEl = document.getElementById('comp_poc');
    const poc = compPocEl ? compPocEl.value : '';
    const isWeb = (poc === 'Admin' || poc === 'PC Web');

    const srvs = Array.from(document.querySelectorAll('.comp-srv-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    const compCheckNode = document.getElementById('comp_check');
    const compCheckVal = compCheckNode ? compCheckNode.value : '';

    const previewNode = document.getElementById('comp_preview');
    if (!previewNode) return;

    if (isWeb) {
        const urlInput = document.getElementById('comp_url_input');
        const urlString = urlInput ? urlInput.value : '-';
        
        previewNode.value = `■ 서버 : ${srvs}\n■ URL : ${urlString}\n■ 현상 check : ${compCheckVal}`;
    } else {
        const devs = Array.from(document.querySelectorAll('.comp-dev-cb:checked')).map(cb => cb.value).join(' / ') || '-';
        const verInput = document.getElementById('comp_version_input');
        const verString = verInput ? verInput.value : '-';

        previewNode.value = `■ Device(OS Ver.) : ${devs}\n■ 버젼 : ${verString}\n■ 서버 : ${srvs}\n■ 현상 check : ${compCheckVal}`;
    }
}

function copyCompletionReport() {
    const el = document.getElementById('comp_preview');
    if (!el) return;

    try {
        el.select();
        document.execCommand('copy');
        alert('완료문 복사 완료!');
        closeCompletionModal();
    } catch (err) {
        alert('복사에 실패했습니다.');
    }
}
