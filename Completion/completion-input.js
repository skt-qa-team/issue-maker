window.QA_CORE = window.QA_CORE || {};

window.QA_CORE.CompletionInput = {
    State: {
        cache: {},
        presets: {}
    },

    init: () => {
        try {
            window.QA_CORE.CompletionInput.State.cache = (typeof window.loadConfig === 'function' ? window.loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master'))) || {};
            
            const adminInput = document.getElementById('comp_admin_url');
            const pcInput = document.getElementById('comp_pc_url');
            if (adminInput) adminInput.value = window.QA_CORE.CompletionInput.State.cache.adminUrl || '';
            if (pcInput) pcInput.value = window.QA_CORE.CompletionInput.State.cache.pcUrl || '';

            const sList = document.getElementById('comp_server_list');
            if (sList) {
                sList.innerHTML = '';
                ['STG', 'GRN', 'PRD'].forEach(s => {
                    const label = s === 'PRD' ? '상용(PRD)' : s;
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

            window.QA_CORE.CompletionInput.renderDevices();
            window.QA_CORE.CompletionInput.fetchPresets();
            window.QA_CORE.CompletionInput.initEvents();

            if (window.QA_CORE.CompletionResult && typeof window.QA_CORE.CompletionResult.updatePreview === 'function') {
                window.QA_CORE.CompletionResult.updatePreview();
            }
        } catch (e) {
            console.error(e);
        }
    },

    fetchPresets: () => {
        try {
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.database) {
                firebase.auth().onAuthStateChanged((user) => {
                    if (user && !user.isAnonymous) {
                        const path = window.QA_CORE.CONSTANTS?.FIREBASE_PATHS?.COMP_PRESETS || 'comp_presets';
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
                            
                            window.QA_CORE.CompletionInput.State.presets = decodedPresets;
                            window.QA_CORE.CompletionInput.renderPresets();
                        }, (error) => {
                            if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(error, 'Comp Preset Firebase Fetch');
                        });
                    }
                });
            }
        } catch (e) {
            if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Fetch Comp Presets From Firebase');
        }
    },

    initEvents: () => {
        try {
            const container = document.getElementById('panel-completion');
            if (!container) return;

            if (container.dataset.eventsBound) return;
            container.dataset.eventsBound = 'true';

            container.addEventListener('input', (e) => {
                if (e.target.classList.contains('template-trigger')) {
                    if (window.QA_CORE.CompletionResult && typeof window.QA_CORE.CompletionResult.updatePreview === 'function') {
                        window.QA_CORE.CompletionResult.updatePreview();
                    }
                }
            });

            container.addEventListener('change', (e) => {
                if (e.target.classList.contains('template-trigger')) {
                    if (e.target.classList.contains('comp-dev-cb')) {
                        window.QA_CORE.CompletionInput.syncDeviceHighlight();
                    }
                    if (window.QA_CORE.CompletionResult && typeof window.QA_CORE.CompletionResult.updatePreview === 'function') {
                        window.QA_CORE.CompletionResult.updatePreview();
                    }
                }
                if (e.target.id === 'compPresetSelect') {
                    window.QA_CORE.CompletionInput.applyPreset(e.target.value);
                }
            });

            container.addEventListener('click', (e) => {
                const target = e.target;
                if (target.id === 'btnSaveCompPreset') window.QA_CORE.CompletionInput.savePreset();
                if (target.id === 'btnEditCompPreset') window.QA_CORE.CompletionInput.editPreset();
                if (target.id === 'btnDeleteCompPreset') window.QA_CORE.CompletionInput.deletePreset();
                if (target.id === 'btnResetCompForm') window.QA_CORE.CompletionInput.resetForm();
            });
        } catch (e) {
            console.error(e);
        }
    },

    syncDeviceHighlight: () => {
        try {
            document.querySelectorAll('.comp-dev-cb').forEach(cb => {
                const label = cb.closest('.pill-label');
                if (label) {
                    if (cb.checked) label.classList.add('active');
                    else label.classList.remove('active');
                }
            });
        } catch (e) {
            console.error(e);
        }
    },

    renderDevices: () => {
        try {
            const andList = document.getElementById('comp_and_list');
            const iosList = document.getElementById('comp_ios_list');
            const cache = window.QA_CORE.CompletionInput.State.cache;
            const andDevices = cache.andDevices || [];
            const iosDevices = cache.iosDevices || [];
            
            const andDefault = cache.andDefaultDevices || [];
            const iosDefault = cache.iosDefaultDevices || [];
            const defaultDevices = [...andDefault, ...iosDefault];

            const render = (container, list, platform) => {
                if (!container) return;
                container.innerHTML = list.map(dev => {
                    const isChecked = defaultDevices.includes(dev) ? 'checked' : '';
                    return `<label class="pill-label"><input type="checkbox" class="pill-cb comp-dev-cb template-trigger" data-platform="${platform}" value="${dev}" ${isChecked}> ${dev}</label>`;
                }).join('');
            };

            render(andList, andDevices, 'android');
            render(iosList, iosDevices, 'ios');
            
            window.QA_CORE.CompletionInput.syncDeviceHighlight();
        } catch (e) {
            console.error(e);
        }
    },

    getFormData: () => {
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
            console.error(e);
            return {};
        }
    },

    savePreset: () => {
        try {
            const nameEl = document.getElementById('newCompPresetName');
            const name = nameEl ? nameEl.value.trim() : '';
            if (!name) {
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 프리셋 이름을 입력해주세요.', 'warning');
                return;
            }

            let presets = window.QA_CORE.CompletionInput.State.presets || {};
            
            if (presets[name]) {
                if (!confirm(`[${name}] 프리셋이 이미 존재합니다. 덮어쓰시겠습니까?`)) return;
            } else {
                if (!confirm(`새로운 프리셋 [${name}]을(를) 저장하시겠습니까?`)) return;
            }

            const newData = window.QA_CORE.CompletionInput.getFormData();
            const encodedName = (window.QA_CORE.Utils && window.QA_CORE.Utils.encodeSafeKey) 
                ? window.QA_CORE.Utils.encodeSafeKey(name) 
                : encodeURIComponent(name);
            
            if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
                if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnSaveCompPreset', true);
                const uid = firebase.auth().currentUser.uid;
                const path = window.QA_CORE.CONSTANTS?.FIREBASE_PATHS?.COMP_PRESETS || 'comp_presets';
                
                firebase.database().ref(`users/${uid}/${path}/${encodedName}`).set(newData).then(() => {
                    if (nameEl) nameEl.value = '';
                    const selectEl = document.getElementById('compPresetSelect');
                    if (selectEl) selectEl.value = name;
                    if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('✅ 프리셋이 저장되었습니다.', 'success');
                }).catch(err => {
                    if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Save Comp Preset Firebase');
                    if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('❌ 저장 실패', 'error');
                }).finally(() => {
                    if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnSaveCompPreset', false);
                });
            } else {
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('🔒 로그인이 필요합니다.', 'warning');
            }
        } catch (e) {
            console.error(e);
        }
    },

    editPreset: () => {
        try {
            const selectEl = document.getElementById('compPresetSelect');
            const originalName = selectEl ? selectEl.value : '';
            if (!originalName) {
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 수정할 프리셋을 먼저 선택해주세요.', 'warning');
                return;
            }

            const nameInput = document.getElementById('newCompPresetName');
            const newName = nameInput ? nameInput.value.trim() : originalName;

            if (!newName) {
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 프리셋 이름을 입력해주세요.', 'warning');
                return;
            }

            const confirmMsg = newName !== originalName 
                ? `프리셋 [${originalName}]의 내용을 변경하고, 이름을 [${newName}](으)로 수정하시겠습니까?`
                : `프리셋 [${originalName}]의 내용을 현재 폼의 데이터로 수정하시겠습니까?`;

            if (!confirm(confirmMsg)) return;

            const newData = window.QA_CORE.CompletionInput.getFormData();

            if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
                if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnEditCompPreset', true);
                const uid = firebase.auth().currentUser.uid;
                const path = window.QA_CORE.CONSTANTS?.FIREBASE_PATHS?.COMP_PRESETS || 'comp_presets';
                const presetsRef = firebase.database().ref(`users/${uid}/${path}`);
                
                const encodedNewName = (window.QA_CORE.Utils && window.QA_CORE.Utils.encodeSafeKey) ? window.QA_CORE.Utils.encodeSafeKey(newName) : encodeURIComponent(newName);
                const encodedOriginalName = (window.QA_CORE.Utils && window.QA_CORE.Utils.encodeSafeKey) ? window.QA_CORE.Utils.encodeSafeKey(originalName) : encodeURIComponent(originalName);
                
                if (newName !== originalName) {
                    const updates = {};
                    updates[encodedOriginalName] = null;
                    updates[encodedNewName] = newData;
                    presetsRef.update(updates).then(() => {
                        if (selectEl) selectEl.value = newName;
                        if (window.QA_CORE.UI) window.QA_CORE.UI.showToast(`✅ [${newName}] 프리셋 수정 완료`, 'success');
                        if (window.QA_CORE.CompletionResult) window.QA_CORE.CompletionResult.updatePreview();
                    }).catch(err => {
                        if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Edit Comp Preset Firebase');
                    }).finally(() => {
                        if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnEditCompPreset', false);
                    });
                } else {
                    presetsRef.child(encodedOriginalName).set(newData).then(() => {
                        if (window.QA_CORE.UI) window.QA_CORE.UI.showToast(`✅ [${newName}] 프리셋 수정 완료`, 'success');
                        if (window.QA_CORE.CompletionResult) window.QA_CORE.CompletionResult.updatePreview();
                    }).catch(err => {
                        if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Edit Comp Preset Firebase');
                    }).finally(() => {
                        if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnEditCompPreset', false);
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }
    },

    deletePreset: () => {
        try {
            const selectEl = document.getElementById('compPresetSelect');
            const name = selectEl ? selectEl.value : '';
            if (!name) {
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 삭제할 프리셋을 선택해주세요.', 'warning');
                return;
            }

            if (!confirm(`정말 프리셋 [${name}]을(를) 삭제하시겠습니까?`)) return;

            const encodedName = (window.QA_CORE.Utils && window.QA_CORE.Utils.encodeSafeKey) ? window.QA_CORE.Utils.encodeSafeKey(name) : encodeURIComponent(name);

            if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
                if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnDeleteCompPreset', true);
                const uid = firebase.auth().currentUser.uid;
                const path = window.QA_CORE.CONSTANTS?.FIREBASE_PATHS?.COMP_PRESETS || 'comp_presets';
                
                firebase.database().ref(`users/${uid}/${path}/${encodedName}`).remove().then(() => {
                    selectEl.value = '';
                    const nameInput = document.getElementById('newCompPresetName');
                    if (nameInput) nameInput.value = '';
                    
                    if (window.QA_CORE.CompletionResult) window.QA_CORE.CompletionResult.updatePreview();
                    if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('🗑️ 프리셋 삭제 완료', 'success');
                }).catch(err => {
                    if(window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Delete Comp Preset Firebase');
                }).finally(() => {
                    if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnDeleteCompPreset', false);
                });
            }
        } catch (e) {
            console.error(e);
        }
    },

    renderPresets: () => {
        try {
            const selectEl = document.getElementById('compPresetSelect');
            if (!selectEl) return;
            const presets = window.QA_CORE.CompletionInput.State.presets || {};
            
            const currentVal = selectEl.value;
            let html = '<option value="">💾 프리셋 선택...</option>';
            Object.keys(presets).forEach(name => {
                const safeName = (window.QA_CORE.Utils && window.QA_CORE.Utils.escapeHTML) ? window.QA_CORE.Utils.escapeHTML(name) : name;
                html += `<option value="${safeName}">${safeName}</option>`;
            });
            selectEl.innerHTML = html;
            
            if (presets[currentVal]) {
                selectEl.value = currentVal;
            }
        } catch (e) {
            console.error(e);
        }
    },

    applyPreset: (name) => {
        try {
            const nameInput = document.getElementById('newCompPresetName');
            if (nameInput) nameInput.value = name || '';

            if (!name) return;
            const presets = window.QA_CORE.CompletionInput.State.presets || {};
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
            
            window.QA_CORE.CompletionInput.syncDeviceHighlight();
            
            if (window.QA_CORE.CompletionResult && typeof window.QA_CORE.CompletionResult.updatePreview === 'function') {
                window.QA_CORE.CompletionResult.updatePreview();
            }
        } catch (e) {
            console.error(e);
        }
    },

    resetForm: () => {
        try {
            if (!confirm('현재 작성 중인 완료문 내용을 모두 초기화하시겠습니까?')) return;

            ['comp_check', 'comp_rate_num'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });

            const adminInput = document.getElementById('comp_admin_url');
            const pcInput = document.getElementById('comp_pc_url');
            if (adminInput) adminInput.value = window.QA_CORE.CompletionInput.State.cache.adminUrl || '';
            if (pcInput) pcInput.value = window.QA_CORE.CompletionInput.State.cache.pcUrl || '';

            document.querySelectorAll('.comp-mode-cb').forEach(cb => cb.checked = false);
            document.querySelectorAll('.comp-srv-cb').forEach(cb => cb.checked = (cb.value === 'STG'));
            document.querySelectorAll('.comp-ver-cb').forEach(cb => cb.checked = false);

            const cache = window.QA_CORE.CompletionInput.State.cache;
            const andDefault = cache.andDefaultDevices || [];
            const iosDefault = cache.iosDefaultDevices || [];
            const defaultDevices = [...andDefault, ...iosDefault];
            document.querySelectorAll('.comp-dev-cb').forEach(cb => cb.checked = defaultDevices.includes(cb.value));
            
            window.QA_CORE.CompletionInput.syncDeviceHighlight();

            const selectEl = document.getElementById('compPresetSelect');
            if (selectEl) selectEl.value = '';
            const nameInput = document.getElementById('newCompPresetName');
            if (nameInput) nameInput.value = '';

            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('🔄 초기화 완료', 'info');
            if (window.QA_CORE.CompletionResult) window.QA_CORE.CompletionResult.updatePreview();
        } catch (e) {
            console.error(e);
        }
    }
};

document.addEventListener('componentsLoaded', () => {
    setTimeout(() => {
        if (window.QA_CORE && window.QA_CORE.CompletionInput) {
            window.QA_CORE.CompletionInput.init();
        }
    }, 500);
});
