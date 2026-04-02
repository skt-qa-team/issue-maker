let currentCompConfig = {};
let currentMainSelectedDevices = [];

function openCompletionModal() {
    currentCompConfig = (typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master'))) || {};
    const osTypeEl = document.getElementById('osType');
    const osType = osTypeEl ? osTypeEl.value : '';
    currentMainSelectedDevices = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);

    const deviceArea = document.getElementById('comp_device_area');
    if (deviceArea) {
        deviceArea.innerHTML = `
            <div id="comp_and_section" style="display: ${osType.includes("Android") ? 'block' : 'none'}; margin-bottom: 15px;">
                <div class="device-col-header" style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">
                    <span class="comp-os-label" style="color:#10b981; margin:0; border:none; padding:0; font-size:0.95rem;">Android</span>
                    <div class="radio-tab-group small">
                        <label class="radio-tab"><input type="radio" name="comp_and_mode" value="normal" checked onchange="renderCompDevices()"> <span>검증</span></label>
                        <label class="radio-tab"><input type="radio" name="comp_and_mode" value="special" onchange="renderCompDevices()"> <span>특수</span></label>
                    </div>
                </div>
                <div id="comp_and_list" class="pill-group"></div>
            </div>
            <div id="comp_ios_section" style="display: ${osType.includes("iOS") ? 'block' : 'none'};">
                <div class="device-col-header" style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">
                    <span class="comp-os-label" style="color:#3b82f6; margin:0; border:none; padding:0; font-size:0.95rem;">iOS</span>
                    <div class="radio-tab-group small">
                        <label class="radio-tab"><input type="radio" name="comp_ios_mode" value="normal" checked onchange="renderCompDevices()"> <span>검증</span></label>
                        <label class="radio-tab"><input type="radio" name="comp_ios_mode" value="special" onchange="renderCompDevices()"> <span>특수</span></label>
                    </div>
                </div>
                <div id="comp_ios_list" class="pill-group"></div>
            </div>
        `;
    }

    const versionContainer = document.getElementById('comp_version_list')?.parentElement;
    const serverContainer = document.getElementById('comp_server_list')?.parentElement;
    
    if (versionContainer && serverContainer) {
        const parentGrid = versionContainer.parentElement;
        if(parentGrid && parentGrid.classList.contains('grid-2')) {
            parentGrid.style.display = 'flex';
            parentGrid.style.flexDirection = 'column';
            parentGrid.style.gap = '15px';
        }
        
        versionContainer.innerHTML = `<label style="font-weight: 700; font-size: 0.88rem; color: var(--text-sub); margin-bottom: 8px; display: block;">■ 버젼</label><input type="text" id="comp_version_input" class="kpi-input" style="width:100%; box-sizing:border-box;" oninput="updateCompletionPreview()">`;
        
        const sList = document.getElementById('comp_server_list');
        if (sList) {
            sList.className = 'checkbox-group';
            sList.style.display = 'flex';
            sList.style.flexDirection = 'row';
            sList.style.flexWrap = 'wrap';
            sList.style.gap = '15px';
        }
    }

    renderCompDevices();

    const sList = document.getElementById('comp_server_list');
    if (sList) {
        sList.innerHTML = '';
        const currentCheckedSrvs = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
        ['STG', 'GRN', 'PRD'].forEach(s => {
            const chk = currentCheckedSrvs.includes(s) ? 'checked' : '';
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
    
    updateVersionTextbox();
    updateCompletionPreview();
}

function renderCompDevices() {
    const andMode = document.querySelector('input[name="comp_and_mode"]:checked')?.value || 'normal';
    const iosMode = document.querySelector('input[name="comp_ios_mode"]:checked')?.value || 'normal';

    const andList = document.getElementById('comp_and_list');
    const iosList = document.getElementById('comp_ios_list');

    const andDevices = andMode === 'normal' ? (currentCompConfig.andDevices || []) : (currentCompConfig.andSpecialDevices || []);
    const iosDevices = iosMode === 'normal' ? (currentCompConfig.iosDevices || []) : (currentCompConfig.iosSpecialDevices || []);

    const renderItems = (container, list, platform) => {
        if (!container) return;
        container.innerHTML = '';
        list.forEach(dev => {
            const chk = currentMainSelectedDevices.includes(dev) ? 'checked' : '';
            container.innerHTML += `<label class="pill-label" style="display:flex; align-items:center; gap:10px;"><input type="checkbox" class="comp-dev-cb" data-platform="${platform}" value="${dev}" ${chk} onchange="handleCompDeviceChange()"> ${dev}</label>`;
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

    const verInput = document.getElementById('comp_version_input');
    if (verInput) {
        verInput.value = verString;
    }
}

function closeCompletionModal() {
    const modal = document.getElementById('completionModal');
    if (modal) modal.style.display = 'none';
}

function updateCompletionPreview() {
    const devs = Array.from(document.querySelectorAll('.comp-dev-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    
    const verInput = document.getElementById('comp_version_input');
    const verString = verInput ? verInput.value : '-';

    const srvs = Array.from(document.querySelectorAll('.comp-srv-cb:checked')).map(cb => cb.value).join(' / ') || '-';

    const extraNode = document.getElementById('extra_notes');
    const extra = extraNode ? extraNode.value.trim() : '';

    const compCheckNode = document.getElementById('comp_check');
    const compCheckVal = compCheckNode ? compCheckNode.value : '';

    const previewNode = document.getElementById('comp_preview');
    if (previewNode) {
        previewNode.value = `■ Device(OS Ver.) : ${devs}\n■ 버젼 : ${verString}\n■ 서버 : ${srvs}\n■ 현상 check : ${compCheckVal}${extra ? '\n\n[검증 참고사항]\n' + extra : ''}`;
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
