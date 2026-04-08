const defaultConfig = {
    andDevices: [], andSpecialDevices: [], andDefaultDevices: [],
    iosDevices: [], iosSpecialDevices: [], iosDefaultDevices: [],
    andAppTester: '', iosTestFlight: '', iosDistribution: '',
    adminUrl: '', pcUrl: ''
};
const STORAGE_KEY = 'qa_system_config_master';

const THEME_PRESETS = {
    defaultLight: { category: '라이트', name: '기본 라이트', bg: '#f0f2f5', panel: '#ffffff', textMain: '#1e293b', textSub: '#475569', border: '#e2e8f0', accent: '#3b82f6' },
    githubLight: { category: '라이트', name: '깃허브 라이트', bg: '#f6f8fa', panel: '#ffffff', textMain: '#24292f', textSub: '#57606a', border: '#d0d7de', accent: '#0969da' },
    cleanWhite: { category: '라이트', name: '퓨어 화이트', bg: '#fbfbfe', panel: '#ffffff', textMain: '#000000', textSub: '#555555', border: '#eeeeee', accent: '#000000' },
    notion: { category: '라이트', name: '노션 캔버스', bg: '#ffffff', panel: '#f7f7f5', textMain: '#37352f', textSub: '#787774', border: '#e9e9e7', accent: '#2383e2' },
    snow: { category: '라이트', name: '스노우 펄', bg: '#f9fafb', panel: '#ffffff', textMain: '#111827', textSub: '#4b5563', border: '#e5e7eb', accent: '#6366f1' },

    defaultDark: { category: '다크', name: '기본 다크', bg: '#0f172a', panel: '#1e293b', textMain: '#f8fafc', textSub: '#94a3b8', border: '#334155', accent: '#38bdf8' },
    githubDark: { category: '다크', name: '깃허브 다크', bg: '#0d1117', panel: '#161b22', textMain: '#c9d1d9', textSub: '#8b949e', border: '#30363d', accent: '#58a6ff' },
    tokyoNight: { category: '다크', name: '도쿄 나이트', bg: '#1a1b26', panel: '#24283b', textMain: '#c0caf5', textSub: '#a9b1d6', border: '#414868', accent: '#7aa2f7' },
    oledBlack: { category: '다크', name: '올레드 블랙', bg: '#000000', panel: '#111111', textMain: '#ffffff', textSub: '#aaaaaa', border: '#333333', accent: '#ff3366' },
    discord: { category: '다크', name: '디스코드 다크', bg: '#313338', panel: '#2b2d31', textMain: '#dbdee1', textSub: '#949ba4', border: '#1e1f22', accent: '#5865f2' },
    obsidian: { category: '다크', name: '옵시디언', bg: '#1e1e1e', panel: '#252526', textMain: '#d4d4d4', textSub: '#cccccc', border: '#3c3c3c', accent: '#007acc' },

    nord: { category: '블루/쿨', name: '노드 쿨', bg: '#2e3440', panel: '#3b4252', textMain: '#eceff4', textSub: '#d8dee9', border: '#4c566a', accent: '#88c0d0' },
    oceanic: { category: '블루/쿨', name: '오셔닉 블루', bg: '#1b2b34', panel: '#343d46', textMain: '#d8dee9', textSub: '#a6accd', border: '#4f5b66', accent: '#6699cc' },
    navy: { category: '블루/쿨', name: '딥 네이비', bg: '#0a192f', panel: '#112240', textMain: '#ccd6f6', textSub: '#8892b0', border: '#233554', accent: '#64ffda' },
    blueberry: { category: '블루/쿨', name: '블루베리', bg: '#e0e7ff', panel: '#ffffff', textMain: '#1e1b4b', textSub: '#3730a3', border: '#c7d2fe', accent: '#4f46e5' },
    dracula: { category: '블루/쿨', name: '드라큘라', bg: '#282a36', panel: '#44475a', textMain: '#f8f8f2', textSub: '#8be9fd', border: '#6272a4', accent: '#bd93f9' },
    cobalt: { category: '블루/쿨', name: '코발트 빈티지', bg: '#193549', panel: '#224b6d', textMain: '#ffffff', textSub: '#9eb4c5', border: '#34658a', accent: '#ffc600' },

    mint: { category: '그린/자연', name: '민트 프레쉬', bg: '#f0fdf4', panel: '#ffffff', textMain: '#14532d', textSub: '#166534', border: '#bbf7d0', accent: '#10b981' },
    forest: { category: '그린/자연', name: '딥 포레스트', bg: '#1c2e26', panel: '#263b32', textMain: '#d1e8df', textSub: '#9ebcae', border: '#3b5448', accent: '#4ade80' },
    gruvbox: { category: '그린/자연', name: '그루브박스', bg: '#282828', panel: '#3c3836', textMain: '#ebdbb2', textSub: '#a89984', border: '#504945', accent: '#fe8019' },
    emerald: { category: '그린/자연', name: '에메랄드 시티', bg: '#ecfdf5', panel: '#ffffff', textMain: '#064e3b', textSub: '#047857', border: '#a7f3d0', accent: '#059669' },
    hacker: { category: '그린/자연', name: '해커 터미널', bg: '#0d1117', panel: '#000000', textMain: '#00ff00', textSub: '#00cc00', border: '#004400', accent: '#00ff00' },

    sepia: { category: '웜/파스텔', name: '세피아 웜', bg: '#f4ecd8', panel: '#fffbf0', textMain: '#433422', textSub: '#705a3e', border: '#dfd3b6', accent: '#d97706' },
    solarLight: { category: '웜/파스텔', name: '솔라 라이트', bg: '#fdf6e3', panel: '#eee8d5', textMain: '#073642', textSub: '#586e75', border: '#ccc2a3', accent: '#2aa198' },
    solarDark: { category: '웜/파스텔', name: '솔라 다크', bg: '#002b36', panel: '#073642', textMain: '#839496', textSub: '#93a1a1', border: '#104b5a', accent: '#b58900' },
    peach: { category: '웜/파스텔', name: '피치 블라썸', bg: '#fff7ed', panel: '#ffffff', textMain: '#431407', textSub: '#7c2d12', border: '#ffedd5', accent: '#ea580c' },
    roseWater: { category: '웜/파스텔', name: '로즈 워터', bg: '#fff0f5', panel: '#ffffff', textMain: '#5c1a3b', textSub: '#8a2b58', border: '#ffd1e3', accent: '#e11d48' },
    sunset: { category: '웜/파스텔', name: '선셋 다크', bg: '#2a1b18', panel: '#3a2622', textMain: '#fde0d9', textSub: '#d4a398', border: '#5c3a33', accent: '#ff7b54' },
    lavender: { category: '웜/파스텔', name: '라벤더 블룸', bg: '#f3f0ff', panel: '#ffffff', textMain: '#3b2164', textSub: '#5a3b8c', border: '#e5d5ff', accent: '#8b5cf6' },
    latte: { category: '웜/파스텔', name: '카페 라떼', bg: '#fdf8f5', panel: '#ffffff', textMain: '#4a3b32', textSub: '#705c4f', border: '#ebd8cc', accent: '#c28e6a' },

    hcLight: { category: '고대비/스페셜', name: '고대비 라이트', bg: '#ffffff', panel: '#ffffff', textMain: '#000000', textSub: '#000000', border: '#000000', accent: '#0000ff' },
    hcDark: { category: '고대비/스페셜', name: '고대비 다크', bg: '#000000', panel: '#000000', textMain: '#ffffff', textSub: '#ffffff', border: '#ffffff', accent: '#ffff00' },
    monokai: { category: '고대비/스페셜', name: '모노카이', bg: '#272822', panel: '#3e3d32', textMain: '#f8f8f2', textSub: '#a6e22e', border: '#75715e', accent: '#fd971f' },
    oneDark: { category: '고대비/스페셜', name: '원 다크', bg: '#282c34', panel: '#21252b', textMain: '#abb2bf', textSub: '#5c6370', border: '#3e4451', accent: '#61afef' }
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

function renderThemeTabs(activeCategory) {
    const container = document.getElementById('preset_buttons_container');
    if (!container) return;

    const categories = [...new Set(Object.values(THEME_PRESETS).map(p => p.category))];

    let html = `<div style="display: flex; gap: 8px; margin-bottom: 15px; border-bottom: 2px solid var(--border-color); padding-bottom: 8px; overflow-x: auto;">`;
    categories.forEach(cat => {
        const isAct = cat === activeCategory;
        const bg = isAct ? 'var(--accent-blue)' : 'var(--bg-color)';
        const color = isAct ? '#ffffff' : 'var(--text-sub)';
        const border = isAct ? 'var(--accent-blue)' : 'var(--border-color)';
        html += `<button type="button" onclick="renderThemeTabs('${cat}')" style="padding: 6px 12px; border-radius: 20px; border: 1px solid ${border}; background: ${bg}; color: ${color}; font-size: 0.8rem; font-weight: 800; cursor: pointer; white-space: nowrap; transition: 0.2s;">${cat}</button>`;
    });
    html += `</div>`;

    html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; max-height: 250px; overflow-y: auto; padding-right: 5px;">`;
    Object.keys(THEME_PRESETS).forEach(key => {
        const p = THEME_PRESETS[key];
        if (p.category === activeCategory) {
            html += `<button type="button" class="preset-btn" style="background:${p.panel}; border: 1.5px solid ${p.border}; color:${p.textMain}; padding:10px; border-radius:8px; cursor:pointer; font-weight:800; font-size:0.85rem; display:flex; align-items:center; gap:8px; transition:0.2s;" onmouseover="this.style.borderColor='${p.accent}'" onmouseout="this.style.borderColor='${p.border}'" onclick="applyPreset('${key}')"><span style="display:inline-block; min-width:14px; height:14px; border-radius:50%; background:${p.accent};"></span>${p.name}</button>`;
        }
    });
    html += `</div>`;

    container.innerHTML = html;
    container.style.display = 'block';
}

function openThemeModal() {
    renderThemeTabs('라이트');
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
