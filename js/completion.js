function openCompletionModal() {
    const config = loadConfig();
    const osType = document.getElementById('osType').value;
    const currentSelected = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);
    
    const andList = document.getElementById('comp_and_list');
    const iosList = document.getElementById('comp_ios_list');
    andList.innerHTML = ''; iosList.innerHTML = '';
    
    document.getElementById('comp_and_section').style.display = osType.includes("Android") ? 'block' : 'none';
    document.getElementById('comp_ios_section').style.display = osType.includes("iOS") ? 'block' : 'none';

    const renderComp = (container, list) => {
        list.forEach(dev => {
            const chk = currentSelected.includes(dev) ? 'checked' : '';
            container.innerHTML += `<label class="pill-label" style="display:flex; align-items:center; gap:10px;"><input type="checkbox" class="comp-dev-cb" value="${dev}" ${chk} onchange="updateCompletionPreview()"> ${dev}</label>`;
        });
    };
    renderComp(andList, [...config.andDevices, ...config.andSpecialDevices]);
    renderComp(iosList, [...config.iosDevices, ...config.iosSpecialDevices]);

    const vList = document.getElementById('comp_version_list'); vList.innerHTML = '';
    document.getElementById('appVersion').value.split(' / ').forEach(v => {
        vList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-ver-cb" value="${v}" checked onchange="updateCompletionPreview()"> ${v}</label>`;
    });

    const sList = document.getElementById('comp_server_list'); sList.innerHTML = '';
    const currentCheckedSrvs = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    ['STG', 'GRN', 'PRD'].forEach(s => {
        const chk = currentCheckedSrvs.includes(s) ? 'checked' : '';
        const label = s==='PRD'?'상용(PRD)':s;
        sList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-srv-cb" value="${label}" ${chk} onchange="updateCompletionPreview()"> ${label}</label>`;
    });

    document.getElementById('comp_check').value = '';
    document.getElementById('completionModal').style.display = 'flex';
    updateCompletionPreview();
}

function closeCompletionModal() { 
    document.getElementById('completionModal').style.display = 'none'; 
}

function updateCompletionPreview() {
    const devs = Array.from(document.querySelectorAll('.comp-dev-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    const vers = Array.from(document.querySelectorAll('.comp-ver-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    const srvs = Array.from(document.querySelectorAll('.comp-srv-cb:checked')).map(cb => cb.value).join(' / ') || '-';
    const extra = document.getElementById('extra_notes').value.trim();
    document.getElementById('comp_preview').value = `■ Device(OS Ver.) : ${devs}\n■ 버젼 : ${vers}\n■ 서버 : ${srvs}\n■ 현상 check : ${document.getElementById('comp_check').value}${extra ? '\n\n[검증 참고사항]\n' + extra : ''}`;
}

function copyCompletionReport() {
    const el = document.getElementById('comp_preview');
    el.select();
    document.execCommand('copy');
    alert('완료문 복사 완료!');
    closeCompletionModal();
}
