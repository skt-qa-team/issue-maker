document.addEventListener('componentsLoaded', () => {
    let saveTimer;
    
    document.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            if (e.target.readOnly || e.target.closest('#guide-panel-placeholder')) return; 
            
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                if (typeof window.saveDraft === 'function') window.saveDraft();
                const now = new Date();
                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                if (typeof window.showToast === 'function') {
                    window.showToast(`💾 ${timeStr} 폼 데이터 자동 저장됨`);
                }
            }, 1500);
        }
    });

    if (typeof window.loadPrefixOrder === 'function') window.loadPrefixOrder();
    if (typeof window.loadDraft === 'function') window.loadDraft();
});

window.toggleDeviceMode = (os) => {
    const checkedInput = document.querySelector(`input[name="${os}_dev_mode"]:checked`);
    if (!checkedInput) return;

    const isNormal = checkedInput.value === 'normal';
    const normalList = document.getElementById(`${os}NormalList`);
    const specialList = document.getElementById(`${os}SpecialList`);

    if (normalList) normalList.classList.toggle('d-none', !isNormal);
    if (specialList) specialList.classList.toggle('d-none', isNormal);
    
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
};

window.applyAndSavePrefixOrder = () => {
    const container = document.getElementById('prefixContainer');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.prefix-item'));
    const orders = {};

    items.sort((a, b) => {
        const valA = parseInt(a.querySelector('.prefix-order-input')?.value || 0);
        const valB = parseInt(b.querySelector('.prefix-order-input')?.value || 0);
        return valA - valB;
    });

    items.forEach((item, idx) => {
        const target = item.getAttribute('data-id');
        const orderVal = idx + 1;
        const input = item.querySelector('.prefix-order-input');
        if (input) input.value = orderVal;
        orders[target] = orderVal;
        container.appendChild(item);
    });

    localStorage.setItem('skm_prefix_order', JSON.stringify(orders));
    if (typeof window.showToast === 'function') window.showToast('✅ Prefix 순서가 저장되었습니다.');
    if (typeof window.generateTemplate === 'function') window.generateTemplate();
};

window.resetPrefixOrder = () => {
    localStorage.removeItem('skm_prefix_order');
    location.reload();
};

window.loadPrefixOrder = () => {
    const orders = JSON.parse(localStorage.getItem('skm_prefix_order') || '{}');
    const container = document.getElementById('prefixContainer');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.prefix-item'));

    items.sort((a, b) => {
        const idA = a.getAttribute('data-id');
        const idB = b.getAttribute('data-id');
        return (orders[idA] || 99) - (orders[idB] || 99);
    });

    items.forEach(item => {
        const id = item.getAttribute('data-id');
        const input = item.querySelector('.prefix-order-input');
        if (orders[id] && input) input.value = orders[id];
        container.appendChild(item);
    });
};
