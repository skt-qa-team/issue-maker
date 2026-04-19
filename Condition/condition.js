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
            stepEl.classList.toggle('d-none', i !== step);
        }
    }
    
    const prevBtn = document.getElementById('cond-prev-btn');
    const nextBtn = document.getElementById('cond-next-btn');
    
    if (prevBtn) {
        prevBtn.classList.toggle('d-none', step === 1);
    }

    if (nextBtn) {
        nextBtn.classList.toggle('d-none', step === totalCondSteps);
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
                const customVal = input ? input.value.trim() : "";
                resultText += `${index}. ${customVal || "기타"}\n`;
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
        if (typeof showToast === 'function') showToast('⚠️ 복사할 내용이 없습니다.');
        return;
    }

    const textToCopy = previewEl.value.trim();

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textToCopy);
            if (typeof showToast === 'function') showToast('📋 조건이 복사되었습니다.');
        } else {
            throw new Error('Clipboard API unavailable');
        }
    } catch (err) {
        fallbackCopyConditionText(textToCopy);
    }
}

function fallbackCopyConditionText(text) {
    const t = document.createElement("textarea");
    t.style.position = "fixed";
    t.style.left = "-9999px";
    t.value = text;
    document.body.appendChild(t);
    t.select();
    try {
        document.execCommand('copy');
        if (typeof showToast === 'function') showToast('📋 조건이 복사되었습니다.');
    } catch (err) {
        console.error('Copy fallback failed', err);
    }
    document.body.removeChild(t);
}

function applyConditionToForm() {
    const previewEl = document.getElementById('cond_preview');
    const preConditionEl = document.getElementById('preCondition');
    if (!previewEl || !preConditionEl) return;

    const newText = previewEl.value.trim();
    if (!newText) {
        if (typeof showToast === 'function') showToast('⚠️ 적용할 내용이 없습니다.');
        return;
    }

    const currentText = preConditionEl.value.trim();
    if (currentText) {
        preConditionEl.value = currentText + '\n' + newText;
    } else {
        preConditionEl.value = newText;
    }

    if (typeof generateTemplate === 'function') generateTemplate();
    closeConditionModal();
    if (typeof showToast === 'function') showToast('✅ 본문에 반영되었습니다.');
}

document.addEventListener('DOMContentLoaded', () => {
    const condModal = document.getElementById('conditionModal');
    if (!condModal) return;

    condModal.addEventListener('change', (e) => {
        if (e.target.classList.contains('cond-cb')) {
            const wrapper = e.target.closest('.checkbox-group');
            const otherInput = wrapper.querySelector('.cond-other-input');
            
            if (otherInput) {
                const isOther = e.target.classList.contains('cond-other-cb') && e.target.checked;
                otherInput.classList.toggle('d-none', !isOther);
                if (isOther) setTimeout(() => otherInput.focus(), 10);
            }
            updateConditionPreview();
        }
    });

    condModal.addEventListener('input', (e) => {
        if (e.target.classList.contains('cond-other-input')) {
            updateConditionPreview();
        }
    });
});
