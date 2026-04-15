let calCurrentDate = new Date();
let calSchedules = [];
let currentViewingScheduleId = null;

const GEMINI_API_KEY = "AIzaSyA3u-gBRUtcIzFt5EQYUzLjNL66NVfAdlI";

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
    const dropzoneContent = document.getElementById('ai_dropzone_content');
    const loadingContent = document.getElementById('ai_loading_content');
    if (!dropzoneContent || !loadingContent) return;

    dropzoneContent.style.display = 'none';
    loadingContent.style.display = 'block';

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = reader.result.split(',')[1];
            const mimeType = file.type;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "이 이미지에서 일정을 파악하여 JSON으로 반환하라. 필드는 title, start(YYYY-MM-DD), end(YYYY-MM-DD), epic, desc를 포함하라. 마크다운 기호 없이 순수한 JSON 문자열만 출력하라." },
                            { inline_data: { mime_type: mimeType, data: base64Image } }
                        ]
                    }]
                })
            });

            const result = await response.json();
            let textResult = result.candidates[0].content.parts[0].text;
            textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(textResult);

            if (parsed.title) document.getElementById('sch_title').value = parsed.title;
            if (parsed.start) document.getElementById('sch_start').value = parsed.start;
            if (parsed.end) document.getElementById('sch_end').value = parsed.end;
            if (parsed.epic) document.getElementById('sch_epic').value = parsed.epic;
            if (parsed.desc) document.getElementById('sch_desc').value = parsed.desc;
            
            if (typeof showToast === 'function') showToast("AI 분석 및 자동 입력이 완료되었습니다.");
        };
    } catch (error) {
        console.error("Vision API Error:", error);
        alert("이미지 분석 중 오류가 발생했습니다.");
    } finally {
        setTimeout(() => {
            dropzoneContent.style.display = 'block';
            loadingContent.style.display = 'none';
        }, 500);
    }
}

window.switchMainTab = (tabName) => {
    const allTabs = document.querySelectorAll('.main-tab-content');
    allTabs.forEach(tab => tab.style.display = 'none');
    if (tabName === 'calendar') {
        const calTab = document.getElementById('tab-calendar');
        if (calTab) { calTab.style.display = 'block'; renderCalendar(); }
    } else {
        const issueTab = document.getElementById('tab-issue-maker');
        if (issueTab) issueTab.style.display = 'block';
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
        
        let html = `<div class="day-number">${wd.day}${holidayLabel}</div><div class="sch-container">`;
        const dayLanes = laneMap.get(dateStr) || [];
        const maxLane = dayLanes.length;

        for (let l = 0; l < maxLane; l++) {
            const item = dayLanes[l];
            if (item && item.isHead) {
                const widthVal = `calc(${item.span} * 100% + ${(item.span - 1)} * 1px)`;
                html += `<div class="cal-schedule span-head" style="background-color:${item.sch.color}; width:${widthVal}; text-align:center; z-index:5;" onclick="event.stopPropagation(); openScheduleDetail('${item.sch.id}')">${item.sch.title}</div>`;
            } else if (item && !item.isHead) {
                html += `<div class="cal-schedule spacer"></div>`;
            } else {
                html += `<div class="cal-schedule spacer"></div>`;
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
    closeScheduleDetail(); 
    modal.style.display = 'flex';
};

window.closeScheduleModal = () => { document.getElementById('scheduleModal').style.display = 'none'; };

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
