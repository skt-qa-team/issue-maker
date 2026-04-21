document.addEventListener('componentsLoaded', () => {
    window.initCompletionResult();
});

window.initCompletionResult = () => {
    const btnCopy = document.getElementById('btn-copy-completion');
    if (btnCopy) {
        btnCopy.onclick = window.copyCompletionReport;
    }
    
    if (typeof window.updateCompletionPreview === 'function') {
        window.updateCompletionPreview();
    }
};

window.updateCompletionPreview = () => {
    const previewNode = document.getElementById('comp_preview');
    if (!previewNode) return;

    if (typeof window.getCompFormData !== 'function') return;
    const data = window.getCompFormData();
    
    let result = [];

    if (data.devices && data.devices.length > 0) {
        result.push(`■ Device : ${data.devices.join(' / ')}`);
    }

    if (data.versions && data.versions.length > 0) {
        let versions = [];
        const cfg = window.compDataCache || {};
        data.versions.forEach(v => {
            if (v === 'Android') versions.push(`App Tester_${cfg.andAppTester || ''}`);
            else if (v === 'iOS') versions.push(`TestFlight_${cfg.iosTestFlight || ''}`);
            else if (v === '삼성인터넷') versions.push(`삼성인터넷_${cfg.samsungBrowser || ''}`);
            else if (v === 'Safari') versions.push(`Safari_${cfg.safariBrowser || ''}`);
            else if (v === 'Chrome') versions.push(`Chrome_${cfg.chromeBrowser || ''}`);
            else if (v === 'Edge') versions.push(`Edge_${cfg.edgeBrowser || ''}`);
        });
        result.push(`■ 버전 : ${versions.join(' / ')}`);
    }

    if (data.servers && data.servers.length > 0) {
        result.push(`■ 서버 : ${data.servers.join(' / ')}`);
    }

    if (data.rate && data.rate.toString().trim() !== '') {
        result.push(`■ 재현율 : ${data.rate} / 10`);
    }

    if (data.adminUrl && data.adminUrl.trim() !== '') {
        result.push(`■ Admin URL : ${data.adminUrl}`);
    }

    if (data.pcUrl && data.pcUrl.trim() !== '') {
        result.push(`■ PC URL : ${data.pcUrl}`);
    }

    if (data.mode && data.mode.trim() !== '') {
        result.push(`■ 모드 : ${data.mode}`);
    }

    if (data.check && data.check.trim() !== '') {
        result.push(`■ 현상 check :\n${data.check}`);
    }

    previewNode.value = result.join('\n');
};

window.copyCompletionReport = async () => {
    const el = document.getElementById('comp_preview');
    if (!el) return;
    const textToCopy = el.value;

    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(textToCopy);
            if (typeof window.showToast === 'function') window.showToast('✅ 완료문 복사 완료!');
        } catch (err) {
            window.fallbackCopyCompletion(textToCopy);
        }
    } else {
        window.fallbackCopyCompletion(textToCopy);
    }
};

window.fallbackCopyCompletion = (text) => {
    const t = document.createElement("textarea");
    t.style.position = "fixed";
    t.style.left = "-9999px";
    t.style.top = "0";
    document.body.appendChild(t);
    t.value = text;
    t.focus();
    t.select();
    try {
        document.execCommand('copy');
        if (typeof window.showToast === 'function') window.showToast('✅ 완료문 복사 완료!');
    } catch (err) {
        console.error('Copy failed', err);
    }
    document.body.removeChild(t);
};
