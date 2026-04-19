window.saveGuideDraft = () => {
    const data = {
        epic: document.getElementById('guide_epic')?.value || '',
        notes: document.getElementById('guide_notes')?.value || ''
    };
    localStorage.setItem('qa_guide_form_draft', JSON.stringify(data));
};

window.loadGuideDraft = () => {
    const saved = localStorage.getItem('qa_guide_form_draft');
    if (!saved) return;
    try {
        const data = JSON.parse(saved);
        const epicEl = document.getElementById('guide_epic');
        const notesEl = document.getElementById('guide_notes');
        if (epicEl) epicEl.value = data.epic || '';
        if (notesEl) notesEl.value = data.notes || '';
    } catch (e) {
        console.error("Guide draft load error:", e);
    }
};

document.addEventListener('componentsLoaded', () => {
    window.loadGuideDraft();
    const guideInputs = document.querySelectorAll('.guide-input, .guide-textarea-auto');
    guideInputs.forEach(input => {
        input.addEventListener('input', window.saveGuideDraft);
    });
});