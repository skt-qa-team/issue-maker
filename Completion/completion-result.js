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
            const label = s === 'PRD' ? '상용(PRD)' : s;
            sList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-srv-cb template-trigger" value="${label}"> ${label}</label>`;
        });
    }

    const vList = document.getElementById('comp_version_list');
    if (vList) {
        vList.innerHTML = '';
        ['Android', 'iOS', '삼성인터넷', 'Safari', 'Chrome', 'Edge'].forEach(v => {
            vList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-ver-cb template-trigger" value="${v}"> ${v}</label>`;
        });
    }

    window.renderCompDevices();
    window.renderCompPresets();
    window.initCompletionInputEvents();
};

window.initCompletionInputEvents = () => {
    const container = document.querySelector('.completion-container');
    if (!container) return;

    container.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.id === 'btnSaveCompPreset') window.saveCompPreset();
        if (target.id === 'btnDeleteCompPreset') window.deleteCompPreset();
        
        if (target.classList.contains('btn-add-case')) {
            if (typeof window.addCase === 'function') {
                window.addCase(target.dataset.target);
                if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
            }
        }
        
        if (target.classList.contains('btn-apply-preset')) {
            if (typeof window.applyIndividualPreset === 'function') {
                window.applyIndividualPreset(target.dataset.target, parseInt(target.dataset.preset));
                if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
            }
        }
    });

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
};

window.renderCompDevices = () => {
    const andList = document.getElementById('comp_and_list');
    const iosList = document.getElementById('comp_ios_list');
    const andDevices = window.compDataCache.andDevices || [];
    const iosDevices = window.compDataCache.iosDevices || [];

    const render = (container, list, platform) => {
        if (!container) return;
        container.innerHTML = list.map(dev => {
            return `<label class="pill-label"><input type="checkbox" class="pill-cb comp-dev-cb template-trigger" data-platform="${platform}" value="${dev}"> ${dev}</label>`;
        }).join('');
    };

    render(andList, andDevices, 'android');
    render(iosList, iosDevices, 'ios');
};

window.getCompFormData = () => {
    const isChecked = (id) => {
        const el = document.getElementById(id);
        return el ? el.checked : true;
    };

    return {
        check: isChecked('toggle_check') ? (document.getElementById('comp_check')?.value || '') : '',
        rate: isChecked('toggle_rate') ? (document.getElementById('comp_rate_num')?.value || '') : '',
        adminUrl: isChecked('toggle_admin_url') ? (document.getElementById('comp_admin_url')?.value || '') : '',
        pcUrl: isChecked('toggle_pc_url') ? (document.getElementById('comp_pc_url')?.value || '') : '',
        mode: isChecked('toggle_mode') ? (document.getElementById('comp_mode')?.value || '') : '',
        servers: isChecked('toggle_server') ? Array.from(document.querySelectorAll('.comp-srv-cb:checked')).map(cb => cb.value) : [],
        versions: isChecked('toggle_version') ? Array.from(document.querySelectorAll('.comp-ver-cb:checked')).map(cb => cb.value) : [],
        devices: isChecked('toggle_device') ? Array.from(document.querySelectorAll('.comp-dev-cb:checked')).map(cb => cb.value) : []
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
    
    const selectEl = document.getElementById('compPresetSelect');
    if (selectEl) selectEl.value = name;
    
    if (typeof window.showToast === 'function') window.showToast('✅ 완료문 프리셋이 저장되었습니다.');
};

window.deleteCompPreset = () => {
    const selectEl = document.getElementById('compPresetSelect');
    const name = selectEl ? selectEl.value : '';
    if (!name) return;

    let presets = JSON.parse(localStorage.getItem('qa_comp_presets') || '{}');
    delete presets[name];
    localStorage.setItem('qa_comp_presets', JSON.stringify(presets));
    
    selectEl.value = '';
    window.renderCompPresets();
    
    if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
    if (typeof window.showToast === 'function') window.showToast('🗑️ 프리셋이 삭제되었습니다.');
};

window.renderCompPresets = () => {
    const selectEl = document.getElementById('compPresetSelect');
    if (!selectEl) return;
    const presets = JSON.parse(localStorage.getItem('qa_comp_presets') || '{}');
    
    const currentVal = selectEl.value;
    let html = '<option value="">💾 프리셋 선택...</option>';
    Object.keys(presets).forEach(name => {
        html += `<option value="${name}">${name}</option>`;
    });
    selectEl.innerHTML = html;
    
    if (presets[currentVal]) {
        selectEl.value = currentVal;
    }
};

window.applyCompPreset = (name) => {
    if (!name) return;
    const presets = JSON.parse(localStorage.getItem('qa_comp_presets') || '{}');
    const data = presets[name];
    if (!data) return;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('comp_check', data.check);
    setVal('comp_rate_num', data.rate);
    setVal('comp_admin_url', data.adminUrl);
    setVal('comp_pc_url', data.pcUrl);
    setVal('comp_mode', data.mode);

    document.querySelectorAll('.comp-srv-cb').forEach(cb => cb.checked = data.servers.includes(cb.value));
    document.querySelectorAll('.comp-ver-cb').forEach(cb => cb.checked = data.versions.includes(cb.value));
    document.querySelectorAll('.comp-dev-cb').forEach(cb => cb.checked = data.devices.includes(cb.value));
    
    if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
};
