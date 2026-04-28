window.QA_CORE = window.QA_CORE || {};

window.QA_CORE.ErrorHandler = {
    State: {
        lastError: { message: '', time: 0 }
    },

    init() {
        window.addEventListener('error', (e) => this.handleRuntimeError(e));
        window.addEventListener('unhandledrejection', (e) => this.handlePromiseError(e));
        this.overrideConsoleError();
    },

    handle(error, context = 'MANUAL') {
        const details = error.stack || error.message || String(error);
        this.showModal(`🚨 명시적 에러 포착 (${context})`, details);
    },

    handleRuntimeError(e) {
        const details = `에러 메시지: ${e.message}\n발생 파일: ${e.filename}\n위치: Line ${e.lineno}, Col ${e.colno}\n\n[Stack Trace]\n${e.error ? e.error.stack : 'No trace'}`;
        this.showModal("자바스크립트 런타임 에러", details);
    },

    handlePromiseError(e) {
        let title = "비동기 작업(Promise) 처리 실패";
        let reasonStr = e.reason ? (e.reason.stack || e.reason.message || String(e.reason)) : 'No reason provided';
        
        if (reasonStr.includes('Firebase') || reasonStr.includes('PERMISSION_DENIED')) {
            title = "🔥 Firebase 시스템 에러";
        }
        
        this.showModal(title, `상세 이유: ${reasonStr}`);
    },

    overrideConsoleError() {
        const originalConsoleError = console.error;
        console.error = (...args) => {
            originalConsoleError.apply(console, args);
            const errStrings = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
            
            if (errStrings.includes('Component Load Failure')) {
                this.showModal("HTML 컴포넌트 로드 실패 (404)", errStrings + "\n\nloader.js의 경로명과 실제 파일명이 일치하는지 확인하십시오.");
            } else if (errStrings.includes('Firebase')) {
                this.showModal("🔥 Firebase 내부 에러", errStrings);
            }
        };
    },

    showModal(title, details) {
        const now = Date.now();
        if (this.State.lastError.message === details && now - this.State.lastError.time < 2000) return;
        this.State.lastError = { message: details, time: now };

        let overlay = document.getElementById('global-error-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'global-error-overlay';
            overlay.className = 'system-error-overlay';
            document.body.appendChild(overlay);
        }

        const modal = document.createElement('div');
        modal.className = 'system-error-modal';

        const header = document.createElement('div');
        header.className = 'system-error-header';
        const h3 = document.createElement('h3');
        h3.textContent = '🚨 System Error Monitor';
        header.appendChild(h3);

        const titleP = document.createElement('p');
        titleP.className = 'system-error-title';
        titleP.textContent = title;

        const body = document.createElement('div');
        body.className = 'system-error-body';
        body.textContent = details;

        const footer = document.createElement('div');
        footer.className = 'system-error-footer';

        const btnCopy = document.createElement('button');
        btnCopy.className = 'btn-secondary';
        btnCopy.style.marginRight = '8px';
        btnCopy.textContent = '로그 복사';
        btnCopy.onclick = () => {
            navigator.clipboard.writeText(`[${title}]\n${details}`).then(() => {
                if (window.QA_CORE.UI && typeof window.QA_CORE.UI.showToast === 'function') {
                    window.QA_CORE.UI.showToast('에러 로그가 복사되었습니다.', 'success');
                }
            });
        };

        const btnReload = document.createElement('button');
        btnReload.className = 'btn-secondary';
        btnReload.style.marginRight = '8px';
        btnReload.textContent = '새로고침';
        btnReload.onclick = () => window.location.reload();

        const btnClose = document.createElement('button');
        btnClose.className = 'btn-primary';
        btnClose.textContent = '인지했습니다';
        btnClose.onclick = () => overlay.remove();

        footer.appendChild(btnCopy);
        footer.appendChild(btnReload);
        footer.appendChild(btnClose);

        modal.appendChild(header);
        modal.appendChild(titleP);
        modal.appendChild(body);
        modal.appendChild(footer);

        overlay.innerHTML = '';
        overlay.appendChild(modal);
    }
};

window.QA_CORE.Utils = window.QA_CORE.Utils || {};
window.QA_CORE.Utils.requireElement = (id, contextName = "알 수 없는 컨텍스트") => {
    const el = document.getElementById(id);
    if (!el) {
        const errTitle = `필수 DOM 요소 누락 (${contextName})`;
        const errDetails = `ID가 '${id}'인 HTML 요소를 화면에서 찾을 수 없습니다.`;
        window.QA_CORE.ErrorHandler.showModal(errTitle, errDetails);
        throw new Error(`DOM Element Missing: ${id}`);
    }
    return el;
};

window.requireElement = window.QA_CORE.Utils.requireElement;

window.QA_CORE.ErrorHandler.init();
