window.QA_CORE = window.QA_CORE || {};
window.QA_CORE.CONSTANTS = window.QA_CORE.CONSTANTS || {};

window.QA_CORE.CONSTANTS.SETTINGS = {
    STORAGE_KEY: 'qa_system_config_master',
    ADMIN_UID: '4LLzBg1Y9zOhcXAGhJK8OLYoUCQ2',
    DEFAULT_CONFIG: {
        andDevices: [], andSpecialDevices: [], andDefaultDevices: [],
        iosDevices: [], iosSpecialDevices: [], iosDefaultDevices: [],
        andAppTester: '', iosTestFlight: '', iosDistribution: '',
        adminUrl: '', pcUrl: '',
        samsungBrowser: '', safariBrowser: '', chromeBrowser: '', edgeBrowser: ''
    }
};

window.QA_CORE.Setting = {
    loadConfig: () => {
        try {
            const raw = localStorage.getItem(window.QA_CORE.CONSTANTS.SETTINGS.STORAGE_KEY);
            return raw ? JSON.parse(raw) : window.QA_CORE.CONSTANTS.SETTINGS.DEFAULT_CONFIG;
        } catch(e) {
            return window.QA_CORE.CONSTANTS.SETTINGS.DEFAULT_CONFIG;
        }
    },

    save: () => {
        try {
            const split = (id) => {
                const el = document.getElementById(id);
                return el ? el.value.split('\n').map(s => s.trim()).filter(Boolean) : [];
            };

            const data = {
                adminUrl: document.getElementById('set_admin_url')?.value || '',
                pcUrl: document.getElementById('set_pc_url')?.value || '',
                andAppTester: document.getElementById('set_and_apptester')?.value || '',
                iosTestFlight: document.getElementById('set_ios_testflight')?.value || '',
                iosDistribution: document.getElementById('set_ios_distribution')?.value || '',
                samsungBrowser: document.getElementById('set_samsung_browser')?.value || '',
                safariBrowser: document.getElementById('set_safari_browser')?.value || '',
                chromeBrowser: document.getElementById('set_chrome_browser')?.value || '',
                edgeBrowser: document.getElementById('set_edge_browser')?.value || '',
                andDevices: split('set_and_devices'),
                andSpecialDevices: split('set_and_special'),
                andDefaultDevices: split('set_and_default'),
                iosDevices: split('set_ios_devices'),
                iosSpecialDevices: split('set_ios_special'),
                iosDefaultDevices: split('set_ios_default')
            };

            localStorage.setItem(window.QA_CORE.CONSTANTS.SETTINGS.STORAGE_KEY, JSON.stringify(data));

            if (typeof firebase !== 'undefined' && firebase.auth) {
                const user = firebase.auth().currentUser;
                if (user && !user.isAnonymous) {
                    if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnSaveSettings', true);
                    firebase.database().ref('users/' + user.uid + '/settings').set(data)
                        .then(() => {
                            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('✅ 설정이 클라우드에 동기화되었습니다.', 'success');
                        })
                        .catch((error) => {
                            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(error, 'Firebase Save Settings');
                        })
                        .finally(() => {
                            if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnSaveSettings', false);
                        });
                } else {
                     if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('✅ 설정이 로컬에 저장되었습니다.', 'success');
                }
            } else {
                 if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('✅ 설정이 로컬에 저장되었습니다.', 'success');
            }

            if (window.QA_CORE.InputForm && typeof window.QA_CORE.InputForm.syncEnvironment === 'function') {
                window.QA_CORE.InputForm.syncEnvironment();
            }
            window.QA_CORE.Setting.closeModal();
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Save Settings');
        }
    },

    copyAdmin: () => {
        try {
            if (!confirm("관리자(Admin)의 환경설정 데이터를 가져와 내 계정에 덮어쓰시겠습니까?\n기존 설정은 삭제됩니다.")) return;

            if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) {
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 로그인이 필요한 기능입니다.', 'warning');
                return;
            }

            const currentUser = firebase.auth().currentUser;
            const adminUid = window.QA_CORE.CONSTANTS.SETTINGS.ADMIN_UID;

            if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnCopyAdminSettings', true);

            firebase.database().ref('users/' + adminUid + '/settings').once('value').then(snapshot => {
                const adminSettings = snapshot.val();
                
                if (!adminSettings) {
                    if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('⚠️ 관리자 설정 데이터를 찾을 수 없습니다.', 'warning');
                    return;
                }

                localStorage.setItem(window.QA_CORE.CONSTANTS.SETTINGS.STORAGE_KEY, JSON.stringify(adminSettings));

                if (!currentUser.isAnonymous) {
                    firebase.database().ref('users/' + currentUser.uid + '/settings').set(adminSettings).catch(err => {
                        if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Admin Settings Sync');
                    });
                }

                window.QA_CORE.Setting.openModal();
                if (window.QA_CORE.InputForm && typeof window.QA_CORE.InputForm.syncEnvironment === 'function') {
                    window.QA_CORE.InputForm.syncEnvironment();
                }
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('👑 관리자 설정이 성공적으로 복사되었습니다.', 'success');
                
            }).catch(err => {
                if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(err, 'Admin Settings Fetch');
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('❌ 설정 복사 중 오류가 발생했습니다.', 'error');
            }).finally(() => {
                if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnCopyAdminSettings', false);
            });
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Copy Admin Settings');
        }
    },

    openModal: () => {
        try {
            const cfg = window.QA_CORE.Setting.loadConfig();
            if (window.QA_CORE.UI) window.QA_CORE.UI.initModal('setting-modal');
            
            const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
            setVal('set_admin_url', cfg.adminUrl);
            setVal('set_pc_url', cfg.pcUrl);
            setVal('set_and_apptester', cfg.andAppTester);
            setVal('set_ios_testflight', cfg.iosTestFlight);
            setVal('set_ios_distribution', cfg.iosDistribution);
            setVal('set_samsung_browser', cfg.samsungBrowser);
            setVal('set_safari_browser', cfg.safariBrowser);
            setVal('set_chrome_browser', cfg.chromeBrowser);
            setVal('set_edge_browser', cfg.edgeBrowser);
            setVal('set_and_devices', (cfg.andDevices || []).join('\n'));
            setVal('set_and_special', (cfg.andSpecialDevices || []).join('\n'));
            setVal('set_and_default', (cfg.andDefaultDevices || []).join('\n'));
            setVal('set_ios_devices', (cfg.iosDevices || []).join('\n'));
            setVal('set_ios_special', (cfg.iosSpecialDevices || []).join('\n'));
            setVal('set_ios_default', (cfg.iosDefaultDevices || []).join('\n'));
        } catch (e) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(e, 'Open Setting Modal');
        }
    },

    closeModal: () => { 
        if (window.QA_CORE.UI) window.QA_CORE.UI.closeModal('setting-modal'); 
    },

    openChangelogModal: () => {
        if (window.QA_CORE.UI) window.QA_CORE.UI.initModal('changelog-modal');
    },

    closeChangelogModal: () => {
        if (window.QA_CORE.UI) window.QA_CORE.UI.closeModal('changelog-modal');
    }
};

document.addEventListener('componentsLoaded', () => {
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (user && !user.isAnonymous) {
                firebase.database().ref('users/' + user.uid + '/settings').once('value').then(snapshot => {
                    const data = snapshot.val();
                    if (data) {
                        localStorage.setItem(window.QA_CORE.CONSTANTS.SETTINGS.STORAGE_KEY, JSON.stringify(data));
                        if (window.QA_CORE.InputForm && typeof window.QA_CORE.InputForm.syncEnvironment === 'function') {
                            window.QA_CORE.InputForm.syncEnvironment();
                        }
                    }
                });
            }
        });
    }
});
