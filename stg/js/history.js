function saveDraft() {
    const getValue = (id) => document.getElementById(id) ? document.getElementById(id).value : '';
    const checkedServers = Array.from(document.querySelectorAll('.issue-server-cb:checked')).map(cb => cb.value);
    const checkedDevices = Array.from(document.querySelectorAll('.issue-device-cb:checked')).map(cb => cb.value);
    
    const draft = {
        epic_link: getValue('epic_link'),
        extra_notes: getValue('extra_notes'),
        title: getValue('title'),
        prefix_critical: getValue('prefix_critical'),
        prefix_spec_os: getValue('prefix_spec_os'),
        prefix_device: getValue('prefix_device'),
        prefix_account: getValue('prefix_account'),
        prefix_page: getValue('prefix_page'),
        osType: getValue('osType'),
        poc: getValue('poc'),
        appVersion: getValue('appVersion'),
        targetUrl: getValue('targetUrl'),
        preCondition: getValue('preCondition'),
        steps: getValue('steps'),
        actualResult: getValue('actualResult'),
        expectedResult: getValue('expectedResult'),
        ref_prd: getValue('ref_prd'),
        ref_notes: getValue('ref_notes'),
        servers: checkedServers,
        devices: checkedDevices
    };
    localStorage.setItem('skm_draft', JSON.stringify(draft));
}

function loadDraft(dataToLoad) {
    const draft = dataToLoad || JSON.parse(localStorage.getItem('skm_draft'));
    if (!draft) return;
    
    const setValue = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val || ''; };
    
    ['epic_link', 'extra_notes', 'title', 'prefix_critical', 'prefix_spec_os', 'prefix_device', 'prefix_account', 'prefix_page', 'osType', 'poc', 'appVersion', 'targetUrl', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'].forEach(key => {
        setValue(key, draft[key]);
    });

    if (dataToLoad) isInitialRender = false;
    if (typeof handlePocChange === 'function') handlePocChange();

    setTimeout(() => {
        if (draft.servers) {
            document.querySelectorAll('.issue-server-cb').forEach(cb => {
                cb.checked = draft.servers.includes(cb.value);
            });
        }
        if (draft.devices) {
            document.querySelectorAll('.issue-device-cb').forEach(cb => {
                cb.checked = draft.devices.includes(cb.value);
            });
        }
        if (typeof generateTemplate === 'function') generateTemplate();
    }, 100);
}

function clearForm() {
    if(!confirm('초기화하시겠습니까? (현재 작성된 내용은 히스토리에 자동 저장됩니다)')) return;
    
    const tVal = document.getElementById('outputTitle')?.value || '';
    const bVal = document.getElementById('outputBody')?.value || '';
    saveToHistory(tVal, bVal);

    ['title', 'prefix_spec_os', 'prefix_account', 'prefix_device', 'prefix_page', 'preCondition', 'steps', 'actualResult', 'expectedResult', 'ref_prd', 'ref_notes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    isInitialRender = true;
    if (typeof syncEnvironmentByOS === 'function') syncEnvironmentByOS();
    saveDraft();
    if (typeof showToast === 'function') showToast('내용이 초기화되었습니다.');
}

function saveToHistory(title, body) {
    if (!title.trim() && !body.trim()) return;
    let history = JSON.parse(localStorage.getItem('skm_history')) || [];
    const now = new Date();
    const timeString = `${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const draftData = JSON.parse(localStorage.getItem('skm_draft')) || {};
    
    history.unshift({ title, body, time: timeString, data: draftData });
    if (history.length > 10) history = history.slice(0, 10);
    
    localStorage.setItem('skm_history', JSON.stringify(history));
    
    const modal = document.getElementById('historyModal');
    if (modal && modal.classList.contains('active')) {
        renderHistory();
    }
}

function openHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.classList.add('active');
        renderHistory();
    }
}

function closeHistoryModal() {
    const modal = document.getElementById('historyModal');
    if (modal) modal.classList.remove('active');
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function renderHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;
    
    let history = JSON.parse(localStorage.getItem('skm_history')) || [];
    if (history.length === 0) {
        container.innerHTML = '<div class="history-empty">최근 작성 내역이 없습니다.</div>';
        return;
    }
    
    container.innerHTML = '';
    history.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item-card';
        div.innerHTML = `
            <div class="history-time">${escapeHtml(item.time)}</div>
            <div class="history-title">${item.title ? escapeHtml(item.title) : '(제목 없음)'}</div>
            <div class="history-action-group">
                <button class="btn-history-load" onclick="loadHistoryItem(${index})">불러오기</button>
                <button class="btn-history-del" onclick="deleteHistoryItem(${index})">삭제</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function loadHistoryItem(index) {
    if(!confirm('현재 작성 중인 내용은 사라집니다. 불러오시겠습니까?')) return;
    let history = JSON.parse(localStorage.getItem('skm_history')) || [];
    if (!history[index] || !history[index].data) return;
    
    loadDraft(history[index].data);
    closeHistoryModal();
    if (typeof showToast === 'function') showToast('히스토리를 성공적으로 불러왔습니다.');
}

function deleteHistoryItem(index) {
    let history = JSON.parse(localStorage.getItem('skm_history')) || [];
    history.splice(index, 1);
    localStorage.setItem('skm_history', JSON.stringify(history));
    renderHistory();
}
