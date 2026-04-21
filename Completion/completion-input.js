window.compDataCache = {};

document.addEventListener('componentsLoaded', () => {
    window.initCompletionInput();
});

window.initCompletionInput = () => {
    window.compDataCache = (typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master'))) || {};
    
    const sList = document.getElementById('comp_server_list');
    if (sList) {
        sList.innerHTML = '';
        ['STG', 'GRN', 'PRD'].forEach(s => {
            const chk = s === 'STG' ? 'checked' : '';
            const label = s === 'PRD' ? '상용(PRD)' : s;
            sList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-srv-cb template-trigger" value="${label}" ${chk}> ${label}</label>`;
        });
    }

    const vList = document.getElementById('comp_version_list');
    if (vList) {
        vList.innerHTML = '';
        ['Android', 'iOS', '삼성인터넷', 'Safari', 'Chrome', 'Edge'].forEach(v => {
            vList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-ver-cb template-trigger" value="${v}"> ${v}</label>`;
        });
    }

    const pocEl = document.getElementById('comp_poc');
    if (pocEl) {
        pocEl.value = 'T 멤버십';
        pocEl.addEventListener('change', window.handleCompPocChange);
    }

    window.renderCompPresets();
    window.handleCompPocChange();
    window.initCompletionInputEvents();
};

window.initCompletionInputEvents = () => {
    const container = document.getElementById('completionModal');
    if (!container) return;

    container.addEventListener('input', (e) => {
        if (e.target.classList.contains('template-trigger')) {
            if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
        }
    });

    container.addEventListener('change', (e) => {
        if (e.target.classList.contains('template-trigger')) {
            if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
        }
        if (e.target.id === 'compPresetSelect') window.applyCompPreset(e.target.value);
    });

    const btnSave = document.getElementById('btnSaveCompPreset');
    if (btnSave) btnSave.onclick = window.saveCompPreset;

    const btnDelete = document.getElementById('btnDeleteCompPreset');
    if (btnDelete) btnDelete.onclick = window.deleteCompPreset;
};

window.handleCompPocChange = () => {
    const pocEl = document.getElementById('comp_poc');
    const poc = pocEl ? pocEl.value : 'T 멤버십';
    const isWeb = (poc === 'Admin' || poc === 'PC Web');

    const deviceGroup = document.getElementById('comp_device_group');
    if (deviceGroup) deviceGroup.classList.toggle('d-none', isWeb);

    if (!isWeb) window.renderCompDevices();
    
    if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
};

window.renderCompDevices = () => {
    const andList = document.getElementById('comp_and_list');
    const iosList = document.getElementById('comp_ios_list');
    const andDevices = window.compDataCache.andDevices || [];
    const iosDevices = window.compDataCache.iosDevices || [];
    const defaultSelected = [...(window.compDataCache.andDefaultDevices || []), ...(window.compDataCache.iosDefaultDevices || [])];

    const render = (container, list, platform) => {
        if (!container) return;
        container.innerHTML = list.map(dev => {
            const chk = defaultSelected.includes(dev) ? 'checked' : '';
            return `<label class="pill-label"><input type="checkbox" class="pill-cb comp-dev-cb template-trigger" data-platform="${platform}" value="${dev}" ${chk}> ${dev}</label>`;
        }).join('');
    };

    render(andList, andDevices, 'android');
    render(iosList, iosDevices, 'ios');
};

window.getCompFormData = () => {
    return {
        check: document.getElementById('comp_check')?.value || '',
        poc: document.getElementById('comp_poc')?.value || '',
        rate: document.getElementById('comp_rate_num')?.value || '10',
        adminUrl: document.getElementById('comp_admin_url')?.value || '',
        pcUrl: document.getElementById('comp_pc_url')?.value || '',
        mode: document.getElementById('comp_mode')?.value || '',
        servers: Array.from(document.querySelectorAll('.comp-srv-cb:checked')).map(cb => cb.value),
        versions: Array.from(document.querySelectorAll('.comp-ver-cb:checked')).map(cb => cb.value),
        devices: Array.from(document.querySelectorAll('.comp-dev-cb:checked')).map(cb => cb.value)
    };
};

window.saveCompPreset = () => {
    const nameEl = document.getElementById('newCompPresetName');
    const name = nameEl ? nameEl.value.trim() : '';
    if (!name) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ 프리셋 이름을 입력해주세요.');
        return;
    }

    let presets = JSON.parse(localStorage.getItem('qa_comp_presets') || '{}');
    presets[name] = window.getCompFormData();
    localStorage.setItem('qa_comp_presets', JSON.stringify(presets));
    
    nameEl.value = '';
    window.renderCompPresets();
    if (typeof window.showToast === 'function') window.showToast('✅ 완료문 프리셋이 저장되었습니다.');
};

window.deleteCompPreset = () => {
    const selectEl = document.getElementById('compPresetSelect');
    const name = selectEl ? selectEl.value : '';
    if (!name) return;

    let presets = JSON.parse(localStorage.getItem('qa_comp_presets') || '{}');
    delete presets[name];
    localStorage.setItem('qa_comp_presets', JSON.stringify(presets));
    
    window.renderCompPresets();
    if (typeof window.showToast === 'function') window.showToast('🗑️ 프리셋이 삭제되었습니다.');
};

window.renderCompPresets = () => {
    const selectEl = document.getElementById('compPresetSelect');
    if (!selectEl) return;
    const presets = JSON.parse(localStorage.getItem('qa_comp_presets') || '{}');
    let html = '<option value="">💾 프리셋 선택...</option>';
    Object.keys(presets).forEach(name => {
        html += `<option value="${name}">${name}</option>`;
    });
    selectEl.innerHTML = html;
};

window.applyCompPreset = (name) => {
    if (!name) return;
    const presets = JSON.parse(localStorage.getItem('qa_comp_presets') || '{}');
    const data = presets[name];
    if (!data) return;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('comp_check', data.check);
    setVal('comp_poc', data.poc);
    setVal('comp_rate_num', data.rate);
    setVal('comp_admin_url', data.adminUrl);
    setVal('comp_pc_url', data.pcUrl);
    setVal('comp_mode', data.mode);

    document.querySelectorAll('.comp-srv-cb').forEach(cb => cb.checked = data.servers.includes(cb.value));
    document.querySelectorAll('.comp-ver-cb').forEach(cb => cb.checked = data.versions.includes(cb.value));
    
    window.handleCompPocChange();

    setTimeout(() => {
        document.querySelectorAll('.comp-dev-cb').forEach(cb => cb.checked = data.devices.includes(cb.value));
        if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
    }, 50);
};
