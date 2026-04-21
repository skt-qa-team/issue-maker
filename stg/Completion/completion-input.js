window.compDataCache = {};

window.initCompletionInput = () => {
    console.log("[Diagnostic] initCompletionInput started");
    try {
        window.compDataCache = (typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master'))) || {};
        console.log("[Diagnostic] compDataCache loaded:", window.compDataCache);

        const sList = document.getElementById('comp_server_list');
        if (sList) {
            sList.innerHTML = '';
            ['STG', 'GRN', 'PRD'].forEach(s => {
                const label = s === 'PRD' ? '상용(PRD)' : s;
                sList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-srv-cb template-trigger" value="${label}"> ${label}</label>`;
            });
        } else {
            console.error("[Diagnostic] comp_server_list not found");
        }

        const vList = document.getElementById('comp_version_list');
        if (vList) {
            vList.innerHTML = '';
            ['Android', 'iOS', '삼성인터넷', 'Safari', 'Chrome', 'Edge'].forEach(v => {
                vList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-ver-cb template-trigger" value="${v}"> ${v}</label>`;
            });
        } else {
            console.error("[Diagnostic] comp_version_list not found");
        }

        window.renderCompDevices();
        window.renderCompPresets();
        window.initCompletionInputEvents();

        if (typeof window.updateCompletionPreview === 'function') {
            console.log("[Diagnostic] Calling initial updateCompletionPreview");
            window.updateCompletionPreview();
        } else {
            console.error("[Diagnostic] updateCompletionPreview is NOT defined");
        }
    } catch (e) {
        console.error("[Diagnostic] Critical Error in initCompletionInput:", e);
    }
};

window.initCompletionInputEvents = () => {
    console.log("[Diagnostic] initCompletionInputEvents started");
    const container = document.getElementById('panel-completion');
    
    if (!container) {
        console.error("[Diagnostic] panel-completion container NOT found. Events cannot be bound.");
        return;
    }

    if (container.dataset.eventsBound) {
        console.warn("[Diagnostic] Events already bound, skipping to prevent duplicates.");
        return;
    }
    
    container.dataset.eventsBound = 'true';
    console.log("[Diagnostic] Events successfully bound to panel-completion");

    container.addEventListener('input', (e) => {
        if (e.target.classList.contains('template-trigger')) {
            console.log("[Diagnostic] input event triggered by:", e.target.id || e.target.className);
            window.diagnosticUpdatePreview();
        }
    });

    container.addEventListener('change', (e) => {
        if (e.target.classList.contains('template-trigger')) {
            console.log("[Diagnostic] change event triggered by:", e.target.id || e.target.className, "Value/Checked:", e.target.value, e.target.checked);
            window.diagnosticUpdatePreview();
        }
        if (e.target.id === 'compPresetSelect') {
            if (typeof window.applyCompPreset === 'function') window.applyCompPreset(e.target.value);
        }
    });

    container.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.id === 'btnSaveCompPreset') window.saveCompPreset();
        if (target.id === 'btnDeleteCompPreset') window.deleteCompPreset();
        
        if (target.classList.contains('btn-add-case')) {
            if (typeof window.addCase === 'function') {
                window.addCase(target.dataset.target);
                window.diagnosticUpdatePreview();
            }
        }
        
        if (target.classList.contains('btn-apply-preset')) {
            if (typeof window.applyIndividualPreset === 'function') {
                window.applyIndividualPreset(target.dataset.target, parseInt(target.dataset.preset));
                window.diagnosticUpdatePreview();
            }
        }
    });
};

window.diagnosticUpdatePreview = () => {
    try {
        console.log("[Diagnostic] Attempting to update preview. Current FormData:", window.getCompFormData());
        if (typeof window.updateCompletionPreview === 'function') {
            window.updateCompletionPreview();
            console.log("[Diagnostic] Preview updated successfully.");
        } else {
            console.error("[Diagnostic] updateCompletionPreview is undefined.");
        }
    } catch (e) {
        console.error("[Diagnostic] Error during preview update:", e);
    }
};

window.renderCompDevices = () => {
    try {
        const andList = document.getElementById('comp_and_list');
        const iosList = document.getElementById('comp_ios_list');
        const andDevices = window.compDataCache.andDevices || [];
        const iosDevices = window.compDataCache.iosDevices || [];

        const render = (container, list, platform) => {
            if (!container) {
                console.error("[Diagnostic] Device container not found for platform:", platform);
                return;
            }
            container.innerHTML = list.map(dev => {
                return `<label class="pill-label"><input type="checkbox" class="pill-cb comp-dev-cb template-trigger" data-platform="${platform}" value="${dev}"> ${dev}</label>`;
            }).join('');
        };

        render(andList, andDevices, 'android');
        render(iosList, iosDevices, 'ios');
        console.log("[Diagnostic] Devices rendered");
    } catch (e) {
        console.error("[Diagnostic] Error in renderCompDevices:", e);
    }
};

window.getCompFormData = () => {
    try {
        const isChecked = (id) => {
            const el = document.getElementById(id);
            if (!el) console.warn("[Diagnostic] Toggle checkbox not found:", id);
            return el ? el.checked : true;
        };

        const data = {
            check: isChecked('toggle_check') ? (document.getElementById('comp_check')?.value || '') : '',
            rate: isChecked('toggle_rate') ? (document.getElementById('comp_rate_num')?.value || '') : '',
            adminUrl: isChecked('toggle_admin_url') ? (document.getElementById('comp_admin_url')?.value || '') : '',
            pcUrl: isChecked('toggle_pc_url') ? (document.getElementById('comp_pc_url')?.value || '') : '',
            mode: isChecked('toggle_mode') ? (document.getElementById('comp_mode')?.value || '') : '',
            servers: isChecked('toggle_server') ? Array.from(document.querySelectorAll('.comp-srv-cb:checked')).map(cb => cb.value) : [],
            versions: isChecked('toggle_version') ? Array.from(document.querySelectorAll('.comp-ver-cb:checked')).map(cb => cb.value) : [],
            devices: isChecked('toggle_device') ? Array.from(document.querySelectorAll('.comp-dev-cb:checked')).map(cb => cb.value) : []
        };
        return data;
    } catch (e) {
        console.error("[Diagnostic] Error in getCompFormData:", e);
        return {};
    }
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
    
    window.diagnosticUpdatePreview();
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
    
    window.diagnosticUpdatePreview();
};
