function openBugReportModal() {
    const modal = document.getElementById('bugReportModal');
    if (modal) modal.classList.remove('d-none');
}

function closeBugReportModal() {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.classList.add('d-none');
        const loc = document.getElementById('bug_location');
        const desc = document.getElementById('bug_description');
        if (loc) loc.value = '';
        if (desc) desc.value = '';
    }
}

function submitBugReport() {
    const locEl = document.getElementById('bug_location');
    const descEl = document.getElementById('bug_description');
    const locationStr = locEl ? locEl.value.trim() : '';
    const descriptionStr = descEl ? descEl.value.trim() : '';

    if (!descriptionStr) {
        if (typeof showToast === 'function') showToast('⚠️ 상세 내용을 입력해 주세요.');
        return;
    }

    const user = firebase.auth().currentUser;
    const bugData = {
        reporter: user ? {
            uid: user.uid,
            email: user.email,
            name: user.displayName || '이름 없음'
        } : 'Anonymous',
        location: locationStr,
        description: descriptionStr,
        environment: {
            poc: document.getElementById('poc')?.value || 'Unknown',
            os: document.getElementById('osType')?.value || 'Unknown',
            appVersion: document.getElementById('appVersion')?.value || 'Unknown',
            targetUrl: document.getElementById('targetUrl')?.value || 'N/A',
            userAgent: navigator.userAgent
        },
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    firebase.database().ref('system_bugs').push(bugData)
        .then(() => {
            if (typeof showToast === 'function') showToast('✅ 제보가 성공적으로 접수되었습니다!');
            closeBugReportModal();
        })
        .catch((error) => {
            console.error("Bug Report Error:", error);
            if (typeof showToast === 'function') showToast('❌ 제보 전송에 실패했습니다. 관리자에게 문의하세요.');
        });
}
