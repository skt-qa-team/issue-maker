window.QA_CORE = window.QA_CORE || {};
window.QA_CORE.CONSTANTS = window.QA_CORE.CONSTANTS || {};

window.QA_CORE.CONSTANTS.THEME_PRESETS = {
    defaultLight: { category: '라이트', name: '기본 라이트', bg: '#f0f2f5', panel: '#ffffff', textMain: '#1e293b', textSub: '#475569', border: '#e2e8f0', accent: '#3b82f6' },
    githubLight: { category: '라이트', name: '깃허브 라이트', bg: '#f6f8fa', panel: '#ffffff', textMain: '#24292f', textSub: '#57606a', border: '#d0d7de', accent: '#0969da' },
    notion: { category: '라이트', name: '노션 캔버스', bg: '#ffffff', panel: '#f7f7f5', textMain: '#37352f', textSub: '#787774', border: '#e9e9e7', accent: '#2383e2' },
    snow: { category: '라이트', name: '스노우 펄', bg: '#f9fafb', panel: '#ffffff', textMain: '#111827', textSub: '#4b5563', border: '#e5e7eb', accent: '#6366f1' },
    softPastel: { category: '라이트', name: '파스텔 소프트', bg: '#fffaf0', panel: '#ffffff', textMain: '#5d4037', textSub: '#8d6e63', border: '#ffe0b2', accent: '#ff8a65' },
    
    defaultDark: { category: '다크', name: '기본 다크', bg: '#0f172a', panel: '#1e293b', textMain: '#f8fafc', textSub: '#94a3b8', border: '#334155', accent: '#38bdf8' },
    githubDark: { category: '다크', name: '깃허브 다크', bg: '#0d1117', panel: '#161b22', textMain: '#c9d1d9', textSub: '#8b949e', border: '#30363d', accent: '#58a6ff' },
    tokyoNight: { category: '다크', name: '도쿄 나이트', bg: '#1a1b26', panel: '#24283b', textMain: '#c0caf5', textSub: '#a9b1d6', border: '#414868', accent: '#7aa2f7' },
    discord: { category: '다크', name: '디스코드 다크', bg: '#313338', panel: '#2b2d31', textMain: '#dbdee1', textSub: '#949ba4', border: '#1e1f22', accent: '#5865f2' },
    obsidian: { category: '다크', name: '옵시디언', bg: '#1e1e1e', panel: '#252526', textMain: '#d4d4d4', textSub: '#cccccc', border: '#3c3c3c', accent: '#007acc' },
    oledBlack: { category: '다크', name: '올레드 블랙', bg: '#000000', panel: '#111111', textMain: '#ffffff', textSub: '#aaaaaa', border: '#333333', accent: '#ff3366' },

    cyberpunk: { category: '스페셜', name: '나이트 시티', bg: '#000b1e', panel: '#00162d', textMain: '#00fff2', textSub: '#ff00ff', border: '#003b5c', accent: '#fdee00' },
    retro80s: { category: '스페셜', name: '레트로 80', bg: '#2b0245', panel: '#3d0363', textMain: '#ff00cc', textSub: '#33ccff', border: '#5a008a', accent: '#ffcc00' },
    monokai: { category: '스페셜', name: '모노카이', bg: '#272822', panel: '#3e3d32', textMain: '#f8f8f2', textSub: '#a6e22e', border: '#75715e', accent: '#fd971f' },
    oneDark: { category: '스페셜', name: '원 다크', bg: '#282c34', panel: '#21252b', textMain: '#abb2bf', textSub: '#5c6370', border: '#3e4451', accent: '#61afef' },
    dracula: { category: '스페셜', name: '드라큘라', bg: '#282a36', panel: '#44475a', textMain: '#f8f8f2', textSub: '#8be9fd', border: '#6272a4', accent: '#bd93f9' },

    nord: { category: '블루/쿨', name: '노드 쿨', bg: '#2e3440', panel: '#3b4252', textMain: '#eceff4', textSub: '#d8dee9', border: '#4c566a', accent: '#88c0d0' },
    oceanic: { category: '블루/쿨', name: '오셔닉 블루', bg: '#1b2b34', panel: '#343d46', textMain: '#d8dee9', textSub: '#a6accd', border: '#4f5b66', accent: '#6699cc' },
    navy: { category: '블루/쿨', name: '딥 네이비', bg: '#0a192f', panel: '#112240', textMain: '#ccd6f6', textSub: '#8892b0', border: '#233554', accent: '#64ffda' },
    
    forest: { category: '네이처', name: '딥 포레스트', bg: '#1c2e26', panel: '#263b32', textMain: '#d1e8df', textSub: '#9ebcae', border: '#3b5448', accent: '#4ade80' },
    mint: { category: '네이처', name: '민트 프레쉬', bg: '#f0fdf4', panel: '#ffffff', textMain: '#14532d', textSub: '#166534', border: '#bbf7d0', accent: '#10b981' },
    gruvbox: { category: '네이처', name: '그루브박스', bg: '#282828', panel: '#3c3836', textMain: '#ebdbb2', textSub: '#a89984', border: '#504945', accent: '#fe8019' },

    latte: { category: '커피/웜', name: '카페 라떼', bg: '#fdf8f5', panel: '#ffffff', textMain: '#4a3b32', textSub: '#705c4f', border: '#ebd8cc', accent: '#c28e6a' },
    espresso: { category: '커피/웜', name: '에스프레소', bg: '#2c2420', panel: '#3d322d', textMain: '#e6d5c3', textSub: '#b5a494', border: '#4d3f38', accent: '#d4a373' },
    sepia: { category: '커피/웜', name: '세피아 빈티지', bg: '#f4ecd8', panel: '#fffbf0', textMain: '#433422', textSub: '#705a3e', border: '#dfd3b6', accent: '#d97706' }
};

window.QA_CORE.Theme = {
    init: () => {
        const savedTheme = JSON.parse(localStorage.getItem('skm_custom_palette'));
        if (savedTheme) {
            window.QA_CORE.Theme.apply(savedTheme.bg, savedTheme.panel, savedTheme.textMain, savedTheme.textSub, savedTheme.border, savedTheme.accent);
            window.QA_CORE.Theme.syncPickers(savedTheme.bg, savedTheme.panel, savedTheme.textMain, savedTheme.textSub, savedTheme.border, savedTheme.accent);
        }

        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user && !user.isAnonymous) {
                    firebase.database().ref('users/' + user.uid + '/theme').once('value').then(snapshot => {
                        const themeData = snapshot.val();
                        if (themeData) {
                            localStorage.setItem('skm_custom_palette', JSON.stringify(themeData));
                            window.QA_CORE.Theme.apply(themeData.bg, themeData.panel, themeData.textMain, themeData.textSub, themeData.border, themeData.accent);
                        }
                    });
                }
            });
        }
    },

    apply: (bg, panel, textMain, textSub, border, accent) => {
        const root = document.documentElement;
        if (bg) root.style.setProperty('--bg-color', bg);
        if (panel) root.style.setProperty('--panel-bg', panel);
        if (textMain) root.style.setProperty('--text-main', textMain);
        if (textSub) root.style.setProperty('--text-sub', textSub);
        if (border) root.style.setProperty('--border-color', border);
        if (accent) root.style.setProperty('--accent-blue', accent);
    },

    syncPickers: (bg, panel, textMain, textSub, border, accent) => {
        const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
        setVal('picker_bg', bg);
        setVal('picker_panel', panel);
        setVal('picker_text_main', textMain);
        setVal('picker_text_sub', textSub);
        setVal('picker_border', border);
        setVal('picker_accent', accent);
    },

    applyPreset: (presetKey) => {
        const p = window.QA_CORE.CONSTANTS.THEME_PRESETS[presetKey];
        if (!p) return;
        window.QA_CORE.Theme.syncPickers(p.bg, p.panel, p.textMain, p.textSub, p.border, p.accent);
        window.QA_CORE.Theme.apply(p.bg, p.panel, p.textMain, p.textSub, p.border, p.accent);
    },

    preview: () => {
        const getVal = id => { const el = document.getElementById(id); return el ? el.value : null; };
        window.QA_CORE.Theme.apply(
            getVal('picker_bg'),
            getVal('picker_panel'),
            getVal('picker_text_main'),
            getVal('picker_text_sub'),
            getVal('picker_border'),
            getVal('picker_accent')
        );
    },

    save: () => {
        const getVal = id => { const el = document.getElementById(id); return el ? el.value : null; };
        const themeData = {
            bg: getVal('picker_bg'),
            panel: getVal('picker_panel'),
            textMain: getVal('picker_text_main'),
            textSub: getVal('picker_text_sub'),
            border: getVal('picker_border'),
            accent: getVal('picker_accent')
        };
        
        localStorage.setItem('skm_custom_palette', JSON.stringify(themeData));
        
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user && !user.isAnonymous) {
                if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnSaveTheme', true);
                firebase.database().ref('users/' + user.uid + '/theme').set(themeData)
                .then(() => {
                    if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('✅ 테마가 동기화되었습니다.', 'success');
                })
                .finally(() => {
                    if (window.QA_CORE.UI) window.QA_CORE.UI.toggleLoading('btnSaveTheme', false);
                    window.QA_CORE.Theme.closeModal();
                });
            } else {
                window.QA_CORE.Theme.closeModal();
            }
        }
    },

    reset: () => {
        if (confirm('테마를 기본 설정으로 초기화하시겠습니까?')) {
            window.QA_CORE.Theme.applyPreset('defaultLight');
            localStorage.removeItem('skm_custom_palette');
            if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('🔄 기본 테마로 재설정되었습니다.');
        }
    },

    renderTabs: (activeCategory) => {
        const container = document.getElementById('preset_buttons_container');
        if (!container) return;

        const presets = window.QA_CORE.CONSTANTS.THEME_PRESETS;
        const categories = [...new Set(Object.values(presets).map(p => p.category))];

        let html = `<div class="theme-category-container">`;
        categories.forEach(cat => {
            const activeClass = cat === activeCategory ? 'active' : '';
            html += `<button type="button" class="theme-category-btn ${activeClass}" onclick="window.QA_CORE.Theme.renderTabs('${cat}')">${cat}</button>`;
        });
        html += `</div>`;

        html += `<div class="theme-preset-grid">`;
        Object.keys(presets).forEach(key => {
            const p = presets[key];
            if (p.category === activeCategory) {
                html += `
                    <button type="button" class="theme-preset-btn" 
                        onclick="window.QA_CORE.Theme.applyPreset('${key}')">
                        <span class="theme-preset-dot" style="background-color: ${p.accent};"></span>
                        ${p.name}
                    </button>`;
            }
        });
        html += `</div>`;

        container.innerHTML = html;
    },

    openModal: () => {
        window.QA_CORE.Theme.renderTabs('라이트');
        if (window.QA_CORE.UI) window.QA_CORE.UI.initModal('theme-modal');
    },

    closeModal: () => { 
        if (window.QA_CORE.UI) window.QA_CORE.UI.closeModal('theme-modal');
    }
};

document.addEventListener('componentsLoaded', () => {
    window.QA_CORE.Theme.init();
});
