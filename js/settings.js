const defaultConfig = { 
    andDevices: [], andSpecialDevices: [],
    iosDevices: [], iosSpecialDevices: [],
    andAppTester: '', iosTestFlight: '', iosDistribution: '',
    adminUrl: '', pcUrl: '' 
};
const STORAGE_KEY = 'qa_system_config_master';

function initCustomTheme() {
    const savedTheme = JSON.parse(localStorage.getItem('skm_custom_palette'));
    if(savedTheme) {
        applyTheme(savedTheme.bg, savedTheme.panel, savedTheme.text);
        syncPickers(savedTheme.bg, savedTheme.panel, savedTheme.text);
    }
}

function applyTheme(bg, panel, text) {
    document.documentElement.style.setProperty('--bg-color', bg);
    document.documentElement.style.setProperty('--panel-bg', panel);
    document.documentElement.style.setProperty('--text-main', text);
    document.documentElement.style.setProperty('--text-sub', text);
}

function syncPickers(bg, panel, text) {
    const pb = document.getElementById('picker_bg');
    const pp = document.getElementById('picker_panel');
    const pt = document.getElementById('picker_text');
    if (pb) pb.value = bg;
    if (pp) pp.value = panel;
    if (pt) pt.value = text;
}

function applyPreset(bg, panel, text) {
    syncPickers(bg, panel, text);
    applyTheme(bg, panel, text);
}

function previewTheme() {
    applyTheme(document.getElementById('picker_bg').value, document.getElementById('picker_panel').value, document.getElementById('picker_text').value);
}

function saveTheme() {
    localStorage.setItem('skm_custom_palette', JSON.stringify({
        bg: document.getElementById('picker_bg').value,
        panel: document.getElementById('picker_panel').value,
        text: document.getElementById('picker_text').value
    }));
    closeThemeModal();
}

function resetTheme() {
    applyTheme('#f0f2f5', '#ffffff', '#475569');
    syncPickers('#f0f2f5', '#ffffff', '#475569');
    localStorage.removeItem('skm_custom_palette');
}

function openThemeModal() { document.getElementById('themeModal').style.display = 'flex'; }
function closeThemeModal() { document.getElementById('themeModal').style.display = 'none'; initCustomTheme(); }

function renderChangelog() {
    const container = document.getElementById('changelog-container');
    if (!container || typeof changelogData === 'undefined') return;
    let htmlString = '';
    changelogData.forEach(log => {
        let listItems = log.changes.map(change => `<li>${change}</li>`).join('');
        htmlString += `<div class="changelog-item"><span class="version-badge">${log.version}</span><ul class="changelog-desc">${listItems}</ul></div>`;
    });
    container.innerHTML = htmlString;
}

function loadConfig() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultConfig; }

function saveSettings() {
    const split = (id) => document.getElementById(id).value.split('\n').map(s => s.trim()).filter(Boolean);
    const data = {
        adminUrl: document.getElementById('set_admin_url').value,
        pcUrl: document.getElementById('set_pc_url').value,
        andAppTester: document.getElementById('set_and_apptester').value,
        iosTestFlight: document.getElementById('set_ios_testflight').value,
        iosDistribution: document.getElementById('set_ios_distribution').value,
        andDevices: split('set_and_devices'),
        andSpecialDevices: split('set_and_special'),
        iosDevices: split('set_ios_devices'),
        iosSpecialDevices: split('set_ios_special')
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    if (typeof currentUserId !== 'undefined' && currentUserId && typeof isAnonymousUser !== 'undefined' && !isAnonymousUser) {
        firebase.database().ref('users/' + currentUserId + '/settings').set(data);
    }

    syncEnvironmentByOS();
    closeModal();
}

function openModal() {
    const cfg = loadConfig();
    document.getElementById('settingModal').style.display = 'flex';
    document.getElementById('set_admin_url').value = cfg.adminUrl || '';
    document.getElementById('set_pc_url').value = cfg.pcUrl || '';
    document.getElementById('set_and_apptester').value = cfg.andAppTester || '';
    document.getElementById('set_ios_testflight').value = cfg.iosTestFlight || '';
    document.getElementById('set_ios_distribution').value = cfg.iosDistribution || '';
    document.getElementById('set_and_devices').value = (cfg.andDevices || []).join('\n');
    document.getElementById('set_and_special').value = (cfg.andSpecialDevices || []).join('\n');
    document.getElementById('set_ios_devices').value = (cfg.iosDevices || []).join('\n');
    document.getElementById('set_ios_special').value = (cfg.iosSpecialDevices || []).join('\n');
}

function closeModal() { document.getElementById('settingModal').style.display = 'none'; }
function openChangelogModal() { document.getElementById('changelogModal').style.display = 'flex'; }
function closeChangelogModal() { document.getElementById('changelogModal').style.display = 'none'; }
