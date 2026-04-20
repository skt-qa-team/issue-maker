window.currentViewingScheduleId = null;

document.addEventListener('componentsLoaded', () => {
    window.updateQuotaDisplay();
});

document.addEventListener('change', (e) => {
    if (e.target.name === 'sch_color') {
        window.handleScheduleTypeChange();
    }
    
    if (e.target.id === 'sch_start') {
        const endInput = document.getElementById('sch_end');
        const typeRadio = document.querySelector('input[name="sch_color"]:checked');
        
        if (typeRadio && typeRadio.getAttribute('data-type') !== '검증') {
            if (endInput) endInput.value = e.target.value;
        } else if (endInput && (!endInput.value || endInput.value < e.target.value)) {
            if (endInput) endInput.value = e.target.value;
        }
    }
});

document.addEventListener('paste', async (e) => {
    const modal = document.getElementById('scheduleModal');
    if (modal && modal.classList.contains('active')) {
        const items = e.clipboardData?.items || [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) await window.processScreenshot(file);
                break;
            }
        }
    }
});

document.addEventListener('click', (e) => {
    const target = e.target;

    if (target.id === 'btn-close-sch-modal-top' || target.id === 'btn-close-sch-modal-bot') window.closeScheduleModal();
    if (target.id === 'btn-save-sch') window.saveSchedule();
    if (target.id === 'btn-close-detail') window.closeScheduleDetail();
    if (target.id === 'btn-delete-sch') window.deleteSchedule();
    if (target.id === 'btn-edit-sch') window.editSchedule();
    if (target.id === 'btn-start-workflow') window.startScheduleWorkflow();
});

window.handleScheduleTypeChange = () => {
    const selectedRadio = document.querySelector('input[name="sch_color"]:checked');
    if (!selectedRadio) return;
    
    const type = selectedRadio.getAttribute('data-type');
    const groupEnd = document.getElementById('group_sch_end');
    const groupEpic = document.getElementById('group_sch_epic');
    const labelStart = document.getElementById('label_sch_start');

    if (groupEnd) groupEnd.classList.toggle('d-none', type !== '검증');
    if (groupEpic) groupEpic.classList.toggle('d-none', type !== '검증');
    
    if (labelStart) {
        if (type === '검증') labelStart.textContent = '시작일 *';
        else if (type === '회의') labelStart.textContent = '회의 날짜 *';
        else labelStart.textContent = '날짜 *';
    }
};

window.updateQuotaDisplay = () => {
    const quotaInfo = document.getElementById('ai_quota_info');
    if (quotaInfo) {
        const d = new Date();
        const todayStr = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        let usageData;
        try {
            usageData = JSON.parse(localStorage.getItem('GEMINI_USAGE')) || { date: todayStr, count: 0 };
        } catch (e) { usageData = { date: todayStr, count: 0 }; }
        
        if (usageData.date !== todayStr) {
            usageData = { date: todayStr, count: 0 };
            localStorage.setItem('GEMINI_USAGE', JSON.stringify(usageData));
        }

        const remaining = Math.max(0, 20 - usageData.count);
        quotaInfo.textContent = `⚡ 오늘 AI 자동 등록 남은 횟수: ${remaining} / 20`;
    }
};

window.processScreenshot = async (file) => {
    let savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (!savedKey) {
        savedKey = prompt("Gemini API 키가 필요합니다.");
        if (!savedKey) return;
        localStorage.setItem('GEMINI_API_KEY', savedKey.trim());
    }

    const d = new Date();
    const todayStr = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    let usageData = JSON.parse(localStorage.getItem('GEMINI_USAGE')) || { date: todayStr, count: 0 };
    if (usageData.date !== todayStr) usageData = { date: todayStr, count: 0 };
    if (usageData.count >= 20) return alert("오늘 무료 제공량(20회)을 모두 소진했습니다.");

    const dropzoneContent = document.getElementById('ai_dropzone_content');
    const loadingContent = document.getElementById('ai_loading_content');
    if (dropzoneContent && loadingContent) {
        dropzoneContent.classList.add('d-none');
        loadingContent.classList.remove('d-none');
    }

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const base64Image = reader.result.split(',')[1];
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${savedKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: "이 일정표 이미지에서 일정 데이터를 추출하여 [{title, start, end}] 형태의 JSON 배열로만 반환해줘." },
                                { inline_data: { mime_type: file.type, data: base64Image } }
                            ]
                        }]
                    })
                });

                const result = await response.json();
                let textResult = result.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
                textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsedArray = JSON.parse(textResult);

                if (Array.isArray(parsedArray)) {
                    usageData.count++;
                    localStorage.setItem('GEMINI_USAGE', JSON.stringify(usageData));
                    window.updateQuotaDisplay();

                    for (const [index, item] of parsedArray.entries()) {
                        if (!item.title || !item.start) continue;
                        const id = Date.now().toString() + index;
                        const newSch = { id, title: item.title, start: item.start, end: item.end || item.start, epic: '', desc: 'AI 추출', color: '#3b82f6' };
                        await firebase.database().ref('shared_schedules/' + id).set(newSch);
                    }
                    window.closeScheduleModal();
                }
            } catch (innerError) {
                console.error(innerError);
            } finally {
                if (dropzoneContent && loadingContent) {
                    dropzoneContent.classList.remove('d-none');
                    loadingContent.classList.add('d-none');
                }
            }
        };
    } catch (error) { console.error(error); }
};

window.openScheduleModal = (id = null) => {
    const modal = document.getElementById('scheduleModal');
    if (!modal) return;
    
    const idField = document.getElementById('sch_id');
    if (idField) idField.value = id || '';

    if (id) {
        const sch = window.calSchedules.find(s => s.id === id);
        if (sch) {
            document.getElementById('sch_title').value = sch.title;
            document.getElementById('sch_start').value = sch.start;
            document.getElementById('sch_end').value = sch.end;
            document.getElementById('sch_epic').value = sch.epic;
            document.getElementById('sch_desc').value = sch.desc;
            const radio = document.querySelector(`input[name="sch_color"][value="${sch.color}"]`);
            if (radio) radio.checked = true;
        }
    } else {
        ['sch_title', 'sch_start', 'sch_end', 'sch_epic', 'sch_desc'].forEach(eid => {
            const el = document.getElementById(eid);
            if (el) el.value = '';
        });
        const defaultRadio = document.querySelector(`input[name="sch_color"][value="#3b82f6"]`);
        if (defaultRadio) defaultRadio.checked = true;
    }
    
    window.handleScheduleTypeChange(); 
    modal.classList.add('active');
};

window.closeScheduleModal = () => { 
    const modal = document.getElementById('scheduleModal');
    if (modal) modal.classList.remove('active');
};

window.saveSchedule = () => {
    const idField = document.getElementById('sch_id');
    const id = (idField && idField.value) ? idField.value : Date.now().toString();
    const title = document.getElementById('sch_title')?.value.trim();
    const start = document.getElementById('sch_start')?.value;
    let end = document.getElementById('sch_end')?.value;
    const colorRadio = document.querySelector('input[name="sch_color"]:checked');
    const color = colorRadio ? colorRadio.value : '#3b82f6';
    if (colorRadio && colorRadio.getAttribute('data-type') !== '검증') end = start;

    if (!title || !start || !end) return alert("필수 정보를 입력하세요.");
    const newSch = { id, title, start, end, epic: document.getElementById('sch_epic')?.value || '', desc: document.getElementById('sch_desc')?.value || '', color };

    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
        firebase.database().ref('shared_schedules/' + id).set(newSch).then(() => {
            window.closeScheduleModal();
        });
    }
};

window.openScheduleDetail = (id) => {
    const sch = window.calSchedules.find(s => s.id === id);
    if (!sch) return;
    window.currentViewingScheduleId = id;
    const modal = document.getElementById('scheduleDetailModal');
    if (!modal) return;
    
    const colorBar = document.getElementById('detail_color_bar');
    if (colorBar) colorBar.style.setProperty('--detail-bg', sch.color);
    document.getElementById('detail_title').textContent = sch.title;
    document.getElementById('detail_date').textContent = `${sch.start} ~ ${sch.end}`;
    document.getElementById('detail_desc').textContent = sch.desc || '-';
    
    const epicWrapper = document.getElementById('detail_epic_wrapper');
    const startWorkflowBtn = document.getElementById('btn-start-workflow');
    const elEpic = document.getElementById('detail_epic');
    if (sch.epic && sch.epic.trim() !== '') {
        epicWrapper.classList.remove('d-none');
        startWorkflowBtn.classList.remove('d-none');
        elEpic.textContent = sch.epic;
    } else {
        epicWrapper.classList.add('d-none');
        startWorkflowBtn.classList.add('d-none');
    }

    modal.classList.add('active');
};

window.closeScheduleDetail = () => { 
    const modal = document.getElementById('scheduleDetailModal');
    if (modal) {
        modal.classList.remove('active');
        window.currentViewingScheduleId = null;
    }
};

window.deleteSchedule = () => {
    if (!window.currentViewingScheduleId || !confirm("일정을 삭제하시겠습니까?")) return;
    firebase.database().ref('shared_schedules/' + window.currentViewingScheduleId).remove().then(() => {
        window.closeScheduleDetail();
    });
};

window.editSchedule = () => {
    if (window.currentViewingScheduleId) {
        const id = window.currentViewingScheduleId;
        window.closeScheduleDetail();
        window.openScheduleModal(id);
    }
};

window.startScheduleWorkflow = () => {
    if (!window.currentViewingScheduleId) return;
    const sch = window.calSchedules.find(s => s.id === window.currentViewingScheduleId);
    if (!sch || !sch.epic) return;
    window.closeScheduleDetail();
    if (typeof window.switchMainTab === 'function') window.switchMainTab('issue');
    const epicInput = document.getElementById('targetUrl');
    if (epicInput) {
        epicInput.value = sch.epic;
        if (typeof window.generateTemplate === 'function') window.generateTemplate();
    }
};
