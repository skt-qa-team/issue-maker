window.showSystemError = (title, details) => {
    let overlay = document.getElementById('global-error-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'global-error-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.75);z-index:999999;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);';
        document.body.appendChild(overlay);
    }

    const modal = document.createElement('div');
    modal.style.cssText = 'background:#ffffff;border-radius:12px;padding:24px;width:90%;max-width:550px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);font-family:sans-serif;border-left:8px solid #ef4444;box-sizing:border-box;';
    
    modal.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h3 style="margin:0;color:#ef4444;font-size:1.25rem;font-weight:900;letter-spacing:-0.5px;">🚨 System Error Monitor</h3>
        </div>
        <p style="margin:0 0 12px 0;font-weight:800;color:#1f2937;font-size:1rem;">${title}</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;font-family:monospace;font-size:0.85rem;color:#374151;white-space:pre-wrap;word-break:break-all;max-height:250px;overflow-y:auto;border:1px solid #e5e7eb;">${details}</div>
        <div style="margin-top:20px;text-align:right;">
            <button onclick="this.closest('#global-error-overlay').remove()" style="background:#ef4444;color:#ffffff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:800;font-size:0.9rem;transition:background 0.2s;">인지했습니다 (닫기)</button>
        </div>
    `;

    overlay.innerHTML = '';
    overlay.appendChild(modal);
};

window.addEventListener('error', (e) => {
    const title = "자바스크립트 런타임 에러";
    const details = `에러 메시지: ${e.message}\n발생 파일: ${e.filename}\n위치: Line ${e.lineno}, Col ${e.colno}\n\n[Stack Trace]\n${e.error ? e.error.stack : 'No stack trace available'}`;
    window.showSystemError(title, details);
});

window.addEventListener('unhandledrejection', (e) => {
    const title = "비동기 작업(Promise) 처리 실패";
    const details = `상세 이유: ${e.reason ? (e.reason.stack || e.reason) : 'No reason provided'}`;
    window.showSystemError(title, details);
});

const originalConsoleError = console.error;
console.error = function(...args) {
    originalConsoleError.apply(console, args);
    const errStrings = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
    
    if (errStrings.includes('Component Load Failure')) {
        window.showSystemError("HTML 컴포넌트 로드 실패 (404)", errStrings + "\n\nloader.js의 경로명과 실제 파일명이 일치하는지 확인하십시오.");
    }
};

window.requireElement = (id, contextName = "알 수 없는 컨텍스트") => {
    const el = document.getElementById(id);
    if (!el) {
        const errTitle = `필수 DOM 요소 누락 (${contextName})`;
        const errDetails = `ID가 '${id}'인 HTML 요소를 화면에서 찾을 수 없습니다.\n\n해당 파일이 로드되지 않았거나, 파일 내부에 해당 ID를 가진 요소가 존재하지 않습니다.\nloader.js와 HTML 구조를 점검하세요.`;
        window.showSystemError(errTitle, errDetails);
        throw new Error(`DOM Element Missing: ${id}`);
    }
    return el;
};
