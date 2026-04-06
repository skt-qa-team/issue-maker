function openConditionModal() {
    const modal = document.getElementById('conditionModal');
    if (modal) modal.style.display = 'flex';
    updateConditionPreview();
}

function closeConditionModal() {
    const modal = document.getElementById('conditionModal');
    if (modal) modal.style.display = 'none';
}

function updateConditionPreview() {
    const checkboxes = document.querySelectorAll('.cond-cb:checked');
    const previewEl = document.getElementById('cond_preview');
    if (!previewEl) return;

    let resultText = "";
    let index = 1;
    checkboxes.forEach(cb => {
        resultText += `${index}. ${cb.value}\n`;
        index++;
    });

    previewEl.value = resultText.trim();
}

function clearConditionChecks() {
    const checkboxes = document.querySelectorAll('.cond-cb');
    checkboxes.forEach(cb => cb.checked = false);
    updateConditionPreview();
}

function copyConditionText() {
    const previewEl = document.getElementById('cond_preview');
    if (!previewEl || !previewEl.value.trim()) {
        if (typeof showToast === 'function') showToast('복사할 내용이 없습니다.');
        return;
    }
    previewEl.select();
    document.execCommand('copy');
    if (typeof showToast === 'function') showToast('조합된 조건이 복사되었습니다.');
}

function applyConditionToForm() {
    const previewEl = document.getElementById('cond_preview');
    const preConditionEl = document.getElementById('preCondition');
    if (!previewEl || !preConditionEl) return;

    if (!previewEl.value.trim()) {
        if (typeof showToast === 'function') showToast('적용할 내용이 없습니다.');
        return;
    }

    const currentText = preConditionEl.value.trim();
    const newText = previewEl.value.trim();

    if (currentText) {
        preConditionEl.value = currentText + '\n\n' + newText;
    } else {
        preConditionEl.value = newText;
    }

    if (typeof generateTemplate === 'function') generateTemplate();
    closeConditionModal();
    if (typeof showToast === 'function') showToast('본문에 반영되었습니다.');
}

document.addEventListener('DOMContentLoaded', () => {
    const checkboxes = document.querySelectorAll('.cond-cb');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', updateConditionPreview);
    });
});
