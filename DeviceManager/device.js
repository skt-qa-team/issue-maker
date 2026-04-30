window.QA_CORE = window.QA_CORE || {};
window.QA_CORE.CONSTANTS = window.QA_CORE.CONSTANTS || {};

window.QA_CORE.CONSTANTS.DEVICE_MANAGER = {
    GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbyLuRt_rWMEu47uUKzP74XitMzoS5_UZRprVKV2IYhqeTaFSuEOwBAv5LYIsDfbzLnfXg/exec',
    FIREBASE_PATH: 'system/device_master'
};

window.QA_CORE.DeviceManager = {
    State: {
        devices: [],
        lastSync: null,
        currentOS: 'android',
        filters: {
            android: 'all',
            ios: 'all'
        }
    },

    init: () => {
        window.QA_CORE.DeviceManager.fetchFromFirebase();
    },

    switchOS: (targetOS) => {
        window.QA_CORE.DeviceManager.State.currentOS = targetOS;

        document.querySelectorAll('.segment-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === targetOS);
        });

        document.querySelectorAll('.device-os-view').forEach(view => {
            view.classList.add('d-none');
            view.classList.remove('active');
        });

        const activeView = document.getElementById(`device-view-${targetOS}`);
        if (activeView) {
            activeView.classList.remove('d-none');
            setTimeout(() => activeView.classList.add('active'), 50);
        }
    },

    filterMasterList: (os) => {
        const selectEl = document.getElementById(`filter-${os}-status`);
        if (selectEl) {
            window.QA_CORE.DeviceManager.State.filters[os] = selectEl.value;
            window.QA_CORE.DeviceManager.renderTables();
        }
    },

    syncFromGAS: async () => {
        const btn = document.getElementById('btnSyncDevice');
        
        if (btn) btn.disabled = true;
        if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnSyncDevice', true);

        try {
            const response = await fetch(window.QA_CORE.CONSTANTS.DEVICE_MANAGER.GAS_WEB_APP_URL, {
                method: 'GET',
                redirect: 'follow'
            });
            
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            
            const result = await response.json();
            
            if (!result || !Array.isArray(result.data)) {
                throw new Error('Invalid data format from GAS');
            }

            window.QA_CORE.DeviceManager.State.devices = result.data;
            window.QA_CORE.DeviceManager.State.lastSync = new Date().getTime();

            await window.QA_CORE.DeviceManager.saveToFirebase(result.data, window.QA_CORE.DeviceManager.State.lastSync);
            
            window.QA_CORE.DeviceManager.renderTables();
            
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('✅ 구글 시트 동기화 완료', 'success');
        } catch (error) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(error, 'GAS Sync Error');
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('❌ 동기화 실패 (CORS 또는 권한 문제)', 'error');
        } finally {
            if (btn) btn.disabled = false;
            if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnSyncDevice', false);
        }
    },

    fetchFromFirebase: () => {
        try {
            if (typeof firebase !== 'undefined' && firebase.database) {
                const path = window.QA_CORE.CONSTANTS.DEVICE_MANAGER.FIREBASE_PATH;
                firebase.database().ref(path).on('value', (snapshot) => {
                    const data = snapshot.val();
                    if (data && Array.isArray(data.list)) {
                        window.QA_CORE.DeviceManager.State.devices = data.list;
                        window.QA_CORE.DeviceManager.State.lastSync = data.lastSync || null;
                        window.QA_CORE.DeviceManager.renderTables();
                    }
                });
            }
        } catch (error) {
            if (window.QA_CORE.ErrorHandler) window.QA_CORE.ErrorHandler.handle(error, 'Firebase Fetch Devices');
        }
    },

    saveToFirebase: async (deviceList, syncTime) => {
        try {
            if (typeof firebase !== 'undefined' && firebase.database) {
                const path = window.QA_CORE.CONSTANTS.DEVICE_MANAGER.FIREBASE_PATH;
                await firebase.database().ref(path).set({
                    list: deviceList,
                    lastSync: syncTime
                });
            }
        } catch (error) {
            throw error;
        }
    },

    formatDate: (timestamp) => {
        if (!timestamp) return '없음';
        const d = new Date(timestamp);
        const pad = (n) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },

    getStatusClass: (status) => {
        const s = status || '';
        if (s.includes('내부') || s.includes('검증')) return 'status-internal';
        if (s.includes('보유')) return 'status-owned';
        if (s.includes('대여')) return 'status-rental';
        if (s.includes('이상') || s.includes('불량')) return 'status-error';
        return '';
    },

    renderTables: () => {
        const state = window.QA_CORE.DeviceManager.State;
        const devices = state.devices || [];

        const syncLabel = document.getElementById('deviceLastSyncLabel');
        if (syncLabel) {
            syncLabel.textContent = `마지막 동기화: ${window.QA_CORE.DeviceManager.formatDate(state.lastSync)}`;
        }

        const androidDevices = devices.filter(d => d.os && !d.os.toLowerCase().includes('ios'));
        const iosDevices = devices.filter(d => d.os && d.os.toLowerCase().includes('ios'));

        window.QA_CORE.DeviceManager.renderOSGroup('and', androidDevices);
        window.QA_CORE.DeviceManager.renderOSGroup('ios', iosDevices);
    },

    renderOSGroup: (osPrefix, osDevices) => {
        const verifyList = osDevices.filter(d => d.isVerify === true || d.status === '검증' || d.status === '내부');
        const filterVal = window.QA_CORE.DeviceManager.State.filters[osPrefix === 'and' ? 'android' : 'ios'];
        const masterList = filterVal === 'all' ? osDevices : osDevices.filter(d => (d.status || '').includes(filterVal));

        const countEl = document.getElementById(`count-${osPrefix}-verify`);
        if (countEl) countEl.textContent = `${verifyList.length}대`;

        const verifyTbody = document.getElementById(`tbody-${osPrefix}-verify`);
        if (verifyTbody) {
            verifyTbody.innerHTML = verifyList.map((d, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td class="td-highlight">${d.deviceNo || '-'}</td>
                    <td>${d.name || '-'}</td>
                    <td>${d.osVersion || '-'}</td>
                    <td>${d.resolution || '-'}</td>
                    <td>${d.model || '-'}</td>
                    <td><span class="user-tag">${d.currentUser || '-'}</span></td>
                </tr>
            `).join('');
        }

        const masterTbody = document.getElementById(`tbody-${osPrefix}-master`);
        if (masterTbody) {
            masterTbody.innerHTML = masterList.map((d, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${d.manufacturer || '-'}</td>
                    <td class="td-highlight">${d.name || '-'}</td>
                    <td>${d.model || '-'}</td>
                    <td class="text-sub">${d.serial || '-'}</td>
                    <td>${d.os || '-'}</td>
                    <td><span class="status-badge ${window.QA_CORE.DeviceManager.getStatusClass(d.status)}">${d.status || '-'}</span></td>
                    <td>${d.currentUser ? `<span class="user-tag">${d.currentUser}</span>` : '-'}</td>
                </tr>
            `).join('');
        }
    }
};

document.addEventListener('componentsLoaded', () => {
    setTimeout(() => {
        if (window.QA_CORE && window.QA_CORE.DeviceManager) {
            window.QA_CORE.DeviceManager.init();
        }
    }, 600);
});
