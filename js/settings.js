const defaultConfig = {
    andDevices: [], andSpecialDevices: [], andDefaultDevices: [],
    iosDevices: [], iosSpecialDevices: [], iosDefaultDevices: [],
    andAppTester: '', iosTestFlight: '', iosDistribution: '',
    adminUrl: '', pcUrl: ''
};
const STORAGE_KEY = 'qa_system_config_master';

const THEME_PRESETS = {
    defaultLight: { name: '기본 라이트', bg: '#f0f2f5', panel: '#ffffff', textMain: '#1e293b', textSub: '#475569', border: '#e2e8f0', accent: '#3b82f6' },
    defaultDark: { name: '기본 다크', bg: '#0f172a', panel: '#1e293b', textMain: '#f8fafc', textSub: '#94a3b8', border: '#334155', accent: '#38bdf8' },
    githubLight: { name: '깃허브 라이트', bg: '#f6f8fa', panel: '#ffffff', textMain: '#24292f', textSub: '#57606a', border: '#d0d7de', accent: '#0969da' },
    githubDark: { name: '깃허브 다크', bg: '#0d1117', panel: '#161b22', textMain: '#c9d1d9', textSub: '#8b949e', border: '#30363d', accent: '#58a6ff' },
    dracula: { name: '드라큘라', bg: '#282a36', panel: '#44475a', textMain: '#f8f8f2', textSub: '#6272a4', border: '#6272a4', accent: '#bd93f9' },
    nord: { name: '노드 쿨', bg: '#2e3440', panel: '#3b4252', textMain: '#eceff4', textSub: '#d8dee9', border: '#4c566a', accent: '#88c0d0' },
    solarLight: { name: '솔라 라이트', bg: '#fdf6e3', panel: '#eee8d5', textMain: '#657b83', textSub: '#839496', border: '#ccc2a3', accent: '#2aa198' },
    solarDark: { name: '솔라 다크', bg: '#002b36', panel: '#073642', textMain: '#839496', textSub: '#586e75', border: '#104b5a', accent: '#b58900' },
    mint: { name: '민트 프레쉬', bg: '#f0fdf4', panel: '#ffffff', textMain: '#14532d', textSub: '#166534', border: '#bbf7d0', accent: '#10b981' },
    sepia: { name: '세피아 웜', bg: '#f4ecd8', panel: '#fffbf0', textMain: '#433422', textSub: '#705a3e', border: '#dfd3b6', accent: '#d97706' }
};

function initCustomTheme() {
    const savedTheme = JSON.parse(localStorage.getItem('skm_custom_palette'));
    if(savedTheme) {
        applyTheme(savedTheme.bg, savedTheme.panel, savedTheme.textMain, savedTheme.textSub, savedTheme.border, savedTheme.accent);
        syncPickers(savedTheme.bg, savedTheme.panel, savedTheme.textMain, savedTheme.textSub, savedTheme.border, savedTheme.accent);
    }
}

function applyTheme(bg, panel, textMain, textSub, border, accent) {
    const root = document.documentElement;
    if(bg) root.style.setProperty('--bg-color', bg);
    if(panel) root.style.setProperty('--panel-bg', panel);
    if(textMain) root.style.setProperty('--text-main', textMain);
    if(textSub) root.style.setProperty('--text-sub', textSub);
    if(border) root.style.setProperty('--border-color', border);
    if(accent) root.style.setProperty('--accent-blue', accent);
}

function syncPickers(bg, panel, textMain, textSub, border, accent) {
    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    setVal('picker_bg', bg);
    setVal('picker_panel', panel);
    setVal('picker_text_main', textMain);
    setVal('picker_text_sub', textSub);
    setVal('picker_border', border);
    setVal('picker_accent', accent);
}

function applyPreset(presetKey) {
    const p = THEME_PRESETS[presetKey];
    if(!p) return;
    syncPickers(p.bg, p.panel, p.textMain, p.textSub, p.border, p.accent);
    applyTheme(p.bg, p.panel, p.textMain, p.textSub, p.border, p.accent);
}

function previewTheme() {
    const getVal = id => { const el = document.getElementById(id); return el ? el.value : null; };
    applyTheme(
        getVal('picker_bg'),
        getVal('picker_panel'),
        getVal('picker_text_main'),
        getVal('picker_text_sub'),
        getVal('picker_border'),
        getVal('picker_accent')
    );
}

function saveTheme() {
    const getVal = id => { const el = document.getElementById(id); return el ? el.value : null; };
    localStorage.setItem('skm_custom_palette', JSON.stringify({
        bg: getVal('picker_bg'),
        panel: getVal('picker_panel'),
        textMain: getVal('picker_text_main'),
        textSub: getVal('picker_text_sub'),
        border: getVal('picker_border'),
        accent: getVal('picker_accent')
    }));
    closeThemeModal();
}

function resetTheme() {
    applyPreset('defaultLight');
    localStorage.removeItem('skm_custom_palette');
}

function openThemeModal() {
    const container = document.getElementById('preset_buttons_container');
    if (container && container.innerHTML.trim() === '') {
        container.innerHTML = '';
        Object.keys(THEME_PRESETS).forEach(key => {
            const p = THEME_PRESETS[key];
            container.innerHTML += `<button type="button" class="preset-btn" style="background:${p.panel}; border: 1.5px solid ${p.border}; color:${p.textMain}; padding:10px; border-radius:8px; cursor:pointer; font-weight:800; font-size:0.85rem; display:flex; align-items:center; gap:8px; transition:0.2s;" onmouseover="this.style.borderColor='${p.accent}'" onmouseout="this.style.borderColor='${p.border}'" onclick="applyPreset('${key}')"><span style="display:inline-block; width:14px; height:14px; border-radius:50%; background:${p.accent};"></span>${p.name}</button>`;
        });
    }
    document.getElementById('themeModal').style.display = 'flex';
}

function closeThemeModal() { 
    document.getElementById('themeModal').style.display = 'none'; 
    initCustomTheme(); 
}

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
        andDefaultDevices: split('set_and_default'),
        iosDevices: split('set_ios_devices'),
        iosSpecialDevices: split('set_ios_special'),
        iosDefaultDevices: split('set_ios_default')
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user && !user.isAnonymous) {
            firebase.database().ref('users/' + user.uid + '/settings').set(data);
        }
    }

    if (typeof syncEnvironmentByOS === 'function') {
        syncEnvironmentByOS();
    }
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
    document.getElementById('set_and_default').value = (cfg.andDefaultDevices || []).join('\n');
    document.getElementById('set_ios_devices').value = (cfg.iosDevices || []).join('\n');
    document.getElementById('set_ios_special').value = (cfg.iosSpecialDevices || []).join('\n');
    document.getElementById('set_ios_default').value = (cfg.iosDefaultDevices || []).join('\n');
}

function closeModal() { document.getElementById('settingModal').style.display = 'none'; }
function openChangelogModal() { document.getElementById('changelogModal').style.display = 'flex'; }
function closeChangelogModal() { document.getElementById('changelogModal').style.display = 'none'; }
