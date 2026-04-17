let currentCondStep = 1;
const totalCondSteps = 6;

function openConditionModal() {
    const modal = document.getElementById('conditionModal');
    if (modal) modal.classList.add('active');
    showCondStep(1);
    updateConditionPreview();
}

function closeConditionModal() {
    const modal = document.getElementById('conditionModal');
    if (modal) modal.classList.remove('active');
}

function showCondStep(step) {
    currentCondStep = step;
    for (let i = 1; i <= totalCondSteps; i++) {
        const stepEl = document.getElementById(`cond-step-${i}`);
        if (stepEl) {
            if (i === step) stepEl.classList.remove('d-none');
            else stepEl.classList.add('d-none');
        }
    }
    
    const prevBtn = document.getElementById('cond-prev-btn');
    const nextBtn = document.getElementById('cond-next-btn');
    
    if (prevBtn) {
        if (step === 1) prevBtn.classList.add('d-none');
        else prevBtn.classList.remove('d-none');
    }

    if (nextBtn) {
        if (step === totalCondSteps) nextBtn.classList.add('d-none');
        else nextBtn.classList.remove('d-none');
    }
}

function nextCondStep() {
    if (currentCondStep < totalCondSteps) {
        showCondStep(currentCondStep + 1);
    }
}

function prevCondStep() {
    if (currentCondStep > 1) {
        showCondStep(currentCondStep - 1);
    }
}

function updateConditionPreview() {
    const previewEl = document.getElementById('cond_preview');
    if (!previewEl) return;

    let resultText = "";
    let index = 1;
    
    for (let i = 1; i <= totalCondSteps; i++) {
        const checkedRadio = document.querySelector(`input[name="cond_g${i}"]:checked`);
        if (checkedRadio) {
            if (checkedRadio.classList.contains('cond-other-cb')) {
                const wrapper = checkedRadio.closest('.checkbox-group');
                const input = wrapper.querySelector('.cond-other-input');
                if (input && input.value.trim() !== "") {
                    resultText += `${index}. ${input.value.trim()}\n`;
                } else {
                    resultText += `${index}. 기타\n`;
                }
            } else {
                resultText += `${index}. ${checkedRadio.value}\n`;
            }
            index++;
        }
    }

    previewEl.value = resultText.trim();
}

function clearConditionChecks() {
    const radios = document.querySelectorAll('.cond-cb');
    radios.forEach(r => r.checked = false);
    
    const otherInputs = document.querySelectorAll('.cond-other-input');
    otherInputs.forEach(input => {
        input.classList.add('d-none');
        input.value = '';
    });

    showCondStep(1);
    updateConditionPreview();
}

async function copyConditionText() {
    const previewEl = document.getElementById('cond_preview');
    if (!previewEl || !previewEl.value.trim()) {
        if (typeof showToast === 'function') showToast('복사할 내용이 없습니다.');
        return;
    }

    const textToCopy = previewEl.value.trim();

    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(textToCopy);
            if (typeof showToast === 'function') showToast('조합된 조건이 복사되었습니다.');
        } catch (err) {
            fallbackCopyConditionText(textToCopy);
        }
    } else {
        fallbackCopyConditionText(textToCopy);
    }
}

function fallbackCopyConditionText(text) {
    const t = document.createElement("textarea");
    t.className = 'sr-only';
    document.body.appendChild(t);
    t.value = text;
    t.select();
    try {
        document.execCommand('copy');
        if (typeof showToast === 'function') showToast('조합된 조건이 복사되었습니다.');
    } catch (err) {
        console.error('Copy fallback failed', err);
    }
    document.body.removeChild(t);
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
    document.body.addEventListener('change', (e) => {
        if (e.target.classList.contains('cond-cb')) {
            const wrapper = e.target.closest('.checkbox-group');
            const allInputs = wrapper.querySelectorAll('.cond-other-input');
            allInputs.forEach(input => {
                input.classList.add('d-none');
            });

            if (e.target.classList.contains('cond-other-cb') && e.target.checked) {
                const input = wrapper.querySelector('.cond-other-input');
                if (input) {
                    input.classList.remove('d-none');
                    input.focus();
                }
            }
            updateConditionPreview();
        }
    });

    document.body.addEventListener('input', (e) => {
        if (e.target.classList.contains('cond-other-input')) {
            updateConditionPreview();
        }
    });
});
