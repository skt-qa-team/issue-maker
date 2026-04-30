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
        filters: { android: 'all', ios: 'all' }
    },

    init: () => {
        window.QA_CORE.DeviceManager.fetchFromFirebase();
    },

    switchOS: (targetOS) => {
        window.QA_CORE.DeviceManager.State.currentOS = targetOS;
        document.querySelectorAll('.segment-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === targetOS);
        });
        document.querySelectorAll('.device-os-view').forEach(view => view.classList.add('d-none'));
        const activeView = document.getElementById(`device-view-${targetOS}`);
        if (activeView) activeView.classList.remove('d-none');
        window.QA_CORE.DeviceManager.renderTables();
    },

    syncFromGAS: async () => {
        const btn = document.getElementById('btnSyncDevice');
        if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnSyncDevice', true);
        try {
            const response = await fetch(window.QA_CORE.CONSTANTS.DEVICE_MANAGER.GAS_WEB_APP_URL, { redirect: 'follow' });
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            if (!result || !Array.isArray(result.data)) throw new Error('Data format error');
            window.QA_CORE.DeviceManager.State.devices = result.data;
            window.QA_CORE.DeviceManager.State.lastSync = new Date().getTime();
            await window.QA_CORE.DeviceManager.saveToFirebase(result.data, window.QA_CORE.DeviceManager.State.lastSync);
            window.QA_CORE.DeviceManager.renderTables();
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('✅ 동기화 완료', 'success');
        } catch (error) {
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('❌ 동기화 실패', 'error');
        } finally {
            if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnSyncDevice', false);
        }
    },

    fetchFromFirebase: () => {
        const path = window.QA_CORE.CONSTANTS.DEVICE_MANAGER.FIREBASE_PATH;
        if (typeof firebase !== 'undefined' && firebase.database) {
            firebase.database().ref(path).on('value', (snapshot) => {
                const data = snapshot.val();
                if (data && Array.isArray(data.list)) {
                    window.QA_CORE.DeviceManager.State.devices = data.list;
                    window.QA_CORE.DeviceManager.State.lastSync = data.lastSync;
                    window.QA_CORE.DeviceManager.renderTables();
                }
            });
        }
    },

    saveToFirebase: async (list, time) => {
        const path = window.QA_CORE.CONSTANTS.DEVICE_MANAGER.FIREBASE_PATH;
        if (typeof firebase !== 'undefined' && firebase.database) {
            await firebase.database().ref(path).set({ list: list, lastSync: time });
        }
    },

    formatDate: (t) => {
        if (!t) return '없음';
        const d = new Date(t);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },

    renderTables: () => {
        const devices = window.QA_CORE.DeviceManager.State.devices || [];
        const syncLabel = document.getElementById('deviceLastSyncLabel');
        if (syncLabel) syncLabel.textContent = `마지막 동기화: ${window.QA_CORE.DeviceManager.formatDate(window.QA_CORE.DeviceManager.State.lastSync)}`;

        const isIOS = (d) => {
            const name = String(d.name || '').toLowerCase();
            const os = String(d.os || '').toLowerCase();
            const mf = String(d.manufacturer || '').toLowerCase();
            return name.includes('iphone') || name.includes('ipad') || name.includes('아이폰') || name.includes('아이패드') || os.includes('ios') || mf.includes('apple');
        };

        const androidList = devices.filter(d => !isIOS(d));
        const iosList = devices.filter(d => isIOS(d));

        window.QA_CORE.DeviceManager.renderOSGroup('and', androidList);
        window.QA_CORE.DeviceManager.renderOSGroup('ios', iosList);
    },

    renderOSGroup: (prefix, list) => {
        const verifyList = list.filter(d => d.isVerify || ['검증', '내부'].includes(d.status));
        const filterVal = window.QA_CORE.DeviceManager.State.filters[prefix === 'and' ? 'android' : 'ios'];
        const masterList = filterVal === 'all' ? list : list.filter(d => String(d.status).includes(filterVal));

        const countEl = document.getElementById(`count-${prefix}-verify`);
        if (countEl) countEl.textContent = `${verifyList.length}대`;

        const verifyTbody = document.getElementById(`tbody-${prefix}-verify`);
        if (verifyTbody) {
            verifyTbody.innerHTML = verifyList.map((d, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td class="td-highlight">${d.deviceNo || '-'}</td>
                    <td>${d.name || '-'}</td>
                    <td>${d.osVersion || '-'}</td>
                    <td>${d.resolution || '-'}</td>
                    <td>${d.model || '-'}</td>
                    <td><span class="user-tag">${d.currentUser || '-'}</span></td>
                </tr>
            `).join('');
        }

        const masterTbody = document.getElementById(`tbody-${prefix}-master`);
        if (masterTbody) {
            masterTbody.innerHTML = masterList.map((d, i) => `
                <tr>
                    <td>${i + 1}</td>
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
    },

    getStatusClass: (s) => {
        const status = String(s || '');
        if (status.includes('내부') || status.includes('검증')) return 'status-internal';
        if (status.includes('보유')) return 'status-owned';
        if (status.includes('대여')) return 'status-rental';
        if (status.includes('이상') || status.includes('불량')) return 'status-error';
        return '';
    }
};

document.addEventListener('componentsLoaded', () => {
    setTimeout(() => { if (window.QA_CORE.DeviceManager) window.QA_CORE.DeviceManager.init(); }, 600);
});
