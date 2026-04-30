window.QA_CORE = window.QA_CORE || {};
window.QA_CORE.CONSTANTS = window.QA_CORE.CONSTANTS || {};
window.QA_CORE.CONSTANTS.INPUT_FORM = {
    DEFAULT_PREFIX_ORDER: [
        { id: 'env', order: 1 },
        { id: 'os', order: 2 },
        { id: 'poc', order: 3 },
        { id: 'critical', order: 4 },
        { id: 'device', order: 5 },
        { id: 'account', order: 6 },
        { id: 'page', order: 7 }
    ],
    PRESET_LIMIT: 10,
    MAX_NAME_LENGTH: 20
};

window.QA_CORE.InputForm = {
    State: {
        isInitialRender: true,
        presets: {}
    },

    initEvents: () => {
        window.QA_CORE.InputForm.loadPrefixOrder();
        window.QA_CORE.InputForm.fetchPresets();
    },

    addCase: (targetId) => {
        const el = document.getElementById(targetId);
        if (!el) return;
        const currentVal = el.value.trim();
        const caseMatch = currentVal.match(/CASE (\d+)\./g);
        const nextNum = caseMatch ? caseMatch.length + 1 : 1;
        const prefix = currentVal ? '\n\n' : '';
        el.value += `${prefix}CASE ${nextNum}.\n`;
        el.focus();
        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        }
    },

    resetCase: (targetId) => {
        const el = document.getElementById(targetId);
        if (!el) return;
        el.value = '';
        el.focus();
        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        }
    },

    saveDraft: () => {
        const fields = ['title', 'prefix_env', 'prefix_env_custom', 'osType', 'osType_custom', 'poc', 'poc_custom', 'prefix_critical', 'prefix_critical_custom', 'prefix_device_input', 'prefix_account', 'prefix_page', 'appVersion', 'targetUrl', 'aiMode', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'];
        const data = {};
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) data[id] = el.value;
        });
        data.selectedDevices = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);
        data.selectedServers = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
        data.selectedVerCbs = Array.from(document.querySelectorAll('.ver-type-cb:checked')).map(cb => cb.id);
        localStorage.setItem('skm_draft', JSON.stringify(data));
    },

    loadDraft: () => {
        const raw = localStorage.getItem('skm_draft');
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            Object.entries(data).forEach(([id, val]) => {
                const el = document.getElementById(id);
                if (el && !['selectedDevices', 'selectedServers', 'selectedVerCbs'].includes(id)) {
                    el.value = val || '';
                    if (id.includes('_custom')) {
                        const baseId = id.replace('_custom', '');
                        const baseEl = document.getElementById(baseId);
                        if (baseEl && baseEl.value === 'direct') el.classList.remove('d-none');
                    }
                }
            });
            if (data.selectedVerCbs) data.selectedVerCbs.forEach(id => { const cb = document.getElementById(id); if (cb) cb.checked = true; });
            if (data.selectedServers) document.querySelectorAll('.issue-server-cb').forEach(cb => cb.checked = data.selectedServers.includes(cb.value));
            window.QA_CORE.InputForm.syncEnvironment();
            if (data.selectedDevices) {
                setTimeout(() => {
                    data.selectedDevices.forEach(dev => {
                        const cb = document.querySelector(`.issue-device-cb[value="${dev}"]`);
                        if (cb) cb.checked = true;
                    });
                    if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
                        window.QA_CORE.ResultForm.generate();
                    }
                }, 100);
            }
        } catch (e) {
            if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Draft Load Error');
        }
    },

    applyAndSavePrefixOrder: () => {
        const inputs = document.querySelectorAll('.prefix-order-input');
        let orderArray = [];
        inputs.forEach(input => {
            let val = parseInt(input.value);
            if (isNaN(val) || val < 1) val = 1;
            if (val > 7) val = 7;
            input.value = val;
            orderArray.push({ id: input.dataset.target, order: val });
        });
        orderArray.sort((a, b) => a.order - b.order);
        const container = document.getElementById('prefixContainer');
        if (container) {
            orderArray.forEach(item => {
                const el = container.querySelector(`.prefix-item[data-id="${item.id}"]`);
                if (el) container.appendChild(el);
            });
        }
        localStorage.setItem('qa_prefix_order_map_v3', JSON.stringify(orderArray));
        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        }
        if(window.QA_CORE.UI) window.QA_CORE.UI.showToast('✅ Prefix 순서가 저장되었습니다.', 'success');
    },

    resetPrefixOrder: () => {
        localStorage.removeItem('qa_prefix_order_map_v3');
        document.querySelectorAll('.prefix-order-input').forEach(input => {
            const defaultItem = window.QA_CORE.CONSTANTS.INPUT_FORM.DEFAULT_PREFIX_ORDER.find(item => item.id === input.dataset.target);
            if (defaultItem) input.value = defaultItem.order;
        });
        const container = document.getElementById('prefixContainer');
        if (container) {
            window.QA_CORE.CONSTANTS.INPUT_FORM.DEFAULT_PREFIX_ORDER.forEach(item => {
                const el = container.querySelector(`.prefix-item[data-id="${item.id}"]`);
                if (el) container.appendChild(el);
            });
        }
        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        }
        if(window.QA_CORE.UI) window.QA_CORE.UI.showToast('🔄 Prefix 순서가 초기화되었습니다.', 'info');
    },

    loadPrefixOrder: () => {
        const saved = localStorage.getItem('qa_prefix_order_map_v3');
        const container = document.getElementById('prefixContainer');
        if (!container) return;
        if (saved) {
            try {
                const orderArray = JSON.parse(saved);
                orderArray.forEach(item => {
                    const input = document.querySelector(`.prefix-order-input[data-target="${item.id}"]`);
                    if (input) input.value = item.order;
                });
                orderArray.sort((a, b) => a.order - b.order).forEach(item => {
                    const el = container.querySelector(`.prefix-item[data-id="${item.id}"]`);
                    if (el) container.appendChild(el);
                });
            } catch (e) { 
                window.QA_CORE.InputForm.resetPrefixOrder(); 
            }
        } else { 
            window.QA_CORE.InputForm.resetPrefixOrder(); 
        }
    },

    getFormData: () => {
        return {
            title: document.getElementById('title')?.value.trim() || '',
            prefix_env: document.getElementById('prefix_env')?.value || '',
            prefix_env_custom: document.getElementById('prefix_env_custom')?.value.trim() || '',
            osType: document.getElementById('osType')?.value || '',
            osType_custom: document.getElementById('osType_custom')?.value.trim() || '',
            poc: document.getElementById('poc')?.value || '',
            poc_custom: document.getElementById('poc_custom')?.value.trim() || '',
            prefix_critical: document.getElementById('prefix_critical')?.value || '',
            prefix_critical_custom: document.getElementById('prefix_critical_custom')?.value.trim() || '',
            prefix_browser_none: document.getElementById('prefix_browser_none')?.checked || false,
            prefix_browser_custom: document.getElementById('prefix_browser_custom')?.value.trim() || '',
            prefix_device_input: document.getElementById('prefix_device_input')?.value.trim() || '',
            prefix_account: document.getElementById('prefix_account')?.value.trim() || '',
            prefix_page: document.getElementById('prefix_page')?.value.trim() || '',
            targetUrl: document.getElementById('targetUrl')?.value.trim() || '',
            aiMode: document.getElementById('aiMode')?.value || '',
            preCondition: document.getElementById('preCondition')?.value || '',
            steps: document.getElementById('steps')?.value || '',
            actualResult: document.getElementById('actualResult')?.value || '',
            expectedResult: document.getElementById('expectedResult')?.value || '',
            ref_prd: document.getElementById('ref_prd')?.value || '',
            ref_notes: document.getElementById('ref_notes')?.value || '',
            servers: Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(e => e.value),
            devices: Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(e => e.value),
            browsers: Array.from(document.querySelectorAll('.prefix-browser-cb:checked')).map(e => e.value),
            versions: Array.from(document.querySelectorAll('.ver-type-cb:checked')).map(e => e.value),
            and_dev_mode: document.querySelector('input[name="and_dev_mode"]:checked')?.value || 'normal',
            ios_dev_mode: document.querySelector('input[name="ios_dev_mode"]:checked')?.value || 'normal',
            ios_ver_type: document.querySelector('input[name="ios_ver_type"]:checked')?.value || 'TestFlight'
        };
    },

    fetchPresets: () => {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.database) {
                firebase.auth().onAuthStateChanged((user) => {
                    if (user && !user.isAnonymous) {
                        const path = window.QA_CORE.CONSTANTS?.FIREBASE_PATHS?.PRESETS || 'presets';
                        firebase.database().ref(`users/${user.uid}/${path}`).on('value', (snapshot) => {
                            const rawPresets = snapshot.val() || {};
                            const decodedPresets = {};
                            Object.keys(rawPresets).forEach(encodedKey => {
                                try {
                                    const decodedKey = (window.QA_CORE.Utils && window.QA_CORE.Utils.decodeSafeKey) 
                                        ? window.QA_CORE.Utils.decodeSafeKey(encodedKey) 
                                        : decodeURIComponent(encodedKey);
                                    decodedPresets[decodedKey] = rawPresets[encodedKey];
                                } catch (err) {
                                    decodedPresets[encodedKey] = rawPresets[encodedKey];
                                }
                            });
                            window.QA_CORE.InputForm.State.presets = decodedPresets;
                            window.QA_CORE.InputForm.renderPresets();
                        }, (error) => {
                            if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(error, 'Preset Firebase Fetch');
                        });
                    }
                });
            }
        } catch (e) {
            if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Fetch Presets From Firebase');
        }
    },

    renderPresets: () => {
        const presets = window.QA_CORE.InputForm.State.presets || {};
        const selectEl = document.getElementById('inputPresetSelect');
        if (!selectEl) return;
        const currentVal = selectEl.value;
        let html = '<option value="">💾 프리셋 선택...</option>';
        Object.keys(presets).forEach(name => {
            const safeName = (window.QA_CORE.Utils && window.QA_CORE.Utils.escapeHTML) ? window.QA_CORE.Utils.escapeHTML(name) : name;
            html += `<option value="${safeName}">${safeName}</option>`;
        });
        selectEl.innerHTML = html;
        if (presets[currentVal]) {
            selectEl.value = currentVal;
        } else {
            selectEl.value = '';
            const editBtn = document.getElementById('btnEditPreset');
            if(editBtn) editBtn.classList.add('d-none');
        }
    },

    handleDropdown: () => {
        const selectEl = document.getElementById('inputPresetSelect');
        const editBtn = document.getElementById('btnEditPreset');
        const nameInput = document.getElementById('newPresetName');
        if (!selectEl) return;
        const name = selectEl.value;
        if (nameInput) nameInput.value = name;
        if (name) {
            if (editBtn) editBtn.classList.remove('d-none');
            window.QA_CORE.InputForm.applyPreset(name);
        } else {
            if (editBtn) editBtn.classList.add('d-none');
        }
    },

    savePreset: () => {
        const nameInput = document.getElementById('newPresetName');
        const name = nameInput ? nameInput.value.trim() : '';
        const limit = window.QA_CORE.CONSTANTS.INPUT_FORM.PRESET_LIMIT;
        const maxLen = window.QA_CORE.CONSTANTS.INPUT_FORM.MAX_NAME_LENGTH;

        if (!name) {
            if(window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 프리셋 이름을 입력해주세요.', 'warning');
            return;
        }
        if (name.length > maxLen) {
            if(window.QA_CORE.UI) window.QA_CORE.UI.showToast(`⚠️ 프리셋 이름은 ${maxLen}자를 초과할 수 없습니다.`, 'warning');
            return;
        }
        
        const presets = window.QA_CORE.InputForm.State.presets || {};
        if (Object.keys(presets).length >= limit && !presets[name]) {
            if(window.QA_CORE.UI) window.QA_CORE.UI.showToast(`⚠️ 프리셋은 최대 ${limit}개까지만 저장 가능합니다.`, 'warning');
            return;
        }

        const newData = window.QA_CORE.InputForm.getFormData();
        const encodedName = (window.QA_CORE.Utils && window.QA_CORE.Utils.encodeSafeKey) ? window.QA_CORE.Utils.encodeSafeKey(name) : encodeURIComponent(name);
        const btnSave = document.getElementById('btnSavePreset');
        
        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            if(window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnSavePreset', true);
            if(btnSave) btnSave.disabled = true;

            const uid = firebase.auth().currentUser.uid;
            const path = window.QA_CORE.CONSTANTS?.FIREBASE_PATHS?.PRESETS || 'presets';
            
            firebase.database().ref(`users/${uid}/${path}/${encodedName}`).set(newData).then(() => {
                if (nameInput) nameInput.value = '';
                const selectEl = document.getElementById('inputPresetSelect');
                if (selectEl) {
                    selectEl.value = name;
                    window.QA_CORE.InputForm.handleDropdown();
                }
                if(window.QA_CORE.UI) window.QA_CORE.UI.showToast('✅ 프리셋 저장 성공', 'success');
            }).catch(err => {
                if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Save Preset Firebase');
                if(window.QA_CORE.UI) window.QA_CORE.UI.showToast('❌ 저장 실패', 'error');
            }).finally(() => {
                if(window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnSavePreset', false);
                if(btnSave) btnSave.disabled = false;
            });
        }
    },

    editPreset: () => {
        const selectEl = document.getElementById('inputPresetSelect');
        const originalName = selectEl ? selectEl.value : '';
        const maxLen = window.QA_CORE.CONSTANTS.INPUT_FORM.MAX_NAME_LENGTH;

        if (!originalName) {
            if(window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 수정할 프리셋을 선택해주세요.', 'warning');
            return;
        }

        const nameInput = document.getElementById('newPresetName');
        const newName = nameInput ? nameInput.value.trim() : originalName;
        if (!newName) {
            if(window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 프리셋 이름을 입력해주세요.', 'warning');
            return;
        }
        if (newName.length > maxLen) {
            if(window.QA_CORE.UI) window.QA_CORE.UI.showToast(`⚠️ 프리셋 이름은 ${maxLen}자를 초과할 수 없습니다.`, 'warning');
            return;
        }

        const newData = window.QA_CORE.InputForm.getFormData();
        const btnEdit = document.getElementById('btnEditPreset');

        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            if(window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnEditPreset', true);
            if(btnEdit) btnEdit.disabled = true;

            const uid = firebase.auth().currentUser.uid;
            const path = window.QA_CORE.CONSTANTS?.FIREBASE_PATHS?.PRESETS || 'presets';
            const presetsRef = firebase.database().ref(`users/${uid}/${path}`);
            
            const encodedNewName = (window.QA_CORE.Utils && window.QA_CORE.Utils.encodeSafeKey) ? window.QA_CORE.Utils.encodeSafeKey(newName) : encodeURIComponent(newName);
            const encodedOriginalName = (window.QA_CORE.Utils && window.QA_CORE.Utils.encodeSafeKey) ? window.QA_CORE.Utils.encodeSafeKey(originalName) : encodeURIComponent(originalName);
            
            if (newName !== originalName) {
                const updates = {};
                updates[encodedOriginalName] = null;
                updates[encodedNewName] = newData;
                presetsRef.update(updates).then(() => {
                    if (selectEl) selectEl.value = newName;
                    if(window.QA_CORE.UI) window.QA_CORE.UI.showToast(`✏️ 프리셋 '${newName}' 수정 완료`, 'success');
                }).catch(err => {
                    if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Edit Preset Firebase');
                }).finally(() => {
                    if(window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnEditPreset', false);
                    if(btnEdit) btnEdit.disabled = false;
                });
            } else {
                presetsRef.child(encodedOriginalName).set(newData).then(() => {
                    if(window.QA_CORE.UI) window.QA_CORE.UI.showToast(`✏️ 프리셋 '${newName}' 수정 완료`, 'success');
                }).catch(err => {
                    if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Edit Preset Firebase');
                }).finally(() => {
                    if(window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnEditPreset', false);
                    if(btnEdit) btnEdit.disabled = false;
                });
            }
        }
    },

    deletePreset: () => {
        const selectEl = document.getElementById('inputPresetSelect');
        if (!selectEl || !selectEl.value) {
            if(window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 삭제할 프리셋을 선택해주세요.', 'warning');
            return;
        }
        
        const name = selectEl.value;
        if (!confirm(`정말 프리셋 '${name}'을(를) 삭제하시겠습니까?`)) return;

        const encodedName = (window.QA_CORE.Utils && window.QA_CORE.Utils.encodeSafeKey) ? window.QA_CORE.Utils.encodeSafeKey(name) : encodeURIComponent(name);
        const btnDelete = document.getElementById('btnDeletePreset');
        
        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            if(window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnDeletePreset', true);
            if(btnDelete) btnDelete.disabled = true;

            const uid = firebase.auth().currentUser.uid;
            const path = window.QA_CORE.CONSTANTS?.FIREBASE_PATHS?.PRESETS || 'presets';
            
            firebase.database().ref(`users/${uid}/${path}/${encodedName}`).remove().then(() => {
                selectEl.value = '';
                const nameInput = document.getElementById('newPresetName');
                if (nameInput) nameInput.value = '';
                window.QA_CORE.InputForm.handleDropdown();
                if(window.QA_CORE.UI) window.QA_CORE.UI.showToast('🗑️ 프리셋 삭제 완료', 'success');
            }).catch(err => {
                if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Delete Preset Firebase');
            }).finally(() => {
                if(window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnDeletePreset', false);
                if(btnDelete) btnDelete.disabled = false;
            });
        }
    },

    applyPreset: (name) => {
        const nameInput = document.getElementById('newPresetName');
        if (nameInput) nameInput.value = name || '';

        const presets = window.QA_CORE.InputForm.State.presets || {};
        const data = presets[name];
        if (!data) return;

        window.QA_CORE.InputForm.State.isInitialRender = false;

        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        const setCheck = (id, checked) => { const el = document.getElementById(id); if (el) el.checked = checked; };
        const toggleDnone = (id, isCustom) => { const el = document.getElementById(id); if (el) el.classList.toggle('d-none', !isCustom); };

        setVal('title', data.title);
        setVal('prefix_env', data.prefix_env);
        setVal('prefix_env_custom', data.prefix_env_custom);
        setVal('osType', data.osType);
        setVal('osType_custom', data.osType_custom);
        setVal('poc', data.poc);
        setVal('poc_custom', data.poc_custom);
        setVal('prefix_critical', data.prefix_critical);
        setVal('prefix_critical_custom', data.prefix_critical_custom);
        setCheck('prefix_browser_none', data.prefix_browser_none);
        setVal('prefix_browser_custom', data.prefix_browser_custom);
        setVal('prefix_device_input', data.prefix_device_input);
        setVal('prefix_account', data.prefix_account);
        setVal('prefix_page', data.prefix_page);
        setVal('targetUrl', data.targetUrl);
        setVal('aiMode', data.aiMode);
        setVal('preCondition', data.preCondition);
        setVal('steps', data.steps);
        setVal('actualResult', data.actualResult);
        setVal('expectedResult', data.expectedResult);
        setVal('ref_prd', data.ref_prd);
        setVal('ref_notes', data.ref_notes);

        document.querySelectorAll('.issue-server-cb').forEach(cb => cb.checked = data.servers?.includes(cb.value));
        document.querySelectorAll('.prefix-browser-cb').forEach(cb => cb.checked = data.browsers?.includes(cb.value));

        const andModeEl = document.querySelector(`input[name="and_dev_mode"][value="${data.and_dev_mode}"]`);
        if (andModeEl) andModeEl.checked = true;
        const iosModeEl = document.querySelector(`input[name="ios_dev_mode"][value="${data.ios_dev_mode}"]`);
        if (iosModeEl) iosModeEl.checked = true;
        const iosVerEl = document.querySelector(`input[name="ios_ver_type"][value="${data.ios_ver_type}"]`);
        if (iosVerEl) iosVerEl.checked = true;

        toggleDnone('prefix_env_custom', data.prefix_env === 'direct');
        toggleDnone('osType_custom', data.osType === 'direct');
        toggleDnone('poc_custom', data.poc === 'direct');
        toggleDnone('prefix_critical_custom', data.prefix_critical === 'direct');

        const browserCustomEl = document.getElementById('prefix_browser_custom');
        if (browserCustomEl) browserCustomEl.classList.toggle('d-none', !data.browsers?.includes('기타'));

        const deviceInputEl = document.getElementById('prefix_device_input');
        if (deviceInputEl) deviceInputEl.classList.toggle('d-none', !data.prefix_browser_none);

        window.QA_CORE.InputForm.switchDeviceMode('and', data.and_dev_mode || 'normal');
        window.QA_CORE.InputForm.switchDeviceMode('ios', data.ios_dev_mode || 'normal');
        window.QA_CORE.InputForm.handlePocChange();
        window.QA_CORE.InputForm.syncEnvironment();

        document.querySelectorAll('.issue-device-cb').forEach(cb => { cb.checked = data.devices?.includes(cb.value); });
        document.querySelectorAll('.ver-type-cb').forEach(cb => cb.checked = data.versions?.includes(cb.value));

        window.QA_CORE.InputForm.updateVersionTextbox();
        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        }
    },

    toggleCustomInput: (id) => {
        const selectEl = document.getElementById(id);
        const customEl = document.getElementById(id + '_custom');
        if(selectEl && customEl) {
            customEl.classList.toggle('d-none', selectEl.value !== 'direct');
            if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
                window.QA_CORE.ResultForm.generate();
            }
        }
    },

    handleOsChange: () => {
        const target = document.getElementById('osType');
        if(!target) return;
        const customEl = document.getElementById('osType_custom');
        if(customEl) customEl.classList.toggle('d-none', target.value !== 'direct');
        window.QA_CORE.InputForm.syncEnvironment();
    },

    handleBrowserNone: (el) => {
        if (el.checked) {
            document.querySelectorAll('.prefix-browser-cb').forEach(cb => cb.checked = false);
            const customInput = document.getElementById('prefix_browser_custom');
            const deviceInput = document.getElementById('prefix_device_input');
            if (customInput) customInput.classList.add('d-none');
            if (deviceInput) deviceInput.classList.remove('d-none');
        }
        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        }
    },

    toggleBrowserCustom: () => {
        const etcCb = document.getElementById('prefix_browser_etc');
        const noneCb = document.getElementById('prefix_browser_none');
        const customInput = document.getElementById('prefix_browser_custom');
        const deviceInput = document.getElementById('prefix_device_input');

        const anyChecked = Array.from(document.querySelectorAll('.prefix-browser-cb')).some(cb => cb.checked);
        if (anyChecked && noneCb) {
            noneCb.checked = false;
            if (deviceInput) deviceInput.classList.add('d-none');
        }
        
        if (customInput) {
            customInput.classList.toggle('d-none', !(etcCb && etcCb.checked));
        }

        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        }
    },

    updateVersionCheckboxes: () => {
        const osEl = document.getElementById('osType');
        const pocEl = document.getElementById('poc');
        if (!osEl || !pocEl) return;
        
        const osType = osEl.value;
        const poc = pocEl.value;
        const isPureWeb = poc === 'Admin' || poc === 'PC Web';

        const cbList = ['ver_cb_android', 'ver_cb_ios', 'ver_cb_samsung', 'ver_cb_safari', 'ver_cb_chrome', 'ver_cb_edge'];
        cbList.forEach(id => { const el = document.getElementById(id); if (el) el.checked = false; });

        if (!isPureWeb) {
            const multiOs = ["Android/iOS", "Android", "iOS", "모바일", "태블릿", "모바일/태블릿", "direct"];
            if (multiOs.includes(osType)) {
                if (document.getElementById('ver_cb_android')) document.getElementById('ver_cb_android').checked = true;
                if (document.getElementById('ver_cb_ios')) document.getElementById('ver_cb_ios').checked = true;
            } else if (osType === "Android") {
                if (document.getElementById('ver_cb_android')) document.getElementById('ver_cb_android').checked = true;
            } else if (osType === "iOS") {
                if (document.getElementById('ver_cb_ios')) document.getElementById('ver_cb_ios').checked = true;
            }
        } else {
            if (document.getElementById('ver_cb_chrome')) document.getElementById('ver_cb_chrome').checked = true; 
        }
    },

    syncEnvironment: () => {
        const rawConfig = localStorage.getItem('qa_system_config_master');
        const config = rawConfig ? JSON.parse(rawConfig) : {
            andDevices: ["S21", "S22", "Fold4"],
            iosDevices: ["iPhone 13", "iPhone 14"],
            andDefaultDevices: ["S21"],
            iosDefaultDevices: ["iPhone 13"]
        };

        const osEl = document.getElementById('osType');
        if (!osEl) return;
        const osType = osEl.value;
        
        let currentSelected = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);

        if (window.QA_CORE.InputForm.State.isInitialRender || currentSelected.length === 0) {
            currentSelected = [...(config.andDefaultDevices || []), ...(config.iosDefaultDevices || [])];
            window.QA_CORE.InputForm.State.isInitialRender = false;
        }

        window.QA_CORE.InputForm.updateVersionCheckboxes();

        const andCol = document.getElementById('andDeviceCol');
        const iosCol = document.getElementById('iosDeviceCol');
        const iosVerToggle = document.getElementById('ios-ver-toggle');

        const osGroup = ["Android/iOS", "Android", "iOS", "모바일", "태블릿", "모바일/태블릿", "direct"];
        const showAnd = (osType === "Android/iOS" || osType === "Android" || osGroup.slice(3).includes(osType));
        const showIos = (osType === "Android/iOS" || osType === "iOS" || osGroup.slice(3).includes(osType));

        if(andCol) andCol.classList.toggle('d-none', !showAnd);
        if(iosCol) iosCol.classList.toggle('d-none', !showIos);
        if(iosVerToggle) iosVerToggle.classList.toggle('d-none', !showIos);

        const render = (containerId, list, idPrefix) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            let html = '';
            list.forEach(dev => {
                const safeDevName = (window.QA_CORE.Utils && window.QA_CORE.Utils.escapeHTML) ? window.QA_CORE.Utils.escapeHTML(dev) : dev;
                const domId = `${idPrefix}_${safeDevName.replace(/\s+/g, '_')}`;
                const isChecked = currentSelected.includes(dev) ? 'checked' : '';
                html += `<input type="checkbox" id="${domId}" class="pill-cb issue-device-cb" value="${safeDevName}" onchange="window.QA_CORE.InputForm.handleDeviceClick(this)" ${isChecked}><label for="${domId}" class="pill-label">${safeDevName}</label>`;
            });
            container.innerHTML = html;
        };

        render('andNormalList', config.andDevices || [], 'and_n');
        render('andSpecialList', config.andSpecialDevices || [], 'and_s');
        render('iosNormalList', config.iosDevices || [], 'ios_n');
        render('iosSpecialList', config.iosSpecialDevices || [], 'ios_s');

        window.QA_CORE.InputForm.updateVersionTextbox();
        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        }
    },

    handleDeviceClick: (element) => {
        if (element.checked) {
            const sameValueCount = Array.from(document.querySelectorAll('.issue-device-cb:checked'))
                .filter(cb => cb.value === element.value).length;
            if (sameValueCount > 1) {
                if(window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 이미 선택된 단말입니다.', 'warning');
                element.checked = false;
                return;
            }
        }
        
        window.QA_CORE.InputForm.updateVersionTextbox();
        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        }
    },

    switchDeviceMode: (platform, mode) => {
        const normalList = document.getElementById(`${platform}NormalList`);
        const specialList = document.getElementById(`${platform}SpecialList`);
        
        if(normalList) normalList.classList.toggle('d-none', mode !== 'normal');
        if(specialList) specialList.classList.toggle('d-none', mode === 'normal');
        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        }
    },

    handlePocChange: () => {
        const pocEl = document.getElementById('poc');
        if(!pocEl) return;
        const poc = pocEl.value;
        const customEl = document.getElementById('poc_custom');
        if(customEl) customEl.classList.toggle('d-none', poc !== 'direct');
        
        const isPureWeb = poc === 'Admin' || poc === 'PC Web';
        const needsUrl = poc === 'Admin' || poc === 'PC Web' || poc === 'PC M.Web';
        const isAI = poc === 'AI Layer';

        const groups = {
            'deviceGroup': !isPureWeb,
            'urlGroup': needsUrl,
            'aiModeGroup': isAI
        };

        Object.entries(groups).forEach(([id, show]) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('d-none', !show);
        });
        
        if (needsUrl) {
            const cfg = (window.QA_CORE.Setting && typeof window.QA_CORE.Setting.loadConfig === 'function') 
                ? window.QA_CORE.Setting.loadConfig() 
                : JSON.parse(localStorage.getItem('qa_system_config_master')) || {};
            const targetUrl = document.getElementById('targetUrl');
            if(targetUrl) targetUrl.value = poc === 'Admin' ? (cfg.adminUrl || '') : (cfg.pcUrl || '');
        }
        
        window.QA_CORE.InputForm.updateVersionCheckboxes();
        
        if (!isPureWeb) {
            window.QA_CORE.InputForm.syncEnvironment();
        } else {
            window.QA_CORE.InputForm.updateVersionTextbox();
            if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
                window.QA_CORE.ResultForm.generate();
            }
        }
    },

    updateVersionTextbox: () => {
        const config = (window.QA_CORE.Setting && typeof window.QA_CORE.Setting.loadConfig === 'function') 
            ? window.QA_CORE.Setting.loadConfig() 
            : JSON.parse(localStorage.getItem('qa_system_config_master')) || {};
        const checkedTypes = Array.from(document.querySelectorAll('.ver-type-cb:checked')).map(cb => cb.value);
        
        let versionParts = [];
        const iosTypeChecked = document.querySelector('input[name="ios_ver_type"]:checked');
        const iosMode = iosTypeChecked ? iosTypeChecked.value : 'TestFlight';

        checkedTypes.forEach(type => {
            if (type === 'Android') versionParts.push(`App Tester_${config.andAppTester || ''}`);
            else if (type === 'iOS') versionParts.push(`${iosMode}_${(iosMode === 'TestFlight' ? (config.iosTestFlight || '') : (config.iosDistribution || ''))}`);
            else if (type === '삼성인터넷') versionParts.push(`삼성인터넷_${config.samsungBrowser || ''}`);
            else if (type === 'Safari') versionParts.push(`Safari_${config.safariBrowser || ''}`);
            else if (type === 'Chrome') versionParts.push(`Chrome_${config.chromeBrowser || ''}`);
            else if (type === 'Edge') versionParts.push(`Edge_${config.edgeBrowser || ''}`);
        });

        const verInput = document.getElementById('appVersion');
        if (verInput) verInput.value = versionParts.join(' / ');
        
        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        }
    }
};

document.addEventListener('componentsLoaded', () => {
    setTimeout(() => {
        if (window.QA_CORE && window.QA_CORE.InputForm) {
            window.QA_CORE.InputForm.initEvents();
        }
    }, 500);
});
