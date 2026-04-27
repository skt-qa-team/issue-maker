window.compDataCache = {};
window.qa_comp_presets = {};

// 특수문자 방어 로직 (inputform.js가 늦게 로드될 경우를 대비해 여기서도 선언)
window.encodeSafeKey = window.encodeSafeKey || ((str) => encodeURIComponent(str).replace(/\./g, '%2E'));
window.decodeSafeKey = window.decodeSafeKey || ((str) => decodeURIComponent(str.replace(/%2E/g, '.')));

window.initCompletionInput = () => {
    try {
        window.compDataCache = (typeof loadConfig === 'function' ? loadConfig() : JSON.parse(localStorage.getItem('qa_system_config_master'))) || {};
        
        const adminInput = document.getElementById('comp_admin_url');
        const pcInput = document.getElementById('comp_pc_url');
        // undefined 방어 로직 추가 (|| '')
        if (adminInput) adminInput.value = window.compDataCache.adminUrl || '';
        if (pcInput) pcInput.value = window.compDataCache.pcUrl || '';

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

        window.renderCompDevices();
        window.fetchCompPresetsFromFirebase();
        window.initCompletionInputEvents();

        if (typeof window.updateCompletionPreview === 'function') {
            window.updateCompletionPreview();
        }
    } catch (e) {
        console.error("initCompletionInput Error:", e);
    }
};

window.fetchCompPresetsFromFirebase = () => {
    try {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.database) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user && !user.isAnonymous) {
                    firebase.database().ref(`users/${user.uid}/comp_presets`).on('value', (snapshot) => {
                        const rawPresets = snapshot.val() || {};
                        const decodedPresets = {};
                        
                        // Firebase에서 불러올 때 키값 디코딩
                        Object.keys(rawPresets).forEach(encodedKey => {
                            try {
                                const decodedKey = window.decodeSafeKey(encodedKey);
                                decodedPresets[decodedKey] = rawPresets[encodedKey];
                            } catch (err) {
                                decodedPresets[encodedKey] = rawPresets[encodedKey];
                            }
                        });
                        
                        window.qa_comp_presets = decodedPresets;
                        window.renderCompPresets();
                    }, (error) => {
                        if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(error, 'Comp Preset Firebase Fetch');
                    });
                }
            });
        }
    } catch (e) {
        if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(e, 'Fetch Comp Presets From Firebase');
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
            if (target.id === 'btnEditCompPreset') window.editCompPreset();
            if (target.id === 'btnDeleteCompPreset') window.deleteCompPreset();
            if (target.id === 'btnResetCompForm') window.resetCompForm();
        });
    } catch (e) {
        console.error("initCompletionInputEvents Error:", e);
    }
};

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
        
        const andDefault = window.compDataCache.andDefaultDevices || [];
        const iosDefault = window.compDataCache.iosDefaultDevices || [];
        const defaultDevices = [...andDefault, ...iosDefault];

        const render = (container, list, platform) => {
            if (!container) return;
            container.innerHTML = list.map(dev => {
                const isChecked = defaultDevices.includes(dev) ? 'checked' : '';
                return `<label class="pill-label"><input type="checkbox" class="pill-cb comp-dev-cb template-trigger" data-platform="${platform}" value="${dev}" ${isChecked}> ${dev}</label>`;
            });
        };

        render(andList, andDevices, 'android');
        render(iosList, iosDevices, 'ios');
        
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

        let presets = window.qa_comp_presets || {};
        
        if (presets[name]) {
            if (!confirm(`[${name}] 프리셋이 이미 존재합니다. 덮어쓰시겠습니까?`)) return;
        } else {
            if (!confirm(`새로운 프리셋 [${name}]을(를) 저장하시겠습니까?`)) return;
        }

        const newData = window.getCompFormData();
        const encodedName = window.encodeSafeKey(name); // 저장 시 키 인코딩
        
        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            const uid = firebase.auth().currentUser.uid;
            firebase.database().ref(`users/${uid}/comp_presets/${encodedName}`).set(newData).then(() => {
                if (nameEl) nameEl.value = '';
                const selectEl = document.getElementById('compPresetSelect');
                if (selectEl) selectEl.value = name;
                if (typeof window.showToast === 'function') window.showToast('✅ 완료문 프리셋이 서버에 저장되었습니다.');
            }).catch(err => {
                if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(err, 'Save Comp Preset Firebase');
            });
        } else {
            if (typeof window.showToast === 'function') window.showToast('⚠️ 로그인 정보가 없어 프리셋을 저장할 수 없습니다.');
        }
    } catch (e) {
        console.error("saveCompPreset Error:", e);
    }
};

window.editCompPreset = () => {
    try {
        const selectEl = document.getElementById('compPresetSelect');
        const originalName = selectEl ? selectEl.value : '';
        if (!originalName) {
            if (typeof window.showToast === 'function') window.showToast('⚠️ 수정할 프리셋을 먼저 선택해주세요.');
            return;
        }

        const nameInput = document.getElementById('newCompPresetName');
        const newName = nameInput ? nameInput.value.trim() : originalName;

        if (!newName) {
            if (typeof window.showToast === 'function') window.showToast('⚠️ 프리셋 이름을 입력해주세요.');
            return;
        }

        const confirmMsg = newName !== originalName 
            ? `프리셋 [${originalName}]의 내용을 변경하고, 이름을 [${newName}](으)로 수정하시겠습니까?`
            : `프리셋 [${originalName}]의 내용을 현재 폼의 데이터로 수정하시겠습니까?`;

        if (!confirm(confirmMsg)) return;

        const newData = window.getCompFormData();

        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            const uid = firebase.auth().currentUser.uid;
            const presetsRef = firebase.database().ref(`users/${uid}/comp_presets`);
            
            const encodedNewName = window.encodeSafeKey(newName);
            const encodedOriginalName = window.encodeSafeKey(originalName);
            
            if (newName !== originalName) {
                const updates = {};
                updates[encodedOriginalName] = null;
                updates[encodedNewName] = newData;
                presetsRef.update(updates).then(() => {
                    if (selectEl) selectEl.value = newName;
                    if (typeof window.showToast === 'function') window.showToast(`✅ [${newName}] 프리셋이 서버에서 수정되었습니다.`);
                    if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
                }).catch(err => {
                    if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(err, 'Edit Comp Preset Firebase');
                });
            } else {
                presetsRef.child(encodedOriginalName).set(newData).then(() => {
                    if (typeof window.showToast === 'function') window.showToast(`✅ [${newName}] 프리셋이 서버에서 수정되었습니다.`);
                    if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
                }).catch(err => {
                    if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(err, 'Edit Comp Preset Firebase');
                });
            }
        }
    } catch (e) {
        console.error("editCompPreset Error:", e);
    }
};

window.deleteCompPreset = () => {
    try {
        const selectEl = document.getElementById('compPresetSelect');
        const name = selectEl ? selectEl.value : '';
        if (!name) {
            if (typeof window.showToast === 'function') window.showToast('⚠️ 삭제할 프리셋을 선택해주세요.');
            return;
        }

        if (!confirm(`정말 프리셋 [${name}]을(를) 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.`)) return;

        const encodedName = window.encodeSafeKey(name); // 삭제 시 키 인코딩

        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
            const uid = firebase.auth().currentUser.uid;
            firebase.database().ref(`users/${uid}/comp_presets/${encodedName}`).remove().then(() => {
                selectEl.value = '';
                const nameInput = document.getElementById('newCompPresetName');
                if (nameInput) nameInput.value = '';
                
                if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
                if (typeof window.showToast === 'function') window.showToast('🗑️ 프리셋이 서버에서 삭제되었습니다.');
            }).catch(err => {
                if(window.QA_ErrorHandler) window.QA_ErrorHandler.handle(err, 'Delete Comp Preset Firebase');
            });
        }
    } catch (e) {
        console.error("deleteCompPreset Error:", e);
    }
};

window.renderCompPresets = () => {
    try {
        const selectEl = document.getElementById('compPresetSelect');
        if (!selectEl) return;
        const presets = window.qa_comp_presets || {};
        
        const currentVal = selectEl.value;
        let html = '<option value="">💾 프리셋 선택...</option>';
        Object.keys(presets).forEach(name => {
            const safeName = window.escapeHTMLTemplate ? window.escapeHTMLTemplate(name) : name;
            html += `<option value="${safeName}">${safeName}</option>`;
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
        const nameInput = document.getElementById('newCompPresetName');
        if (nameInput) nameInput.value = name || '';

        if (!name) return;
        const presets = window.qa_comp_presets || {};
        const data = presets[name];
        if (!data) return;

        // 값이 undefined일 경우 빈 칸으로 처리하도록 방어 코드(|| '') 적용
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
        
        window.syncCompDeviceHighlight();
        
        if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
    } catch (e) {
        console.error("applyCompPreset Error:", e);
    }
};

window.resetCompForm = () => {
    try {
        if (!confirm('현재 작성 중인 완료문 내용을 모두 초기화하시겠습니까?')) return;

        ['comp_check', 'comp_rate_num'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        const adminInput = document.getElementById('comp_admin_url');
        const pcInput = document.getElementById('comp_pc_url');
        if (adminInput) adminInput.value = window.compDataCache.adminUrl || '';
        if (pcInput) pcInput.value = window.compDataCache.pcUrl || '';

        document.querySelectorAll('.comp-mode-cb').forEach(cb => cb.checked = false);
        
        document.querySelectorAll('.comp-srv-cb').forEach(cb => cb.checked = (cb.value === 'STG'));
        
        document.querySelectorAll('.comp-ver-cb').forEach(cb => cb.checked = false);

        const andDefault = window.compDataCache.andDefaultDevices || [];
        const iosDefault = window.compDataCache.iosDefaultDevices || [];
        const defaultDevices = [...andDefault, ...iosDefault];
        document.querySelectorAll('.comp-dev-cb').forEach(cb => cb.checked = defaultDevices.includes(cb.value));
        
        window.syncCompDeviceHighlight();

        const selectEl = document.getElementById('compPresetSelect');
        if (selectEl) selectEl.value = '';
        const nameInput = document.getElementById('newCompPresetName');
        if (nameInput) nameInput.value = '';

        if (typeof window.showToast === 'function') window.showToast('🔄 모든 값이 초기화되었습니다.');
        if (typeof window.updateCompletionPreview === 'function') window.updateCompletionPreview();
    } catch (e) {
        console.error("resetCompForm Error:", e);
    }
};
