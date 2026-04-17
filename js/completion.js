let currentCompConfig = {};

function initCompletionPanel() {
    currentCompConfig = (typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master'))) || {};
    
    const sList = document.getElementById('comp_server_list');
    if (sList) {
        sList.innerHTML = '';
        ['STG', 'GRN', 'PRD'].forEach(s => {
            const chk = s === 'STG' ? 'checked' : '';
            const label = s === 'PRD' ? '상용(PRD)' : s;
            sList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-srv-cb" value="${label}" ${chk} onchange="updateCompletionPreview()"> ${label}</label>`;
        });
    }

    const vList = document.getElementById('comp_version_list');
    if (vList) {
        vList.innerHTML = '';
        ['Android', 'iOS', '삼성인터넷', 'Safari', 'Chrome', 'Edge'].forEach(v => {
            vList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-ver-cb" value="${v}" onchange="updateCompletionPreview()"> ${v}</label>`;
        });
    }

    const compCheck = document.getElementById('comp_check');
    if (compCheck) {
        compCheck.value = '';
        compCheck.oninput = updateCompletionPreview;
    }

    const compUrl = document.getElementById('comp_url');
    if (compUrl) {
        compUrl.value = '';
        compUrl.oninput = updateCompletionPreview;
    }

    const pocEl = document.getElementById('comp_poc');
    if (pocEl) {
        pocEl.value = 'T 멤버십';
    }

    handleCompPocChange();
}

function handleCompPocChange() {
    const compPocEl = document.getElementById('comp_poc');
    const poc = compPocEl ? compPocEl.value : 'T 멤버십';
    const isWeb = (poc === 'Admin' || poc === 'PC Web');

    const deviceGroup = document.getElementById('comp_device_group');
    const urlGroup = document.getElementById('comp_url_group');
    
    if (deviceGroup) {
        if (isWeb) deviceGroup.classList.add('d-none');
        else deviceGroup.classList.remove('d-none');
    }
    
    if (urlGroup) {
        if (isWeb) urlGroup.classList.remove('d-none');
        else urlGroup.classList.add('d-none');
    }

    if (isWeb) {
        const urlInput = document.getElementById('comp_url');
        if (urlInput) {
            urlInput.value = poc === 'Admin' ? (currentCompConfig.adminUrl || '') : (currentCompConfig.pcUrl || '');
        }
    } else {
        renderCompDevices();
    }

    updateCompletionPreview();
}

function renderCompDevices() {
    const andList = document.getElementById('comp_and_list');
    const iosList = document.getElementById('comp_ios_list');

    const andDevices = currentCompConfig.andDevices || [];
    const iosDevices = currentCompConfig.iosDevices || [];
    const defaultSelected = [...(currentCompConfig.andDefaultDevices || []), ...(currentCompConfig.iosDefaultDevices || [])];

    const renderItems = (container, list, platform) => {
        if (!container) return;
        container.innerHTML = '';
        list.forEach(dev => {
            const chk = defaultSelected.includes(dev) ? 'checked' : '';
            container.innerHTML += `<label class="pill-label"><input type="checkbox" class="pill-cb comp-dev-cb" data-platform="${platform}" value="${dev}" ${chk} onchange="updateCompletionPreview()"> ${dev}</label>`;
        });
    };

    renderItems(andList, andDevices, 'android');
    renderItems(iosList, iosDevices, 'ios');
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

    let versions = [];
    if (isWeb) {
        const urlInput = document.getElementById('comp_url');
        const urlString = urlInput ? urlInput.value : '-';
        
        document.querySelectorAll('.comp-ver-cb:checked').forEach(cb => {
            const type = cb.value;
            if (type === 'Android') versions.push(`App Tester_${currentCompConfig.andAppTester || ''}`);
            else if (type === 'iOS') versions.push(`TestFlight_${currentCompConfig.iosTestFlight || ''}`);
            else if (type === '삼성인터넷') versions.push(`삼성인터넷_${currentCompConfig.samsungBrowser || ''}`);
            else if (type === 'Safari') versions.push(`Safari_${currentCompConfig.safariBrowser || ''}`);
            else if (type === 'Chrome') versions.push(`Chrome_${currentCompConfig.chromeBrowser || ''}`);
            else if (type === 'Edge') versions.push(`Edge_${currentCompConfig.edgeBrowser || ''}`);
        });
        const verString = versions.join(' / ') || '-';
        previewNode.value = `■ 버전 : ${verString}\n■ 서버 : ${srvs}\n■ URL : ${urlString}\n■ 현상 check : ${compCheckVal}`;
    } else {
        const devs = Array.from(document.querySelectorAll('.comp-dev-cb:checked')).map(cb => cb.value).join(' / ') || '-';
        const checkedDevs = Array.from(document.querySelectorAll('.comp-dev-cb:checked'));
        const hasAndroid = checkedDevs.some(cb => cb.dataset.platform === 'android');
        const hasIos = checkedDevs.some(cb => cb.dataset.platform === 'ios');

        if (hasAndroid) versions.push(`App Tester_${currentCompConfig.andAppTester || ''}`);
        if (hasIos) versions.push(`TestFlight_${currentCompConfig.iosTestFlight || ''}`);

        document.querySelectorAll('.comp-ver-cb:checked').forEach(cb => {
            const type = cb.value;
            if (type !== 'Android' && type !== 'iOS') {
                if (type === '삼성인터넷') versions.push(`삼성인터넷_${currentCompConfig.samsungBrowser || ''}`);
                else if (type === 'Safari') versions.push(`Safari_${currentCompConfig.safariBrowser || ''}`);
                else if (type === 'Chrome') versions.push(`Chrome_${currentCompConfig.chromeBrowser || ''}`);
                else if (type === 'Edge') versions.push(`Edge_${currentCompConfig.edgeBrowser || ''}`);
            }
        });
        const verString = versions.join(' / ') || '-';
        previewNode.value = `■ Device(OS Ver.) : ${devs}\n■ 버젼 : ${verString}\n■ 서버 : ${srvs}\n■ 현상 check : ${compCheckVal}`;
    }
}

async function copyCompletionReport() {
    const el = document.getElementById('comp_preview');
    if (!el) return;
    const textToCopy = el.value;

    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(textToCopy);
            if (typeof showToast === 'function') showToast('완료문 복사 완료!');
        } catch (err) {
            fallbackCopy(textToCopy);
        }
    } else {
        fallbackCopy(textToCopy);
    }
}

function fallbackCopy(text) {
    const t = document.createElement("textarea");
    t.className = "sr-only";
    document.body.appendChild(t);
    t.value = text;
    t.select();
    try {
        document.execCommand('copy');
        if (typeof showToast === 'function') showToast('완료문 복사 완료!');
    } catch (err) {
        console.error('Copy failed', err);
    }
    document.body.removeChild(t);
}
