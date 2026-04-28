window.QA_CORE = window.QA_CORE || {};
window.QA_CORE.CONSTANTS = window.QA_CORE.CONSTANTS || {};

window.QA_CORE.CONSTANTS.TABS = {
    'issue': 'panel-issue',
    'calendar': 'panel-calendar',
    'completion': 'panel-completion',
    'bookmark': 'panel-bookmark'
};

window.QA_CORE.Utils = {
    escapeHTML: (str) => {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    
    encodeSafeKey: (str) => {
        return encodeURIComponent(str).replace(/\./g, '%2E');
    },

    decodeSafeKey: (str) => {
        return decodeURIComponent(str.replace(/%2E/g, '.'));
    }
};

window.QA_CORE.UI = {
    startClock: () => {
        setInterval(() => {
            const now = new Date();
            const clockEl = document.getElementById('currentTime');
            if (clockEl) {
                clockEl.textContent = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
            }
        }, 1000);
    },

    showToast: (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-msg toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) container.removeChild(toast);
            }, 400);
        }, 2500);
    },

    toggleLoading: (btnId, isLoading) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        if (isLoading) {
            btn.disabled = true;
            btn.dataset.originalHtml = btn.innerHTML;
            btn.innerHTML = '<span class="spinner"></span> 처리 중...';
        } else {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
        }
    },

    switchMainTab: (tabName) => {
        const targetId = window.QA_CORE.CONSTANTS.TABS[tabName];
        if (!targetId) return;

        document.querySelectorAll('.main-panel-content').forEach(panel => {
            panel.classList.add('d-none');
            panel.classList.remove('active');
        });

        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            targetEl.classList.remove('d-none');
            targetEl.classList.add('active');
        }

        document.querySelectorAll('.nav-btn, .main-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[data-tab="${tabName}"], [data-target="${targetId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        if (tabName === 'calendar' && window.QA_CORE.Calendar && typeof window.QA_CORE.Calendar.render === 'function') {
            window.QA_CORE.Calendar.render();
        }
        
        if (tabName === 'completion' && window.QA_CORE.CompletionInput && typeof window.QA_CORE.CompletionInput.init === 'function') {
            window.QA_CORE.CompletionInput.init();
        }

        if (tabName === 'bookmark' && window.QA_CORE.Bookmark && typeof window.QA_CORE.Bookmark.render === 'function') {
            window.QA_CORE.Bookmark.render();
        }
    },

    initModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    renderPresence: () => {
        const presenceList = document.getElementById('presence-list');
        if (!presenceList) return;

        if (typeof firebase !== 'undefined' && firebase.database) {
            firebase.database().ref('presence').on('value', (snapshot) => {
                presenceList.innerHTML = '';
                const users = snapshot.val();

                if (users) {
                    presenceList.classList.add('presence-active');
                    Object.values(users).forEach((u) => {
                        const img = document.createElement('img');
                        img.src = (u.photo && u.photo !== 'undefined') ? u.photo : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                        img.title = (u.name && u.name !== 'undefined') ? u.name : '알 수 없음';
                        img.className = 'presence-avatar';
                        presenceList.appendChild(img);
                    });
                } else {
                    presenceList.classList.remove('presence-active');
                }
            });
        }
    },

    initEvents: () => {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close-trigger') || e.target.classList.contains('modal-overlay')) {
                const modal = e.target.closest('.modal-base');
                if (modal) window.QA_CORE.UI.closeModal(modal.id);
            }
            
            const tabBtn = e.target.closest('.main-tab-btn');
            if (tabBtn) {
                const targetId = tabBtn.getAttribute('data-target');
                if (targetId) {
                    const tabName = targetId.replace('panel-', '');
                    if (typeof window.QA_CORE.UI.switchMainTab === 'function') {
                        window.QA_CORE.UI.switchMainTab(tabName);
                    }
                }
            }
        });
    }
};

window.QA_CORE.Form = {
    addCase: (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const match = el.value.match(/CASE (\d+)/g);
        let nextNum = 1;
        if (match) {
            const lastCase = match[match.length - 1];
            nextNum = parseInt(lastCase.replace('CASE ', '')) + 1;
        }
        const prefix = el.value.trim() === '' ? '' : '\n\n';
        el.value += `${prefix}CASE ${nextNum}.\n`;
        
        if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
            window.QA_CORE.ResultForm.generate();
        }
        el.focus();
    },

    clearForm: () => {
        if (confirm('모든 입력 내용을 초기화하시겠습니까?')) {
            const fields = [
                'title', 'prefix_env_custom', 'osType_custom', 'poc_custom', 
                'prefix_critical_custom', 'prefix_browser_custom', 'prefix_device_input',
                'prefix_account', 'prefix_page', 'targetUrl', 'preCondition', 
                'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'
            ];
            
            fields.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });

            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            
            if (window.QA_CORE.ResultForm && typeof window.QA_CORE.ResultForm.generate === 'function') {
                window.QA_CORE.ResultForm.generate();
            }
            if (window.QA_CORE.UI && typeof window.QA_CORE.UI.showToast === 'function') {
                window.QA_CORE.UI.showToast('🔄 초기화되었습니다.', 'success');
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.QA_CORE.UI && typeof window.QA_CORE.UI.initEvents === 'function') {
        window.QA_CORE.UI.initEvents();
    }
});
