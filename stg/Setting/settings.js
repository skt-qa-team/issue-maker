const defaultConfig = {
    andDevices: [], andSpecialDevices: [], andDefaultDevices: [],
    iosDevices: [], iosSpecialDevices: [], iosDefaultDevices: [],
    andAppTester: '', iosTestFlight: '', iosDistribution: '',
    adminUrl: '', pcUrl: '',
    samsungBrowser: '', safariBrowser: '', chromeBrowser: '', edgeBrowser: ''
};
const STORAGE_KEY = 'qa_system_config_master';

window.openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
};

window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
};

window.loadConfig = () => { 
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultConfig; 
};

window.saveSettings = () => {
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
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user && !user.isAnonymous) {
            firebase.database().ref('users/' + user.uid + '/settings').set(data)
                .then(() => {
                    if (typeof window.showToast === 'function') window.showToast('✅ 설정이 클라우드에 동기화되었습니다.');
                })
                .catch((error) => {
                    console.error("Firebase save error: ", error);
                });
        }
    }

    if (typeof window.syncEnvironmentByOS === 'function') window.syncEnvironmentByOS();
    window.closeSettingModal();
};

window.openSettingModal = () => {
    const cfg = window.loadConfig();
    window.openModal('settingModal');
    
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
};

window.closeSettingModal = () => { 
    window.closeModal('settingModal'); 
};

window.openChangelogModal = () => { 
    window.openModal('changelogModal'); 
};

window.closeChangelogModal = () => { 
    window.closeModal('changelogModal'); 
};

document.addEventListener('componentsLoaded', () => {
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (user && !user.isAnonymous) {
                firebase.database().ref('users/' + user.uid + '/settings').once('value').then(snapshot => {
                    const data = snapshot.val();
                    if (data) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                        if (typeof window.syncEnvironmentByOS === 'function') window.syncEnvironmentByOS();
                    }
                });
            }
        });
    }
});