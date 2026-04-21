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

    const deviceString = data.devices.length > 0 ? data.devices.join(' / ') : '-';
    result.push(`■ Device : ${deviceString}`);

    let versions = [];
    data.versions.forEach(v => {
        const cfg = window.compDataCache || {};
        if (v === 'Android') versions.push(`App Tester_${cfg.andAppTester || ''}`);
        else if (v === 'iOS') versions.push(`TestFlight_${cfg.iosTestFlight || ''}`);
        else if (v === '삼성인터넷') versions.push(`삼성인터넷_${cfg.samsungBrowser || ''}`);
        else if (v === 'Safari') versions.push(`Safari_${cfg.safariBrowser || ''}`);
        else if (v === 'Chrome') versions.push(`Chrome_${cfg.chromeBrowser || ''}`);
        else if (v === 'Edge') versions.push(`Edge_${cfg.edgeBrowser || ''}`);
    });
    result.push(`■ 버전 : ${versions.join(' / ') || '-'}`);

    result.push(`■ 서버 : ${data.servers.join(' / ') || '-'}`);

    result.push(`■ 재현율 : ${data.rate || 0} / 10`);

    result.push(`■ Admin URL : ${data.adminUrl || '-'}`);
    result.push(`■ PC URL : ${data.pcUrl || '-'}`);

    result.push(`■ 모드 : ${data.mode || '-'}`);

    result.push(`■ 현상 check : ${data.check}`);

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
