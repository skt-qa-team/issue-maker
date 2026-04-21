window.compDataCache = {};

window.initCompletionInput = () => {
    try {
        window.compDataCache = (typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master'))) || {};
        
        // [추가] 1. 환경설정 값(Admin/PC URL) 자동 바인딩
        const adminInput = document.getElementById('comp_admin_url');
        const pcInput = document.getElementById('comp_pc_url');
        if (adminInput && window.compDataCache.adminUrl) adminInput.value = window.compDataCache.adminUrl;
        if (pcInput && window.compDataCache.pcUrl) pcInput.value = window.compDataCache.pcUrl;

        const sList = document.getElementById('comp_server_list');
        if (sList) {
            sList.innerHTML = '';
            ['STG', 'GRN', 'PRD'].forEach(s => {
                const label = s === 'PRD' ? '상용(PRD)' : s;
                // [수정] 3. STG를 기본값으로 체크
                const isChecked = s === 'STG' ? 'checked' : '';
                sList.innerHTML += `<label class="checkbox-label"><input type="checkbox" class="comp-srv-cb template-trigger" value="${label}" ${isChecked}> ${label}</label>`;
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

        if (typeof window.updateCompletionPreview === 'function') {
            window.updateCompletionPreview();
        }
    } catch (e) {
        console.error("initCompletionInput Error:", e);
    }
};

window.initCompletionInputEvents = () => {
    try {
        const container = document.getElementById('panel-completion');
        if (!container) throw new Error("panel-completion element not found");

        if (container.dataset.eventsBound) return;
        container.dataset.eventsBound = 'true';

        container.addEventListener('input', (e) => {
            if (e.target.classList.contains('template-trigger')) {
                if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
            }
        });

        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('template-trigger')) {
                // [추가] 2. 단말 체크박스 변경 시 UI 피드백 동기화
                if (e.target.classList.contains('comp-dev-cb')) {
                    window.syncCompDeviceHighlight();
                }
                if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
            }
            if (e.target.id === 'compPresetSelect') {
                if (typeof window.applyCompPreset === 'function') window.applyCompPreset(e.target.value);
            }
        });

        container.addEventListener('click', (e) => {
            const target = e.target;
            if (target.id === 'btnSaveCompPreset') window.saveCompPreset();
            // [추가] 4. 프리셋 수정 버튼 이벤트 바인딩
            if (target.id === 'btnEditCompPreset') window.editCompPreset();
            if (target.id === 'btnDeleteCompPreset') window.deleteCompPreset();
        });
    } catch (e) {
        console.error("initCompletionInputEvents Error:", e);
    }
};

// [추가] 2. 단말 UI 피드백(Active 클래스 토글) 함수
window.syncCompDeviceHighlight = () => {
    try {
        document.querySelectorAll('.comp-dev-cb').forEach(cb => {
            const label = cb.closest('.pill-label');
            if (label) {
                if (cb.checked) label.classList.add('active');
                else label.classList.remove('active');
            }
        });
    } catch (e) {
        console.error("syncCompDeviceHighlight Error:", e);
    }
};

window.renderCompDevices = () => {
    try {
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
        
        // [추가] 2. 렌더링 직후 UI 피드백 동기화
        window.syncCompDeviceHighlight();
    } catch (e) {
        console.error("renderCompDevices Error:", e);
    }
};

window.getCompFormData = () => {
    try {
        const isChecked = (id) => {
            const el = document.getElementById(id);
            return el ? el.checked : true;
        };

        return {
            check: isChecked('toggle_check') ? (document.getElementById('comp_check')?.value || '') : '',
            rate: isChecked('toggle_rate') ? (document.getElementById('comp_rate_num')?.value || '') : '',
            adminUrl: isChecked('toggle_admin_url') ? (document.getElementById('comp_admin_url')?.value || '') : '',
            pcUrl: isChecked('toggle_pc_url') ? (document.getElementById('comp_pc_url')?.value || '') : '',
            mode: isChecked('toggle_mode') ? Array.from(document.querySelectorAll('.comp-mode-cb:checked')).map(cb => cb.value) : [],
            servers: isChecked('toggle_server') ? Array.from(document.querySelectorAll('.comp-srv-cb:checked')).map(cb => cb.value) : [],
            versions: isChecked('toggle_version') ? Array.from(document.querySelectorAll('.comp-ver-cb:checked')).map(cb => cb.value) : [],
            devices: isChecked('toggle_device') ? Array.from(document.querySelectorAll('.comp-dev-cb:checked')).map(cb => cb.value) : []
        };
    } catch (e) {
        console.error("getCompFormData Error:", e);
        return {};
    }
};

window.saveCompPreset = () => {
    try {
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
    } catch (e) {
        console.error("saveCompPreset Error:", e);
    }
};

// [추가] 4. 기존 프리셋을 현재 폼 데이터로 덮어씌우는 수정 함수
window.editCompPreset = () => {
    try {
        const selectEl = document.getElementById('compPresetSelect');
        const name = selectEl ? selectEl.value : '';
        if (!name) {
            if (typeof window.showToast === 'function') window.showToast('⚠️ 수정할 프리셋을 먼저 선택해주세요.');
            return;
        }

        let presets = JSON.parse(localStorage.getItem('qa_comp_presets') || '{}');
        presets[name] = window.getCompFormData();
        localStorage.setItem('qa_comp_presets', JSON.stringify(presets));
        
        if (typeof window.showToast === 'function') window.showToast(`✅ [${name}] 프리셋이 수정되었습니다.`);
    } catch (e) {
        console.error("editCompPreset Error:", e);
    }
};

window.deleteCompPreset = () => {
    try {
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
    } catch (e) {
        console.error("deleteCompPreset Error:", e);
    }
};

window.renderCompPresets = () => {
    try {
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
    } catch (e) {
        console.error("renderCompPresets Error:", e);
    }
};

window.applyCompPreset = (name) => {
    try {
        if (!name) return;
        const presets = JSON.parse(localStorage.getItem('qa_comp_presets') || '{}');
        const data = presets[name];
        if (!data) return;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        setVal('comp_check', data.check);
        setVal('comp_rate_num', data.rate);
        setVal('comp_admin_url', data.adminUrl);
        setVal('comp_pc_url', data.pcUrl);

        const savedMode = data.mode || [];
        const modeArray = Array.isArray(savedMode) ? savedMode : [savedMode];
        document.querySelectorAll('.comp-mode-cb').forEach(cb => cb.checked = modeArray.includes(cb.value));

        document.querySelectorAll('.comp-srv-cb').forEach(cb => cb.checked = (data.servers || []).includes(cb.value));
        document.querySelectorAll('.comp-ver-cb').forEach(cb => cb.checked = (data.versions || []).includes(cb.value));
        document.querySelectorAll('.comp-dev-cb').forEach(cb => cb.checked = (data.devices || []).includes(cb.value));
        
        // [추가] 2. 프리셋 적용 후 단말 UI 피드백 동기화
        window.syncCompDeviceHighlight();
        
        if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
    } catch (e) {
        console.error("applyCompPreset Error:", e);
    }
};
