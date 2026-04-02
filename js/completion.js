function openCompletionModal() {
    const config = (typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master'))) || {};
    
    const osTypeEl = document.getElementById('osType');
    const osType = osTypeEl ? osTypeEl.value : '';
    const currentSelected = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);
    
    const andList = document.getElementById('comp_and_list');
    const iosList = document.getElementById('comp_ios_list');
    if (andList) andList.innerHTML = ''; 
    if (iosList) iosList.innerHTML = '';
    
    const andSection = document.getElementById('comp_and_section');
    const iosSection = document.getElementById('comp_ios_section');
    if (andSection) andSection.style.display = osType.includes("Android") ? 'block' : 'none';
    if (iosSection) iosSection.style.display = osType.includes("iOS") ? 'block' : 'none';

    const renderComp = (container, list) => {
        if (!container) return;
        list.forEach(dev => {
            const chk = currentSelected.includes(dev) ? 'checked' : '';
            container.innerHTML += `<label class="pill-label" style="display:flex; align-items:center; gap:10px;"><input type="checkbox" class="comp-dev-cb" value="${dev}" ${chk} onchange="updateCompletionPreview()"> ${dev}</label>`;
        });
    };

    const andDevicesAll = [...(config.andDevices || []), ...(config.andSpecialDevices || [])];
    const iosDevicesAll = [...(config.iosDevices || []), ...(config.iosSpecialDevices || [])];
    
    renderComp(andList, andDevicesAll);
    renderComp(iosList, iosDevicesAll);

    const vList = document.getElementById('comp_version_list'); 
    if (vList) {
        vList.innerHTML = '';
        const appVerInput = document.getElementById('appVersion');
        if (appVerInput && appVerInput.value) {
            appVerInput.value.split(' / ').forEach(v => {
                const cleanVer = v.trim();
                vList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-ver-cb" value="${cleanVer}" checked onchange="updateCompletionPreview()"> ${cleanVer}</label>`;
            });
        }
    }

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

    const modal = document.getElementById('completionModal');
    if (modal) modal.style.display = 'flex';
    
    updateCompletionPreview();
}

function closeCompletionModal() { 
    const modal = document.getElementById('completionModal');
    if (modal) modal.style.display = 'none'; 
}

function updateCompletionPreview() {
    const devs = Array.from(document.querySelectorAll('.comp-dev-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    const vers = Array.from(document.querySelectorAll('.comp-ver-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    const srvs = Array.from(document.querySelectorAll('.comp-srv-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    
    const extraNode = document.getElementById('extra_notes');
    const extra = extraNode ? extraNode.value.trim() : '';
    
    const compCheckNode = document.getElementById('comp_check');
    const compCheckVal = compCheckNode ? compCheckNode.value : '';
    
    const previewNode = document.getElementById('comp_preview');
    if (previewNode) {
        previewNode.value = `■ Device(OS Ver.) : ${devs}\n■ 버젼 : ${vers}\n■ 서버 : ${srvs}\n■ 현상 check : ${compCheckVal}${extra ? '\n\n[검증 참고사항]\n' + extra : ''}`;
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
