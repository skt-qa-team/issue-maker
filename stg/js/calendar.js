let calCurrentDate = new Date();
let calSchedules = [];
let currentViewingScheduleId = null;

const holidays = {
    "01-01": "신정", "03-01": "3·1절", "05-05": "어린이날", "06-06": "현충일",
    "08-15": "광복절", "10-03": "개천절", "10-09": "한글날", "12-25": "기독탄신일"
};

function fetchSchedulesFromFirebase() {
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                firebase.database().ref('shared_schedules').on('value', (snapshot) => {
                    const data = snapshot.val();
                    calSchedules = data ? Object.values(data) : [];
                    renderCalendar();
                });
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loadCalendarComponent = async () => {
        try {
            const response = await fetch('components/calendar.html');
            const html = await response.text();
            const placeholder = document.getElementById('comp-calendar');
            if (placeholder) placeholder.innerHTML = html;
            fetchSchedulesFromFirebase(); 
            renderCalendar();
        } catch (error) {
            console.error('Calendar component failed to load:', error);
        }
    };
    loadCalendarComponent();

    const injectCalButton = setInterval(() => {
        const topBarBtns = document.querySelector('.top-bar-btns');
        if (topBarBtns && !document.querySelector('.cal-btn-wrapper')) {
            clearInterval(injectCalButton);
            const calWrapper = document.createElement('div');
            calWrapper.className = 'menu-item-wrapper cal-btn-wrapper';
            calWrapper.onclick = () => switchMainTab('calendar');
            calWrapper.innerHTML = `<div class="setting-btn-float cal-icon">📅</div><span class="menu-label">일정 관리</span>`;
            const issueWrapper = document.createElement('div');
            issueWrapper.className = 'menu-item-wrapper issue-btn-wrapper';
            issueWrapper.onclick = () => switchMainTab('issue');
            issueWrapper.innerHTML = `<div class="setting-btn-float main-icon">📝</div><span class="menu-label">이슈 작성</span>`;
            topBarBtns.prepend(calWrapper);
            topBarBtns.prepend(issueWrapper);
        }
    }, 100);
});

document.addEventListener('paste', async (e) => {
    const modal = document.getElementById('scheduleModal');
    if (modal && modal.style.display !== 'none') {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                await processScreenshot(file);
                break;
            }
        }
    }
});

document.addEventListener('change', async (e) => {
    if (e.target.id === 'ai_image_input') {
        const file = e.target.files[0];
        if (file) await processScreenshot(file);
        e.target.value = '';
    }
});

document.addEventListener('dragover', (e) => {
    const dropzone = e.target.closest('#ai_dropzone');
    if (dropzone) {
        e.preventDefault();
        dropzone.classList.add('dragover');
    }
});

document.addEventListener('dragleave', (e) => {
    const dropzone = e.target.closest('#ai_dropzone');
    if (dropzone) {
        e.preventDefault();
        dropzone.classList.remove('dragover');
    }
});

document.addEventListener('drop', async (e) => {
    const dropzone = e.target.closest('#ai_dropzone');
    if (dropzone) {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            await processScreenshot(file);
        }
    }
});

async function processScreenshot(file) {
    let savedKey = localStorage.getItem('GEMINI_API_KEY');
    
    if (!savedKey) {
        savedKey = prompt("Gemini API 키가 필요합니다.\n(입력하신 키는 브라우저 내부에만 안전하게 보관됩니다.)");
        if (!savedKey) return;
        localStorage.setItem('GEMINI_API_KEY', savedKey.trim());
    }

    const dropzoneContent = document.getElementById('ai_dropzone_content');
    const loadingContent = document.getElementById('ai_loading_content');
    if (!dropzoneContent || !loadingContent) return;

    dropzoneContent.style.display = 'none';
    loadingContent.style.display = 'block';

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const base64Image = reader.result.split(',')[1];
                const mimeType = file.type;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${savedKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: "이 이미지는 일정표입니다. 1열(제목)과 4열(일정, 예: 4/14~4/17) 데이터만 추출하고 2, 3, 5열은 무시하세요. 날짜는 2026년 기준으로 판단하여 'YYYY-MM-DD' 포맷으로 변경하세요. 시작일과 종료일이 같으면 동일한 날짜를 넣으세요. 여러 일정을 추출하여 반드시 JSON 배열 형식으로만 반환하세요. 마크다운 기호 없이 순수 JSON 배열만 출력하세요." },
                                { inline_data: { mime_type: mimeType, data: base64Image } }
                            ]
                        }]
                    })
                });

                const result = await response.json();
                
                if (result.error) {
                    if (result.error.code === 400 || result.error.code === 403 || result.error.message.includes("API key") || result.error.message.includes("leaked")) {
                        localStorage.removeItem('GEMINI_API_KEY');
                        throw new Error("API 키에 문제가 있습니다. 다시 시도하여 새로운 키를 입력해주세요.");
                    }
                    throw new Error(result.error.message);
                }

                if (!response.ok) throw new Error("API 요청 실패");

                if (!result.candidates || !result.candidates[0]) throw new Error("AI가 데이터를 분석하지 못했습니다.");

                let textResult = result.candidates[0].content.parts[0].text;
                textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsedArray = JSON.parse(textResult);

                if (Array.isArray(parsedArray)) {
                    let savePromises = [];
                    parsedArray.forEach((item, index) => {
                        const newSch = {
                            id: Date.now().toString() + index,
                            title: item.title || '새 일정',
                            start: item.start || '',
                            end: item.end || '',
                            epic: '',
                            desc: 'AI 자동 추출 (스크린샷 일괄 등록)',
                            color: '#3b82f6'
                        };

                        if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
                            savePromises.push(firebase.database().ref('shared_schedules/' + newSch.id).set(newSch));
                        } else {
                            calSchedules.push(newSch);
                        }
                    });

                    if (savePromises.length > 0) await Promise.all(savePromises);
                    renderCalendar();
                    if (typeof showToast === 'function') showToast(`${parsedArray.length}개의 일정이 등록되었습니다.`);
                    closeScheduleModal();
                } else {
                    throw new Error("결과가 올바른 배열 형태가 아닙니다.");
                }
            } catch (innerError) {
                console.error(innerError);
                alert("처리 오류: " + innerError.message);
            } finally {
                dropzoneContent.style.display = 'block';
                loadingContent.style.display = 'none';
            }
        };
    } catch (error) {
        console.error(error);
        alert("파일 읽기 오류가 발생했습니다.");
        dropzoneContent.style.display = 'block';
        loadingContent.style.display = 'none';
    }
}

window.switchMainTab = (tabName) => {
    const allTabs = document.querySelectorAll('.main-tab-content');
    allTabs.forEach(tab => tab.style.display = 'none');
    
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';

    if (tabName === 'calendar') {
        const calTab = document.getElementById('tab-calendar');
        if (calTab) { 
            calTab.style.display = 'block'; 
            renderCalendar(); 
        }
    } else {
        const issueTab = document.getElementById('tab-issue-maker');
        if (issueTab) { 
            issueTab.style.display = 'block'; 
            window.scrollTo(0, 0);
        }
    }
};

function renderCalendar() {
    const grid = document.getElementById('cal-grid');
    const title = document.getElementById('cal-month-year');
    if (!grid || !title) return;

    const year = calCurrentDate.getFullYear();
    const month = calCurrentDate.getMonth();
    title.innerText = `${year}. ${String(month + 1).padStart(2, '0')}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    const today = new Date();
    const isThisMonth = (today.getFullYear() === year && today.getMonth() === month);
    
    grid.innerHTML = '';
    const allDays = [];

    for (let i = firstDayIndex; i > 0; i--) {
        allDays.push({ day: prevLastDay - i + 1, month: month - 1, year, type: 'empty' });
    }
    for (let i = 1; i <= lastDay; i++) {
        allDays.push({ day: i, month: month, year, type: 'current' });
    }
    const remain = 42 - allDays.length;
    for (let i = 1; i <= remain; i++) {
        allDays.push({ day: i, month: month + 1, year, type: 'empty' });
    }

    const laneMap = new Map(); 
    const sortedSchedules = [...calSchedules].sort((a, b) => {
        if (a.start !== b.start) return new Date(a.start) - new Date(b.start);
        return (new Date(b.end) - new Date(b.start)) - (new Date(a.end) - new Date(a.start));
    });

    for (let w = 0; w < 6; w++) {
        const weekDays = allDays.slice(w * 7, (w + 1) * 7);
        const firstDayOfWeek = `${weekDays[0].year}-${String(weekDays[0].month + 1).padStart(2, '0')}-${String(weekDays[0].day).padStart(2, '0')}`;
        const lastDayOfWeek = `${weekDays[6].year}-${String(weekDays[6].month + 1).padStart(2, '0')}-${String(weekDays[6].day).padStart(2, '0')}`;

        const weekSchedules = sortedSchedules.filter(s => s.start <= lastDayOfWeek && s.end >= firstDayOfWeek);
        const lanes = [];

        weekSchedules.forEach(sch => {
            let laneIndex = 0;
            while (lanes[laneIndex] && lanes[laneIndex].some(assigned => sch.start <= assigned.end && sch.end >= assigned.start)) {
                laneIndex++;
            }
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
        const dayOfWeek = idx % 7;
        
        if (dayOfWeek === 0 || (wd.type === 'current' && holidays[`${String(wd.month + 1).padStart(2, '0')}-${String(wd.day).padStart(2, '0')}`])) cell.classList.add('sun');
        else if (dayOfWeek === 6) cell.classList.add('sat');
        if (isThisMonth && wd.type === 'current' && wd.day === today.getDate()) cell.classList.add('today');

        let holidayLabel = (wd.type === 'current' && holidays[`${String(wd.month + 1).padStart(2, '0')}-${String(wd.day).padStart(2, '0')}`]) 
                          ? `<span class="holiday-label">${holidays[`${String(wd.month + 1).padStart(2, '0')}-${String(wd.day).padStart(2, '0')}`]}</span>` : '';
        
        let html = `<div class="day-number">${wd.day}${holidayLabel}</div><div class="sch-container" style="gap: 4px; display: flex; flex-direction: column;">`;
        const dayLanes = laneMap.get(dateStr) || [];
        const maxLane = dayLanes.length;

        for (let l = 0; l < maxLane; l++) {
            const item = dayLanes[l];
            if (item && item.isHead) {
                const widthVal = `calc(${item.span} * 100% + ${(item.span - 1)} * 1px)`;
                html += `<div class="cal-schedule span-head" style="background-color:${item.sch.color}; width:${widthVal}; text-align:center; z-index:5; margin-bottom: 2px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 1px 2px rgba(0,0,0,0.1);" onclick="event.stopPropagation(); openScheduleDetail('${item.sch.id}')">${item.sch.title}</div>`;
            } else {
                html += `<div class="cal-schedule spacer" style="height: 24px; margin-bottom: 2px;"></div>`;
            }
        }
        html += `</div>`;
        cell.innerHTML = html;
        grid.appendChild(cell);
    });
}

window.changeMonth = (offset) => { calCurrentDate.setMonth(calCurrentDate.getMonth() + offset); renderCalendar(); };
window.goToday = () => { calCurrentDate = new Date(); renderCalendar(); };

window.openScheduleModal = (id = null) => {
    const modal = document.getElementById('scheduleModal');
    if (!modal) return;
    const idField = document.getElementById('sch_id');
    if (idField) idField.value = id || '';
    if (id) {
        const sch = calSchedules.find(s => s.id === id);
        if (sch) {
            document.getElementById('sch_title').value = sch.title;
            document.getElementById('sch_start').value = sch.start;
            document.getElementById('sch_end').value = sch.end;
            document.getElementById('sch_epic').value = sch.epic;
            document.getElementById('sch_desc').value = sch.desc;
            document.querySelector(`input[name="sch_color"][value="${sch.color}"]`).checked = true;
        }
    } else {
        document.getElementById('sch_title').value = '';
        document.getElementById('sch_start').value = '';
        document.getElementById('sch_end').value = '';
        document.getElementById('sch_epic').value = '';
        document.getElementById('sch_desc').value = '';
    }
    
    const detailModal = document.getElementById('scheduleDetailModal');
    if (detailModal) detailModal.style.display = 'none';
    currentViewingScheduleId = null;

    modal.style.display = 'flex';
};

window.closeScheduleModal = () => { 
    document.getElementById('scheduleModal').style.display = 'none'; 
};

window.saveSchedule = () => {
    const idField = document.getElementById('sch_id');
    const id = (idField && idField.value) ? idField.value : Date.now().toString();
    const title = document.getElementById('sch_title').value;
    const start = document.getElementById('sch_start').value;
    const end = document.getElementById('sch_end').value;
    const epic = document.getElementById('sch_epic').value;
    const desc = document.getElementById('sch_desc').value;
    const color = document.querySelector('input[name="sch_color"]:checked').value;

    if (!title || !start || !end) return alert("필수 정보를 입력하세요.");
    const newSch = { id, title, start, end, epic, desc, color };

    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
        firebase.database().ref('shared_schedules/' + id).set(newSch).then(() => {
            if(typeof showToast === 'function') showToast("저장되었습니다.");
            closeScheduleModal();
        });
    } else {
        const idx = calSchedules.findIndex(s => s.id === id);
        if(idx > -1) calSchedules[idx] = newSch; else calSchedules.push(newSch);
        renderCalendar(); closeScheduleModal();
    }
};

window.openScheduleDetail = (id) => {
    const sch = calSchedules.find(s => s.id === id);
    if (!sch) return;
    currentViewingScheduleId = id;
    const modal = document.getElementById('scheduleDetailModal');
    if (!modal) return;
    document.getElementById('detail_color_bar').style.backgroundColor = sch.color;
    document.getElementById('detail_title').innerText = sch.title;
    document.getElementById('detail_date').innerText = `${sch.start} ~ ${sch.end}`;
    document.getElementById('detail_epic').innerText = sch.epic || '-';
    document.getElementById('detail_desc').innerText = sch.desc || '-';
    modal.style.display = 'flex';
};

window.closeScheduleDetail = () => { 
    const modal = document.getElementById('scheduleDetailModal');
    if (modal) modal.style.display = 'none'; 
    currentViewingScheduleId = null; 
};

window.deleteSchedule = () => {
    if (!currentViewingScheduleId || !confirm("삭제하시겠습니까?")) return;
    firebase.database().ref('shared_schedules/' + currentViewingScheduleId).remove().then(() => {
        closeScheduleDetail();
    });
};

window.editSchedule = () => { if (currentViewingScheduleId) openScheduleModal(currentViewingScheduleId); };

window.startScheduleWorkflow = () => {
    if (!currentViewingScheduleId) return;
    const sch = calSchedules.find(s => s.id === currentViewingScheduleId);
    if (!sch || !sch.epic) return alert("Epic Link가 없습니다.");

    closeScheduleDetail();
    switchMainTab('issue');
    
    const epicInput = document.getElementById('epic_link');
    if (epicInput) {
        epicInput.value = sch.epic;
        if (typeof generateTemplate === 'function') generateTemplate();
        epicInput.style.backgroundColor = "#e0f2fe";
        setTimeout(() => { epicInput.style.backgroundColor = ""; }, 1000);
    }
};
