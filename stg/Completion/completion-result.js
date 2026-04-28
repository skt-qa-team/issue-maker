window.QA_CORE = window.QA_CORE || {};

window.QA_CORE.CompletionResult = {
    init: () => {
        try {
            const btnCopy = document.getElementById('btn-copy-completion');
            if (btnCopy) {
                btnCopy.onclick = () => window.QA_CORE.CompletionResult.copyReport();
            }
            
            window.QA_CORE.CompletionResult.updatePreview();
        } catch (e) {
            console.error(e);
        }
    },

    updatePreview: () => {
        try {
            const previewNode = document.getElementById('comp_preview');
            if (!previewNode) return;

            if (!window.QA_CORE.CompletionInput || typeof window.QA_CORE.CompletionInput.getFormData !== 'function') return;
            
            const data = window.QA_CORE.CompletionInput.getFormData();
            if (!data) return;
            
            let result = [];

            if (data.devices && data.devices.length > 0) {
                result.push(`■ Device : ${data.devices.join(' / ')}`);
            }

            if (data.versions && data.versions.length > 0) {
                let versions = [];
                const cfg = (window.QA_CORE.CompletionInput && window.QA_CORE.CompletionInput.State && window.QA_CORE.CompletionInput.State.cache) ? window.QA_CORE.CompletionInput.State.cache : {};
                
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

            if (data.rate && String(data.rate).trim() !== '') {
                result.push(`■ 재현율 : ${data.rate} / 10`);
            }

            if (data.adminUrl && String(data.adminUrl).trim() !== '') {
                result.push(`■ Admin URL : ${data.adminUrl}`);
            }

            if (data.pcUrl && String(data.pcUrl).trim() !== '') {
                result.push(`■ PC URL : ${data.pcUrl}`);
            }

            if (data.mode && Array.isArray(data.mode) && data.mode.length > 0) {
                result.push(`■ 모드 : ${data.mode.join(' / ')}`);
            } else if (data.mode && typeof data.mode === 'string' && data.mode.trim() !== '') {
                result.push(`■ 모드 : ${data.mode}`);
            }

            if (data.check && String(data.check).trim() !== '') {
                result.push(`■ 현상 check : ${data.check}`);
            }

            previewNode.value = result.join('\n');
        } catch (e) {
            console.error(e);
        }
    },

    copyReport: async () => {
        try {
            const el = document.getElementById('comp_preview');
            if (!el || !el.value) return;
            const textToCopy = el.value;

            if (navigator.clipboard && window.isSecureContext) {
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('✅ 완료문 복사 완료!', 'success');
                } catch (err) {
                    window.QA_CORE.CompletionResult.fallbackCopy(textToCopy);
                }
            } else {
                window.QA_CORE.CompletionResult.fallbackCopy(textToCopy);
            }
        } catch (e) {
            console.error(e);
        }
    },

    fallbackCopy: (text) => {
        try {
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
                if (window.QA_CORE.UI) window.QA_CORE.UI.showToast('✅ 완료문 복사 완료!', 'success');
            } catch (err) {
            }
            document.body.removeChild(t);
        } catch (e) {
            console.error(e);
        }
    }
};
