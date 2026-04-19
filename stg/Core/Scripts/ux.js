document.addEventListener('DOMContentLoaded', () => {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    window.showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast-msg';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        requestAnimationFrame(() => {
            setTimeout(() => toast.classList.add('show'), 10);
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2000);
    };

    let saveTimer;
    document.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            if (e.target.readOnly) return;
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                if (typeof window.saveDraft === 'function') window.saveDraft();
                const now = new Date();
                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                window.showToast(`💾 ${timeStr} 자동 저장됨`);
            }, 1500);
        }
    });

    if (typeof window.loadPrefixOrder === 'function') window.loadPrefixOrder();
    if (typeof window.loadDraft === 'function') window.loadDraft();
});

window.saveDraft = () => {
    const fields = ['title', 'prefix_env', 'prefix_env_custom', 'osType', 'osType_custom', 'poc', 'poc_custom', 'prefix_critical', 'prefix_critical_custom', 'prefix_device_input', 'prefix_account', 'prefix_page', 'appVersion', 'targetUrl', 'aiMode', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'];
    const data = {};
    
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) data[id] = el.value;
    });

    const devices = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);
    data.selectedDevices = devices;

    const servers = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    data.selectedServers = servers;

    const verCbs = Array.from(document.querySelectorAll('.ver-type-cb:checked')).map(cb => cb.id);
    data.selectedVerCbs = verCbs;

    localStorage.setItem('skm_draft', JSON.stringify(data));
};

window.loadDraft = () => {
    const raw = localStorage.getItem('skm_draft');
    if (!raw) return;
    
    try {
        const data = JSON.parse(raw);
        
        Object.entries(data).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el && !['selectedDevices', 'selectedServers', 'selectedVerCbs'].includes(id)) {
                el.value = val;
                if (id.includes('_custom')) {
                    const baseId = id.replace('_custom', '');
                    const baseEl = document.getElementById(baseId);
                    if (baseEl && baseEl.value === 'direct') el.classList.remove('d-none');
                }
            }
        });

        if (data.selectedVerCbs) {
            data.selectedVerCbs.forEach(id => {
                const cb = document.getElementById(id);
                if (cb) cb.checked = true;
            });
        }

        if (data.selectedServers) {
            document.querySelectorAll('.issue-server-cb').forEach(cb => {
                cb.checked = data.selectedServers.includes(cb.value);
            });
        }

        window.syncEnvironmentByOS();

        if (data.selectedDevices) {
            setTimeout(() => {
                data.selectedDevices.forEach(dev => {
                    const cb = document.querySelector(`.issue-device-cb[value="${dev}"]`);
                    if (cb) cb.checked = true;
                });
                window.generateTemplate();
            }, 100);
        }
    } catch (e) {
        console.error("Draft Load Error:", e);
    }
};

window.toggleDeviceMode = (os) => {
    const checkedInput = document.querySelector(`input[name="${os}_dev_mode"]:checked`);
    if (!checkedInput) return;

    const isNormal = checkedInput.value === 'normal';
    const normalList = document.getElementById(`${os}NormalList`);
    const specialList = document.getElementById(`${os}SpecialList`);

    if (isNormal) {
        if (normalList) normalList.classList.remove('d-none');
        if (specialList) specialList.classList.add('d-none');
    } else {
        if (normalList) normalList.classList.add('d-none');
        if (specialList) specialList.classList.remove('d-none');
    }
    
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
};

window.handlePocChange = () => {
    const pocEl = document.getElementById('poc');
    if (!pocEl) return;

    const poc = pocEl.value;
    const isWeb = (poc === 'PC Web' || poc === 'PC M.Web' || poc === 'Admin');
    const isAI = (poc === 'AI Layer');

    const deviceGroup = document.getElementById('deviceGroup');
    const appVersionGroup = document.getElementById('appVersionGroup');
    const urlGroup = document.getElementById('urlGroup');
    const aiModeGroup = document.getElementById('aiModeGroup');

    if (deviceGroup) deviceGroup.classList.toggle('d-none', isWeb);
    if (appVersionGroup) appVersionGroup.classList.toggle('d-none', isWeb);
    if (urlGroup) urlGroup.classList.toggle('d-none', !isWeb);
    if (aiModeGroup) aiModeGroup.classList.toggle('d-none', !isAI);

    if (isWeb) {
        const configStr = localStorage.getItem('qa_system_config_master');
        const config = configStr ? JSON.parse(configStr) : {};
        const urlLabel = document.getElementById('urlLabel');
        const targetUrl = document.getElementById('targetUrl');

        if (urlLabel) urlLabel.textContent = poc === 'Admin' ? 'Admin URL' : 'PC Web URL';
        if (targetUrl) targetUrl.value = poc === 'Admin' ? (config.adminUrl || '') : (config.pcUrl || '');
    }
    
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
};

window.syncEnvironmentByOS = () => {
    const osTypeEl = document.getElementById('osType');
    if (!osTypeEl) return;

    const osType = osTypeEl.value;
    const iosVerToggle = document.getElementById('ios-ver-toggle');
    const appVersionLabel = document.getElementById('appVersionLabel');

    if (osType === 'iOS' || osType === 'Android/iOS') {
        if (iosVerToggle) iosVerToggle.classList.remove('d-none');
        const checkedVer = document.querySelector('input[name="ios_ver_type"]:checked');
        if (appVersionLabel && checkedVer) appVersionLabel.textContent = `${checkedVer.value} 버전`;
    } else {
        if (iosVerToggle) iosVerToggle.classList.add('d-none');
        if (appVersionLabel) appVersionLabel.textContent = osType === 'Android' ? 'App Tester 버전' : '버전';
    }
    
    if (typeof window.updateVersionTextbox === 'function') window.updateVersionTextbox();
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
};

window.syncDeviceFromVersion = (os) => {
    const cb = document.getElementById(`ver_cb_${os}`);
    const col = document.getElementById(`${os}DeviceCol`);
    if (!cb || !col) return;

    if (cb.checked) col.classList.remove('d-none');
    else {
        col.classList.add('d-none');
        const checkboxes = col.querySelectorAll('.issue-device-cb');
        checkboxes.forEach(box => box.checked = false);
    }
    
    if (typeof window.updateVersionTextbox === 'function') window.updateVersionTextbox();
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
};

window.updateVersionTextbox = () => {
    const configStr = localStorage.getItem('qa_system_config_master');
    const config = configStr ? JSON.parse(configStr) : {};
    let versions = [];

    const andCb = document.getElementById('ver_cb_android');
    if (andCb && andCb.checked) versions.push(`App Tester_${config.andAppTester || ''}`);

    const iosCb = document.getElementById('ver_cb_ios');
    if (iosCb && iosCb.checked) {
        const verType = document.querySelector('input[name="ios_ver_type"]:checked')?.value || 'TestFlight';
        versions.push(`${verType}_${config.iosTestFlight || ''}`);
    }

    const browserMap = {
        'samsung': { id: 'ver_cb_samsung', label: '삼성인터넷', key: 'samsungBrowser' },
        'safari': { id: 'ver_cb_safari', label: 'Safari', key: 'safariBrowser' },
        'chrome': { id: 'ver_cb_chrome', label: 'Chrome', key: 'chromeBrowser' },
        'edge': { id: 'ver_cb_edge', label: 'Edge', key: 'edgeBrowser' }
    };

    Object.values(browserMap).forEach(b => {
        const cb = document.getElementById(b.id);
        if (cb && cb.checked) versions.push(`${b.label}_${config[b.key] || ''}`);
    });

    const appVerEl = document.getElementById('appVersion');
    if (appVerEl) appVerEl.value = versions.join(' / ');
};

window.applyAndSavePrefixOrder = () => {
    const container = document.getElementById('prefixContainer');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.prefix-item'));
    const orders = {};

    items.sort((a, b) => {
        const valA = parseInt(a.querySelector('.prefix-order-input')?.value || 0);
        const valB = parseInt(b.querySelector('.prefix-order-input')?.value || 0);
        return valA - valB;
    });

    items.forEach((item, idx) => {
        const target = item.getAttribute('data-id');
        const orderVal = idx + 1;
        const input = item.querySelector('.prefix-order-input');
        if (input) input.value = orderVal;
        orders[target] = orderVal;
        container.appendChild(item);
    });

    localStorage.setItem('skm_prefix_order', JSON.stringify(orders));
    if (typeof window.showToast === 'function') window.showToast('✅ Prefix 순서가 저장되었습니다.');
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
};

window.resetPrefixOrder = () => {
    localStorage.removeItem('skm_prefix_order');
    location.reload();
};

window.loadPrefixOrder = () => {
    const ordersStr = localStorage.getItem('skm_prefix_order');
    if (!ordersStr) return;
    const orders = JSON.parse(ordersStr);

    const container = document.getElementById('prefixContainer');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.prefix-item'));

    items.sort((a, b) => {
        const idA = a.getAttribute('data-id');
        const idB = b.getAttribute('data-id');
        return (orders[idA] || 99) - (orders[idB] || 99);
    });

    items.forEach(item => {
        const id = item.getAttribute('data-id');
        const input = item.querySelector('.prefix-order-input');
        if (orders[id] && input) input.value = orders[id];
        container.appendChild(item);
    });
};
