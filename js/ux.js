document.addEventListener('DOMContentLoaded', () => {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    window.showToast = function(message) {
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
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.target.readOnly) return;
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                if (typeof saveDraft === 'function') saveDraft();
                const now = new Date();
                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                window.showToast(`💾 ${timeStr} 자동 저장됨`);
            }, 1500);
        }
    });

    loadPrefixOrder();
});

function toggleDeviceMode(os) {
    const isNormal = document.querySelector(`input[name="${os}_dev_mode"]:checked`).value === 'normal';
    const normalList = document.getElementById(`${os}NormalList`);
    const specialList = document.getElementById(`${os}SpecialList`);

    if (isNormal) {
        normalList.classList.remove('d-none');
        specialList.classList.add('d-none');
    } else {
        normalList.classList.add('d-none');
        specialList.classList.remove('d-none');
    }
}

function handlePocChange() {
    const poc = document.getElementById('poc').value;
    const isWeb = (poc === 'PC Web' || poc === 'PC M.Web' || poc === 'Admin');
    const isAI = (poc === 'AI Layer');

    document.getElementById('deviceGroup').classList.toggle('d-none', isWeb);
    document.getElementById('appVersionGroup').classList.toggle('d-none', isWeb);
    document.getElementById('urlGroup').classList.toggle('d-none', !isWeb);
    document.getElementById('aiModeGroup').classList.toggle('d-none', !isAI);

    if (isWeb) {
        const config = JSON.parse(localStorage.getItem('qa_system_config_master')) || {};
        document.getElementById('urlLabel').textContent = poc === 'Admin' ? 'Admin URL' : 'PC Web URL';
        document.getElementById('targetUrl').value = poc === 'Admin' ? (config.adminUrl || '') : (config.pcUrl || '');
    }
}

function syncEnvironmentByOS() {
    const osType = document.getElementById('osType').value;
    const iosVerToggle = document.getElementById('ios-ver-toggle');
    const appVersionLabel = document.getElementById('appVersionLabel');

    if (osType === 'iOS') {
        iosVerToggle.classList.remove('d-none');
        const verType = document.querySelector('input[name="ios_ver_type"]:checked').value;
        appVersionLabel.textContent = `${verType} 버전`;
    } else if (osType === 'Android') {
        iosVerToggle.classList.add('d-none');
        appVersionLabel.textContent = 'App Tester 버전';
    } else {
        iosVerToggle.classList.add('d-none');
        appVersionLabel.textContent = '버전';
    }
}

function syncDeviceFromVersion(os) {
    const cb = document.getElementById(`ver_cb_${os}`);
    const col = document.getElementById(`${os}DeviceCol`);
    if (cb.checked) col.classList.remove('d-none');
    else col.classList.add('d-none');
}

function updateVersionTextbox() {
    const config = JSON.parse(localStorage.getItem('qa_system_config_master')) || {};
    let versions = [];
    if (document.getElementById('ver_cb_android').checked) versions.push(`App Tester_${config.andAppTester || ''}`);
    if (document.getElementById('ver_cb_ios').checked) {
        const verType = document.querySelector('input[name="ios_ver_type"]:checked').value;
        versions.push(`${verType}_${config.iosTestFlight || ''}`);
    }
    if (document.getElementById('ver_cb_samsung').checked) versions.push(`삼성인터넷_${config.samsungBrowser || ''}`);
    if (document.getElementById('ver_cb_safari').checked) versions.push(`Safari_${config.safariBrowser || ''}`);
    if (document.getElementById('ver_cb_chrome').checked) versions.push(`Chrome_${config.chromeBrowser || ''}`);
    if (document.getElementById('ver_cb_edge').checked) versions.push(`Edge_${config.edgeBrowser || ''}`);

    document.getElementById('appVersion').value = versions.join(' / ');
}

function applyAndSavePrefixOrder() {
    const container = document.getElementById('prefixContainer');
    const items = Array.from(container.querySelectorAll('.prefix-item'));
    const orders = {};

    items.sort((a, b) => {
        const valA = parseInt(a.querySelector('.prefix-order-input').value);
        const valB = parseInt(b.querySelector('.prefix-order-input').value);
        return valA - valB;
    });

    items.forEach((item, idx) => {
        const target = item.getAttribute('data-id');
        const orderVal = idx + 1;
        item.querySelector('.prefix-order-input').value = orderVal;
        orders[target] = orderVal;
        container.appendChild(item);
    });

    localStorage.setItem('skm_prefix_order', JSON.stringify(orders));
    if (typeof showToast === 'function') showToast('순서가 저장되었습니다.');
    if (typeof generateTemplate === 'function') generateTemplate();
}

function resetPrefixOrder() {
    localStorage.removeItem('skm_prefix_order');
    location.reload();
}

function loadPrefixOrder() {
    const orders = JSON.parse(localStorage.getItem('skm_prefix_order'));
    if (!orders) return;

    const container = document.getElementById('prefixContainer');
    const items = Array.from(container.querySelectorAll('.prefix-item'));

    items.sort((a, b) => {
        const idA = a.getAttribute('data-id');
        const idB = b.getAttribute('data-id');
        return (orders[idA] || 99) - (orders[idB] || 99);
    });

    items.forEach(item => {
        const id = item.getAttribute('data-id');
        if (orders[id]) item.querySelector('.prefix-order-input').value = orders[id];
        container.appendChild(item);
    });
}
