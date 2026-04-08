let currentCompConfig = {};
let currentMainSelectedDevices = [];

function openCompletionModal() {
    currentCompConfig = (typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master'))) || {};
    
    // 1. 메인 폼의 POC 값을 모달 POC에 자동 세팅 (편의성)
    const mainPocEl = document.getElementById('poc');
    const mainPoc = mainPocEl ? mainPocEl.value : 'T 멤버십';
    const compPocEl = document.getElementById('comp_poc');
    if (compPocEl) compPocEl.value = mainPoc;

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

    const sList = document.getElementById('comp_server_list');
    if (sList) {
        sList.className = 'checkbox-group';
        sList.style.display = 'flex';
        sList.style.flexDirection = 'row';
        sList.style.flexWrap = 'wrap';
        sList.style.gap = '15px';
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
    
    // 2. 모달이 열림과 동시에 POC에 맞춰 화면 UI 세팅
    handleCompPocChange();
}

// ✨ 핵심 로직: 완료문 모달 내부에서 POC를 변경할 때 동작하는 함수
function handleCompPocChange() {
    const compPocEl = document.getElementById('comp_poc');
    const poc = compPocEl ? compPocEl.value : '';
    const isWeb = (poc === 'Admin' || poc === 'PC Web');

    // 1) 단말기 그룹 숨기기/보이기
    const deviceArea = document.getElementById('comp_device_area');
    if (deviceArea) {
        const deviceGroup = deviceArea.closest('.form-group');
        if (deviceGroup) deviceGroup.style.display = isWeb ? 'none' : 'block';
    }

    // 2) 앱 버전 폼을 URL 폼으로 스위칭
    let versionContainer = document.getElementById('comp_version_list')?.parentElement;
    if (!versionContainer) versionContainer = document.getElementById('comp_version_input')?.parentElement;
    if (!versionContainer) versionContainer = document.getElementById('comp_url_input')?.parentElement;
    
    if (versionContainer) {
        const parentGrid = versionContainer.parentElement;
        if(parentGrid && parentGrid.classList.contains('grid-2')) {
            parentGrid.style.display = 'flex';
            parentGrid.style.flexDirection = 'column';
            parentGrid.style.gap = '15px';
        }
        
        if (isWeb) {
            let defaultUrl = '';
            const targetUrlEl = document.getElementById('targetUrl');
            if (targetUrlEl && targetUrlEl.value) {
                defaultUrl = targetUrlEl.value;
            } else {
                defaultUrl = poc === 'Admin' ? (currentCompConfig.adminUrl || '') : (currentCompConfig.pcUrl || '');
            }

            versionContainer.innerHTML = `<label style="font-weight: 700; font-size: 0.88rem; color: var(--text-sub); margin-bottom: 8px; display: block;">■ URL</label><input type="text" id="comp_url_input" style="width:100%; box-sizing:border-box; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.92rem;" value="${defaultUrl}" oninput="updateCompletionPreview()">`;
        } else {
            versionContainer.innerHTML = `<label style="font-weight: 700; font-size: 0.88rem; color: var(--text-sub); margin-bottom: 8px; display: block;">■ 버젼</label><input type="text" id="comp_version_input" style="width:100%; box-sizing:border-box; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.92rem;" oninput="updateCompletionPreview()">`;
        }
    }

    // 3) 서버 순서 조정 (웹일 때는 위로 올림)
    const sList = document.getElementById('comp_server_list');
    const sListParent = sList?.parentElement;
    if (sListParent) {
        sListParent.style.order = isWeb ? "-1" : "0"; 
    }

    // 변경사항 최종 렌더링
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
    // 미리보기는 완료문 모달 자체의 POC 값을 기준으로 텍스트를 생성합니다.
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
