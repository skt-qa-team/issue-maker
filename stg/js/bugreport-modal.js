function openBugReportModal() {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.classList.remove('d-none');
    }
}

function closeBugReportModal() {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.classList.add('d-none');
        const locInput = document.getElementById('bug_location');
        const descInput = document.getElementById('bug_description');
        if (locInput) locInput.value = '';
        if (descInput) descInput.value = '';
    }
}

function submitBugReport() {
    const locInput = document.getElementById('bug_location');
    const descInput = document.getElementById('bug_description');
    
    const locationStr = locInput ? locInput.value.trim() : '';
    const descriptionStr = descInput ? descInput.value.trim() : '';

    if (!descriptionStr) {
        if (typeof showToast === 'function') {
            showToast('상세 내용을 입력해 주세요.');
        } else {
            alert('상세 내용을 입력해 주세요.');
        }
        return;
    }

    console.log({
        type: "BUG_REPORT",
        location: locationStr,
        description: descriptionStr,
        timestamp: new Date().toISOString()
    });

    if (typeof showToast === 'function') {
        showToast('버그가 성공적으로 제보되었습니다. 감사합니다!');
    } else {
        alert('버그가 성공적으로 제보되었습니다. 감사합니다!');
    }

    closeBugReportModal();
}
