window.calCurrentDate = new Date();
window.calSchedules = [];
window.currentViewingScheduleId = null;

const holidays = {
    "01-01": "신정",
    "02-16": "설날 연휴",
    "02-17": "설날",
    "02-18": "설날 연휴",
    "03-01": "삼일절",
    "03-02": "대체공휴일",
    "05-05": "어린이날",
    "05-24": "부처님오신날",
    "05-25": "대체공휴일",
    "06-06": "현충일",
    "08-15": "광복절",
    "08-17": "대체공휴일",
    "09-24": "추석 연휴",
    "09-25": "추석",
    "09-26": "추석 연휴",
    "09-28": "대체공휴일",
    "10-03": "개천절",
    "10-05": "대체공휴일",
    "10-09": "한글날",
    "12-25": "성탄절"
};

window.fetchSchedulesFromFirebase = () => {
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                firebase.database().ref('shared_schedules').on('value', (snapshot) => {
                    const data = snapshot.val();
                    window.calSchedules = data ? Object.values(data) : [];
                    window.renderCalendar();
                });
            }
        });
    }
};

document.addEventListener('componentsLoaded', () => {
    window.fetchSchedulesFromFirebase();
    window.renderCalendar();
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
            endInput.value = e.target.value;
        }
    }
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
        let usageData = JSON.parse(localStorage.getItem('GEMINI_USAGE')) || { date: todayStr, count: 0 };
        
        if (usageData.date !== todayStr) {
            usageData = { date: todayStr, count: 0 };
            localStorage.setItem('GEMINI_USAGE', JSON.stringify(usageData));
        }

        const remaining = Math.max(0, 20 - usageData.count);
        quotaInfo.textContent = `⚡ 오늘 AI 자동 등록 남은 횟수: ${remaining} / 20`;
        quotaInfo.classList.toggle('quota-exhausted', remaining === 0);
    }
};

document.addEventListener('paste', async (e) => {
    const modal = document.getElementById('scheduleModal');
    if (modal && !modal.classList.contains('d-none')) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                await window.processScreenshot(file);
                break;
            }
        }
    }
});

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
    if (!dropzoneContent || !loadingContent) return;

    dropzoneContent.classList.add('d-none');
    loadingContent.classList.remove('d-none');

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
                                { text: "이 이미지는 일정표입니다. 1열 텍스트는 'title' 키에, 4열의 기간(예: 4/14~4/17)은 분석하여 시작일을 'start' 키, 종료일을 'end' 키에 매핑하세요. 날짜는 2026년 기준 'YYYY-MM-DD' 포맷이어야 합니다. 키 이름은 영어 소문자 'title', 'start', 'end'만 사용하세요. 순수 JSON 배열만 반환하세요." },
                                { inline_data: { mime_type: file.type, data: base64Image } }
                            ]
                        }]
                    })
                });

                const result = await response.json();
                if (result.error) throw new Error(result.error.message);

                let textResult = result.candidates[0].content.parts[0].text;
                textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsedArray = JSON.parse(textResult);

                if (Array.isArray(parsedArray)) {
                    usageData.count++;
                    localStorage.setItem('GEMINI_USAGE', JSON.stringify(usageData));
                    window.updateQuotaDisplay();

                    let savePromises = [];
                    parsedArray.forEach((item, index) => {
                        if (!item.title || !item.start) return; 
                        const id = Date.now().toString() + index;
                        const newSch = { id, title: item.title, start: item.start, end: item.end || item.start, epic: '', desc: 'AI 추출', color: '#3b82f6' };
                        savePromises.push(firebase.database().ref('shared_schedules/' + id).set(newSch));
                    });

                    await Promise.all(savePromises);
                    if (typeof window.showToast === 'function') window.showToast(`✅ ${savePromises.length}개의 일정이 등록되었습니다.`);
                    window.closeScheduleModal();
                }
            } catch (innerError) {
                alert("처리 오류: " + innerError.message);
            } finally {
                dropzoneContent.classList.remove('d-none');
                loadingContent.classList.add('d-none');
            }
        };
    } catch (error) {
        alert("파일 읽기 오류");
    }
};

window.renderCalendar = () => {
    const grid = document.getElementById('cal-grid');
    const title = document.getElementById('cal-month-year');
    if (!grid || !title) return;

    const year = window.calCurrentDate.getFullYear();
    const month = window.calCurrentDate.getMonth();
    title.textContent = `${year}. ${String(month + 1).padStart(2, '0')}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    grid.innerHTML = '';
    const allDays = [];

    for (let i = firstDayIndex; i > 0; i--) allDays.push({ day: prevLastDay - i + 1, month: month - 1, year, type: 'empty' });
    for (let i = 1; i <= lastDay; i++) allDays.push({ day: i, month: month, year, type: 'current' });
    const remain = 42 - allDays.length;
    for (let i = 1; i <= remain; i++) allDays.push({ day: i, month: month + 1, year, type: 'empty' });

    const laneMap = new Map();
    const sortedSchedules = [...window.calSchedules].sort((a, b) => new Date(a.start) - new Date(b.start));

    for (let w = 0; w < 6; w++) {
        const weekDays = allDays.slice(w * 7, (w + 1) * 7);
        const firstDayOfWeek = `${weekDays[0].year}-${String(weekDays[0].month + 1).padStart(2, '0')}-${String(weekDays[0].day).padStart(2, '0')}`;
        const lastDayOfWeek = `${weekDays[6].year}-${String(weekDays[6].month + 1).padStart(2, '0')}-${String(weekDays[6].day).padStart(2, '0')}`;
        const weekSchedules = sortedSchedules.filter(s => s.start <= lastDayOfWeek && s.end >= firstDayOfWeek);
        const lanes = [];

        weekSchedules.forEach(sch => {
            let laneIndex = 0;
            while (lanes[laneIndex] && lanes[laneIndex].some(assigned => sch.start <= assigned.end && sch.end >= assigned.start)) laneIndex++;
            if (!lanes[laneIndex]) lanes[laneIndex] = [];
            lanes[laneIndex].push(sch);
            
            let isHeadAssigned = false;
            weekDays.forEach((wd, dayIdx) => {
                const dateStr = `${wd.year}-${String(wd.month + 1).padStart(2, '0')}-${String(wd.day).padStart(2, '0')}`;
                if (sch.start <= dateStr && sch.end >= dateStr) {
                    if (!laneMap.has(dateStr)) laneMap.set(dateStr, []);
                    let isHead = false;
                    let span = 0;
                    if (!isHeadAssigned) {
                        isHead = true;
                        isHeadAssigned = true;
                        for (let k = dayIdx; k < 7; k++) {
                            const checkDate = `${weekDays[k].year}-${String(weekDays[k].month + 1).padStart(2, '0')}-${String(weekDays[k].day).padStart(2, '0')}`;
                            if (sch.start <= checkDate && sch.end >= checkDate) span++;
                            else break;
                        }
                    }
                    laneMap.get(dateStr)[laneIndex] = { sch, isHead, span };
                }
            });
        });
    }

    allDays.forEach((wd, idx) => {
        const cell = document.createElement('div');
        cell.className = `cal-day ${wd.type}`;
        const dateStr = `${wd.year}-${String(wd.month + 1).padStart(2, '0')}-${String(wd.day).padStart(2, '0')}`;
        const keyMMDD = `${String(wd.month + 1).padStart(2, '0')}-${String(wd.day).padStart(2, '0')}`;
        
        if (idx % 7 === 0 || (wd.type === 'current' && holidays[keyMMDD])) cell.classList.add('sun');
        else if (idx % 7 === 6) cell.classList.add('sat');

        const dayNumDiv = document.createElement('div');
        dayNumDiv.className = 'day-number';
        dayNumDiv.innerHTML = `${wd.day}${ (wd.type === 'current' && holidays[keyMMDD]) ? `<span class="holiday-label">${holidays[keyMMDD]}</span>` : '' }`;
        cell.appendChild(dayNumDiv);

        const schContainer = document.createElement('div');
        schContainer.className = 'sch-container';
        const dayLanes = laneMap.get(dateStr) || [];
        for (let l = 0; l < dayLanes.length; l++) {
            const item = dayLanes[l];
            const schDiv = document.createElement('div');
            if (item && item.isHead) {
                schDiv.className = 'cal-schedule span-head';
                schDiv.style.setProperty('--sch-bg', item.sch.color);
                schDiv.style.setProperty('--sch-span', item.span);
                schDiv.textContent = item.sch.title;
                schDiv.onclick = (e) => { e.stopPropagation(); window.openScheduleDetail(item.sch.id); };
            } else {
                schDiv.className = 'cal-schedule spacer';
            }
            schContainer.appendChild(schDiv);
        }
        cell.appendChild(schContainer);
        grid.appendChild(cell);
    });
};

window.changeMonth = (offset) => { window.calCurrentDate.setMonth(window.calCurrentDate.getMonth() + offset); window.renderCalendar(); };
window.goToday = () => { window.calCurrentDate = new Date(); window.renderCalendar(); };

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
        ['sch_title', 'sch_start', 'sch_end', 'sch_epic', 'sch_desc'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = '';
        });
        const defaultRadio = document.querySelector(`input[name="sch_color"][value="#3b82f6"]`);
        if (defaultRadio) defaultRadio.checked = true;
    }
    
    window.handleScheduleTypeChange(); 
    window.updateQuotaDisplay();
    modal.classList.remove('d-none');
};

window.closeScheduleModal = () => { document.getElementById('scheduleModal').classList.add('d-none'); };

window.saveSchedule = () => {
    const idField = document.getElementById('sch_id');
    const id = (idField && idField.value) ? idField.value : Date.now().toString();
    const title = document.getElementById('sch_title').value;
    const start = document.getElementById('sch_start').value;
    const colorRadio = document.querySelector('input[name="sch_color"]:checked');
    const color = colorRadio ? colorRadio.value : '#3b82f6';
    let end = document.getElementById('sch_end').value;
    if (colorRadio && colorRadio.getAttribute('data-type') !== '검증') end = start;

    if (!title || !start || !end) return alert("필수 정보를 입력하세요.");
    const newSch = { id, title, start, end, epic: document.getElementById('sch_epic').value, desc: document.getElementById('sch_desc').value, color };

    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
        firebase.database().ref('shared_schedules/' + id).set(newSch).then(() => {
            if(typeof window.showToast === 'function') window.showToast("✅ 저장되었습니다.");
            window.closeScheduleModal();
        });
    } else {
        const idx = window.calSchedules.findIndex(s => s.id === id);
        if(idx > -1) window.calSchedules[idx] = newSch; else window.calSchedules.push(newSch);
        window.renderCalendar(); 
        window.closeScheduleModal();
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
    const startEpicBtn = document.getElementById('btn_start_epic');
    
    if (sch.epic && sch.epic.trim() !== '') {
        if (epicWrapper) epicWrapper.classList.remove('d-none');
        if (startEpicBtn) startEpicBtn.classList.remove('d-none');
        document.getElementById('detail_epic').textContent = sch.epic;
    } else {
        if (epicWrapper) epicWrapper.classList.add('d-none');
        if (startEpicBtn) startEpicBtn.classList.add('d-none');
    }

    modal.classList.remove('d-none');
};

window.closeScheduleDetail = () => { 
    const modal = document.getElementById('scheduleDetailModal');
    if (modal) modal.classList.add('d-none'); 
    window.currentViewingScheduleId = null; 
};

window.deleteSchedule = () => {
    if (!window.currentViewingScheduleId || !confirm("일정을 삭제하시겠습니까?")) return;
    firebase.database().ref('shared_schedules/' + window.currentViewingScheduleId).remove().then(() => {
        window.closeScheduleDetail();
    });
};

window.editSchedule = () => { if (window.currentViewingScheduleId) window.openScheduleModal(window.currentViewingScheduleId); };

window.startScheduleWorkflow = () => {
    if (!window.currentViewingScheduleId) return;
    const sch = window.calSchedules.find(s => s.id === window.currentViewingScheduleId);
    if (!sch || !sch.epic) return alert("Epic Link가 등록되지 않은 일정입니다.");

    window.closeScheduleDetail();
    window.switchMainTab('issue');
    
    const epicInput = document.getElementById('epic_link');
    if (epicInput) {
        epicInput.value = sch.epic;
        if (typeof window.generateTemplate === 'function') window.generateTemplate();
    }
};
